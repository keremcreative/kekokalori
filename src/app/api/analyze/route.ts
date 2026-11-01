import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Nutrients } from "@/lib/nutrition";
import { HttpError, MODEL, anthropic, errorResponse, requireUser } from "@/lib/server";

export const maxDuration = 60;

const Per100 = z.object({
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sugar: z.number(),
  satFat: z.number(),
  sodium: z.number(),
  potassium: z.number(),
  calcium: z.number(),
  iron: z.number(),
  magnesium: z.number(),
  vitA: z.number(),
  vitC: z.number(),
  vitD: z.number(),
  vitB12: z.number(),
});

const Result = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      grams: z.number(),
      confidence: z.enum(["high", "medium", "low"]),
      per100: Per100,
    }),
  ),
  note: z.string(),
});

const SYSTEM = `Sen bir diyetisyen asistanısın. Kullanıcının yediği veya içtiği şeyleri fotoğraftan ve/veya açıklamadan tanıyıp besin değerlerini çıkarıyorsun.

Her ayrı yiyecek veya içecek için bir kalem döndür:
- name: Türkçe, kısa ve anlaşılır ad (ör. "Menemen", "Beyaz peynir", "Çay (şekersiz)").
- grams: Yenen/içilen tahmini miktar, gram cinsinden (içecekler için ml'yi gram say). Tabak, çatal, bardak gibi nesneleri ölçek olarak kullan. Kullanıcı miktar yazdıysa onu esas al.
- confidence: Tanıma ve miktar tahmininden ne kadar eminsin.
- per100: 100 g başına besin değerleri. Birimler: kcal; protein, carbs, fat, fiber, sugar, satFat gram; sodium, potassium, calcium, iron, magnesium, vitC miligram; vitA (RAE), vitD, vitB12 mikrogram. Türk mutfağındaki tipik tarifleri (pişirme yağı, tuz dahil) ve USDA / TürKomp ortalamalarını temel al.

Yemekleri gereksiz yere parçalama: menemen tek kalem olur, ama tabaktaki ayrı duran pilav ve tavuk ayrı kalemlerdir. Şekerli çay/kahve gibi görünmeyen eklemeler belirsizse şekersiz varsay ve note alanında belirt.
Görüntüde yiyecek/içecek yoksa items boş olsun.
note: Kullanıcıya Türkçe, en fazla iki cümlelik kısa bir not (ör. emin olmadığın kısımlar, kontrol etmesi gerekenler). Söyleyecek bir şey yoksa boş bırak.`;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = (await req.json()) as { image?: string | null; text?: string | null };
    const text = (body.text ?? "").slice(0, 1000).trim();

    const content: Array<
      | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/webp"; data: string } }
      | { type: "text"; text: string }
    > = [];

    if (body.image) {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(body.image);
      if (!m) throw new HttpError(400, "Fotoğraf biçimi desteklenmiyor.");
      if (m[2].length * 0.75 > MAX_IMAGE_BYTES) throw new HttpError(413, "Fotoğraf çok büyük.");
      content.push({
        type: "image",
        source: { type: "base64", media_type: m[1] as "image/jpeg" | "image/png" | "image/webp", data: m[2] },
      });
    }
    if (!body.image && !text) throw new HttpError(400, "Fotoğraf ya da açıklama gerekli.");

    content.push({
      type: "text",
      text: text
        ? `Kullanıcının açıklaması: ${text}`
        : "Bu fotoğraftaki yiyecek ve içecekleri ve miktarlarını çıkar.",
    });

    const response = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "medium", format: betaZodOutputFormat(Result) },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      throw new HttpError(422, "Bu istek analiz edilemedi. Farklı bir fotoğraf ya da açıklama dene.");
    }
    const parsed = response.parsed_output;
    if (!parsed) throw new HttpError(502, "Yapay zekâ yanıtı okunamadı, tekrar dene.");

    const items = parsed.items
      .filter((i) => i.grams > 0)
      .map((i) => ({
        name: i.name,
        grams: Math.round(i.grams),
        per100: clean(i.per100),
        note: i.confidence === "low" ? "Emin olunamadı, kontrol et." : undefined,
      }));

    return Response.json({ items, note: parsed.note || null });
  } catch (e) {
    return errorResponse(e);
  }
}

function clean(p: z.infer<typeof Per100>): Nutrients {
  const out: Nutrients = {};
  for (const [k, v] of Object.entries(p)) out[k as keyof Nutrients] = Math.max(0, Math.round(v * 100) / 100);
  return out;
}

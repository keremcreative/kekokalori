import { MODEL, HttpError, anthropic, errorResponse, requireUser } from "@/lib/server";

export const maxDuration = 60;

type Body = {
  profile: { sex: string; age: number; height_cm: number; weight_kg: number; goal: string; activity: string };
  totals: Record<string, number>;
  targets: Record<string, number>;
  foods: { name: string; grams: number; meal: string }[];
  waterMl: number;
  waterTarget: number;
  isToday: boolean;
  hour: number;
};

const SYSTEM = `Sen samimi ve bilgili bir beslenme koçusun. Kullanıcının bir günlük beslenme kaydına bakarak Türkçe, kısa ve uygulanabilir öneriler veriyorsun.

Kurallar:
- En fazla 5 madde, her biri 1-2 cümle. Madde işareti olarak "•" kullan, başka biçimlendirme (başlık, kalın yazı) kullanma.
- Önce iyi giden bir şeyi söyle, sonra en önemli eksik veya fazlaları.
- Somut, Türkiye'de kolay bulunan yiyecekler öner ve mümkünse miktar ver.
- Gün henüz bitmediyse kalan öğünler için öneri ver.
- Tıbbi teşhis koyma. Ciddi bir durum fark edersen doktora/diyetisyene danışmasını öner.`;

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = (await req.json()) as Body;
    if (!body?.totals || !body?.targets) throw new HttpError(400, "Eksik veri.");

    const response = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: JSON.stringify(body).slice(0, 20000) }],
    });

    if (response.stop_reason === "refusal") throw new HttpError(422, "Şu an öneri üretilemedi.");
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return Response.json({ text });
  } catch (e) {
    return errorResponse(e);
  }
}

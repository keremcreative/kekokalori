import { NUTRIENT_KEYS, type Nutrients } from "./nutrition";

/** Kullanıcının kendi yapay zekâsına fotoğrafla birlikte göndereceği komut. */
export const PHOTO_PROMPT = `Bu fotoğraftaki (veya aşağıda yazdığım) yiyecek ve içecekleri tanı, her biri için yenen miktarı gram olarak tahmin et ve 100 g başına besin değerlerini ver. Türk mutfağındaki tipik tarifleri (pişirme yağı ve tuz dahil) esas al. Ayrı duran yiyecekleri ayrı kalem yap.

Cevabın SADECE aşağıdaki biçimde bir JSON olsun, başka açıklama yazma:
[
  {"name": "Menemen", "grams": 200, "per100": {"kcal": 100, "protein": 5.5, "carbs": 4, "fat": 7, "fiber": 1, "sugar": 2.5, "satFat": 1.8, "sodium": 250, "potassium": 250, "calcium": 30, "iron": 1, "magnesium": 15, "vitA": 80, "vitC": 15, "vitD": 1, "vitB12": 0.5}}
]
Birimler: kcal; protein, carbs, fat, fiber, sugar, satFat gram; sodium, potassium, calcium, iron, magnesium, vitC miligram; vitA, vitD, vitB12 mikrogram.`;

export type ImportedItem = { name: string; grams: number; per100: Nutrients };

/** Yapay zekânın cevabından JSON listesini ayıklar. Hatalıysa açıklayıcı bir Error fırlatır. */
export function parseAiItems(text: string): ImportedItem[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("Cevapta [ ... ] biçiminde bir liste bulunamadı.");
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Cevaptaki liste okunamadı. Yapay zekâdan sadece JSON vermesini iste.");
  }
  if (!Array.isArray(raw)) throw new Error("Cevap bir liste değil.");
  const items: ImportedItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const name = String(o.name ?? o.ad ?? "").trim();
    const grams = Number(o.grams ?? o.gram);
    const src = (o.per100 ?? {}) as Record<string, unknown>;
    const per100: Nutrients = {};
    for (const k of NUTRIENT_KEYS) {
      const v = Number(src[k]);
      if (Number.isFinite(v) && v >= 0) per100[k] = v;
    }
    if (!name || !Number.isFinite(grams) || grams <= 0 || per100.kcal === undefined) continue;
    items.push({ name, grams: Math.round(grams), per100 });
  }
  if (items.length === 0) throw new Error("Listede geçerli bir yiyecek bulunamadı (ad, gram ve kcal gerekli).");
  return items;
}

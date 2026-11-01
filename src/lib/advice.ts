import { fmt, type NutrientKey, type Targets } from "./nutrition";

export type Tip = { tone: "good" | "warn" | "info"; text: string };

/**
 * Günün toplamlarına bakarak kural tabanlı öneriler üretir.
 * dayProgress: günün ne kadarının geçtiği (0-1). Geçmiş günler için 1.
 */
export function buildTips(
  totals: Record<NutrientKey, number>,
  targets: Targets,
  opts: { entryCount: number; waterMl: number; dayProgress: number },
): Tip[] {
  const t = targets.values;
  const tips: Tip[] = [];
  const { dayProgress } = opts;

  if (opts.entryCount === 0) {
    return [{ tone: "info", text: "Bugün henüz bir şey eklemedin. İlk öğününü fotoğrafla ya da listeden ekleyebilirsin." }];
  }

  const kcalRatio = totals.kcal / t.kcal;
  if (kcalRatio > 1.1) {
    tips.push({ tone: "warn", text: `Kalori hedefini ${fmt(totals.kcal - t.kcal)} kcal aştın. Kalan öğünlerde sebze ve yağsız protein ağırlıklı, hafif seçimler yapabilirsin.` });
  } else if (dayProgress > 0.8 && kcalRatio < 0.7) {
    tips.push({ tone: "warn", text: `Hedefinin epey altındasın (${fmt(t.kcal - totals.kcal)} kcal eksik). Çok düşük kalori kas kaybına ve yorgunluğa yol açabilir. Eklemeyi unuttuğun bir şey var mı?` });
  } else if (kcalRatio >= 0.9 && kcalRatio <= 1.1) {
    tips.push({ tone: "good", text: "Kalori hedefinle tam uyumlusun, böyle devam." });
  }

  const proteinLeft = t.protein - totals.protein;
  if (proteinLeft > 20 && dayProgress > 0.5) {
    tips.push({ tone: "info", text: `Proteine ${fmt(proteinLeft)} g daha ihtiyacın var. Süzme yoğurt, yumurta, tavuk, ton balığı, lor peyniri veya baklagiller iyi seçenekler.` });
  } else if (totals.protein >= t.protein * 0.95) {
    tips.push({ tone: "good", text: "Protein hedefini tutturdun." });
  }

  if (dayProgress > 0.6 && totals.fiber < t.fiber * 0.6) {
    tips.push({ tone: "info", text: `Lif düşük (${fmt(totals.fiber)} / ${fmt(t.fiber)} g). Sebze, meyve, tam buğday ekmeği, bulgur, yulaf veya baklagil ekleyebilirsin.` });
  }
  if (totals.sugar > t.sugar) {
    tips.push({ tone: "warn", text: `Şeker önerilen sınırın üzerinde (${fmt(totals.sugar)} g). Şekerli içecekler ve tatlılar en büyük kaynak olur genelde.` });
  }
  if (totals.satFat > t.satFat * 1.1) {
    tips.push({ tone: "warn", text: "Doymuş yağ yüksek. Tereyağı, sucuk ve yağlı peynir yerine zeytinyağı, ceviz ve balığı tercih edebilirsin." });
  }
  if (totals.sodium > t.sodium) {
    tips.push({ tone: "warn", text: `Tuz (sodyum) yüksek: ${fmt(totals.sodium)} mg. Peynir, zeytin, işlenmiş et ve hazır çorbalar çok tuz içerir. Bol su iç.` });
  }

  if (dayProgress > 0.7) {
    const lows: string[] = [];
    if (totals.calcium < t.calcium * 0.5) lows.push("kalsiyum (süt, yoğurt, peynir, tahin)");
    if (totals.iron < t.iron * 0.5) lows.push("demir (kırmızı et, mercimek, ıspanak, kuru kayısı)");
    if (totals.vitC < t.vitC * 0.5) lows.push("C vitamini (biber, portakal, çilek, brokoli)");
    if (totals.potassium < t.potassium * 0.5) lows.push("potasyum (muz, patates, baklagiller, avokado)");
    if (totals.magnesium < t.magnesium * 0.5) lows.push("magnezyum (badem, yulaf, bitter çikolata)");
    if (lows.length) tips.push({ tone: "info", text: `Düşük kalan mikro besinler: ${lows.join(", ")}.` });
    if (totals.vitD < t.vitD * 0.3) {
      tips.push({ tone: "info", text: "D vitamini besinlerle zor karşılanır. Güneş ışığı ve yağlı balık önemli, eksiklikten şüpheleniyorsan doktoruna kan tahlili yaptırabilirsin." });
    }
  }

  const waterTarget = targets.waterMl;
  if (dayProgress > 0.5 && opts.waterMl < waterTarget * dayProgress * 0.6) {
    tips.push({ tone: "info", text: `Su az: ${fmt(opts.waterMl)} / ${fmt(waterTarget)} ml. Yanında bir şişe su bulundurmak işe yarar.` });
  }

  return tips;
}

import type { LogEntry, WeightEntry } from "./db";
import { entryTotals } from "./db";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  MEALS,
  NUTRIENTS,
  NUTRIENT_KEYS,
  ageFromBirthYear,
  fmt,
  shiftDate,
  sum,
  type NutrientKey,
  type Profile,
  type Targets,
} from "./nutrition";

const MEAL_LABEL: Record<string, string> = Object.fromEntries(MEALS.map((m) => [m.id, m.label]));

function dayLabel(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
}

/** Kullanıcının kendi yapay zekâsına (ChatGPT, Gemini, Claude...) yapıştıracağı haftalık rapor metni. */
export function buildWeeklyReport(opts: {
  profile: Profile;
  targets: Targets;
  logs: LogEntry[];
  weights: WeightEntry[];
  endDate: string;
  days?: number;
}): string {
  const { profile, targets, logs, weights, endDate } = opts;
  const days = opts.days ?? 7;
  const startDate = shiftDate(endDate, -(days - 1));
  const dates = Array.from({ length: days }, (_, i) => shiftDate(startDate, i));
  const t = targets.values;

  const food = logs.filter((l) => l.meal !== "water");
  const byDay = new Map(dates.map((d) => [d, food.filter((l) => l.eaten_on === d)]));
  const waterByDay = new Map(
    dates.map((d) => [d, logs.filter((l) => l.meal === "water" && l.eaten_on === d).reduce((s, l) => s + l.grams, 0)]),
  );
  const totalsByDay = new Map(dates.map((d) => [d, sum((byDay.get(d) ?? []).map(entryTotals))]));
  const loggedDays = dates.filter((d) => (byDay.get(d) ?? []).length > 0);

  const lines: string[] = [];
  const p = (s = "") => lines.push(s);

  p(`Aşağıda ${dayLabel(startDate)} - ${dayLabel(endDate)} arasındaki beslenme kaydım var. Bir diyetisyen gibi değerlendir ve bana Türkçe olarak şunları söyle:`);
  p("1. Genel değerlendirme: hedefime göre nasıl gidiyorum, kilo gidişatım ne anlatıyor?");
  p("2. Azaltmam gerekenler (somut yiyecek ve miktarlarla)");
  p("3. Artırmam gerekenler (eksik kalan makro ve mikro besinler için somut öneriler)");
  p("4. Gelecek hafta için basit, uygulanabilir 3-5 hedef");
  p("Değerler uygulamanın yaklaşık hesaplamalarıdır. Tıbbi teşhis koyma.");
  p();
  p("## Profil");
  p(
    `${profile.sex === "male" ? "Erkek" : "Kadın"}, ${ageFromBirthYear(profile.birth_year)} yaş, ${fmt(profile.height_cm)} cm, ${fmt(profile.weight_kg)} kg (VKİ ${fmt(Math.round(targets.bmi * 10) / 10)})`,
  );
  p(`Aktivite: ${ACTIVITY_LABELS[profile.activity]}`);
  p(`Hedef: ${GOAL_LABELS[profile.goal]}`);
  p(
    `Günlük hedefler: ${fmt(Math.round(t.kcal))} kcal, protein ${fmt(Math.round(t.protein))} g, karbonhidrat ${fmt(Math.round(t.carbs))} g, yağ ${fmt(Math.round(t.fat))} g, lif ${fmt(Math.round(t.fiber))} g, su ${fmt(targets.waterMl / 1000)} L (bazal metabolizma ${fmt(targets.bmr)} kcal, günlük harcama ≈ ${fmt(targets.tdee)} kcal)`,
  );
  p();

  p("## Kilo");
  if (weights.length === 0) {
    p("Bu hafta kilo kaydı yok.");
  } else {
    p(weights.map((w) => `${dayLabel(w.logged_on)}: ${fmt(w.weight_kg)} kg`).join(" · "));
    if (weights.length > 1) {
      const diff = weights[weights.length - 1].weight_kg - weights[0].weight_kg;
      p(`Değişim: ${diff > 0 ? "+" : ""}${fmt(Math.round(diff * 10) / 10)} kg`);
    }
  }
  p();

  p(`## Haftalık ortalama (kayıt girilen ${loggedDays.length} gün üzerinden)`);
  if (loggedDays.length === 0) {
    p("Bu hafta yemek kaydı yok.");
  } else {
    const avg = Object.fromEntries(
      NUTRIENT_KEYS.map((k) => [k, loggedDays.reduce((s, d) => s + totalsByDay.get(d)![k], 0) / loggedDays.length]),
    ) as Record<NutrientKey, number>;
    for (const k of NUTRIENT_KEYS) {
      const meta = NUTRIENTS[k];
      if (avg[k] === 0 && k !== "kcal") {
        p(`- ${meta.label}: veri yok`);
        continue;
      }
      const pct = Math.round((avg[k] / t[k]) * 100);
      const note = meta.kind === "max" ? " (üst sınır)" : "";
      p(`- ${meta.label}: ${fmt(avg[k], meta.unit)} / hedef ${fmt(t[k], meta.unit)}${note} → %${pct}`);
    }
    const avgWater = loggedDays.reduce((s, d) => s + (waterByDay.get(d) ?? 0), 0) / loggedDays.length;
    p(`- Su: ${fmt(Math.round(avgWater))} ml / hedef ${fmt(targets.waterMl)} ml (sadece su kayıtları)`);
  }
  p();

  p("## Günlük toplamlar");
  p("Gün | kcal | Protein g | Karb. g | Yağ g | Lif g | Şeker g | Sodyum mg | Su ml");
  for (const d of dates) {
    const x = totalsByDay.get(d)!;
    if ((byDay.get(d) ?? []).length === 0) {
      p(`${dayLabel(d)} | kayıt yok`);
      continue;
    }
    p(
      [dayLabel(d), x.kcal, x.protein, x.carbs, x.fat, x.fiber, x.sugar, x.sodium]
        .map((v) => (typeof v === "number" ? fmt(Math.round(v)) : v))
        .concat(fmt(waterByDay.get(d) ?? 0))
        .join(" | "),
    );
  }
  p();

  p("## Yediklerim ve içtiklerim");
  for (const d of loggedDays) {
    p(`### ${dayLabel(d)}`);
    for (const m of MEALS) {
      const items = (byDay.get(d) ?? []).filter((l) => l.meal === m.id);
      if (items.length === 0) continue;
      p(
        `${MEAL_LABEL[m.id]}: ` +
          items.map((l) => `${l.name} ${fmt(Math.round(l.grams))} g (${fmt(Math.round(entryTotals(l).kcal ?? 0))} kcal)`).join(", "),
      );
    }
  }

  if (food.length > 0) {
    const freq = new Map<string, { count: number; kcal: number }>();
    for (const l of food) {
      const key = l.name;
      const f = freq.get(key) ?? { count: 0, kcal: 0 };
      f.count++;
      f.kcal += entryTotals(l).kcal ?? 0;
      freq.set(key, f);
    }
    const top = [...freq.entries()].sort((a, b) => b[1].kcal - a[1].kcal).slice(0, 8);
    p();
    p("## Haftanın en çok kalori getiren besinleri");
    for (const [name, f] of top) p(`- ${name}: ${f.count} kez, toplam ${fmt(Math.round(f.kcal))} kcal`);
  }

  return lines.join("\n");
}

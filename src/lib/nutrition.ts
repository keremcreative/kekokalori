// Besin değerleri, hedef hesapları ve yardımcı fonksiyonlar.

export const NUTRIENT_KEYS = [
  "kcal",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "satFat",
  "sodium",
  "potassium",
  "calcium",
  "iron",
  "magnesium",
  "vitA",
  "vitC",
  "vitD",
  "vitB12",
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
/** 100 g (veya 100 ml) başına değerler. Bilinmeyen değerler eksik olabilir. */
export type Nutrients = Partial<Record<NutrientKey, number>>;

export type NutrientMeta = {
  label: string;
  unit: string;
  /** "min": en az bu kadar alınmalı, "max": bunu aşmamalı */
  kind: "min" | "max" | "target";
};

export const NUTRIENTS: Record<NutrientKey, NutrientMeta> = {
  kcal: { label: "Kalori", unit: "kcal", kind: "target" },
  protein: { label: "Protein", unit: "g", kind: "target" },
  carbs: { label: "Karbonhidrat", unit: "g", kind: "target" },
  fat: { label: "Yağ", unit: "g", kind: "target" },
  fiber: { label: "Lif", unit: "g", kind: "min" },
  sugar: { label: "Şeker", unit: "g", kind: "max" },
  satFat: { label: "Doymuş yağ", unit: "g", kind: "max" },
  sodium: { label: "Sodyum", unit: "mg", kind: "max" },
  potassium: { label: "Potasyum", unit: "mg", kind: "min" },
  calcium: { label: "Kalsiyum", unit: "mg", kind: "min" },
  iron: { label: "Demir", unit: "mg", kind: "min" },
  magnesium: { label: "Magnezyum", unit: "mg", kind: "min" },
  vitA: { label: "A vitamini", unit: "µg", kind: "min" },
  vitC: { label: "C vitamini", unit: "mg", kind: "min" },
  vitD: { label: "D vitamini", unit: "µg", kind: "min" },
  vitB12: { label: "B12 vitamini", unit: "µg", kind: "min" },
};

export const MICRO_KEYS: NutrientKey[] = [
  "fiber",
  "sugar",
  "satFat",
  "sodium",
  "potassium",
  "calcium",
  "iron",
  "magnesium",
  "vitA",
  "vitC",
  "vitD",
  "vitB12",
];

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

export type Profile = {
  name: string | null;
  sex: Sex;
  birth_year: number;
  height_cm: number;
  weight_kg: number;
  activity: Activity;
  goal: Goal;
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Hareketsiz (masa başı, spor yok)",
  light: "Az hareketli (haftada 1-3 gün spor)",
  moderate: "Orta (haftada 3-5 gün spor)",
  active: "Hareketli (haftada 6-7 gün spor)",
  very_active: "Çok hareketli (ağır iş veya günde 2 antrenman)",
};

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Kilo vermek",
  maintain: "Kilomu korumak",
  gain: "Kilo / kas almak",
};

export type Targets = {
  bmr: number;
  tdee: number;
  bmi: number;
  waterMl: number;
  values: Record<NutrientKey, number>;
};

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

/** Mifflin-St Jeor formülü ile BMR, aktivite çarpanı ile günlük harcama. */
export function calcTargets(p: Profile, now = new Date()): Targets {
  const age = ageFromBirthYear(p.birth_year, now);
  const bmr =
    10 * p.weight_kg + 6.25 * p.height_cm - 5 * age + (p.sex === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[p.activity];

  let kcal = tdee;
  if (p.goal === "lose") kcal = Math.max(tdee - 500, p.sex === "male" ? 1500 : 1200);
  if (p.goal === "gain") kcal = tdee + 300;

  const proteinPerKg = p.goal === "maintain" ? 1.6 : 2.0;
  const protein = Math.min(p.weight_kg * proteinPerKg, (kcal * 0.35) / 4);
  const fat = (kcal * 0.27) / 9;
  const carbs = Math.max((kcal - protein * 4 - fat * 9) / 4, 0);

  const female = p.sex === "female";
  const values: Record<NutrientKey, number> = {
    kcal,
    protein,
    carbs,
    fat,
    fiber: Math.max(25, (kcal / 1000) * 14),
    sugar: (kcal * 0.1) / 4, // serbest şeker için üst sınır (%10)
    satFat: (kcal * 0.1) / 9,
    sodium: 2300,
    potassium: female ? 2600 : 3400,
    calcium: age > 50 && female ? 1200 : 1000,
    iron: female && age <= 50 ? 18 : 8,
    magnesium: female ? 320 : 420,
    vitA: female ? 700 : 900,
    vitC: female ? 75 : 90,
    vitD: age > 70 ? 20 : 15,
    vitB12: 2.4,
  };

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi: p.weight_kg / (p.height_cm / 100) ** 2,
    waterMl: Math.round((p.weight_kg * 35) / 50) * 50,
    values,
  };
}

/** 100 g başına değerleri verilen grama ölçekler. */
export function scale(per100: Nutrients, grams: number): Nutrients {
  const out: Nutrients = {};
  for (const k of NUTRIENT_KEYS) {
    const v = per100[k];
    if (typeof v === "number") out[k] = (v * grams) / 100;
  }
  return out;
}

export function sum(list: Nutrients[]): Record<NutrientKey, number> {
  const out = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as Record<
    NutrientKey,
    number
  >;
  for (const n of list) for (const k of NUTRIENT_KEYS) out[k] += n[k] ?? 0;
  return out;
}

export function fmt(v: number, unit?: string): string {
  const r = v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
  return unit ? `${r.toLocaleString("tr-TR")} ${unit}` : r.toLocaleString("tr-TR");
}

export const MEALS = [
  { id: "breakfast", label: "Kahvaltı" },
  { id: "lunch", label: "Öğle" },
  { id: "dinner", label: "Akşam" },
  { id: "snack", label: "Ara öğün" },
] as const;
export type Meal = (typeof MEALS)[number]["id"];

export function guessMeal(d = new Date()): Meal {
  const h = d.getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return todayStr(new Date(y, m - 1, d + days));
}

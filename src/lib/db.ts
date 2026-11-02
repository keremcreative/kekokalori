"use client";

import { supabase } from "./supabase";
import { scale, type Meal, type Nutrients, type Profile } from "./nutrition";

export type LogEntry = {
  id: string;
  eaten_on: string;
  meal: Meal | "water";
  name: string;
  grams: number;
  per100: Nutrients;
  source: "db" | "photo" | "custom" | "water";
  created_at: string;
};

export type NewLog = Omit<LogEntry, "id" | "created_at">;

export function entryTotals(e: Pick<LogEntry, "per100" | "grams">): Nutrients {
  return scale(e.per100, e.grams);
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from("profiles")
    .select("name, sex, birth_year, height_cm, weight_kg, activity, goal")
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function saveProfile(userId: string, p: Profile): Promise<void> {
  const { error } = await supabase()
    .from("profiles")
    .upsert({ id: userId, ...p, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getLogs(date: string): Promise<LogEntry[]> {
  const { data, error } = await supabase()
    .from("food_logs")
    .select("id, eaten_on, meal, name, grams, per100, source, created_at")
    .eq("eaten_on", date)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as LogEntry[];
}

export async function addLogs(entries: NewLog[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabase().from("food_logs").insert(entries);
  if (error) throw error;
}

export async function updateLogGrams(id: string, grams: number): Promise<void> {
  const { error } = await supabase().from("food_logs").update({ grams }).eq("id", id);
  if (error) throw error;
}

export async function deleteLog(id: string): Promise<void> {
  const { error } = await supabase().from("food_logs").delete().eq("id", id);
  if (error) throw error;
}

/** Son kullanılan besinler (tekrar eklemeyi hızlandırmak için). */
export async function getRecentFoods(limit = 12): Promise<LogEntry[]> {
  const { data, error } = await supabase()
    .from("food_logs")
    .select("id, eaten_on, meal, name, grams, per100, source, created_at")
    .neq("meal", "water")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const seen = new Set<string>();
  const out: LogEntry[] = [];
  for (const e of (data ?? []) as LogEntry[]) {
    const key = e.name.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getDailyKcal(from: string, to: string): Promise<Record<string, number>> {
  const { data, error } = await supabase()
    .from("food_logs")
    .select("eaten_on, grams, per100")
    .gte("eaten_on", from)
    .lte("eaten_on", to);
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    const kcal = ((r.per100 as Nutrients).kcal ?? 0) * (r.grams as number) / 100;
    out[r.eaten_on as string] = (out[r.eaten_on as string] ?? 0) + kcal;
  }
  return out;
}

export async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getLogsRange(from: string, to: string): Promise<LogEntry[]> {
  const { data, error } = await supabase()
    .from("food_logs")
    .select("id, eaten_on, meal, name, grams, per100, source, created_at")
    .gte("eaten_on", from)
    .lte("eaten_on", to)
    .order("eaten_on")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as LogEntry[];
}

export type WeightEntry = { logged_on: string; weight_kg: number };

export async function getWeights(from: string, to: string): Promise<WeightEntry[]> {
  const { data, error } = await supabase()
    .from("weight_logs")
    .select("logged_on, weight_kg")
    .gte("logged_on", from)
    .lte("logged_on", to)
    .order("logged_on");
  if (error) throw error;
  return (data ?? []) as WeightEntry[];
}

/** Kiloyu kaydeder. Bugünün (veya en yeni) kaydıysa profildeki kiloyu da günceller ki hedefler yeniden hesaplansın. */
export async function saveWeight(userId: string, date: string, kg: number): Promise<boolean> {
  const sb = supabase();
  const { error } = await sb
    .from("weight_logs")
    .upsert({ user_id: userId, logged_on: date, weight_kg: kg }, { onConflict: "user_id,logged_on" });
  if (error) throw error;
  const { data: newer } = await sb.from("weight_logs").select("logged_on").gt("logged_on", date).limit(1);
  if (newer && newer.length > 0) return false;
  const { error: pErr } = await sb
    .from("profiles")
    .update({ weight_kg: kg, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (pErr) throw pErr;
  return true;
}

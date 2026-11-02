"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/components/ProfileProvider";
import { saveProfile } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  calcTargets,
  fmt,
  type Activity,
  type Goal,
  type Profile,
  type Sex,
} from "@/lib/nutrition";

const EMPTY: Profile = {
  name: "",
  sex: "male",
  birth_year: 1995,
  height_cm: 175,
  weight_kg: 75,
  activity: "light",
  goal: "maintain",
};

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  if (loading) return <p className="text-stone-400">Yükleniyor…</p>;
  return <ProfileForm initial={profile} />;
}

function ProfileForm({ initial }: { initial: Profile | null }) {
  const { userId, email } = useAuth();
  const { profile, reload } = useProfile();
  const router = useRouter();
  const [form, setForm] = useState<Profile>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const valid =
    form.height_cm >= 80 && form.height_cm <= 260 && form.weight_kg >= 20 && form.weight_kg <= 400 &&
    form.birth_year >= 1900 && form.birth_year <= new Date().getFullYear() - 10;
  const t = valid ? calcTargets(form) : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const isNew = !profile;
      await saveProfile(userId, form);
      await reload();
      if (isNew) router.push("/");
      else setMsg("Kaydedildi.");
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{profile ? "Profilim" : "Hoş geldin! Önce seni tanıyalım"}</h1>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Adın</label>
          <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} className="input" />
        </div>
        <div>
          <span className="label">Cinsiyet</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["male", "Erkek"],
                ["female", "Kadın"],
              ] as [Sex, string][]
            ).map(([v, l]) => (
              <button
                type="button"
                key={v}
                onClick={() => set("sex", v)}
                className={form.sex === v ? "btn-primary" : "btn-secondary"}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Doğum yılı" value={form.birth_year} onChange={(v) => set("birth_year", v)} />
          <NumField label="Boy (cm)" value={form.height_cm} onChange={(v) => set("height_cm", v)} />
          <NumField label="Kilo (kg)" value={form.weight_kg} onChange={(v) => set("weight_kg", v)} step="0.1" />
        </div>
        <div>
          <label className="label">Aktivite seviyesi</label>
          <select value={form.activity} onChange={(e) => set("activity", e.target.value as Activity)} className="input">
            {Object.entries(ACTIVITY_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="label">Hedefin</span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([k, l]) => (
              <button
                type="button"
                key={k}
                onClick={() => set("goal", k)}
                className={`${form.goal === k ? "btn-primary" : "btn-secondary"} px-2 text-sm`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {t && (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="mb-1 font-semibold">Günlük hedeflerin</p>
            <p>
              <b>{fmt(t.values.kcal)} kcal</b> · Protein {fmt(t.values.protein)} g · Karbonhidrat {fmt(t.values.carbs)} g ·
              Yağ {fmt(t.values.fat)} g · Su {fmt(t.waterMl / 1000)} L
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Bazal metabolizma {fmt(t.bmr)} kcal, günlük harcama ≈ {fmt(t.tdee)} kcal, vücut kitle indeksi{" "}
              {fmt(Math.round(t.bmi * 10) / 10)}.
            </p>
          </div>
        )}

        {msg && <p className="text-sm text-stone-600">{msg}</p>}
        <button disabled={!valid || saving} className="btn-primary w-full">
          {saving ? "Kaydediliyor…" : profile ? "Kaydet" : "Başla"}
        </button>
      </form>

      <div className="card flex items-center justify-between text-sm">
        <span className="truncate text-stone-500">{email}</span>
        <button onClick={() => supabase().auth.signOut()} className="text-red-600">
          Çıkış yap
        </button>
      </div>

      <p className="px-2 text-xs text-stone-400">
        Hesaplamalar Mifflin-St Jeor formülüne ve genel önerilere dayanır, tıbbi tavsiye değildir. Özel bir sağlık
        durumun varsa doktoruna ya da diyetisyenine danış.
      </p>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="label text-xs">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input px-2"
      />
    </div>
  );
}

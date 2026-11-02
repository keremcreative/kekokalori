"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Bar from "@/components/Bar";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/components/ProfileProvider";
import { useAiEnabled } from "@/components/useAiEnabled";
import { buildTips } from "@/lib/advice";
import {
  addLogs,
  authHeader,
  deleteLog,
  entryTotals,
  getDailyKcal,
  getLogs,
  getWeights,
  saveWeight,
  updateLogGrams,
  type LogEntry,
} from "@/lib/db";
import {
  MEALS,
  MICRO_KEYS,
  NUTRIENTS,
  ageFromBirthYear,
  calcTargets,
  fmt,
  shiftDate,
  sum,
  todayStr,
} from "@/lib/nutrition";

export default function TodayPage() {
  return (
    <Suspense>
      <Today />
    </Suspense>
  );
}

function Today() {
  const { profile, loading, reload: reloadProfile } = useProfile();
  const { userId } = useAuth();
  const aiEnabled = useAiEnabled();
  const params = useSearchParams();
  const [date, setDate] = useState(() => {
    const d = params.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayStr();
  });
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [week, setWeek] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState<{ date: string; kg: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    getWeights(date, date)
      .then((ws) => !cancelled && setWeight({ date, kg: ws[0]?.weight_kg ?? null }))
      .catch(() => !cancelled && setWeight({ date, kg: null }));
    Promise.all([getLogs(date), getDailyKcal(shiftDate(date, -6), date)])
      .then(([l, w]) => {
        if (cancelled) return;
        setLogs(l);
        setWeek(w);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [date, version]);

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);
  const food = useMemo(() => (logs ?? []).filter((l) => l.meal !== "water"), [logs]);
  const waterMl = useMemo(
    () => (logs ?? []).filter((l) => l.meal === "water").reduce((s, l) => s + l.grams, 0),
    [logs],
  );
  const totals = useMemo(() => sum(food.map(entryTotals)), [food]);

  if (loading) return <p className="text-stone-400">Yükleniyor…</p>;
  if (!profile || !targets) {
    return (
      <div className="card mt-8 space-y-3 text-center">
        <div className="text-4xl">👋</div>
        <p>Hedeflerini hesaplayabilmem için önce boyunu, kilonu ve hedefini girmen gerekiyor.</p>
        <Link href="/profil" className="btn-primary inline-block">
          Profilimi oluştur
        </Link>
      </div>
    );
  }

  const t = targets.values;
  const isToday = date === todayStr();
  const now = new Date();
  const dayProgress = isToday ? Math.min(1, Math.max(0.1, (now.getHours() - 6) / 16)) : 1;
  const tips = buildTips(totals, targets, { entryCount: food.length, waterMl, dayProgress });
  const remaining = t.kcal - totals.kcal;

  async function addWater(ml: number) {
    await addLogs([{ eaten_on: date, meal: "water", name: "Su", grams: ml, per100: {}, source: "water" }]);
    load();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button onClick={() => setDate(shiftDate(date, -1))} className="px-3 py-1 text-2xl text-stone-500" aria-label="Önceki gün">
          ‹
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">{isToday ? "Bugün" : formatDate(date)}</h1>
          {isToday && profile.name && <p className="text-xs text-stone-500">Merhaba {profile.name}</p>}
        </div>
        <button
          onClick={() => setDate(shiftDate(date, 1))}
          disabled={isToday}
          className="px-3 py-1 text-2xl text-stone-500 disabled:opacity-20"
          aria-label="Sonraki gün"
        >
          ›
        </button>
      </header>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="card space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-stone-500">{remaining >= 0 ? "Kalan" : "Aşılan"}</p>
            <p className={`text-4xl font-bold ${remaining < 0 ? "text-amber-600" : ""}`}>
              {fmt(Math.abs(remaining))} <span className="text-base font-normal text-stone-500">kcal</span>
            </p>
          </div>
          <p className="text-right text-sm text-stone-500">
            {fmt(totals.kcal)} / {fmt(t.kcal)} kcal
          </p>
        </div>
        <Bar value={totals.kcal} target={t.kcal} />
        <div className="grid grid-cols-3 gap-3 text-sm">
          {(
            [
              ["protein", "bg-sky-500"],
              ["carbs", "bg-amber-400"],
              ["fat", "bg-rose-400"],
            ] as const
          ).map(([k, color]) => (
            <div key={k}>
              <p className="text-stone-500">{NUTRIENTS[k].label}</p>
              <p className="font-semibold">
                {fmt(totals[k])} <span className="font-normal text-stone-400">/ {fmt(t[k])} g</span>
              </p>
              <Bar value={totals[k]} target={t[k]} color={color} />
            </div>
          ))}
        </div>
      </section>

      {weight && weight.date === date && (
        <WeightCard
          key={date}
          initial={weight.kg}
          onSave={async (kg) => {
            const updatedProfile = await saveWeight(userId, date, kg);
            setWeight({ date, kg });
            if (updatedProfile) await reloadProfile();
          }}
        />
      )}

      <section className="card flex items-center gap-3">
        <span className="text-2xl">💧</span>
        <div className="flex-1">
          <p className="text-sm font-medium">
            Su {fmt(waterMl / 1000)} / {fmt(targets.waterMl / 1000)} L
          </p>
          <Bar value={waterMl} target={targets.waterMl} color="bg-sky-400" />
        </div>
        <button onClick={() => addWater(250)} className="btn-secondary px-3 py-1.5 text-sm">
          +1 bardak
        </button>
      </section>

      {tips.length > 0 && (
        <section className="card space-y-2">
          <h2 className="font-semibold">Öneriler</h2>
          <ul className="space-y-2 text-sm">
            {tips.map((tip, i) => (
              <li
                key={i}
                className={`rounded-lg p-2 ${
                  tip.tone === "good" ? "bg-emerald-50 text-emerald-900" : tip.tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-stone-100 text-stone-700"
                }`}
              >
                {tip.text}
              </li>
            ))}
          </ul>
          {food.length > 0 && aiEnabled && (
            <AiCoach
              key={date}
              payload={{
                profile: {
                  sex: profile.sex,
                  age: ageFromBirthYear(profile.birth_year),
                  height_cm: profile.height_cm,
                  weight_kg: profile.weight_kg,
                  goal: profile.goal,
                  activity: profile.activity,
                },
                totals: roundAll(totals),
                targets: roundAll(t),
                foods: food.map((f) => ({ name: f.name, grams: f.grams, meal: f.meal })),
                waterMl,
                waterTarget: targets.waterMl,
                isToday,
                hour: now.getHours(),
              }}
            />
          )}
        </section>
      )}

      {MEALS.map((m) => {
        const items = food.filter((l) => l.meal === m.id);
        const kcal = items.reduce((s, l) => s + (entryTotals(l).kcal ?? 0), 0);
        return (
          <section key={m.id} className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {m.label} {items.length > 0 && <span className="text-sm font-normal text-stone-500">· {fmt(Math.round(kcal))} kcal</span>}
              </h2>
              <Link href={`/ekle?meal=${m.id}&date=${date}`} className="text-sm font-medium text-emerald-700">
                + Ekle
              </Link>
            </div>
            {items.length > 0 && (
              <ul className="mt-2 divide-y divide-stone-100">
                {items.map((l) => (
                  <LogRow key={l.id} entry={l} onChanged={load} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="card">
        <h2 className="mb-3 font-semibold">Mikro besinler</h2>
        <ul className="space-y-3 text-sm">
          {MICRO_KEYS.map((k) => {
            const meta = NUTRIENTS[k];
            return (
              <li key={k}>
                <div className="mb-1 flex justify-between">
                  <span>
                    {meta.label}
                    {meta.kind === "max" && <span className="text-xs text-stone-400"> (üst sınır)</span>}
                  </span>
                  <span className="text-stone-500">
                    {fmt(totals[k])} / {fmt(t[k], meta.unit)}
                  </span>
                </div>
                <Bar value={totals[k]} target={t[k]} kind={meta.kind} color="bg-violet-500" />
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-stone-400">Değerler yaklaşıktır. Fotoğraftan eklenenler tahmindir.</p>
      </section>

      <WeekChart week={week} end={date} target={t.kcal} />
    </div>
  );
}

function WeightCard({ initial, onSave }: { initial: number | null; onSave: (kg: number) => Promise<void> }) {
  const [value, setValue] = useState(initial === null ? "" : String(initial));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const kg = Number(value.replace(",", "."));
  const valid = value !== "" && kg >= 20 && kg <= 400;
  const dirty = valid && kg !== initial;

  async function save() {
    setState("saving");
    try {
      await onSave(Math.round(kg * 10) / 10);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="card flex items-center gap-3">
      <span className="text-2xl">⚖️</span>
      <div className="flex-1">
        <p className="text-sm font-medium">Kilo</p>
        <p className="text-xs text-stone-500">
          {state === "error"
            ? "Kaydedilemedi, tekrar dene."
            : initial === null && state !== "saved"
              ? "Bu gün için kayıt yok"
              : "Kaydedildi"}
        </p>
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setState("idle");
        }}
        placeholder="kg"
        className="input w-20 py-1.5 text-right"
      />
      <button onClick={save} disabled={!dirty || state === "saving"} className="btn-primary px-3 py-1.5 text-sm">
        {state === "saving" ? "…" : "Kaydet"}
      </button>
    </section>
  );
}

function LogRow({ entry, onChanged }: { entry: LogEntry; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [grams, setGrams] = useState(entry.grams);
  const n = entryTotals(entry);

  async function save() {
    if (grams > 0 && grams !== entry.grams) await updateLogGrams(entry.id, grams);
    setEditing(false);
    onChanged();
  }

  async function remove() {
    if (!confirm(`"${entry.name}" silinsin mi?`)) return;
    await deleteLog(entry.id);
    onChanged();
  }

  return (
    <li className="py-2">
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(!editing)} className="min-w-0 flex-1 text-left">
          <p className="truncate">
            {entry.source === "photo" && <span title="Fotoğraftan">📷 </span>}
            {entry.name}
          </p>
          <p className="text-xs text-stone-500">
            {fmt(entry.grams)} g · P {fmt(n.protein ?? 0)} · K {fmt(n.carbs ?? 0)} · Y {fmt(n.fat ?? 0)}
          </p>
        </button>
        <span className="text-sm font-medium">{fmt(Math.round(n.kcal ?? 0))} kcal</span>
      </div>
      {editing && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={grams || ""}
            onChange={(e) => setGrams(Number(e.target.value))}
            className="input w-24 py-1.5 text-right"
          />
          <span className="text-sm text-stone-500">g</span>
          <button onClick={save} className="btn-primary px-3 py-1.5 text-sm">
            Kaydet
          </button>
          <button onClick={remove} className="ml-auto text-sm text-red-600">
            Sil
          </button>
        </div>
      )}
    </li>
  );
}

function AiCoach({ payload }: { payload: unknown }) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Öneri alınamadı.");
      setText(data.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (text) return <p className="rounded-lg bg-sky-50 p-3 text-sm whitespace-pre-line text-sky-950">{text}</p>;
  return (
    <div>
      <button onClick={ask} disabled={busy} className="btn-secondary w-full text-sm">
        {busy ? "Düşünüyor…" : "✨ Yapay zekâ koçundan kişisel öneri al"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function WeekChart({ week, end, target }: { week: Record<string, number>; end: string; target: number }) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(end, i - 6));
  const max = Math.max(target * 1.3, ...days.map((d) => week[d] ?? 0));
  const logged = days.filter((d) => (week[d] ?? 0) > 0);
  const avg = logged.length ? logged.reduce((s, d) => s + week[d], 0) / logged.length : 0;
  return (
    <section className="card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">Son 7 gün</h2>
        {avg > 0 && <span className="text-sm text-stone-500">Ortalama {fmt(avg)} kcal</span>}
      </div>
      <div className="relative flex h-32 items-end gap-2">
        <div
          className="absolute inset-x-0 border-t border-dashed border-emerald-600/60"
          style={{ bottom: `${(target / max) * 100}%` }}
          title="Hedef"
        />
        {days.map((d) => {
          const v = week[d] ?? 0;
          const over = v > target * 1.1;
          return (
            <div key={d} className="flex h-full flex-1 flex-col justify-end">
              <div
                className={`rounded-t-md ${over ? "bg-amber-400" : "bg-emerald-500"}`}
                style={{ height: `${(v / max) * 100}%` }}
                title={`${fmt(v)} kcal`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2 text-center text-[10px] text-stone-500">
        {days.map((d) => (
          <span key={d} className="flex-1">
            {new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "short" })}
          </span>
        ))}
      </div>
    </section>
  );
}

function formatDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

function roundAll(o: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10) / 10]));
}

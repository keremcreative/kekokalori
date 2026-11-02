"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { getLogsRange, getWeights, type LogEntry, type WeightEntry } from "@/lib/db";
import { calcTargets, fmt, shiftDate, todayStr } from "@/lib/nutrition";
import { buildWeeklyReport } from "@/lib/report";
import { AI_APPS, canShare, copyText, shareText } from "@/lib/share";

export default function ReportPage() {
  const { profile, loading } = useProfile();
  const [end, setEnd] = useState(todayStr());
  const [data, setData] = useState<{ end: string; logs: LogEntry[]; weights: WeightEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(false);
  const [shareable, setShareable] = useState(false);

  const start = shiftDate(end, -6);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getLogsRange(start, end), getWeights(start, end)])
      .then(([logs, weights]) => !cancelled && setData({ end, logs, weights }))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  useEffect(() => {
    const t = setTimeout(() => setShareable(canShare()), 0);
    return () => clearTimeout(t);
  }, []);

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);
  const ready = data && data.end === end ? data : null;
  const text = useMemo(
    () =>
      profile && targets && ready
        ? buildWeeklyReport({ profile, targets, logs: ready.logs, weights: ready.weights, endDate: end })
        : "",
    [profile, targets, ready, end],
  );

  if (loading) return <p className="text-stone-400">Yükleniyor…</p>;
  if (!profile || !targets) return <p className="text-stone-500">Önce profilini oluşturmalısın.</p>;

  const food = ready?.logs.filter((l) => l.meal !== "water") ?? [];
  const days = new Set(food.map((l) => l.eaten_on));
  const totalKcal = food.reduce((s, l) => s + ((l.per100.kcal ?? 0) * l.grams) / 100, 0);
  const avgKcal = days.size ? totalKcal / days.size : 0;
  const w = ready?.weights ?? [];
  const wDiff = w.length > 1 ? w[w.length - 1].weight_kg - w[0].weight_kg : null;
  const isThisWeek = end === todayStr();

  async function copy() {
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button onClick={() => setEnd(shiftDate(end, -7))} className="px-3 py-1 text-2xl text-stone-500" aria-label="Önceki hafta">
          ‹
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Haftalık rapor</h1>
          <p className="text-xs text-stone-500">
            {fmtDay(start)} - {fmtDay(end)}
          </p>
        </div>
        <button
          onClick={() => setEnd(shiftDate(end, 7) > todayStr() ? todayStr() : shiftDate(end, 7))}
          disabled={isThisWeek}
          className="px-3 py-1 text-2xl text-stone-500 disabled:opacity-20"
          aria-label="Sonraki hafta"
        >
          ›
        </button>
      </header>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="card grid grid-cols-3 gap-2 text-center">
        <Stat label="Kayıtlı gün" value={ready ? `${days.size} / 7` : "…"} />
        <Stat label="Ort. kalori" value={ready ? (avgKcal ? fmt(Math.round(avgKcal)) : "-") : "…"} sub={`hedef ${fmt(Math.round(targets.values.kcal))}`} />
        <Stat
          label="Kilo değişimi"
          value={ready ? (wDiff === null ? "-" : `${wDiff > 0 ? "+" : ""}${fmt(Math.round(wDiff * 10) / 10)} kg`) : "…"}
        />
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Kendi yapay zekâna sor</h2>
        <p className="text-sm text-stone-600">
          Rapor; profilini, hedeflerini, kilonu, günlük toplamları ve ne yediğini içerir. En başında yapay zekâya ne
          sorulacağı da yazılı. Kopyala, kullandığın yapay zekâya yapıştır, sana neyi azaltıp neyi artırman gerektiğini
          söylesin.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={copy} disabled={!text} className="btn-primary">
            {copied ? "✓ Kopyalandı" : "📋 Raporu kopyala"}
          </button>
          {shareable ? (
            <button onClick={() => shareText(text, "Haftalık beslenme raporum")} disabled={!text} className="btn-secondary">
              📤 Paylaş
            </button>
          ) : (
            <button onClick={() => setShowText(!showText)} disabled={!text} className="btn-secondary">
              {showText ? "Gizle" : "👁 Göster"}
            </button>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs text-stone-500">Kopyalayıp aç ve yapıştır:</p>
          <div className="grid grid-cols-3 gap-2">
            {AI_APPS.map((a) => (
              <a
                key={a.name}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  copy();
                }}
                className="btn-secondary px-2 text-center text-sm"
              >
                {a.name} ↗
              </a>
            ))}
          </div>
        </div>
        {shareable && (
          <button onClick={() => setShowText(!showText)} className="text-sm text-stone-500 underline">
            {showText ? "Raporu gizle" : "Raporu göster"}
          </button>
        )}
        {showText && (
          <pre className="max-h-96 overflow-auto rounded-lg bg-stone-100 p-3 text-xs whitespace-pre-wrap text-stone-700">
            {text}
          </pre>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {sub && <p className="text-[10px] text-stone-400">{sub}</p>}
    </div>
  );
}

function fmtDay(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

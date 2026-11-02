"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addLogs, authHeader, getRecentFoods, type LogEntry } from "@/lib/db";
import { FOODS, searchFoods, type Food } from "@/lib/foods";
import { MEALS, fmt, guessMeal, scale, todayStr, type Meal, type Nutrients } from "@/lib/nutrition";
import { resizeImage } from "@/lib/image";
import { PHOTO_PROMPT, parseAiItems } from "@/lib/importAi";
import { AI_APPS, copyText } from "@/lib/share";
import { useAiEnabled } from "@/components/useAiEnabled";

type CartItem = {
  key: string;
  name: string;
  grams: number;
  per100: Nutrients;
  source: "db" | "photo" | "custom";
  note?: string;
};

type Tab = "photo" | "list" | "custom";

let keySeq = 0;
const nextKey = () => `k${++keySeq}`;

export default function AddPage() {
  return (
    <Suspense>
      <Add />
    </Suspense>
  );
}

function Add() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("photo");
  const [date, setDate] = useState(() => {
    const d = params.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayStr();
  });
  const [meal, setMeal] = useState<Meal>(() => {
    const m = params.get("meal");
    return MEALS.some((x) => x.id === m) ? (m as Meal) : guessMeal();
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = (items: Omit<CartItem, "key">[]) =>
    setCart((c) => [...c, ...items.map((i) => ({ ...i, key: nextKey() }))]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + ((i.per100.kcal ?? 0) * i.grams) / 100, 0),
    [cart],
  );

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await addLogs(
        cart
          .filter((i) => i.grams > 0)
          .map((i) => ({
            eaten_on: date,
            meal,
            name: i.name.trim() || "Adsız",
            grams: i.grams,
            per100: i.per100,
            source: i.source,
          })),
      );
      router.push(date === todayStr() ? "/" : `/?date=${date}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Yemek / içecek ekle</h1>

      <div className="flex gap-2">
        <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)} className="input flex-1">
          {MEALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className="input w-40" />
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-200 p-1 text-sm">
        {(
          [
            ["photo", "📷 Fotoğraf"],
            ["list", "🔎 Listeden"],
            ["custom", "✏️ Elle"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg py-2 ${tab === id ? "bg-white font-semibold shadow-sm" : "text-stone-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "photo" && <PhotoArea onAdd={addToCart} />}
      {tab === "list" && <ListTab onAdd={addToCart} />}
      {tab === "custom" && <CustomTab onAdd={addToCart} />}

      {cart.length > 0 && (
        <section className="card space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Eklenecekler</h2>
            <span className="text-sm text-stone-500">Toplam {fmt(total)} kcal</span>
          </div>
          <p className="text-xs text-stone-500">Gramları kontrol et, gerekirse düzelt.</p>
          <ul className="divide-y divide-stone-100">
            {cart.map((item) => (
              <CartRow
                key={item.key}
                item={item}
                onChange={(next) => setCart((c) => c.map((x) => (x.key === item.key ? next : x)))}
                onRemove={() => setCart((c) => c.filter((x) => x.key !== item.key))}
              />
            ))}
          </ul>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? "Kaydediliyor…" : `Kaydet (${cart.length})`}
          </button>
        </section>
      )}
    </div>
  );
}

function CartRow({
  item,
  onChange,
  onRemove,
}: {
  item: CartItem;
  onChange: (i: CartItem) => void;
  onRemove: () => void;
}) {
  const n = scale(item.per100, item.grams);
  return (
    <li className="py-3">
      <div className="flex items-center gap-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          className="min-w-0 flex-1 rounded-lg border border-transparent px-1 py-1 font-medium hover:border-stone-200 focus:border-stone-300 focus:outline-none"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={item.grams || ""}
            onChange={(e) => onChange({ ...item, grams: Number(e.target.value) })}
            className="w-20 rounded-lg border border-stone-300 px-2 py-1 text-right"
          />
          <span className="text-sm text-stone-500">g</span>
        </div>
        <button onClick={onRemove} aria-label="Kaldır" className="px-2 text-stone-400 hover:text-red-600">
          ✕
        </button>
      </div>
      <div className="mt-1 px-1 text-xs text-stone-500">
        {fmt(Math.round(n.kcal ?? 0))} kcal · P {fmt(n.protein ?? 0)} g · K {fmt(n.carbs ?? 0)} g · Y {fmt(n.fat ?? 0)} g
        {item.note && <span className="block text-stone-400">{item.note}</span>}
      </div>
    </li>
  );
}

function PhotoArea({ onAdd }: { onAdd: (items: Omit<CartItem, "key">[]) => void }) {
  const aiEnabled = useAiEnabled();
  const [own, setOwn] = useState(false);
  if (aiEnabled === null) return <p className="text-sm text-stone-400">Yükleniyor…</p>;
  if (!aiEnabled) return <OwnAiPanel onAdd={onAdd} />;
  return (
    <div className="space-y-2">
      {own ? <OwnAiPanel onAdd={onAdd} /> : <PhotoTab onAdd={onAdd} />}
      <button onClick={() => setOwn(!own)} className="w-full text-center text-sm text-stone-500 underline">
        {own ? "Uygulamanın kendi analizini kullan" : "veya kendi yapay zekânla (ChatGPT, Gemini, Claude) analiz et"}
      </button>
    </div>
  );
}

function OwnAiPanel({ onAdd }: { onAdd: (items: Omit<CartItem, "key">[]) => void }) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    if (await copyText(PHOTO_PROMPT)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function importAnswer() {
    setError(null);
    try {
      const items = parseAiItems(answer);
      onAdd(items.map((i) => ({ ...i, source: "photo" as const })));
      setAnswer("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="font-semibold">Kendi yapay zekânla fotoğraf analizi</h2>
        <p className="mt-1 text-sm text-stone-600">Kullandığın yapay zekâ fotoğrafı analiz etsin, sonucu buraya yapıştır.</p>
      </div>
      <ol className="space-y-3 text-sm">
        <li>
          <p className="mb-2">
            <b>1.</b> Komutu kopyala ve yapay zekânı aç (düğmeler komutu kopyalayıp açar):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={copyPrompt} className="btn-primary col-span-3 text-sm">
              {copied ? "✓ Komut kopyalandı" : "📋 Komutu kopyala"}
            </button>
            {AI_APPS.map((a) => (
              <a
                key={a.name}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  copyPrompt();
                }}
                className="btn-secondary px-2 text-center text-sm"
              >
                {a.name} ↗
              </a>
            ))}
          </div>
        </li>
        <li>
          <b>2.</b> Orada komutu yapıştır, yemeğin fotoğrafını ekle ve gönder. İstersen &quot;2 yumurta, yarım ekmek&quot; gibi
          bir not da yaz.
        </li>
        <li>
          <p className="mb-2">
            <b>3.</b> Gelen cevabın tamamını kopyalayıp buraya yapıştır:
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder='[{"name": "Menemen", "grams": 200, ...}]'
            className="input font-mono text-xs"
          />
        </li>
      </ol>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={importAnswer} disabled={!answer.trim()} className="btn-primary w-full">
        Listeye ekle
      </button>
      <p className="text-xs text-stone-500">Kaydetmeden önce gramları aşağıdaki listede kontrol edebilirsin.</p>
    </section>
  );
}

function PhotoTab({ onAdd }: { onAdd: (items: Omit<CartItem, "key">[]) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeImage(file, 1280);
      setImage(dataUrl);
      setPreview(dataUrl);
    } catch {
      setError("Fotoğraf okunamadı. Başka bir fotoğraf dene.");
    }
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ image, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analiz başarısız oldu.");
      const items = data.items as { name: string; grams: number; per100: Nutrients; note?: string }[];
      if (items.length === 0) {
        setError("Fotoğrafta yiyecek ya da içecek bulunamadı.");
      } else {
        onAdd(items.map((i) => ({ ...i, grams: Math.round(i.grams), source: "photo" as const })));
        setImage(null);
        setPreview(null);
        setText("");
      }
      if (data.note) setNote(data.note);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-4 text-center text-stone-600 hover:bg-stone-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Seçilen fotoğraf" className="max-h-64 rounded-lg object-contain" />
        ) : (
          <>
            <span className="text-4xl">📷</span>
            <span className="text-sm">Fotoğraf çek veya galeriden seç</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="İstersen açıklama ekle: ör. &quot;2 yumurtalı menemen, 1 dilim ekmek, şekersiz çay&quot;. Fotoğraf olmadan sadece yazarak da analiz edebilirsin."
        className="input text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {note && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{note}</p>}
      <button onClick={analyze} disabled={busy || (!image && !text.trim())} className="btn-primary w-full">
        {busy ? "Analiz ediliyor… (10-30 sn)" : "Analiz et"}
      </button>
      <p className="text-xs text-stone-500">
        Gramlar fotoğraftan tahmin edilir. Sonuçlar aşağıdaki listeye eklenir, kaydetmeden önce düzeltebilirsin.
      </p>
    </section>
  );
}

function ListTab({ onAdd }: { onAdd: (items: Omit<CartItem, "key">[]) => void }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(0);

  useEffect(() => {
    getRecentFoods().then(setRecent).catch(() => {});
  }, []);

  const results = useMemo(() => searchFoods(q), [q]);
  const grouped = useMemo(() => {
    const g = new Map<string, Food[]>();
    for (const f of results) g.set(f.category, [...(g.get(f.category) ?? []), f]);
    return [...g.entries()];
  }, [results]);

  function choose(f: Food) {
    setSelected(f);
    setGrams(f.portion.grams);
  }

  if (selected) {
    const n = scale(selected.per100, grams);
    const unit = selected.drink ? "ml" : "g";
    return (
      <section className="card space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold">{selected.name}</h2>
            <p className="text-xs text-stone-500">
              1 porsiyon: {selected.portion.label} ≈ {selected.portion.grams} {unit}
            </p>
          </div>
          <button onClick={() => setSelected(null)} className="text-sm text-stone-500 underline">
            Geri
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={grams || ""}
            onChange={(e) => setGrams(Number(e.target.value))}
            className="input w-28 text-right"
            autoFocus
          />
          <span className="text-stone-500">{unit}</span>
          <div className="ml-auto flex gap-1">
            {[0.5, 1, 2].map((m) => (
              <button
                key={m}
                onClick={() => setGrams(Math.round(selected.portion.grams * m))}
                className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
              >
                {m === 0.5 ? "½" : m} porsiyon
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-stone-600">
          <b>{fmt(Math.round(n.kcal ?? 0))} kcal</b> · Protein {fmt(n.protein ?? 0)} g · Karb. {fmt(n.carbs ?? 0)} g · Yağ{" "}
          {fmt(n.fat ?? 0)} g
        </p>
        <button
          disabled={!grams}
          onClick={() => {
            onAdd([{ name: selected.name, grams, per100: selected.per100, source: "db" }]);
            setSelected(null);
            setQ("");
          }}
          className="btn-primary w-full"
        >
          Listeye ekle
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ara: yumurta, ayran, mercimek…"
        className="input"
      />
      {!q && recent.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">Son eklediklerin</h3>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() => onAdd([{ name: r.name, grams: r.grams, per100: r.per100, source: r.source === "photo" ? "photo" : r.source === "custom" ? "custom" : "db" }])}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm"
              >
                + {r.name} <span className="text-stone-400">{fmt(r.grams)} g</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {grouped.length === 0 && (
        <p className="text-sm text-stone-500">
          Bulunamadı. &quot;Fotoğraf&quot; sekmesinde yazarak analiz ettirebilir ya da &quot;Elle&quot; sekmesinden kendin
          ekleyebilirsin.
        </p>
      )}
      {grouped.map(([cat, foods]) => (
        <div key={cat} className="card p-0">
          <h3 className="px-4 pt-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">{cat}</h3>
          <ul className="divide-y divide-stone-100">
            {foods.map((f) => (
              <li key={f.id}>
                <button onClick={() => choose(f)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
                  <span>{f.name}</span>
                  <span className="text-xs text-stone-500">
                    {fmt(Math.round(f.per100.kcal ?? 0))} kcal / 100 {f.drink ? "ml" : "g"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-center text-xs text-stone-400">Listede {FOODS.length} besin var. Değerler yaklaşıktır.</p>
    </section>
  );
}

function CustomTab({ onAdd }: { onAdd: (items: Omit<CartItem, "key">[]) => void }) {
  const [name, setName] = useState("");
  const [grams, setGrams] = useState(100);
  const [v, setV] = useState({ kcal: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", sodium: "" });

  const fields: [keyof typeof v, string][] = [
    ["kcal", "Kalori (kcal)"],
    ["protein", "Protein (g)"],
    ["carbs", "Karbonhidrat (g)"],
    ["fat", "Yağ (g)"],
    ["fiber", "Lif (g)"],
    ["sugar", "Şeker (g)"],
    ["sodium", "Sodyum (mg)"],
  ];

  function add() {
    const per100: Nutrients = {};
    for (const [k] of fields) if (v[k] !== "") per100[k] = Number(v[k]);
    onAdd([{ name, grams, per100, source: "custom" }]);
    setName("");
    setV({ kcal: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", sodium: "" });
  }

  return (
    <section className="card space-y-3">
      <p className="text-sm text-stone-600">Paketin üzerindeki besin tablosundan 100 g değerlerini gir.</p>
      <div>
        <label className="label">Adı</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="ör. Protein bar" />
      </div>
      <div>
        <label className="label">Yediğin miktar (g)</label>
        <input type="number" inputMode="decimal" value={grams || ""} onChange={(e) => setGrams(Number(e.target.value))} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([k, label]) => (
          <div key={k}>
            <label className="label text-xs">{label} / 100 g</label>
            <input
              type="number"
              inputMode="decimal"
              value={v[k]}
              onChange={(e) => setV({ ...v, [k]: e.target.value })}
              className="input"
            />
          </div>
        ))}
      </div>
      <button onClick={add} disabled={!name.trim() || !grams || v.kcal === ""} className="btn-primary w-full">
        Listeye ekle
      </button>
    </section>
  );
}

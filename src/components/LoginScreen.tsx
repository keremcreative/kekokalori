"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const auth = supabase().auth;
    const { data, error } =
      mode === "login"
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: translateError(error.message) });
    } else if (mode === "signup" && !data.session) {
      setMessage({ ok: true, text: "Kayıt tamam. E-postana gelen onay linkine tıkla, sonra giriş yap." });
      setMode("login");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🥗</div>
        <h1 className="text-2xl font-bold">Kalori Defteri</h1>
        <p className="mt-1 text-sm text-stone-500">Ne yediğini kaydet, hedefini takip et.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Şifre (en az 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Bekle…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </button>
      </form>

      {message && (
        <p className={`mt-4 text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>
      )}

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage(null);
        }}
        className="mt-6 text-sm text-stone-600 underline"
      >
        {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
      </button>
    </main>
  );
}

function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/email not confirmed/i.test(msg)) return "E-postanı henüz onaylamadın. Gelen kutunu kontrol et.";
  if (/already registered/i.test(msg)) return "Bu e-posta ile zaten bir hesap var.";
  if (/signups not allowed/i.test(msg)) return "Yeni kayıtlar kapalı. Uygulamayı kuran kişiden davet iste.";
  return msg;
}

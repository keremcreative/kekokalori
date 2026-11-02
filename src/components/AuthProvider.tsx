"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import LoginScreen from "./LoginScreen";

const configError =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? null
    : "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. README'deki kurulum adımlarına bak.";

type AuthState = { session: Session; userId: string; email: string };

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    if (configError) return;
    const client = supabase();
    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (configError) {
    return (
      <div className="p-6 text-sm">
        <h1 className="mb-2 text-lg font-semibold">Kurulum eksik</h1>
        <p>{configError}</p>
      </div>
    );
  }
  if (session === undefined) {
    return <div className="flex flex-1 items-center justify-center text-stone-400">Yükleniyor…</div>;
  }
  if (!session) return <LoginScreen />;

  return (
    <AuthContext.Provider
      value={{ session, userId: session.user.id, email: session.user.email ?? "" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

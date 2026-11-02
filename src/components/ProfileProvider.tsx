"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getProfile } from "@/lib/db";
import type { Profile } from "@/lib/nutrition";

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  reload: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function useProfile(): ProfileState {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile, ProfileProvider içinde kullanılmalı");
  return ctx;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setProfile(await getProfile());
    } catch (e) {
      console.error("Profil yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((e) => console.error("Profil yüklenemedi", e))
      .finally(() => setLoading(false));
  }, []);

  return <ProfileContext.Provider value={{ profile, loading, reload }}>{children}</ProfileContext.Provider>;
}

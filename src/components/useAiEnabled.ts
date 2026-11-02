"use client";

import { useEffect, useState } from "react";

let cached: Promise<boolean> | null = null;

/** Sunucuda ANTHROPIC_API_KEY tanımlıysa true döner. Bilinmiyorsa null. */
export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    cached ??= fetch("/api/status")
      .then((r) => r.json())
      .then((d) => Boolean(d.ai))
      .catch(() => false);
    let alive = true;
    cached.then((v) => alive && setEnabled(v));
    return () => {
      alive = false;
    };
  }, []);
  return enabled;
}

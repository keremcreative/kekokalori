"use client";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Eski tarayıcılar için yedek yöntem
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function canShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function shareText(text: string, title: string): Promise<void> {
  try {
    await navigator.share({ title, text });
  } catch {
    // Kullanıcı paylaşımı iptal ettiyse sessizce geç
  }
}

export const AI_APPS = [
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Gemini", url: "https://gemini.google.com/app" },
  { name: "Claude", url: "https://claude.ai/new" },
];

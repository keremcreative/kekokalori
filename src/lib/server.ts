import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** İstekteki Supabase oturum anahtarını doğrular; izinli e-posta listesi varsa kontrol eder. */
export async function requireUser(req: Request): Promise<{ id: string; email: string }> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Giriş yapman gerekiyor.");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Oturumun geçersiz, tekrar giriş yap.");
  const email = (data.user.email ?? "").toLowerCase();
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(email)) {
    throw new HttpError(403, "Yapay zekâ özellikleri bu hesap için açık değil.");
  }
  return { id: data.user.id, email };
}

export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "Yapay zekâ özelliği kurulmamış (ANTHROPIC_API_KEY eksik).");
  }
  return new Anthropic();
}

export const MODEL = "claude-opus-5-5";

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Çok fazla istek gönderildi, biraz sonra tekrar dene." }, { status: 429 });
  }
  if (e instanceof Anthropic.APIError) {
    console.error("Anthropic API hatası", e.status, e.message);
    return Response.json({ error: "Yapay zekâ servisine ulaşılamadı, tekrar dene." }, { status: 502 });
  }
  console.error(e);
  return Response.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
}

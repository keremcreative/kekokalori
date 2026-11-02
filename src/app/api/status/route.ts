import { connection } from "next/server";

/** İstemciye yapay zekâ (Anthropic API) özelliklerinin açık olup olmadığını söyler. */
export async function GET() {
  await connection();
  return Response.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY) });
}

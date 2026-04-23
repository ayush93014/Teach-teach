import { NextResponse } from "next/server";

const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export async function GET() {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  return NextResponse.json({
    ok: missing.length === 0,
    missing,
  });
}

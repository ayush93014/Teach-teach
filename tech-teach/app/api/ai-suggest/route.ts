import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeSuggestion } from "@/lib/claude";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@/lib/supabase-server";

const bodySchema = z.object({
  doubtId: z.string().uuid(),
  questionText: z.string().min(3),
  subject: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { doubtId, questionText, subject } = bodySchema.parse(await req.json());
    const suggestion = await getClaudeSuggestion({ question: questionText, subject });

    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from("doubts")
      .update({ ai_suggestion: suggestion })
      .eq("id", doubtId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestion" },
      { status: 400 },
    );
  }
}

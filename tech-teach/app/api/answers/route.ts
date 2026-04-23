import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  doubtId: z.string().uuid(),
  answerText: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.parse(await req.json());
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: answerError } = await supabase.from("answers").insert({
      doubt_id: parsed.doubtId,
      teacher_id: user.id,
      answer_text: parsed.answerText,
    });
    if (answerError) {
      return NextResponse.json({ error: answerError.message }, { status: 400 });
    }

    const { error: doubtError } = await supabase
      .from("doubts")
      .update({ status: "answered" })
      .eq("id", parsed.doubtId);
    if (doubtError) {
      return NextResponse.json({ error: doubtError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bad request" },
      { status: 400 },
    );
  }
}

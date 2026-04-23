import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  lectureId: z.string().uuid(),
  questionText: z.string().min(3),
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

    const { data, error } = await supabase
      .from("doubts")
      .insert({
        lecture_id: parsed.lectureId,
        student_id: user.id,
        question_text: parsed.questionText,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 400 });
    }

    return NextResponse.json({ doubtId: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bad request" },
      { status: 400 },
    );
  }
}

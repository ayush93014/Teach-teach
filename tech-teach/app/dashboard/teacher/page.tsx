import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LectureCard } from "@/components/LectureCard";
import { Navbar } from "@/components/Navbar";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { mapLectureRowToMeta } from "@/lib/ui";
import type { LectureWithMeta } from "@/types";

export const dynamic = "force-dynamic";

async function createLecture(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  if (!title || !date) return;

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!teacher) return;

  await supabase
    .from("lectures")
    .insert({ teacher_id: teacher.id, title, date });
  revalidatePath("/dashboard/teacher");
}

export default async function TeacherDashboardPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "teacher") redirect("/dashboard");

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: lectures } = teacher
    ? await supabase
        .from("lectures")
        .select("id, teacher_id, title, date, created_at, doubts(id, file_url)")
        .eq("teacher_id", teacher.id)
        .order("date", { ascending: false })
    : { data: [] as unknown[] };

  const lectureList: LectureWithMeta[] =
    (lectures as
      | (Record<string, unknown> & {
          doubts?: { id: string; file_url: string | null }[];
        })[]
      | null)?.map((lecture) =>
      mapLectureRowToMeta({
        id: lecture.id as string,
        teacher_id: lecture.teacher_id as string,
        title: lecture.title as string,
        date: lecture.date as string,
        created_at: lecture.created_at as string,
        doubts: lecture.doubts,
      }),
    ) ?? [];

  return (
    <div>
      <Navbar role="teacher" name={profile.name as string} />
      <main className="max-page space-y-5 py-6">
        <section className="card space-y-3">
          <h1 className="text-2xl font-bold">My Lectures</h1>
          <form action={createLecture} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
            <input
              name="title"
              required
              placeholder="Lecture title"
              className="rounded-lg border border-slate-300 p-2.5"
            />
            <input name="date" required type="date" className="rounded-lg border border-slate-300 p-2.5" />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Lecture
            </button>
          </form>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {lectureList.length ? (
            lectureList.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)
          ) : (
            <p className="card text-sm text-slate-600">
              No lectures found. Create one to start receiving doubts.
            </p>
          )}
        </section>

        {teacher ? (
          <Link
            href={`/teacher/${teacher.id}`}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Public Teacher Profile
          </Link>
        ) : null}
      </main>
    </div>
  );
}

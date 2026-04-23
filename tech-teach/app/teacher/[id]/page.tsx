import { notFound } from "next/navigation";
import { LectureCard } from "@/components/LectureCard";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSingleRelation, mapLectureRowToMeta } from "@/lib/ui";
import type { Department, LectureWithMeta } from "@/types";

export const dynamic = "force-dynamic";

type TeacherProfilePageProps = {
  params: { id: string };
};

export default async function TeacherProfilePage({ params }: TeacherProfilePageProps) {
  const supabase = getSupabaseServerClient();

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, subject, experience_years, department, profile_id, profiles(name)")
    .eq("id", params.id)
    .single();

  if (error || !teacher) {
    notFound();
  }

  const { data: lectures } = await supabase
    .from("lectures")
    .select("id, teacher_id, title, date, created_at, doubts(id, file_url)")
    .eq("teacher_id", teacher.id)
    .order("date", { ascending: false });

  const lectureCards: LectureWithMeta[] =
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

  const teacherProfile = getSingleRelation(teacher.profiles as { name?: string }[] | { name?: string } | null);
  const teacherName =
    (teacherProfile?.name as string | undefined) ?? "Teacher";

  return (
    <main className="max-page space-y-4 py-6">
      <section className="card">
        <h1 className="text-2xl font-bold">{teacherName}</h1>
        <p className="text-slate-600">{teacher.subject}</p>
        <p className="text-sm text-slate-500">
          {(teacher.department as Department) ?? "CSE"} | {teacher.experience_years} years
        </p>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        {lectureCards.length ? (
          lectureCards.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)
        ) : (
          <p className="card text-sm text-slate-600">No lectures published yet.</p>
        )}
      </section>
    </main>
  );
}

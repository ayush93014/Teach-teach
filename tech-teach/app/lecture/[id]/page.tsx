"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DoubtCard } from "@/components/DoubtCard";
import { DoubtForm } from "@/components/DoubtForm";
import { Navbar } from "@/components/Navbar";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatDisplayDate, getSingleRelation } from "@/lib/ui";
import type { DoubtWithRelations, Role } from "@/types";

type LectureData = {
  id: string;
  title: string;
  subject: string;
  date: string;
};

export default function LecturePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [doubts, setDoubts] = useState<DoubtWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLectureData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found.");
      setRole(profile.role as Role);
      setName(profile.name as string);

      const { data: lectureRow } = await supabase
        .from("lectures")
        .select("id, title, date, teacher_id, teachers(subject)")
        .eq("id", params.id)
        .single();
      if (!lectureRow) throw new Error("Lecture not found.");

      const teacherRelation = getSingleRelation(
        lectureRow.teachers as { subject?: string }[] | { subject?: string } | null,
      );
      setLecture({
        id: lectureRow.id as string,
        title: lectureRow.title as string,
        date: lectureRow.date as string,
        subject: (teacherRelation?.subject ?? "Engineering") as string,
      });

      const { data: doubtRows } = await supabase
        .from("doubts")
        .select(
          "id, lecture_id, student_id, question_text, file_url, file_type, ai_suggestion, status, created_at, profiles(id,name,department), answers(id, doubt_id, teacher_id, answer_text, created_at)",
        )
        .eq("lecture_id", params.id)
        .order("created_at", { ascending: false });

      const normalizedDoubts =
        (doubtRows as Record<string, unknown>[] | null)?.map((doubt) => {
          const profileRelation = getSingleRelation(
            doubt.profiles as DoubtWithRelations["profiles"][] | DoubtWithRelations["profiles"] | null,
          );
          return {
            ...(doubt as DoubtWithRelations),
            profiles: (profileRelation ?? undefined) as DoubtWithRelations["profiles"],
          };
        }) ?? [];

      setDoubts(normalizedDoubts as DoubtWithRelations[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lecture.");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    void fetchLectureData();
  }, [fetchLectureData]);

  const canAnswer = useMemo(() => role === "teacher", [role]);

  if (loading) {
    return <main className="max-page py-8 text-sm text-slate-600">Loading lecture...</main>;
  }

  if (error || !lecture || !role) {
    return (
      <main className="max-page py-8">
        <p className="card text-sm text-red-600">{error ?? "Unable to load lecture."}</p>
      </main>
    );
  }

  return (
    <div>
      <Navbar role={role} name={name} />
      <main className="max-page space-y-4 py-6">
        <section className="card">
          <h1 className="text-2xl font-bold">{lecture.title}</h1>
          <p className="text-sm text-slate-600">
            {lecture.subject} | {formatDisplayDate(lecture.date)}
          </p>
        </section>

        {role === "student" ? (
          <DoubtForm
            lectureId={lecture.id}
            subject={lecture.subject}
            onSubmitted={fetchLectureData}
          />
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Doubts</h2>
          {doubts.length ? (
            doubts.map((doubt) => (
              <DoubtCard
                key={doubt.id}
                doubt={doubt}
                canAnswer={canAnswer}
                onAnswered={fetchLectureData}
              />
            ))
          ) : (
            <p className="card text-sm text-slate-600">No doubts posted yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

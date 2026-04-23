import type { LectureWithMeta } from "@/types";

type Relation<T> = T | T[] | null | undefined;

type LectureRowWithDoubts = {
  id: string;
  teacher_id: string;
  title: string;
  date: string;
  created_at: string;
  doubts?: { id: string; file_url: string | null }[] | null;
};

export function getSingleRelation<T>(relation: Relation<T>): T | undefined {
  if (!relation) {
    return undefined;
  }

  return Array.isArray(relation) ? relation[0] : relation;
}

export function formatDisplayDate(input: string): string {
  return new Date(input).toLocaleDateString();
}

export function mapLectureRowToMeta(lecture: LectureRowWithDoubts): LectureWithMeta {
  const doubts = lecture.doubts ?? [];

  return {
    id: lecture.id,
    teacher_id: lecture.teacher_id,
    title: lecture.title,
    date: lecture.date,
    created_at: lecture.created_at,
    doubt_count: doubts.length,
    upload_count: doubts.filter((item) => item.file_url).length,
  };
}

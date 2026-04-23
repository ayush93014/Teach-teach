import Link from "next/link";
import { formatDisplayDate } from "@/lib/ui";
import type { LectureWithMeta } from "@/types";

export function LectureCard({ lecture }: { lecture: LectureWithMeta }) {
  return (
    <Link href={`/lecture/${lecture.id}`} className="card block hover:border-blue-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{lecture.title}</h3>
          <p className="text-sm text-slate-600">
            {formatDisplayDate(lecture.date)}
          </p>
        </div>
        <div className="space-y-1 text-right text-xs">
          <p className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
            Doubts: {lecture.doubt_count}
          </p>
          <p className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
            Uploads: {lecture.upload_count}
          </p>
        </div>
      </div>
    </Link>
  );
}

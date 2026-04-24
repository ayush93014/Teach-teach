import Link from "next/link";
import { formatDisplayDate } from "@/lib/ui";
import type { LectureWithMeta } from "@/types";

export function LectureCard({ lecture }: { lecture: LectureWithMeta }) {
  return (
    <Link href={`/lecture/${lecture.id}`} className="card card-hover block">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{lecture.title}</h3>
          <p className="text-sm text-slate-600">
            {formatDisplayDate(lecture.date)}
          </p>
        </div>
        <div className="space-y-1 text-right text-xs">
          <p className="badge-warn">
            Doubts: {lecture.doubt_count}
          </p>
          <p className="badge">
            Uploads: {lecture.upload_count}
          </p>
        </div>
      </div>
    </Link>
  );
}

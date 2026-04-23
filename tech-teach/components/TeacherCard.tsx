import Link from "next/link";
import type { Teacher } from "@/types";

export function TeacherCard({ teacher }: { teacher: Teacher & { name: string } }) {
  const initials = teacher.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/teacher/${teacher.id}`} className="card block hover:border-blue-300">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
          {initials}
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900">{teacher.name}</p>
          <p className="text-sm text-slate-600">{teacher.subject}</p>
          <p className="text-xs text-slate-500">
            {teacher.experience_years} years experience
          </p>
        </div>
      </div>
    </Link>
  );
}

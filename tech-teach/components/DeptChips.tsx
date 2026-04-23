"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENTS, type Department } from "@/types";

export function DeptChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("dept") as Department | null) ?? "CSE";

  return (
    <div className="flex flex-wrap gap-2">
      {DEPARTMENTS.map((dept) => {
        const selected = dept === current;
        return (
          <button
            key={dept}
            type="button"
            onClick={() => router.push(`/dashboard/student?dept=${dept}`)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selected
                ? "bg-blue-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {dept}
          </button>
        );
      })}
    </div>
  );
}

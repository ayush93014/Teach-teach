"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Role } from "@/types";

type NavbarProps = {
  role: Role;
  name: string;
};

export function Navbar({ role, name }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-page flex h-16 items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
          Tech-Teach
        </Link>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
            {role}
          </span>
          <span className="hidden text-sm text-slate-600 md:block">{name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

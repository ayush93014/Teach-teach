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
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="max-page flex h-16 items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
          <span className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Tech-Teach
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="badge uppercase">{role}</span>
          <span className="hidden text-sm text-slate-600 md:block">{name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-primary px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

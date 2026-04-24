"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfigWarning } from "@/components/ConfigWarning";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ROLES, type Role } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleChoice, setRoleChoice] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") ?? "/dashboard");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Could not load your user account.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found. Please finish sign up first.");

      if (profile.role !== roleChoice) {
        await supabase.auth.signOut();
        throw new Error(`Selected role does not match your account role (${profile.role}).`);
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not log in.";
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(
          "Could not connect to Supabase. Check `.env.local` and restart the dev server.",
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-page flex min-h-screen items-center justify-center py-10">
      <form onSubmit={handleLogin} className="card w-full max-w-md space-y-4 shadow-md">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
          <p className="text-sm text-slate-600">Welcome back. Continue to your dashboard.</p>
        </div>
        <ConfigWarning />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input"
        />
        <select
          value={roleChoice}
          onChange={(e) => setRoleChoice(e.target.value as Role)}
          className="select"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          disabled={loading}
          className="btn-accent w-full"
          type="submit"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
        <p className="text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/auth/signup" className="link">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}

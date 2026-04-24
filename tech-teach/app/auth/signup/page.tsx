"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfigWarning } from "@/components/ConfigWarning";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { DEPARTMENTS, ROLES, type Department, type Role } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<Department>("CSE");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        const authMsg = authError.message.toLowerCase();
        if (authMsg.includes("already registered") || authMsg.includes("already been registered")) {
          setSuccess("Request accepted. If this email is already in use, just log in.");
          return;
        }
        throw authError;
      }

      if (!data.user) {
        setSuccess("Request accepted. Please check your email to verify your account.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        name,
        role,
        department,
      });
      if (profileError) {
        const profileMsg = profileError.message.toLowerCase();
        if (!profileMsg.includes("duplicate key")) {
          throw profileError;
        }
      }

      setSuccess("Sign up complete. You can now continue to dashboard.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not sign up.";
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
      <form onSubmit={handleSignup} className="card w-full max-w-md space-y-4 shadow-md">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Sign up</h1>
          <p className="text-sm text-slate-600">Create your account in under a minute.</p>
        </div>
        <ConfigWarning />
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="input"
        />
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
          value={department}
          onChange={(e) => setDepartment(e.target.value as Department)}
          className="select"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="select"
        >
          {ROLES.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          disabled={loading}
          className="btn-accent w-full"
          type="submit"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="link">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}

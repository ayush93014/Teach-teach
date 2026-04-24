import Link from "next/link";

export default function Home() {
  return (
    <main className="max-page flex min-h-screen items-center justify-center py-12">
      <div className="card w-full max-w-2xl space-y-7 text-center shadow-md">
        <div className="space-y-3">
          <p className="mx-auto w-fit rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700">
            Lecture doubts • Teachers • AI draft answers
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Tech-Teach
          </h1>
          <p className="mx-auto max-w-xl text-slate-600">
            Ask questions lecture-wise, attach files, and get quick help from teachers — with an AI draft answer to speed things up.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/auth/login" className="btn-accent">
            Log in
          </Link>
          <Link href="/auth/signup" className="btn-outline">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="max-page flex min-h-screen items-center justify-center py-12">
      <div className="card w-full max-w-2xl space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tech-Teach</h1>
          <p className="mt-2 text-slate-600">
            Ask questions by lecture and get help from teachers with quick AI support.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

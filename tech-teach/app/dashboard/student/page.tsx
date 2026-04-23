import { redirect } from "next/navigation";
import { DeptChips } from "@/components/DeptChips";
import { Navbar } from "@/components/Navbar";
import { TeacherCard } from "@/components/TeacherCard";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSingleRelation } from "@/lib/ui";
import { DEPARTMENTS, type Department } from "@/types";

export const dynamic = "force-dynamic";

type StudentDashboardPageProps = {
  searchParams: { dept?: string };
};

export default async function StudentDashboardPage({
  searchParams,
}: StudentDashboardPageProps) {
  const currentDept = (searchParams.dept as Department) ?? "CSE";
  const department = DEPARTMENTS.includes(currentDept) ? currentDept : "CSE";

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    redirect("/dashboard");
  }

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, subject, experience_years, department, profiles(name)")
    .eq("department", department)
    .limit(5);

  const teacherList =
    teachers?.map((teacher) => {
      const profileRelation = getSingleRelation(teacher.profiles as { name?: string }[] | { name?: string } | null);
      return {
        id: teacher.id as string,
        profile_id: "",
        subject: teacher.subject as string,
        experience_years: teacher.experience_years as number,
        department: teacher.department as Department,
        name: (profileRelation?.name ?? "Teacher") as string,
      };
    }) ?? [];

  return (
    <div>
      <Navbar role="student" name={profile.name as string} />
      <main className="max-page space-y-4 py-6">
        <div className="card space-y-3">
          <h1 className="text-2xl font-bold">Find Teachers by Department</h1>
          <DeptChips />
        </div>
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {teacherList.length ? (
            teacherList.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))
          ) : (
            <p className="card text-sm text-slate-600">
              No teachers found for {department}.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

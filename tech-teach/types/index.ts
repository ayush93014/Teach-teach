export const DEPARTMENTS = ["CSE", "EEE", "ECE", "Civil", "Mechanical"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const ROLES = ["student", "teacher"] as const;
export type Role = (typeof ROLES)[number];

export type Profile = {
  id: string;
  name: string;
  role: Role;
  department: Department;
  created_at: string;
};

export type Teacher = {
  id: string;
  profile_id: string;
  subject: string;
  experience_years: number;
  department: Department;
  profiles?: Profile;
};

export type Lecture = {
  id: string;
  teacher_id: string;
  title: string;
  date: string;
  created_at: string;
};

export type DoubtFileType = "image" | "pdf" | null;
export type DoubtStatus = "pending" | "answered";

export type Doubt = {
  id: string;
  lecture_id: string;
  student_id: string;
  question_text: string;
  file_url: string | null;
  file_type: DoubtFileType;
  ai_suggestion: string | null;
  status: DoubtStatus;
  created_at: string;
};

export type Answer = {
  id: string;
  doubt_id: string;
  teacher_id: string;
  answer_text: string;
  created_at: string;
};

export type LectureWithMeta = Lecture & {
  doubt_count: number;
  upload_count: number;
};

export type DoubtWithRelations = Doubt & {
  profiles?: Pick<Profile, "id" | "name" | "department">;
  answers?: Answer[];
};

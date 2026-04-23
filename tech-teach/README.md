# Tech-Teach

A simple Q&A platform for students and teachers.
Built with Next.js, Tailwind CSS, Supabase, and Claude API.

## 1) Quick setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `cp .env.example .env.local` (PowerShell: `Copy-Item .env.example .env.local`)
3. Fill all values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
4. Run:
   - `npm run dev`

## 2) Supabase SQL setup

Run the SQL below in Supabase SQL Editor in this order.

### 2.1 Enums

```sql
create type public.user_role as enum ('student', 'teacher');
create type public.department_type as enum ('CSE', 'EEE', 'ECE', 'Civil', 'Mechanical');
create type public.file_type as enum ('image', 'pdf');
create type public.doubt_status as enum ('pending', 'answered');
```

### 2.2 Tables

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null,
  department public.department_type not null,
  created_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  subject text not null,
  experience_years int not null check (experience_years >= 0),
  department public.department_type not null,
  created_at timestamptz not null default now()
);

create table public.lectures (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table public.doubts (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_text text not null,
  file_url text,
  file_type public.file_type,
  ai_suggestion text,
  status public.doubt_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  doubt_id uuid not null unique references public.doubts(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default now()
);
```

### 2.3 Helpful Indexes

```sql
create index idx_profiles_role on public.profiles(role);
create index idx_teachers_dept on public.teachers(department);
create index idx_lectures_teacher on public.lectures(teacher_id);
create index idx_doubts_lecture on public.doubts(lecture_id);
create index idx_doubts_student on public.doubts(student_id);
create index idx_doubts_status on public.doubts(status);
```

### 2.4 Trigger: auto-create teacher row when teacher signs up

```sql
create or replace function public.create_teacher_record()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role = 'teacher' then
    insert into public.teachers (profile_id, subject, experience_years, department)
    values (new.id, 'General Engineering', 0, new.department)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_create_teacher_record on public.profiles;
create trigger trg_create_teacher_record
after insert on public.profiles
for each row execute function public.create_teacher_record();
```

### 2.5 Row Level Security

```sql
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.lectures enable row level security;
alter table public.doubts enable row level security;
alter table public.answers enable row level security;
```

#### profiles policies

```sql
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

#### teachers policies

```sql
create policy "teachers_select_authenticated"
on public.teachers for select
to authenticated
using (true);

create policy "teachers_update_own"
on public.teachers for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.id = teachers.profile_id
      and p.role = 'teacher'
  )
);
```

#### lectures policies

```sql
create policy "lectures_select_authenticated"
on public.lectures for select
to authenticated
using (true);

create policy "lectures_insert_teacher_own"
on public.lectures for insert
to authenticated
with check (
  exists (
    select 1 from public.teachers t
    join public.profiles p on p.id = t.profile_id
    where t.id = lectures.teacher_id
      and p.id = auth.uid()
      and p.role = 'teacher'
  )
);
```

#### doubts policies

```sql
create policy "doubts_select_authenticated"
on public.doubts for select
to authenticated
using (true);

create policy "doubts_insert_student_self"
on public.doubts for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student'
  )
);

create policy "doubts_update_teacher_or_owner"
on public.doubts for update
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.lectures l
    join public.teachers t on t.id = l.teacher_id
    where l.id = doubts.lecture_id and t.profile_id = auth.uid()
  )
);
```

#### answers policies

```sql
create policy "answers_select_authenticated"
on public.answers for select
to authenticated
using (true);

create policy "answers_insert_lecture_teacher"
on public.answers for insert
to authenticated
with check (
  exists (
    select 1
    from public.doubts d
    join public.lectures l on l.id = d.lecture_id
    join public.teachers t on t.id = l.teacher_id
    where d.id = answers.doubt_id
      and t.profile_id = auth.uid()
  )
);
```

### 2.6 Storage Bucket + Policies

1. Create bucket:
   - Name: `doubt-uploads`
   - Public bucket: `true`
2. SQL policies:

```sql
create policy "storage_select_public_doubts"
on storage.objects for select
to authenticated
using (bucket_id = 'doubt-uploads');

create policy "storage_insert_own_doubts"
on storage.objects for insert
to authenticated
with check (bucket_id = 'doubt-uploads');
```

## 3) Routes

- `/` landing page
- `/auth/login`, `/auth/signup`
- `/dashboard`, `/dashboard/student`, `/dashboard/teacher`
- `/teacher/[id]`
- `/lecture/[id]`
- `/api/doubts`, `/api/upload`, `/api/ai-suggest`, `/api/answers`

## 4) Notes

- File validation: JPEG/PNG/PDF, max 5MB.
- Upload path format inside `doubt-uploads` bucket:
  - `{lecture_id}/{doubt_id}/{filename}`
- AI suggestion model:
  - `claude-sonnet-4-20250514`

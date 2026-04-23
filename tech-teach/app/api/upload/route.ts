import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@/lib/supabase-server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const lectureId = String(formData.get("lectureId") ?? "");
  const doubtId = String(formData.get("doubtId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large." }, { status: 400 });
  }

  const filePath = `${lectureId}/${doubtId}/${file.name}`;
  const adminClient = getSupabaseAdminClient();

  const { error: uploadError } = await adminClient.storage
    .from("doubt-uploads")
    .upload(filePath, file, { contentType: file.type, upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrlData } = adminClient.storage
    .from("doubt-uploads")
    .getPublicUrl(filePath);

  const fileType = file.type === "application/pdf" ? "pdf" : "image";
  const { error: updateError } = await adminClient
    .from("doubts")
    .update({ file_url: publicUrlData.publicUrl, file_type: fileType })
    .eq("id", doubtId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ fileUrl: publicUrlData.publicUrl, fileType });
}

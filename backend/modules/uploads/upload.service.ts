import { getAdminClient } from "@config/supabaseAdminClient";

export async function uploadFile(userId: string, file: File): Promise<{ filePath: string }> {
  const supabase = getAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const extension = file.name.split(".").pop() || "bin";
  const filePath = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(filePath, fileBuffer, { contentType: file.type, upsert: false });

  if (error) throw error;

  return { filePath };
}

export async function deleteFile(filePath: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.storage.from("receipts").remove([filePath]);
  if (error) throw error;
}

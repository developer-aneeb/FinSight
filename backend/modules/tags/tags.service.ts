import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
}

export async function listTags(userId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (isMissingTable(error)) {
    return [];
  }
  if (error) {
    throw new HttpError(500, "Failed to load tags");
  }

  return data || [];
}

export async function createTag(userId: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ ...payload, user_id: userId })
    .select("*")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Tags table is not set up yet");
  }
  if (error?.code === "23505") {
    throw new HttpError(409, "Tag already exists");
  }
  if (error) {
    throw new HttpError(500, "Failed to create tag");
  }

  return data;
}

export async function updateTag(userId: string, id: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Tags table is not set up yet");
  }
  if (error?.code === "23505") {
    throw new HttpError(409, "Tag already exists");
  }
  if (error) {
    throw new HttpError(404, "Tag not found");
  }

  return data;
}

export async function deleteTag(userId: string, id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("tags").delete().eq("user_id", userId).eq("id", id);

  if (isMissingTable(error)) {
    throw new HttpError(500, "Tags table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Tag not found");
  }
}

export async function syncTransactionTags(userId: string, transactionId: string, tags?: string[]): Promise<void> {
  if (!tags) {
    return;
  }

  const supabase = getAdminClient();

  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  const normalized = uniqueTags.map((name) => name.toLowerCase());

  const { data: existingTags, error: existingError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", userId)
    .in("name", uniqueTags);

  if (existingError && !isMissingTable(existingError)) {
    throw new HttpError(500, "Failed to resolve tags");
  }

  const existingByName = new Map<string, { id: string; name: string }>();
  for (const tag of existingTags || []) {
    existingByName.set(String(tag.name).toLowerCase(), { id: String(tag.id), name: String(tag.name) });
  }

  const toCreate = uniqueTags.filter((name) => !existingByName.has(name.toLowerCase()));
  if (toCreate.length) {
    const { data: createdTags, error: createError } = await supabase
      .from("tags")
      .insert(toCreate.map((name) => ({ user_id: userId, name })))
      .select("id, name");

    if (createError && !isMissingTable(createError)) {
      throw new HttpError(500, "Failed to create tags");
    }

    for (const tag of createdTags || []) {
      existingByName.set(String(tag.name).toLowerCase(), { id: String(tag.id), name: String(tag.name) });
    }
  }

  const selectedTagIds = normalized
    .map((name) => existingByName.get(name)?.id)
    .filter((id): id is string => Boolean(id));

  const { error: deleteError } = await supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId);

  if (deleteError && !isMissingTable(deleteError)) {
    throw new HttpError(500, "Failed to update transaction tags");
  }

  if (!selectedTagIds.length) {
    return;
  }

  const { error: insertError } = await supabase
    .from("transaction_tags")
    .insert(selectedTagIds.map((tagId) => ({ transaction_id: transactionId, tag_id: tagId })));

  if (insertError && !isMissingTable(insertError)) {
    throw new HttpError(500, "Failed to assign transaction tags");
  }
}
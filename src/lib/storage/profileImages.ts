import { createAdminClient } from "@/lib/supabase/admin";

export const PROFILE_IMAGES_BUCKET = "profile-images";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type ProfileImageKind = "icon" | "portrait";

export function validateImageFile(file: File): { ok: true; ext: string } | { ok: false; error: string } {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return { ok: false, error: "INVALID_TYPE" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }
  return { ok: true, ext };
}

function storagePath(userId: string, kind: ProfileImageKind, ext: string) {
  return `${userId}/${kind}.${ext}`;
}

function publicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  return `${base}/storage/v1/object/public/${PROFILE_IMAGES_BUCKET}/${path}`;
}

async function ensureBucket() {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === PROFILE_IMAGES_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(PROFILE_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_MIME),
  });
  if (error && !error.message.includes("already exists")) {
    throw error;
  }
}

export async function uploadProfileImage(
  userId: string,
  kind: ProfileImageKind,
  file: File,
): Promise<string> {
  const validated = validateImageFile(file);
  if (!validated.ok) throw new Error(validated.error);

  await ensureBucket();
  const supabase = createAdminClient();
  const path = storagePath(userId, kind, validated.ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw error;
  return publicUrl(path);
}

export async function removeProfileImageFiles(userId: string, kind: ProfileImageKind) {
  try {
    const supabase = createAdminClient();
    const exts = ["jpg", "png", "webp", "gif"];
    const paths = exts.map((ext) => storagePath(userId, kind, ext));
    await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove(paths);
  } catch {
    // ストレージ未設定時は DB のみクリア
  }
}

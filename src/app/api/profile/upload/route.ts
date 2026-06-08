import { NextResponse } from "next/server";
import { uploadProfileImageAction } from "@/lib/actions/profileUpload";
import type { ProfileImageKind } from "@/lib/storage/profileImages";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "ログインが必要です",
  INVALID_TYPE: "JPEG / PNG / WebP / GIF のみアップロードできます",
  FILE_TOO_LARGE: "ファイルは2MB以下にしてください",
  STORAGE_NOT_CONFIGURED: "画像ストレージが未設定です（管理者に連絡してください）",
  UPLOAD_FAILED: "アップロードに失敗しました",
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const kind = formData.get("kind") as ProfileImageKind;
  const file = formData.get("file");

  if (kind !== "icon" && kind !== "portrait") {
    return NextResponse.json({ error: "INVALID_KIND" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  const result = await uploadProfileImageAction(kind, file);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error, message: ERROR_MESSAGES[result.error] ?? "エラー" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, url: result.url });
}

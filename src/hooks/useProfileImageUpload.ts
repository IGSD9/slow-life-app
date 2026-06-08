"use client";

import { useCallback, useState } from "react";

type ImageKind = "icon" | "portrait";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TYPE: "JPEG / PNG / WebP / GIF のみ対応しています",
  FILE_TOO_LARGE: "2MB以下の画像を選んでください",
  STORAGE_NOT_CONFIGURED: "画像ストレージが未設定です",
  UPLOAD_FAILED: "アップロードに失敗しました",
};

export type ProfileImageUploadSuccess = (
  kind: ImageKind,
  url: string,
) => void | Promise<void>;

export function useProfileImageUpload(onSuccess?: ProfileImageUploadSuccess) {
  const [uploading, setUploading] = useState<ImageKind | null>(null);
  const [error, setError] = useState("");

  const upload = useCallback(
    async (kind: ImageKind, file: File) => {
      setUploading(kind);
      setError("");
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);

      try {
        const res = await fetch("/api/profile/upload", {
          method: "POST",
          body: formData,
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? ERROR_MESSAGES[data.error] ?? "エラーが発生しました");
          return false;
        }
        if (data.url) {
          await onSuccess?.(kind, data.url as string);
        }
        return true;
      } catch {
        setError("アップロードに失敗しました");
        return false;
      } finally {
        setUploading(null);
      }
    },
    [onSuccess],
  );

  return { upload, uploading, error, clearError: () => setError("") };
}

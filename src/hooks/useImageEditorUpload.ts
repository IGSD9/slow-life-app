"use client";

import { useCallback, useRef, useState } from "react";
import type { ImageEditorMode } from "@/lib/imageEditor";

type ImageKind = "icon" | "portrait";

const KIND_TO_MODE: Record<ImageKind, ImageEditorMode> = {
  icon: "icon",
  portrait: "portrait",
};

export function useImageEditorUpload(
  upload: (kind: ImageKind, file: File) => Promise<boolean>,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingKind, setPendingKind] = useState<ImageKind | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const openPicker = useCallback((kind: ImageKind) => {
    setPendingKind(kind);
    const input = inputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && pendingKind) {
      setEditorFile(file);
    }
  }, [pendingKind]);

  const closeEditor = useCallback(() => {
    setEditorFile(null);
    setPendingKind(null);
  }, []);

  const saveEdited = useCallback(
    async (file: File) => {
      if (!pendingKind) return;
      setSaving(true);
      const ok = await upload(pendingKind, file);
      setSaving(false);
      if (ok) closeEditor();
    },
    [pendingKind, upload, closeEditor],
  );

  const editorMode = pendingKind ? KIND_TO_MODE[pendingKind] : "icon";

  return {
    inputRef,
    openPicker,
    onFileChange,
    editorOpen: !!editorFile,
    editorFile,
    editorMode,
    closeEditor,
    saveEdited,
    saving,
    pendingKind,
  };
}

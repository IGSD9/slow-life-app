export type ImageEditorMode = "icon" | "portrait";

export interface ImageEditorTransform {
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_TRANSFORM: ImageEditorTransform = {
  rotation: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export function viewportSize(mode: ImageEditorMode) {
  return mode === "icon"
    ? { width: 280, height: 280 }
    : { width: 280, height: 373 };
}

export function outputSize(mode: ImageEditorMode) {
  return mode === "icon"
    ? { width: 512, height: 512 }
    : { width: 768, height: 1024 };
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("LOAD_FAILED"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function initialScale(
  img: HTMLImageElement,
  viewportW: number,
  viewportH: number,
): number {
  const cover = Math.max(viewportW / img.width, viewportH / img.height);
  return cover * 0.95;
}

export function renderEditedImage(
  img: HTMLImageElement,
  mode: ImageEditorMode,
  transform: ImageEditorTransform,
): Promise<Blob> {
  const { width: vw, height: vh } = viewportSize(mode);
  const { width: ow, height: oh } = outputSize(mode);
  const ratio = ow / vw;

  const canvas = document.createElement("canvas");
  canvas.width = ow;
  canvas.height = oh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("NO_CANVAS"));

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, ow, oh);

  ctx.save();
  ctx.translate((vw / 2 + transform.offsetX) * ratio, (vh / 2 + transform.offsetY) * ratio);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.scale * ratio, transform.scale * ratio);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("EXPORT_FAILED"))),
      "image/jpeg",
      0.92,
    );
  });
}

export function blobToFile(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}-edited.jpg`, { type: "image/jpeg" });
}

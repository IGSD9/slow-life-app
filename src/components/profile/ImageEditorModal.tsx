"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_TRANSFORM,
  initialScale,
  loadImageFromFile,
  renderEditedImage,
  blobToFile,
  viewportSize,
  type ImageEditorMode,
  type ImageEditorTransform,
} from "@/lib/imageEditor";

interface ImageEditorModalProps {
  open: boolean;
  file: File | null;
  mode: ImageEditorMode;
  onClose: () => void;
  onSave: (file: File) => void;
  saving?: boolean;
}

const PAN_STEP = 12;
const ZOOM_STEP = 0.08;
const ROTATE_STEP = 90;

export function ImageEditorModal({
  open,
  file,
  mode,
  onClose,
  onSave,
  saving = false,
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [transform, setTransform] = useState<ImageEditorTransform>(DEFAULT_TRANSFORM);
  const [loading, setLoading] = useState(false);

  const { width: vw, height: vh } = viewportSize(mode);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff8fb";
    ctx.fillRect(0, 0, vw, vh);

    ctx.save();
    ctx.beginPath();
    if (mode === "icon") {
      ctx.arc(vw / 2, vh / 2, vw / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.rect(0, 0, vw, vh);
      ctx.clip();
    }

    ctx.translate(vw / 2 + transform.offsetX, vh / 2 + transform.offsetY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    ctx.strokeStyle = "rgba(233, 69, 96, 0.6)";
    ctx.lineWidth = 2;
    if (mode === "icon") {
      ctx.beginPath();
      ctx.arc(vw / 2, vh / 2, vw / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(1, 1, vw - 2, vh - 2);
    }
  }, [transform, mode, vw, vh]);

  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    setLoading(true);
    setTransform(DEFAULT_TRANSFORM);

    loadImageFromFile(file)
      .then((img) => {
        if (cancelled) return;
        imgRef.current = img;
        const scale = initialScale(img, vw, vh);
        setTransform({ ...DEFAULT_TRANSFORM, scale });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      imgRef.current = null;
    };
  }, [open, file, vw, vh]);

  useEffect(() => {
    draw();
  }, [draw, loading]);

  const pan = (dx: number, dy: number) => {
    setTransform((t) => ({ ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }));
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !file) return;
    const blob = await renderEditedImage(img, mode, transform);
    onSave(blobToFile(blob, file.name));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: transform.offsetX,
      oy: transform.offsetY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setTransform((t) => ({
      ...t,
      offsetX: dragRef.current!.ox + dx,
      offsetY: dragRef.current!.oy + dy,
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (!open || !file) return null;

  const title = mode === "icon" ? "プロフィール画像の調整" : "高画質イラストの調整";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#ff6b9d]/25 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-[#ffd6e8] p-4 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9494b0] hover:text-[#ff6b9d]"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center">
          {loading ? (
            <div
              className="flex items-center justify-center bg-[#fff0f6] rounded-xl"
              style={{ width: vw, height: vh }}
            >
              <p className="text-sm text-[#9494b0]">読み込み中...</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={vw}
              height={vh}
              className="rounded-xl touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          )}
        </div>

        <p className="text-[10px] text-[#8888a8] text-center">
          ドラッグで移動 · ボタンで回転・拡大縮小
        </p>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() =>
              setTransform((t) => ({ ...t, rotation: t.rotation - ROTATE_STEP }))
            }
          >
            <RotateCcw size={14} />
            左回転
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() =>
              setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale - ZOOM_STEP) }))
            }
          >
            <ZoomOut size={14} />
            縮小
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() =>
              setTransform((t) => ({ ...t, scale: Math.min(4, t.scale + ZOOM_STEP) }))
            }
          >
            <ZoomIn size={14} />
            拡大
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() =>
              setTransform((t) => ({ ...t, rotation: t.rotation + ROTATE_STEP }))
            }
          >
            <RotateCw size={14} />
            右回転
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-1 w-28">
            <div />
            <button
              type="button"
              className="p-2 rounded-lg bg-[#fff0f6] hover:bg-[#ffe4ef] text-[#4a4a6a]"
              onClick={() => pan(0, -PAN_STEP)}
              aria-label="上に移動"
            >
              <ArrowUp size={16} className="mx-auto" />
            </button>
            <div />
            <button
              type="button"
              className="p-2 rounded-lg bg-[#fff0f6] hover:bg-[#ffe4ef] text-[#4a4a6a]"
              onClick={() => pan(-PAN_STEP, 0)}
              aria-label="左に移動"
            >
              <ArrowLeft size={16} className="mx-auto" />
            </button>
            <div className="flex items-center justify-center text-[10px] text-[#8888a8]">
              移動
            </div>
            <button
              type="button"
              className="p-2 rounded-lg bg-[#fff0f6] hover:bg-[#ffe4ef] text-[#4a4a6a]"
              onClick={() => pan(PAN_STEP, 0)}
              aria-label="右に移動"
            >
              <ArrowRight size={16} className="mx-auto" />
            </button>
            <div />
            <button
              type="button"
              className="p-2 rounded-lg bg-[#fff0f6] hover:bg-[#ffe4ef] text-[#4a4a6a]"
              onClick={() => pan(0, PAN_STEP)}
              aria-label="下に移動"
            >
              <ArrowDown size={16} className="mx-auto" />
            </button>
            <div />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "保存中..." : "保存して設定"}
          </Button>
        </div>
      </div>
    </div>
  );
}

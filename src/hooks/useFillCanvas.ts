"use client";

import { useEffect, useRef, useState } from "react";

/** 親コンテナに合わせてキャンバス表示サイズを計算（内部解像度は baseW×baseH 固定） */
export function useFillCanvas(baseW: number, baseH: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: baseW, h: baseH });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const scale = Math.min(width / baseW, height / baseH);
      setDisplaySize({
        w: Math.floor(baseW * scale),
        h: Math.floor(baseH * scale),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseW, baseH]);

  return { containerRef, displaySize, baseW, baseH };
}

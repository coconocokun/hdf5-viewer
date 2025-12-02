"use client";

import React, { useEffect, useRef } from "react";

interface DepthPreviewProps {
  data: any; // TypedArray
  shape: number[];
}

export default function DepthPreview({ data, shape }: DepthPreviewProps) {
  // Logic to parse shape for Depth Data: (w, h) or (n, w, h)
  let width = 0;
  let height = 0;
  let frames = 1;

  if (shape.length === 2) {
    // (W, H) or (H, W) - Standard single depth map
    height = shape[0];
    width = shape[1];
  } else if (shape.length === 3) {
    // (N, W, H) - Sequence
    frames = shape[0];
    height = shape[1];
    width = shape[2];
  }

  const displayCount = Math.min(frames, 3);

  // --- Utility: Heatmap Color Map (Blue -> Green -> Red) ---
  const getHeatmapColor = (value: number, min: number, max: number) => {
    if (value === 0) return [0, 0, 0, 255]; // Treat 0 as invalid/black

    // Normalize to 0-1
    let ratio = (value - min) / (max - min);
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;

    // Simple R-G-B gradient
    // 0.0 - 0.5: Blue to Green
    // 0.5 - 1.0: Green to Red
    let r = 0,
      g = 0,
      b = 0;

    if (ratio < 0.5) {
      // Blue to Green
      b = 255 * (1 - ratio * 2);
      g = 255 * (ratio * 2);
    } else {
      // Green to Red
      g = 255 * (1 - (ratio - 0.5) * 2);
      r = 255 * ((ratio - 0.5) * 2);
    }

    return [Math.floor(r), Math.floor(g), Math.floor(b), 255];
  };

  const CanvasRenderer = ({ index }: { index: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Determine min/max for this specific frame to maximize contrast
    const frameDataRef = useRef<{ min: number; max: number } | null>(null);

    useEffect(() => {
      if (!data) return;

      const elementsPerFrame = width * height;
      const startOffset = index * elementsPerFrame;
      const endOffset = startOffset + elementsPerFrame;

      // 1. Calculate Min/Max for auto-contrast
      let min = Infinity;
      let max = -Infinity;

      for (let i = startOffset; i < endOffset; i++) {
        const val = data[i];
        if (val > 0) {
          // Ignore 0/noise
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
      if (min === Infinity) min = 0;
      if (max === -Infinity) max = 1; // Prevent divide by zero

      frameDataRef.current = { min, max };

      // 2. Render
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imgData = ctx.createImageData(width, height);
      const pixelData = imgData.data;

      for (let i = 0; i < elementsPerFrame; i++) {
        const val = data[startOffset + i];
        const [r, g, b, a] = getHeatmapColor(val, min, max);

        const pIdx = i * 4;
        pixelData[pIdx] = r;
        pixelData[pIdx + 1] = g;
        pixelData[pIdx + 2] = b;
        pixelData[pIdx + 3] = a;
      }

      ctx.putImageData(imgData, 0, 0);
    }, [index, data]);

    return (
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-300 dark:border-gray-700 bg-black shadow-sm image-pixelated"
          style={{ maxWidth: "100%", maxHeight: "250px" }}
        />
        <div className="flex justify-between w-full text-[10px] text-gray-500 mt-1 px-1">
          <span>Range:</span>
          <span>
            {frameDataRef.current
              ? `${frameDataRef.current.min.toFixed(0)} - ${frameDataRef.current.max.toFixed(0)} mm`
              : "..."}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
        <span className="font-bold uppercase text-amber-600">Depth Map</span>
        <span>•</span>
        <span>
          {width} x {height}
        </span>
        <span>•</span>
        <span>Auto-scaled Heatmap</span>
        {frames > 1 && (
          <span>
            • Showing {displayCount} of {frames} frames
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {Array.from({ length: displayCount }).map((_, i) => (
          <CanvasRenderer key={i} index={i} />
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";

interface ImagePreviewProps {
  data: any; // TypedArray
  shape: number[];
}

export default function ImagePreview({ data, shape }: ImagePreviewProps) {
  // --- Logic to parse shape ---
  let mode: "gray" | "rgb" | "seq-gray" | "seq-rgb" | "unknown" = "unknown";
  let width = 0;
  let height = 0;
  let frames = 1;
  let channels = 1;

  // Clone shape to avoid mutating the original prop
  const s = [...shape];

  // 1. Handle explicit channel-last = 1 (remove it for calculation logic)
  // e.g., [H, W, 1] -> treat as [H, W]
  // e.g., [N, H, W, 1] -> treat as [N, H, W]
  let effectiveShape = s;
  if (s.length > 0 && s[s.length - 1] === 1) {
    effectiveShape = s.slice(0, -1);
  }

  // 2. Determine Mode based on Effective Shape
  if (effectiveShape.length === 2) {
    // (H, W) or (H, W, 1)
    mode = "gray";
    height = effectiveShape[0];
    width = effectiveShape[1];
    channels = 1;
  } else if (effectiveShape.length === 3) {
    // Check last dim of original shape to see if it was RGB
    if (s[s.length - 1] === 3) {
      // (H, W, 3)
      mode = "rgb";
      height = effectiveShape[0];
      width = effectiveShape[1];
      channels = 3;
    } else {
      // (N, H, W) or (N, H, W, 1)
      mode = "seq-gray";
      frames = effectiveShape[0];
      height = effectiveShape[1];
      width = effectiveShape[2];
      channels = 1;
    }
  } else if (effectiveShape.length === 4) {
    // (N, H, W, 3)
    if (s[s.length - 1] === 3) {
      mode = "seq-rgb";
      frames = effectiveShape[0];
      height = effectiveShape[1];
      width = effectiveShape[2];
      channels = 3;
    }
  }

  const displayCount = Math.min(frames, 4); // Show max 4 frames

  // --- Renderer ---
  const CanvasRenderer = ({ index }: { index: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imgData = ctx.createImageData(width, height);
      const pixelData = imgData.data; // Uint8ClampedArray (RGBA)

      // Calculate stride
      // If original shape had explicit channel 1, we still read it linearly
      const elementsPerImage = width * height * channels;
      const startOffset = index * elementsPerImage;

      for (let i = 0; i < width * height; i++) {
        const pixelIdx = i * 4; // Canvas RGBA index
        const dataIdx = startOffset + i * channels;

        if (channels === 3) {
          pixelData[pixelIdx] = data[dataIdx]; // R
          pixelData[pixelIdx + 1] = data[dataIdx + 1]; // G
          pixelData[pixelIdx + 2] = data[dataIdx + 2]; // B
          pixelData[pixelIdx + 3] = 255; // Alpha
        } else {
          // Grayscale (apply same value to R, G, B)
          const val = data[dataIdx];
          pixelData[pixelIdx] = val;
          pixelData[pixelIdx + 1] = val;
          pixelData[pixelIdx + 2] = val;
          pixelData[pixelIdx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }, [index, data]);

    return (
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-300 dark:border-gray-700 bg-white shadow-sm image-pixelated"
          style={{ maxWidth: "100%", maxHeight: "250px" }}
        />
        {frames > 1 && <span className="text-xs text-gray-500 mt-1">Idx {index}</span>}
      </div>
    );
  };

  if (mode === "unknown") {
    return (
      <div className="text-sm text-red-500 p-4">
        Unable to resolve dimensions for image preview. Shape: {JSON.stringify(shape)}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
        <span className="font-bold uppercase">{mode}</span>
        <span>•</span>
        <span>
          {width} x {height} px
        </span>
        <span>•</span>
        <span>{channels === 3 ? "RGB" : "Grayscale"}</span>
        {frames > 1 && <span>• {frames} Frames</span>}
      </div>

      <div className="flex flex-wrap gap-4">
        {Array.from({ length: displayCount }).map((_, i) => (
          <CanvasRenderer key={i} index={i} />
        ))}
      </div>
    </div>
  );
}

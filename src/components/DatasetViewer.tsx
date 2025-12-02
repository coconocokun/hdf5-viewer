"use client";

import React, { useState, useEffect } from "react";
import type { Dataset } from "h5wasm";
import { TableCellsIcon, PhotoIcon, MapIcon } from "@heroicons/react/24/outline";
import MatrixPreview from "./MatrixPreview";
import ImagePreview from "./ImagePreview";
import DepthPreview from "./DepthPreview";

interface DatasetViewerProps {
  node: Dataset;
  name: string;
}

export default function DatasetViewer({ node, name }: DatasetViewerProps) {
  const [viewMode, setViewMode] = useState<"matrix" | "image" | "depth">("matrix");

  // 1. Reset to Matrix View whenever the node changes
  useEffect(() => {
    setViewMode("matrix");
  }, [node]);

  // 2. Type Safety: Handle null shape
  // node.shape comes from h5wasm as 'number[] | null'.
  // We default to empty array so 'shape' is strictly 'number[]'.
  const shape = node.shape || [];
  const dims = shape.length;

  // --- Validation Logic ---

  // Image Validation
  // Supported: (w, h, c) [3 dims] or (n, w, h, c) [4 dims]
  // Condition: Last dimension (c) MUST be 1, 3, or 4
  let canShowImage = false;
  if (dims === 3 || dims === 4) {
    const lastDim = shape[dims - 1];
    if ([1, 3, 4].includes(lastDim)) {
      canShowImage = true;
    }
  }

  // Depth Validation
  // Supported: (w, h) [2 dims] or (n, w, h) [3 dims]
  // Condition: If 3 dims, ensure it's NOT an Image (last dim is NOT 1, 3, 4)
  let canShowDepth = false;
  if (dims === 2) {
    canShowDepth = true;
  } else if (dims === 3) {
    const lastDim = shape[dims - 1];
    if (![1, 3, 4].includes(lastDim)) {
      canShowDepth = true;
    }
  }

  const shapeStr = dims > 0 ? shape.join(" × ") : "Scalar";

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold break-all text-gray-900 dark:text-white">{name}</h2>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200">
              {String(node.dtype)}
            </span>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {shapeStr}
            </span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-1 overflow-x-auto">
        {/* Matrix Tab (Always available) */}
        <button
          onClick={() => setViewMode("matrix")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            viewMode === "matrix"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <TableCellsIcon className="w-4 h-4" />
          Matrix
        </button>

        {/* Image Tab (Conditional) */}
        {canShowImage && (
          <button
            onClick={() => setViewMode("image")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              viewMode === "image"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <PhotoIcon className="w-4 h-4" />
            Image View
          </button>
        )}

        {/* Depth Tab (Conditional) */}
        {canShowDepth && (
          <button
            onClick={() => setViewMode("depth")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              viewMode === "depth"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Depth Map
          </button>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white dark:bg-gray-900 min-h-[200px] pt-4">
        {viewMode === "matrix" && (
          <div className="animate-fade-in">
            <MatrixPreview data={node.value} shape={shape} />
          </div>
        )}

        {/* passing 'shape' variable instead of node.shape fixes the type error */}
        {viewMode === "image" && canShowImage && <ImagePreview data={node.value} shape={shape} />}

        {viewMode === "depth" && canShowDepth && <DepthPreview data={node.value} shape={shape} />}
      </div>
    </div>
  );
}

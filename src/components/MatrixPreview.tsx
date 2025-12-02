import React from "react";

interface MatrixPreviewProps {
  data: any; // TypedArray (Int32Array, Float64Array, etc.)
  shape: number[] | null;
  limitRows?: number;
  limitCols?: number;
}

export default function MatrixPreview({ data, shape, limitRows = 100, limitCols = 20 }: MatrixPreviewProps) {
  // 1. Handle Scalar (0 dimensions)
  if (!shape || shape.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <span className="font-mono text-blue-600 dark:text-blue-400 text-lg">{String(data)}</span>
        <span className="ml-2 text-xs text-gray-500">(Scalar)</span>
      </div>
    );
  }

  // 2. Handle 1D Arrays
  if (shape.length === 1) {
    const total = shape[0];
    const displayCount = Math.min(total, limitRows);

    return (
      <div className="overflow-auto max-h-[400px] border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900">
        <table className="w-full text-sm text-left font-mono">
          <thead className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 uppercase sticky top-0">
            <tr>
              <th className="px-4 py-2 w-16 text-center border-b dark:border-gray-700">Index</th>
              <th className="px-4 py-2 border-b dark:border-gray-700">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: displayCount }).map((_, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-1 text-center text-gray-400 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800">
                  {i}
                </td>
                <td className="px-4 py-1 text-gray-800 dark:text-gray-200">{String(data[i])}</td>
              </tr>
            ))}
            {total > displayCount && (
              <tr>
                <td colSpan={2} className="px-4 py-2 text-center text-gray-400 italic bg-gray-50 dark:bg-gray-900">
                  ... and {total - displayCount} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Handle 2D+ Arrays
  // If dimension > 2, we currently treat it as a flattened 2D slice of the first two dims for preview
  const rows = shape[0];
  const cols = shape[1];

  // Stride calculation handles dimensions > 2 by just looking at the first "slice"
  // For a pure 2D array, stride is just the column count.
  const stride = shape.slice(1).reduce((a, b) => a * b, 1);

  // Determine how much to render
  const renderRows = Math.min(rows, limitRows);
  const renderCols = Math.min(cols, limitCols);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-1">
        Showing top-left {renderRows}x{renderCols} slice of {shape.join("x")} matrix
      </div>

      <div className="overflow-auto max-h-[500px] max-w-full border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 shadow-sm relative">
        <table className="text-sm font-mono border-collapse w-max">
          <thead className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 uppercase sticky top-0 z-10 shadow-sm">
            <tr>
              {/* Corner Cell */}
              <th className="p-2 border-b border-r dark:border-gray-700 bg-gray-100 dark:bg-gray-800 sticky left-0 z-20">
                idx
              </th>
              {/* Column Headers */}
              {Array.from({ length: renderCols }).map((_, c) => (
                <th key={c} className="p-2 border-b border-r dark:border-gray-700 min-w-[80px] text-center">
                  {c}
                </th>
              ))}
              {cols > renderCols && <th className="p-2 border-b dark:border-gray-700 text-gray-400 italic">...</th>}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: renderRows }).map((_, r) => (
              <tr key={r} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                {/* Row Header (Sticky Left) */}
                <td className="p-2 border-r border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 text-center text-xs sticky left-0 font-bold z-10">
                  {r}
                </td>

                {/* Cells */}
                {Array.from({ length: renderCols }).map((_, c) => {
                  // Calculate index in the 1D flat array
                  // For 2D: index = row * totalCols + col
                  const flatIndex = r * cols + c; // Basic logic, works for contiguous 2D
                  const val = data[flatIndex];

                  return (
                    <td
                      key={c}
                      className="p-2 border-r border-b dark:border-gray-700 text-right text-gray-800 dark:text-gray-200 truncate max-w-[120px]"
                    >
                      {val !== undefined ? String(val) : ""}
                    </td>
                  );
                })}
                {cols > renderCols && (
                  <td className="p-2 border-b dark:border-gray-700 text-gray-400 italic text-center">...</td>
                )}
              </tr>
            ))}
            {rows > renderRows && (
              <tr>
                <td className="p-2 bg-gray-50 dark:bg-gray-900 sticky left-0 border-r dark:border-gray-700">...</td>
                <td
                  colSpan={renderCols + 1}
                  className="p-2 text-gray-400 italic bg-gray-50 dark:bg-gray-900 text-center"
                >
                  {rows - renderRows} more rows hidden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

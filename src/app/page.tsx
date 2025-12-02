"use client";

import React, { useState } from "react";
import * as hdf5 from "jsfive";
import Hdf5Tree from "@/components/Hdf5Tree";
import { DocumentIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [fileData, setFileData] = useState<hdf5.File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<{ name: string; node: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileData(null);
    setSelectedNode(null);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // jsfive constructor reads the buffer
      const f = new hdf5.File(arrayBuffer, file.name);
      setFileData(f);
    } catch (err) {
      console.error(err);
      setError("Failed to read HDF5 file. Ensure it is a valid format.");
    } finally {
      setLoading(false);
    }
  };

  const handleNodeSelect = (name: string, node: any) => {
    setSelectedNode({ name, node });
  };

  // Helper to safely stringify bigints or circular refs if necessary
  const renderValue = (val: any) => {
    if (val === null || val === undefined) return "null";

    // Check if it's a typed array (dataset data)
    if (ArrayBuffer.isView(val) || Array.isArray(val)) {
      const len = (val as any).length;
      if (len > 100) {
        return `Array [${len}] (Preview: ${(val as any).slice(0, 10).join(", ")}...)`;
      }
      return `[${(val as any).join(", ")}]`;
    }
    return val.toString();
  };

  return (
    <main className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            HDF5 Reader
          </h1>
          {fileName && (
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{fileName}</span>
          )}
        </div>

        <div>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition-colors text-sm font-medium">
            Load .h5 File
            <input type="file" accept=".h5,.hdf5" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Tree View */}
        <aside className="w-1/3 min-w-[250px] max-w-md border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto p-4">
          {loading && <div className="text-center text-gray-500 mt-10">Parsing file...</div>}
          {error && <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50 text-sm">{error}</div>}

          {!fileData && !loading && !error && (
            <div className="text-center text-gray-400 mt-20 text-sm">
              No file loaded.
              <br />
              Please upload an HDF5 file.
            </div>
          )}

          {fileData && (
            <div className="animate-fade-in">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Structure</h3>
              <Hdf5Tree name="Root" node={fileData} onSelect={handleNodeSelect} />
            </div>
          )}
        </aside>

        {/* Main Panel / Data View */}
        <section className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-950">
          {selectedNode ? (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              {/* Node Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-2xl font-bold">{selectedNode.name}</h2>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-mono rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {selectedNode.node.keys ? "Group" : "Dataset"}
                </span>
              </div>

              {/* Attributes (Metadata) */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold">Attributes</h3>
                </div>
                <div className="p-4">
                  {selectedNode.node.attrs && Object.keys(selectedNode.node.attrs).length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {Object.entries(selectedNode.node.attrs).map(([key, val]) => (
                          <tr key={key} className="border-b dark:border-gray-700 last:border-0">
                            <td className="py-2 font-mono text-gray-500 dark:text-gray-400 w-1/3">{key}</td>
                            <td className="py-2 text-gray-800 dark:text-gray-200">{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No attributes found.</p>
                  )}
                </div>
              </div>

              {/* Dataset Info & Values */}
              {!selectedNode.node.keys && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between">
                    <h3 className="text-sm font-semibold">Data</h3>
                    {selectedNode.node.shape && (
                      <span className="text-xs font-mono text-gray-500">
                        Shape: {selectedNode.node.shape.join(" x ")} | Type: {selectedNode.node.dtype}
                      </span>
                    )}
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {/* Accessing .value is where jsfive decodes the data */}
                      {renderValue(selectedNode.node.value)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <DocumentIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a node from the tree to view properties and data.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

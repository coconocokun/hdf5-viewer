"use client";

import React, { useState, useEffect } from "react";
import Hdf5Tree from "@/components/Hdf5Tree";
import DatasetViewer from "@/components/DatasetViewer"; // <--- Import new component
import type { File as H5File, Group, Dataset } from "h5wasm";
import { DocumentIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [h5Engine, setH5Engine] = useState<{ File: any; FS: any } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [fileData, setFileData] = useState<H5File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<{ name: string; node: Group | Dataset } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const h5wasm = await import("h5wasm");
        const Module = await h5wasm.ready;
        const { FS } = Module;
        setH5Engine({ File: h5wasm.File, FS: FS });
        setIsReady(true);
      } catch (err) {
        console.error(err);
        setError("Failed to load HDF5 engine.");
      }
    };
    init();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !h5Engine) return;

    if (fileData) {
      try {
        fileData.close();
      } catch (e) {}
    }

    setFileData(null);
    setSelectedNode(null);
    setError(null);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { FS, File } = h5Engine;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      FS.writeFile(safeName, new Uint8Array(arrayBuffer));
      const f = new File(safeName, "r");
      setFileData(f);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse file: " + err.message);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">HDF5</span> Reader
        </h1>
        <label
          className={`px-4 py-2 rounded text-sm font-medium text-white transition shadow-sm ${
            isReady ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer" : "bg-gray-400 cursor-wait"
          }`}
        >
          {isReady ? "Open .h5 File" : "Loading Engine..."}
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".h5,.hdf5,.he5,.nxs"
            disabled={!isReady}
          />
        </label>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/3 min-w-[300px] border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex flex-col">
          {error && (
            <div className="m-4 p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded">{error}</div>
          )}
          <div className="p-4 flex-1">
            {fileData ? (
              <Hdf5Tree name="/" node={fileData} onSelect={(name, node) => setSelectedNode({ name, node })} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                No file loaded
              </div>
            )}
          </div>
        </aside>

        {/* Main Panel */}
        <section className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">
          {selectedNode ? (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              {/* Group View */}
              {(selectedNode.node as any).type === "Group" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{selectedNode.name}</h2>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500">Select a dataset from the tree to view contents.</p>

                    {/* Show Attributes for Groups too */}
                    {selectedNode.node.attrs && Object.keys(selectedNode.node.attrs).length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">Attributes</h4>
                        <ul className="text-sm space-y-1">
                          {Object.entries(selectedNode.node.attrs).map(([k, v]) => (
                            <li key={k} className="flex gap-2">
                              <span className="font-mono text-gray-600 dark:text-gray-400">{k}:</span>
                              <span>{String((v as any).value !== undefined ? (v as any).value : v)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dataset View (Handles Tabs internally) */}
              {(selectedNode.node as any).type === "Dataset" && (
                <DatasetViewer node={selectedNode.node as Dataset} name={selectedNode.name} />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
              <DocumentIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a node to view details.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

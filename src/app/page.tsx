"use client";

import React, { useState, useEffect } from "react";
import Hdf5Tree from "@/components/Hdf5Tree";
import MatrixPreview from "@/components/MatrixPreview"; // <--- Import this
import type { File as H5File, Group, Dataset } from "h5wasm";
import { DocumentIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [h5Engine, setH5Engine] = useState<{ File: any; FS: any } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [fileData, setFileData] = useState<H5File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<{ name: string; node: Group | Dataset } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ... (Keep your useEffect and handleFileUpload logic exactly the same) ...
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
        setError("Failed to initialize h5wasm.");
      }
    };
    init();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Keep existing file upload logic) ...
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
      {/* ... (Keep Header) ... */}
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
        {/* ... (Keep Sidebar) ... */}
        <aside className="w-1/3 min-w-[300px] border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
          {fileData ? (
            <Hdf5Tree name="/" node={fileData} onSelect={(name, node) => setSelectedNode({ name, node })} />
          ) : (
            <div className="text-gray-400 text-center mt-10">No file loaded</div>
          )}
        </aside>

        {/* Main Content */}
        <section className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">
          {selectedNode ? (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              {/* Title Section */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <h2 className="text-2xl font-bold break-all">{selectedNode.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded uppercase font-bold">
                    {(selectedNode.node as any).type}
                  </span>
                  {(selectedNode.node as Dataset).dtype && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                      dtype: {String((selectedNode.node as Dataset).dtype)}
                    </span>
                  )}
                  {(selectedNode.node as Dataset).shape && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                      shape: {JSON.stringify((selectedNode.node as Dataset).shape)}
                    </span>
                  )}
                </div>
              </div>

              {/* Attributes Section */}
              {selectedNode.node.attrs && Object.keys(selectedNode.node.attrs).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Attributes</h3>
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {Object.entries(selectedNode.node.attrs).map(([key, val]) => (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-2 font-mono text-gray-500 w-1/3 border-r dark:border-gray-800">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                              {String((val as any).value !== undefined ? (val as any).value : val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Data Matrix Section */}
              {(selectedNode.node as any).type === "Dataset" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase">Data Matrix</h3>

                  {/* Here we use the new Component */}
                  <MatrixPreview
                    data={(selectedNode.node as Dataset).value}
                    shape={(selectedNode.node as Dataset).shape}
                  />
                </div>
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

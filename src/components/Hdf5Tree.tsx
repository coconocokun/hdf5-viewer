"use client";

import React, { useState } from "react";
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface Hdf5TreeProps {
  name: string;
  node: any; // Using any because jsfive types are complex recursive objects
  onSelect: (name: string, node: any) => void;
  path?: string;
}

export default function Hdf5Tree({ name, node, onSelect, path = "" }: Hdf5TreeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine if it is a Group (has keys) or Dataset
  const isGroup = node && typeof node.keys === "object" && node.keys !== null;
  const currentPath = path ? `${path}/${name}` : name;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isGroup) {
      onSelect(name, node);
    } else {
      // Also allow selecting groups to see attributes
      onSelect(name, node);
    }
  };

  return (
    <div className="pl-4 select-none">
      <div
        className={`flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        onClick={handleToggle}
      >
        {isGroup ? (
          <span className="text-gray-500">
            {isOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
          </span>
        ) : (
          <span className="w-3" />
        )}

        {isGroup ? (
          <FolderIcon className="w-4 h-4 text-blue-500" />
        ) : (
          <DocumentIcon className="w-4 h-4 text-green-500" />
        )}

        <span className="text-sm text-gray-700 dark:text-gray-200">{name}</span>
      </div>

      {isGroup && isOpen && (
        <div className="border-l border-gray-200 dark:border-gray-700 ml-2">
          {/* jsfive stores children keys in an array usually accessible via node.keys */}
          {node.keys.map((childName: string) => (
            <Hdf5Tree
              key={childName}
              name={childName}
              node={node.get(childName)}
              onSelect={onSelect}
              path={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

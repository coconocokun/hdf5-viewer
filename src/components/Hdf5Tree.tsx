"use client";

import React, { useState } from "react";
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import h5wasm from "h5wasm";
const { FS } = await h5wasm.ready;
import type { Group, Dataset } from "h5wasm";

interface Hdf5TreeProps {
  name: string;
  node: Group | Dataset; // h5wasm types
  onSelect: (name: string, node: Group | Dataset) => void;
  path?: string;
}

export default function Hdf5Tree({ name, node, onSelect, path = "" }: Hdf5TreeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // According to docs, we traverse using .get(key)
  // We identify groups by checking if they have a 'keys' method or the type property
  // h5wasm objects usually have a 'type' property: 'Group' or 'Dataset'
  const isGroup = node instanceof node.constructor && (node as any).type === "Group";

  const currentPath = path === "/" ? `/${name}` : `${path}/${name}`;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    onSelect(name, node);
  };

  // Get children keys if it's a group
  // Docs: f.keys() returns an array of strings
  let childrenKeys: string[] = [];
  if (isGroup) {
    try {
      childrenKeys = (node as Group).keys();
    } catch (e) {
      console.warn("Could not read keys for group", name);
    }
  }

  return (
    <div className="pl-4 select-none">
      <div
        className={`flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          isOpen ? "bg-gray-50 dark:bg-gray-800" : ""
        }`}
        onClick={handleToggle}
      >
        <span className="text-gray-500 w-4 flex justify-center">
          {isGroup && (isOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />)}
        </span>

        {isGroup ? (
          <FolderIcon className="w-4 h-4 text-blue-500" />
        ) : (
          <DocumentIcon className="w-4 h-4 text-green-500" />
        )}

        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{name}</span>
      </div>

      {isGroup && isOpen && (
        <div className="border-l border-gray-200 dark:border-gray-700 ml-2.5">
          {childrenKeys.map((childName) => {
            // Docs: f.get("path") returns Group or Dataset
            const childNode = (node as Group).get(childName);
            return (
              <Hdf5Tree
                key={childName}
                name={childName}
                node={childNode as Group | Dataset}
                onSelect={onSelect}
                path={currentPath}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

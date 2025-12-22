// src/bookmarks/BookmarksModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  addBookmark,
  deleteBookmark,
  listBookmarks,
  updateBookmark,
  clearAllBookmarks,
} from "./bookmarkStore";

function buildFullUrl() {
  // Store a shareable URL (origin + path + hash).
  // HashRouter lives in location.hash.
  return `${window.location.origin}${window.location.pathname}${window.location.hash}`;
}

export default function BookmarksModal({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const currentUrl = useMemo(() => buildFullUrl(), [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setItems(listBookmarks());
    setNewName("");
    setCopiedId(null);
    setEditingId(null);
    setEditingName("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSaveCurrent = () => {
    const bm = addBookmark({
      name: newName || "My bookmark",
      url: currentUrl,
    });
    setItems(listBookmarks());
    setNewName("");
    setEditingId(bm.id);
    setEditingName(bm.name);
  };

  const onCopy = async (id, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // fallback prompt
      window.prompt("Copy this link:", url);
    }
  };

  const onOpen = (url) => {
    // Navigate within HashRouter by updating hash.
    const hashIndex = url.indexOf("#");
    const hash = hashIndex >= 0 ? url.slice(hashIndex) : "#/";
    window.location.hash = hash;
    onClose?.();
  };

  const onStartRename = (bm) => {
    setEditingId(bm.id);
    setEditingName(bm.name);
  };

  const onConfirmRename = () => {
    if (!editingId) return;
    updateBookmark(editingId, { name: editingName });
    setItems(listBookmarks());
    setEditingId(null);
    setEditingName("");
  };

  const onDelete = (id) => {
    deleteBookmark(id);
    setItems(listBookmarks());
  };

  const onClearAll = () => {
    if (!window.confirm("Delete all bookmarks?")) return;
    clearAllBookmarks();
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose?.()}
      />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* header */}
          <div
            className="px-6 py-4 flex items-center justify-between text-white"
            style={{ backgroundColor: "#1d186d" }}
          >
            <div className="font-bold text-lg">Bookmarks</div>
            <button
              onClick={() => onClose?.()}
              className="px-3 py-1 rounded-lg border border-white/70 hover:opacity-95"
            >
              Close
            </button>
          </div>

          {/* content */}
          <div className="p-6 space-y-6">
            {/* save current */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="font-semibold text-gray-900">Save current view</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": "#1d186d" }}
                  placeholder="Bookmark name (e.g., Canada - VFX studios)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button
                  onClick={onSaveCurrent}
                  className="px-4 py-2 rounded-lg text-white font-semibold hover:opacity-95"
                  style={{ backgroundColor: "#1d186d" }}
                >
                  Save
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-500 break-all">
                Current link: {currentUrl}
              </div>
            </div>

            {/* list */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
                <div className="font-semibold text-gray-900">
                  Saved bookmarks ({items.length})
                </div>
                <button
                  onClick={onClearAll}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              {items.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">
                  No bookmarks yet. Save your current view above.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {items.map((bm) => (
                    <div key={bm.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {editingId === bm.id ? (
                            <div className="flex gap-2">
                              <input
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
                                style={{ "--tw-ring-color": "#1d186d" }}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                              />
                              <button
                                onClick={onConfirmRename}
                                className="px-3 py-2 rounded-lg text-white font-semibold hover:opacity-95"
                                style={{ backgroundColor: "#1d186d" }}
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="font-semibold text-gray-900 truncate">
                              {bm.name}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-gray-500 break-all">
                            {bm.url}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Updated {new Date(bm.updatedAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => onOpen(bm.url)}
                            className="px-3 py-2 rounded-lg border border-gray-300 font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => onCopy(bm.id, bm.url)}
                            className="px-3 py-2 rounded-lg border border-gray-300 font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            {copiedId === bm.id ? "Copied" : "Copy link"}
                          </button>
                          <button
                            onClick={() => onStartRename(bm)}
                            className="px-3 py-2 rounded-lg border border-gray-300 font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => onDelete(bm.id)}
                            className="px-3 py-2 rounded-lg border border-red-200 font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Tip: bookmarks store full links, so you can save any page/view. For deeper
              state (filters/sort), we’ll encode that into the URL.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

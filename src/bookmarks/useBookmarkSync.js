// src/bookmarks/useBookmarkSync.js
// One hook to sync page state <-> URL bookmarks (Option A).
// Pages provide:
// - routeKey (string)
// - getState(): object
// - applyState(state): void
//
// The hook:
// - On mount: reads ?b=..., decodes, checks routeKey, normalizes, applies state
// - On change: debounced encode + write ?b=...

import { useEffect, useRef } from "react";
import {
  encodeBookmark,
  decodeBookmark,
  readBookmarkFromLocation,
  writeBookmarkToLocation,
} from "./bookmarkCodec";
import { normalizeState } from "./bookmarkRegistry";

export function useBookmarkSync({
  routeKey,
  getState,
  applyState,
  debounceMs = 300,
}) {
  const didHydrateRef = useRef(false);
  const timerRef = useRef(null);

  // 1) Hydrate from URL on first mount
  useEffect(() => {
    if (didHydrateRef.current) return;

    const encoded = readBookmarkFromLocation();
    if (!encoded) {
      didHydrateRef.current = true;
      return;
    }

    const decoded = decodeBookmark(encoded);
    if (!decoded) {
      didHydrateRef.current = true;
      return;
    }

    if (decoded.routeKey !== routeKey) {
      didHydrateRef.current = true;
      return;
    }

    const safeState = normalizeState(routeKey, decoded.state);
    try {
      applyState(safeState);
    } finally {
      didHydrateRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // 2) Write to URL when state changes (debounced)
  useEffect(() => {
    if (!didHydrateRef.current) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        const state = getState();
        const encoded = encodeBookmark({ routeKey, state });
        writeBookmarkToLocation(encoded);
      } catch {
        // swallow errors; never block UI
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // IMPORTANT: caller controls when this effect runs by
    // passing stable getState/applyState and triggering re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
}

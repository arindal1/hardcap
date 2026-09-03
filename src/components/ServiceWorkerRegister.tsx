"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker (public/sw.js). Production-only -
 * a service worker fighting Turbopack's dev HMR would cause stale-module
 * confusion, so this is a no-op in development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a progressive enhancement - failing silently is fine.
    });
  }, []);

  return null;
}
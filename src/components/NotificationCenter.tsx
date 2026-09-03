"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardSummary } from "@/lib/queries";

type Toast = { id: string; message: string; tone: "warning" | "danger" };

const SEEN_KEY_PREFIX = "hardcap-notif-";
const MUTE_KEY = "hardcap-notif-muted";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function alreadyShown(key: string): boolean {
  return localStorage.getItem(`${SEEN_KEY_PREFIX}${key}-${todayKey()}`) === "1";
}

function markShown(key: string) {
  localStorage.setItem(`${SEEN_KEY_PREFIX}${key}-${todayKey()}`, "1");
}

/** Short two-tone chime via Web Audio - no audio asset needed. */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1108, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Web Audio unavailable - fail silently, toast still shows visually.
  }
}

function currency(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

/**
 * Computes smart notifications from already-loaded dashboard data (no extra
 * fetch): near-cap warnings, over-cap alerts, overall-negative alerts.
 * Delivers them as in-app toasts, an optional sound chime, and - if the user
 * grants permission - a browser Notification. This is client-side only: it
 * fires while the tab is open, not a true background push (no service worker
 * or server-side push infra exists yet).
 */
export function NotificationCenter() {
  const { data } = useDashboardSummary();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [muted, setMuted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const seenThisSession = useRef(new Set<string>());

  useEffect(() => {
    setMuted(localStorage.getItem(MUTE_KEY) === "1");
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (!data) return;
    const next: Toast[] = [];

    for (const group of data.groups) {
      const key = `group-${group.id}`;
      if (group.isOverCap) {
        const overKey = `${key}-over`;
        if (!alreadyShown(overKey) && !seenThisSession.current.has(overKey)) {
          next.push({
            id: overKey,
            tone: "danger",
            message: group.isEmergencyFund
              ? `Emergency Fund depleted - drawn ${currency(group.overageAmount)} beyond its cap.`
              : `${group.name} is over budget by ${currency(group.overageAmount)}.`,
          });
        }
      } else if (group.cap > 0 && group.spent / group.cap >= 0.9) {
        const nearKey = `${key}-near`;
        if (!alreadyShown(nearKey) && !seenThisSession.current.has(nearKey)) {
          next.push({
            id: nearKey,
            tone: "warning",
            message: `Only ${currency(group.remaining)} left for ${group.name}.`,
          });
        }
      }
    }

    if (data.overallRemaining < 0) {
      const overallKey = "overall-negative";
      if (!alreadyShown(overallKey) && !seenThisSession.current.has(overallKey)) {
        next.push({
          id: overallKey,
          tone: "danger",
          message: `You've gone over your overall budget by ${currency(-data.overallRemaining)}.`,
        });
      }
    }

    if (next.length === 0) return;
    for (const toast of next) {
      markShown(toast.id);
      seenThisSession.current.add(toast.id);
    }
    setToasts((prev) => [...prev, ...next]);

    if (!muted) playChime();
    if (permission === "granted") {
      for (const toast of next) {
        new Notification("HardCap", { body: toast.message });
      }
    }

    const ids = next.map((t) => t.id);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => !ids.includes(t.id)));
    }, 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, muted, permission]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function requestPermission() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then(setPermission);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-24 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6">
      <div className="pointer-events-auto mb-1 flex gap-2">
        {permission === "default" && (
          <button
            onClick={requestPermission}
            className="focus-ring neu-flat px-3 py-1.5 text-[10px] text-(--color-text-muted) hover:text-(--color-accent)"
          >
            Enable alerts
          </button>
        )}
        <button
          onClick={toggleMute}
          className="focus-ring neu-flat px-3 py-1.5 text-[10px] text-(--color-text-muted) hover:text-(--color-accent)"
        >
          {muted ? "Unmute" : "Mute"} sound
        </button>
      </div>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="neu-raised pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4 sm:w-80"
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: toast.tone === "danger" ? "var(--color-danger)" : "var(--color-accent-strong)",
              }}
            />
            <p className="flex-1 text-sm text-(--color-text-primary)">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="focus-ring shrink-0 text-xs text-(--color-text-muted) hover:text-(--color-text-primary)"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
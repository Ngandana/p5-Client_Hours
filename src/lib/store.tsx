"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { sampleData } from "./sample-data";
import type { AppData, Prefs } from "./types";

/**
 * Demo persistence: everything lives in this browser's localStorage.
 * To move to a shared database (see docs/NEXT-STEPS.md), replace `loadState` / `saveState`
 * with Supabase calls; the components only talk to `useStore()`.
 */
const STORAGE_KEY = "p5hours.v2";

interface Persisted {
  data: AppData;
  prefs: Prefs;
}

function defaultPrefs(): Prefs {
  return { staffId: "sib", managerId: "candice" };
}

function loadState(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      if (p.data && Array.isArray(p.data.entries)) {
        return { data: p.data, prefs: { ...defaultPrefs(), ...p.prefs } };
      }
    }
  } catch {
    // Storage blocked or corrupt: fall through to the sample data.
  }
  return { data: sampleData(), prefs: defaultPrefs() };
}

function saveState(state: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private window or full storage: the demo keeps working for this session.
  }
}

interface StoreValue {
  /** False until the browser state has loaded (sample dates depend on "now"). */
  ready: boolean;
  data: AppData;
  prefs: Prefs;
  /** Apply a pure change from `lib/actions` to the data. */
  update: (fn: (d: AppData) => AppData) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // localStorage only exists in the browser, so the first read has to happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setState((s) => (s ? { ...s, data: fn(s.data) } : s));
  }, []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setState((s) => (s ? { ...s, prefs: { ...s.prefs, ...patch } } : s));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const fallback = state ?? { data: null as unknown as AppData, prefs: defaultPrefs() };
    return { ready: !!state, data: fallback.data, prefs: fallback.prefs, update, setPrefs, toast, showToast };
  }, [state, update, setPrefs, toast, showToast]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

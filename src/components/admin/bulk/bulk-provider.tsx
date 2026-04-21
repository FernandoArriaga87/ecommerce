"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

type BulkContext = {
  selected: Set<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleMany: (ids: string[], value: boolean) => void;
  clear: () => void;
  size: number;
};

const Ctx = createContext<BulkContext | null>(null);

export function BulkSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((ids: string[], value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const value = useMemo<BulkContext>(
    () => ({
      selected,
      isSelected: (id: string) => selected.has(id),
      toggle,
      toggleMany,
      clear,
      size: selected.size,
    }),
    [selected, toggle, toggleMany, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBulkSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBulkSelection must be used inside <BulkSelectionProvider>");
  return ctx;
}

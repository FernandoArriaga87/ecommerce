"use client";

import { useBulkSelection } from "./bulk-provider";

export function BulkCheckbox({ id, label }: { id: string; label?: string }) {
  const { isSelected, toggle } = useBulkSelection();
  const checked = isSelected(id);
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => toggle(id)}
      aria-label={label ?? `Seleccionar ${id}`}
      className="h-4 w-4 accent-black cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function BulkHeaderCheckbox({ ids }: { ids: string[] }) {
  const { selected, toggleMany } = useBulkSelection();
  const eligible = ids;
  const allSelected = eligible.length > 0 && eligible.every((id) => selected.has(id));
  const someSelected = !allSelected && eligible.some((id) => selected.has(id));

  return (
    <input
      type="checkbox"
      checked={allSelected}
      ref={(el) => {
        if (el) el.indeterminate = someSelected;
      }}
      onChange={() => toggleMany(eligible, !allSelected)}
      aria-label="Seleccionar todo"
      className="h-4 w-4 accent-black cursor-pointer"
    />
  );
}

"use client";

import { useState } from "react";

export function useTable<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected: (id: string) => selectedIds.has(id),
    isAllSelected: items.length > 0 && selectedIds.size === items.length,
  };
}

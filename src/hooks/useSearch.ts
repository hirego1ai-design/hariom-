"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "./useDebounce";

export function useSearch<T>(items: T[], searchKeys: (keyof T)[]) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items;
    const lowerQ = debouncedQuery.toLowerCase();
    return items.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        if (typeof val === "string") return val.toLowerCase().includes(lowerQ);
        if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(lowerQ));
        return false;
      })
    );
  }, [items, debouncedQuery, searchKeys]);

  return {
    query,
    setQuery,
    filteredItems,
  };
}

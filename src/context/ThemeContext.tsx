"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with 'dark' (matches SSR default) — corrected on mount via localStorage
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Read the currently applied class from <html> (set by the anti-FOUC script)
    const htmlEl = document.documentElement;
    const current: Theme = htmlEl.classList.contains("light") ? "light" : "dark";
    setThemeState(current);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(newTheme);
    // Persist
    try {
      localStorage.setItem("hirego_theme", newTheme);
    } catch {
      // localStorage not available (SSR, private browsing, etc.)
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so pages outside ThemeProvider don't crash
    return {
      theme: "dark",
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}

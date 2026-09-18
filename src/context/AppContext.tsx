"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ThemeProvider } from "@/context/ThemeContext";

interface User {
  name: string;
  email: string;
  role: string;
  isLoggedIn: boolean;
}

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  login: (email: string) => void;
  logout: () => void;
}

const anonymousUser: User = {
  name: "",
  email: "",
  role: "",
  isLoggedIn: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(anonymousUser);

  useEffect(() => {
    const controller = new AbortController();

    async function hydrateSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!controller.signal.aborted) setUser(anonymousUser);
          return;
        }

        const payload = await response.json();
        const session = payload?.user;
        if (!payload?.authenticated || !session) {
          if (!controller.signal.aborted) setUser(anonymousUser);
          return;
        }

        if (!controller.signal.aborted) {
          setUser({
            name: session.name || session.email?.split("@")[0] || "User",
            email: session.email || "",
            role: session.role || "",
            isLoggedIn: true,
          });
        }
      } catch {
        if (!controller.signal.aborted) setUser(anonymousUser);
      }
    }

    void hydrateSession();
    return () => controller.abort();
  }, []);

  const login = (email: string) => {
    setUser((current) => ({ ...current, email, isLoggedIn: true }));
  };

  const logout = () => {
    setUser(anonymousUser);
  };

  return (
    <AppContext.Provider value={{ user, setUser, login, logout }}>
      <ThemeProvider>
        <OnboardingProvider>{children}</OnboardingProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

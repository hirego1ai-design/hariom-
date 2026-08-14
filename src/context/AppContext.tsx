"use client";

import React, { createContext, useContext, useState } from "react";
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "Candidate",
    isLoggedIn: true,
  });

  const login = (email: string) => {
    setUser({
      name: email.split("@")[0] || "Candidate",
      email,
      role: "Candidate",
      isLoggedIn: true,
    });
  };

  const logout = () => {
    setUser({
      name: "",
      email: "",
      role: "Candidate",
      isLoggedIn: false,
    });
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

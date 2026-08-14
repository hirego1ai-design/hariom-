"use client";

import React from "react";
import { EmployerProvider } from "@/context/EmployerContext";
import { AppProvider } from "@/context/AppContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return React.createElement(
    AppProvider,
    null,
    React.createElement(EmployerProvider, null, children)
  );
}

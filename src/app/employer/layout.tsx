"use client";
import React from "react";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { EmployerProvider } from "@/context/EmployerContext";
import { usePathname } from "next/navigation";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAuthOrOnboarding = pathname.includes("sign-in") || pathname.includes("registration") || pathname.includes("onboarding") || pathname.includes("forgot-password");

  return (
    <EmployerProvider>
      <div className="bg-bg-page text-on-surface font-body-md selection:bg-primary/30 min-h-screen relative overflow-x-hidden">
        {!isAuthOrOnboarding && <EmployerSidebar />}

        <main className={`${!isAuthOrOnboarding ? "md:ml-[104px] pb-24 md:pb-0" : "w-full"} px-4 py-5 sm:px-6 md:px-8 md:py-8 relative z-10 min-h-screen`}>
          {children}
        </main>
      </div>
    </EmployerProvider>
  );
}


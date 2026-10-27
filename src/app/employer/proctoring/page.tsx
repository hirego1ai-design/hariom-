"use client";

import { PageContainer } from "@/components/employer/LayoutSystem";

export default function ProctoringPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-secondary/20 p-4">
              <span className="material-symbols-outlined text-4xl text-secondary">
                schedule
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Proctoring Monitor</h1>
          <p className="mt-6 text-lg text-text-secondary">
            Proctoring monitor is not yet available. Check back soon.
          </p>
          <p className="mt-4 text-sm text-text-muted">
            We're working on bringing real-time proctoring capabilities to your hiring platform.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

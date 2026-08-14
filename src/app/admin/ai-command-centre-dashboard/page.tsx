"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE42() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

      <PageHeader 
        title="AI Command Centre Dashboard" 
        subtitle="Real-time AI agent org tree and platform vitals"
      />

      <div className="flex flex-1 overflow-hidden">
        {/*  Org Tree Canvas  */}
        <section className="flex-1 relative p-10 overflow-auto flex flex-col items-center">
          {/*  Background Mesh/Grid Effect  */}
          <div className="absolute inset-0 z-0 pointer-events-none"></div>
          <div className="relative z-10 w-full max-w-5xl">
            {/*  Virtual CEO  */}
            <div className="flex flex-col items-center mb-24">
              <div className="agent-node glass-card p-4 rounded-xl w-64 text-center relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-on-primary uppercase tracking-widest">
                  Master Brain
                </div>
                <div className="w-20 h-20 rounded-full border-2 border-primary mx-auto mb-3 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-high">
                    <img
                      className="w-full h-full object-cover"
                      data-alt="A futuristic digital representation of a Virtual CEO AI agent. The visual features an abstract, glowing humanoid head made of light particles and data streams. Deep blacks and vibrant red highlights dominate the scene, creating a sense of superior artificial intelligence and leadership. High-fidelity glass textures and 3D depth."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD2wJkRucisZtwrGLJqog4_7Of1pEsNm7HSdAF97nIvVjvIcEPpDus6gxzLicXdOVJuLTDRWQgHuDIHI3O6eOZ4G9aOTjEC6zLpplkbqyoJHgm9-tfdSiWaapOu2HiA5oYROtLqgAaZ5FT9cT-sq-FyQR6jsAmr2P8nuAy1rsX3N_uJHu0Wz6UQLefQUoCecpJeMhX_JcgbR_gcK9XWbpUQfPAtYbSM5Yh1h2-iR7RiaUXm5xkTBhSy7rYdsRNco_wsQ1-O5c_q9s"
                    />
                  </div>
                </div>
                <h3 className="font-headline-md text-lg">Virtual CEO</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
                  <span className="text-xs text-text-secondary font-data-md uppercase tracking-tighter">
                    Status: Strategic Thinking
                  </span>
                </div>
              </div>
            </div>
            {/*  Connectors Line 1  */}
            <div className="absolute left-1/2 top-40 h-24 w-[1px] bg-gradient-to-b from-primary to-white/10 -translate-x-1/2"></div>
            <div className="absolute left-1/4 right-1/4 top-64 h-[1px] bg-white/10"></div>
            {/*  C-Suite Row  */}
            <div className="grid grid-cols-5 gap-4 mb-24 relative">
              {/*  CAO  */}
              <div className="agent-node glass-card p-3 rounded-lg text-center border-t-2 border-t-primary/40">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto mb-2 overflow-hidden border border-white/10">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="AI Agent portrait: Chief Analytics Officer. Abstract visualization of data patterns and neural networks in a sleek, circular frame. Dark theme with blue and red neon accents, conveying high-speed data processing and professional authority."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQt8f6-WGwJQd-ysIXER5UrkqGxeNlr7Ehfgpj6b4yVoPYHKQfcmPiSo0oYlaIaihArixihUiiSV4oiA1Mk9AS8w7TRRn-fS0vxgrOtnS9E3zKOUwxg9Q2CbIKZ7UBQPNS-GZM5iWZyT0-1aQWE_qgf01zPolXrwj6dEr_MCmju1RA2DYC2Nm5I9mlsrnwqHYZIB8RkYKys1uIwknMEXN5tChopDHxtgT9KlmOAWJX_Id3B5aU4WOm2DiG4IiON58HszoQapn3aSI"
                  />
                </div>
                <p className="text-[12px] font-bold text-text-primary">CAO</p>
                <p className="text-[10px] text-text-muted">Analytics</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green"></span>
                </div>
              </div>
              {/*  CTO  */}
              <div className="agent-node glass-card p-3 rounded-lg text-center border-t-2 border-t-primary/40">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto mb-2 overflow-hidden border border-white/10">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="AI Agent portrait: Chief Technology Officer. Intricate glowing circuit designs and code fragments forming a semi-humanoid shape. Sophisticated dark mode aesthetic with premium red and white lighting."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3TAdXdtCU8apNVq_Ua8GaFop6WQWuXozdy7IKPwKYkeq8ufrL_MnsGVR5v0pugjES0lSpNVbeGwDhckC_9YN1WejLbPe3GvONhJPOY1Ilrf--0Ewozy1DFbclGmpP7O0VRpzkHj13X9hOeNeBVCXZU7SL1dx9ILvqzisYciEei4uF24fZ920GXb4f2gviPflypfHW47m_cOb7ymIAVlro6uk76HkhGFS4_QR3wTV2prAcPWGS9EUIGebPGZcFvXfzm_3zIn47yBw"
                  />
                </div>
                <p className="text-[12px] font-bold text-text-primary">CTO</p>
                <p className="text-[10px] text-text-muted">Architecture</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green"></span>
                </div>
              </div>
              {/*  CMO  */}
              <div className="agent-node glass-card p-3 rounded-lg text-center border-t-2 border-t-primary/40">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto mb-2 overflow-hidden border border-white/10">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="AI Agent portrait: Chief Marketing Officer. Dynamic visualization of social graphs and audience segments, rendered as glowing spheres of light in a dark space. Clean, modern aesthetic."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsr4oVTyqZDijnX0YJHGt4tLG2mZDw9dm1_8w01cijs9qJpdrsmsvIziEusTeM_JFInG_BW0COiFXKIrhVpVOMbjtqR0_vLNOh_zzy40_CpVERH6JqE2UJ9MdS5-RjBakBUvHed7wGh7lVHHuaVsTomaJh8zQeMairwCkZ5Yf84lzqUTteaDtW_0vPsq2bg665NnGYw54k_rScbZJcxYKsjNVfy81HWCq01IvBmsUFcP-BIVw8GLy6dM1_pWtiQ_JXhdFrGBU0_YU"
                  />
                </div>
                <p className="text-[12px] font-bold text-text-primary">CMO</p>
                <p className="text-[10px] text-text-muted">Growth</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow"></span>
                </div>
              </div>
              {/*  CHRO  */}
              <div className="agent-node glass-card p-3 rounded-lg text-center border-t-2 border-t-primary/40">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto mb-2 overflow-hidden border border-white/10">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="AI Agent portrait: Chief HR Officer. Visualization of human talent connections and personality mapping through soft, glowing geometric shapes. Professional and empathetic digital persona."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRzk39a-mRMQ5ozzlZX1nofEHNudNecK2nWsi_urkpn8moWODdwVGvpFh7UeVZppUX9dXWk4p_vSV2Y6X6-JUxXAO3TJUwsJ43f2CaR4IBJIfvI-yONqv0QuFKsYRa4P_MmlwBi50YERyvra3HXhRbNxNp3b1QtWmEFHOjSTuDDmzGNedrXV5qPBNlHs0n1qAZD6UqiGObeCmAiA3I_NbYkvrjHJYh2Uej4kj7eP-01PXIHdMSSi4XFwkH3FzCTRglkon558TkNgs"
                  />
                </div>
                <p className="text-[12px] font-bold text-text-primary">CHRO</p>
                <p className="text-[10px] text-text-muted">Talent AI</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green"></span>
                </div>
              </div>
              {/*  CFO  */}
              <div className="agent-node glass-card p-3 rounded-lg text-center border-t-2 border-t-primary/40">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto mb-2 overflow-hidden border border-white/10">
                  <img
                    className="w-full h-full object-cover"
                    data-alt="AI Agent portrait: Chief Financial Officer. Visualization of complex financial matrices and profit graphs as floating golden and red light arrays. Technical and high-precision aesthetic."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcF0YVfW6MvlnEGuBqROvWBogvfMd2KFqP212vrzvf08RDq3Sn9tLPtCaCl_P4QwPdE-rXe2y5NVyUzBlyNZC6AELyqqbp_jVBgTQFZU8CNmbr5ONazVswSJqg62E-AeqcQFI9z0YC3TYg98MupktMmXqsaFp0EdGDpbyXSdVso-T-8NG35WtVx2_6yPDDPAXYCEJw-Ej5HRX1wj3lU4AE2WmSGW21M6JUBM8wvz6GgLuorvJl1leShxsVL6lrX0-juNJsjt9dkDk"
                  />
                </div>
                <p className="text-[12px] font-bold text-text-primary">CFO</p>
                <p className="text-[10px] text-text-muted">Revenue</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green"></span>
                </div>
              </div>
            </div>
            {/*  Sub-Agent Clusters  */}
            <div className="grid grid-cols-4 gap-12">
              <div className="col-span-1 space-y-4">
                <div className="agent-node glass-card p-2 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/5"></div>
                  <div>
                    <p className="text-[10px] font-bold">Parser V4</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green"></div>
                  </div>
                </div>
                <div className="agent-node glass-card p-2 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/5"></div>
                  <div>
                    <p className="text-[10px] font-bold">Scraper X</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow"></div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 space-y-4">
                <div className="agent-node glass-card p-2 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/5"></div>
                  <div>
                    <p className="text-[10px] font-bold">QA Evaluator</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green"></div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 space-y-4">
                <div className="agent-node glass-card p-2 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/5"></div>
                  <div>
                    <p className="text-[10px] font-bold">Growth Bot</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green"></div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 space-y-4">
                <div className="agent-node glass-card p-2 rounded flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/5"></div>
                  <div>
                    <p className="text-[10px] font-bold">PayGate AI</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/*  Right Panel: AI Stats  */}
        <aside className="w-80 border-l border-white/10 bg-surface/30 backdrop-blur-md p-6 flex flex-col">
          <button className="w-full btn-primary-red h-[50px] rounded-full font-bold flex items-center justify-center gap-2 mb-4">
            <span className="material-symbols-outlined">add</span>
            Post a Job
          </button>

          <div className="flex items-center gap-2 mb-6">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              insights
            </span>
            <h2 className="font-headline-md text-[18px]">Platform Vitals</h2>
          </div>
          <div className="space-y-6 flex-1">
            {/*  Total Tasks  */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-text-muted text-label-md mb-1">Total Tasks</p>
              <div className="flex items-baseline gap-2">
                <span className="font-data-lg text-display-lg text-text-primary">
                  1,248,302
                </span>
                <span className="text-green text-xs font-bold">+12%</span>
              </div>
            </div>
            {/*  Success Rate  */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-text-muted text-label-md mb-1">
                Success Rate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-data-lg text-display-lg text-text-primary">
                  99.98%
                </span>
              </div>
              <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[99.98%]"></div>
              </div>
            </div>
            {/*  Avg Latency  */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-text-muted text-label-md mb-1">Avg Latency</p>
              <div className="flex items-baseline gap-2">
                <span className="font-data-lg text-display-lg text-text-primary">
                  14ms
                </span>
              </div>
            </div>
            {/*  Daily Cost  */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-text-muted text-label-md mb-1">
                Daily Run Cost
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-data-lg text-display-lg text-text-primary">
                  $42.12
                </span>
              </div>
            </div>
          </div>
          {/*  Danger Button  */}
          <div className="mt-auto pt-6">
            <button className="w-full h-[50px] rounded-full btn-ghost-red text-red-light font-bold flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined group-hover:animate-pulse">
                emergency_home
              </span>
              Override All Agents
            </button>
            <p className="text-center text-[10px] text-text-muted mt-3 uppercase tracking-[0.2em] font-medium">
              Authorization Required
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

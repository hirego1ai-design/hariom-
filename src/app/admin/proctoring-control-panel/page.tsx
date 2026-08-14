"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE58() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

      <PageHeader
        title="Proctoring Control Panel"
        subtitle="Configure AI surveillance parameters for all active assessments."
      />

      {/* Master Toggle Section */}
      <section className="glass-card rounded-lg p-8 mb-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-light/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="font-display-lg text-display-lg text-white mb-2">Master Proctoring Shield</h3>
          <p className="text-text-secondary max-w-xl">Activating this toggle enables the HireGo AI core proctoring engine. All sub-features will adhere to these global permissions and real-time analysis protocols.</p>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <label className="switch scale-[2]">
            <input defaultChecked type="checkbox" />
            <span className="slider"></span>
          </label>
          <span className="text-primary font-bold mt-4 tracking-widest text-label-md">ACTIVE SYSTEM</span>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Feature 1: Face Detection */}
        <div className="glass-card rounded-lg p-6 flex flex-col justify-between hover:bg-surface-container/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">face</span>
            </div>
            <label className="switch">
              <input defaultChecked type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <h4 className="font-headline-md text-headline-md mb-2">Face Detection</h4>
          <p className="text-text-muted font-body-md mb-6">Continuous tracking of the candidate's facial presence within the frame.</p>
          <div>
            <div className="flex justify-between text-label-md mb-2">
              <span className="text-text-secondary">Violation Tolerance</span>
              <span className="text-primary font-data-md">15%</span>
            </div>
            <input max="100" min="0" type="range" defaultValue="15" />
          </div>
        </div>

        {/* Feature 2: Tab Switch */}
        <div className="glass-card rounded-lg p-6 flex flex-col justify-between hover:bg-surface-container/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">tab</span>
            </div>
            <label className="switch">
              <input defaultChecked type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <h4 className="font-headline-md text-headline-md mb-2">Tab Switch</h4>
          <p className="text-text-muted font-body-md mb-6">Detect and flag whenever the user leaves the assessment browser tab.</p>
          <div>
            <div className="flex justify-between text-label-md mb-2">
              <span className="text-text-secondary">Violation Tolerance</span>
              <span className="text-primary font-data-md">0%</span>
            </div>
            <input max="100" min="0" type="range" defaultValue="0" />
          </div>
        </div>

        {/* Feature 3: Multi-face */}
        <div className="glass-card rounded-lg p-6 flex flex-col justify-between hover:bg-surface-container/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">group</span>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <h4 className="font-headline-md text-headline-md mb-2">Multi-face</h4>
          <p className="text-text-muted font-body-md mb-6">Detect if more than one person is present in the video feed.</p>
          <div>
            <div className="flex justify-between text-label-md mb-2">
              <span className="text-text-secondary">Violation Tolerance</span>
              <span className="text-primary font-data-md">5%</span>
            </div>
            <input max="100" min="0" type="range" defaultValue="5" />
          </div>
        </div>

        {/* Feature 4: Copy-Paste Block */}
        <div className="glass-card rounded-lg p-6 flex flex-col justify-between hover:bg-surface-container/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">content_copy</span>
            </div>
            <label className="switch">
              <input defaultChecked type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <h4 className="font-headline-md text-headline-md mb-2">Copy-Paste Block</h4>
          <p className="text-text-muted font-body-md mb-6">Disable clipboard actions within the assessment environment.</p>
          <div>
            <div className="flex justify-between text-label-md mb-2">
              <span className="text-text-secondary">Violation Tolerance</span>
              <span className="text-primary font-data-md">Locked</span>
            </div>
            <input disabled max="100" min="0" type="range" defaultValue="100" />
          </div>
        </div>

        {/* Feature 5: Screen Recording */}
        <div className="glass-card rounded-lg p-6 flex flex-col justify-between hover:bg-surface-container/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">screen_share</span>
            </div>
            <label className="switch">
              <input defaultChecked type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <h4 className="font-headline-md text-headline-md mb-2">Screen Recording</h4>
          <p className="text-text-muted font-body-md mb-6">Capture candidate screen for post-assessment audit review.</p>
          <div>
            <div className="flex justify-between text-label-md mb-2">
              <span className="text-text-secondary">FPS Priority</span>
              <span className="text-primary font-data-md">High</span>
            </div>
            <input max="100" min="0" type="range" defaultValue="80" />
          </div>
        </div>

        {/* Feature 6: Audio Monitoring */}
        <div className="glass-card rounded-lg p-6 flex flex-col justify-between hover:bg-surface-container/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">mic</span>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <h4 className="font-headline-md text-headline-md mb-2">Audio Monitoring</h4>
          <p className="text-text-muted font-body-md mb-6">Analyze background noise and speech patterns for suspicious activity.</p>
          <div>
            <div className="flex justify-between text-label-md mb-2">
              <span className="text-text-secondary">Sensitivity Level</span>
              <span className="text-primary font-data-md">42dB</span>
            </div>
            <input max="100" min="0" type="range" defaultValue="40" />
          </div>
        </div>
      </section>

      {/* Policy Editor Section */}
      <section className="glass-card rounded-lg p-6 mb-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">gavel</span>
          <h4 className="font-headline-md text-headline-md">Assessment Policy Text</h4>
        </div>
        <div className="relative bg-bg-page/50 rounded-lg p-1 border border-white/5">
          {/* Editor Toolbar */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-white/5 mb-4">
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">format_italic</span></button>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">format_list_bulleted</span></button>
            <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">link</span></button>
          </div>
          <textarea className="w-full h-48 bg-transparent border-none focus:ring-0 text-text-secondary font-body-md px-4 leading-relaxed resize-none" placeholder="Enter policy text here..." defaultValue="By proceeding with this HireGo AI assessment, the candidate acknowledges and consents to the activation of real-time proctoring measures. This includes webcam monitoring for facial presence, screen recording for activity auditing, and tab-switch detection to ensure academic integrity. All data is processed via secure, encrypted channels and is stored temporarily for the duration of the hiring cycle review. HireGo AI reserves the right to automatically flag sessions that exceed the defined violation tolerance levels set by the system administrator."></textarea>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button className="px-8 h-[50px] rounded-full btn-ghost text-text-primary font-bold active:scale-95 transition-transform">
            Reset to Default
          </button>
          <button className="px-10 h-[50px] rounded-full btn-primary-red text-white font-bold active:scale-95 transition-transform">
            Save Changes
          </button>
        </div>
      </section>

      {/* Floating Status (Mini AI Indicator) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="glass-card rounded-full px-6 py-3 flex items-center gap-4 shadow-xl border-primary/20">
          <div className="relative">
            <div className="w-3 h-3 bg-red-light rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-red-light rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="font-data-md text-primary tracking-tighter">AI AGENT: OPTIMIZING LIVE SURVEILLANCE</span>
        </div>
      </div>
    </PageContainer>
  );
}

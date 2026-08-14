"use client";
import React, { useState } from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";
import { useRouter } from "next/navigation";
import { useJobCreationStore } from "@/store/useJobCreationStore";

export default function EmployerPageE53() {
  const router = useRouter();
  const store = useJobCreationStore();

  const [newSkill, setNewSkill] = useState("");

  const handleNext = () => {
    router.push("/employer/job-listings-management");
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkill.trim()) {
      store.updateField('skillTags', [...store.skillTags, newSkill.trim()]);
      setNewSkill("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Stepper Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 text-primary mb-2">
            <button onClick={() => router.push("/employer/create-job-ai-jd-writing")} className="material-symbols-outlined hover:bg-white/10 rounded-full p-1 transition-colors">arrow_back</button>
            <span className="font-label-md text-label-md uppercase tracking-widest opacity-60">Step 3 of 3</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary">Requirements &amp; Compensation</h1>
          <p className="text-text-secondary font-body-md mt-2 max-w-2xl">Define the core DNA of your ideal candidate. AI has pre-filled some suggestions based on your job title.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-8 space-y-gutter">
            
            {/* Skills Section */}
            <section className="glass-card rounded-lg p-stack-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-stack-md">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                  <h2 className="font-headline-md text-headline-md">Required Skills</h2>
                </div>
                <span className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">smart_toy</span> AI Suggested
                </span>
              </div>
              
              {/* AI Suggestions & Skills List */}
              <div className="flex flex-wrap gap-2 mb-6">
                {store.skillTags.map((skill, index) => (
                  <div key={index} className="skill-chip flex items-center gap-2 bg-surface-container-low border border-white/5 px-4 py-2 rounded-full">
                    <span className="font-body-md text-on-surface">{skill}</span>
                    <button onClick={() => store.updateField('skillTags', store.skillTags.filter((_, i) => i !== index))} className="material-symbols-outlined text-sm opacity-40 hover:opacity-100 transition-opacity">close</button>
                  </div>
                ))}
                <div className="flex items-center gap-2 bg-white/5 border border-dashed border-white/20 px-4 py-2 rounded-full">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <input 
                    type="text" 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="Add Skill & press Enter"
                    className="bg-transparent border-none text-sm text-on-surface focus:outline-none w-32 placeholder:text-text-muted"
                  />
                </div>
              </div>
            </section>
            
            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-stack-lg">
              <button onClick={() => router.push("/employer/create-job-ai-jd-writing")} className="btn-ghost h-[50px] px-8 rounded-full text-on-surface font-bold flex items-center gap-2 group hover:bg-white/5">
                <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">chevron_left</span>
                Back
              </button>
              <div className="flex items-center gap-4">
                <button className="text-text-secondary hover:text-on-surface transition-colors font-bold px-4">Save as Draft</button>
                <button onClick={handleNext} className="btn-primary-red h-[50px] px-10 rounded-full text-white font-bold flex items-center gap-2 group">
                  Publish Job
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">rocket_launch</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column: AI Assistant Preview */}
          <div className="lg:col-span-4 space-y-gutter">
            <div className="glass-card rounded-lg p-stack-lg sticky top-[88px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-lg leading-tight">HireGo Assistant</h3>
                  <span className="text-xs text-green font-bold uppercase tracking-widest">Optimizing Live</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-yellow">auto_awesome</span>
                    Posting Strength: 84%
                  </h4>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green w-[84%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
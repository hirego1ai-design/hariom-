"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

// Candidate supporting documents are uploaded privately. Verification is not
// claimed until a candidate-document review workflow has been configured.
const SUPPORTING_DOCUMENTS = [
  {
    id: "identity",
    name: "Identity document",
    description: "A government-issued identity document, if requested later by an employer.",
    type: "candidate-identity",
  },
  {
    id: "education",
    name: "Education document",
    description: "An optional certificate or academic record supporting your profile.",
    type: "candidate-education",
  },
  {
    id: "experience",
    name: "Experience document",
    description: "An optional experience or employment document supporting your profile.",
    type: "candidate-experience",
  },
];

export default function DocumentUploadPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = async (docType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "onboarding-docs");

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      
      if (uploadRes.ok && uploadJson.file?.url) {
        setUploadedDocs((prev) => ({ ...prev, [docType]: true }));
        updateState({ [docType]: true });
        return true;
      }
    } catch (err) {
      console.error("Document upload failed:", err);
      return false;
    }
    return false;
  };

  const handleNext = () => {
    markStepComplete(8);
    router.push("/onboarding/checklist");
  };

  return (
    <div className="min-h-screen flex">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 px-8 py-4 bg-page border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-container-bg text-primary">
                Document upload
              </span>
              <h1 className="font-display-lg text-lg font-bold text-text-primary mt-1">
                Supporting documents
              </h1>
              <p className="text-xs text-text-muted mt-1">
                Upload optional documents that support your candidate profile
              </p>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {Object.values(uploadedDocs).filter(Boolean).length}/{SUPPORTING_DOCUMENTS.length} documents
            </span>
          </div>
        </header>

        <main className="p-6 lg:p-8 flex-1 max-w-[1000px] mx-auto">
          <div className="glass-card rounded-2xl p-6 lg:p-8 space-y-6">
            <div className="bg-yellow/10 border border-yellow/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow text-[20px] mt-1">info</span>
                <div>
                  <p className="text-xs font-bold text-text-primary">
                    Optional supporting documents
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Documents are stored privately. Uploading them does not mean they are verified.
                  </p>
                  <ul className="text-[11px] text-text-muted mt-2 space-y-1 list-disc list-inside">
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {SUPPORTING_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-card rounded-xl p-5 border border-white/5 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-[24px]">
                        {uploadedDocs[doc.id] ? "verified" : "description"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-text-primary">{doc.name}</h3>
                        {uploadedDocs[doc.id] && (
                          <span className="text-[10px] font-bold text-green px-2 py-0.5 rounded-full bg-green/10 border border-green/20">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">{doc.description}</p>
                      
                      {!uploadedDocs[doc.id] ? (
                        <div className="mt-3">
                          <label className="flex items-center justify-center w-full h-12 rounded-lg border border-dashed border-white/10 hover:border-primary/30 hover:bg-white/5 cursor-pointer transition-all group">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  await handleFileUpload(doc.type, file);
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">upload_file</span>
                              {uploadedDocs[doc.id] ? "Document Uploaded" : "Upload Document"}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-xs text-green font-bold">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Document submitted for admin verification
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <Link
                href="/onboarding/personal-details"
                className="px-6 h-11 rounded-full font-bold text-xs flex items-center gap-2 transition-all border border-white/10 bg-surface-container-high text-text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back
              </Link>

              <button
                onClick={handleNext}
                disabled={Object.values(uploadedDocs).every(Boolean) === false}
                className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "var(--shadow-btn-red)",
                }}
              >
                <span>Complete Onboarding</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

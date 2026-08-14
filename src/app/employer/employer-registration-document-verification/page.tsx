"use client";

import React, { useState } from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";
import { useRouter } from "next/navigation";

import { getCurrentSession, UserSession } from "@/lib";

export default function EmployerDocumentVerificationPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Get session from cookie on client side
  React.useEffect(() => {
    const getSessionFromCookie = (): UserSession | null => {
      if (typeof window === "undefined") return null;
      const cookie = document.cookie.split(";").find(c => c.trim().startsWith("hirego_session="));
      if (!cookie) return null;
      const token = cookie.split("=").slice(1).join("=");
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload;
      } catch {
        return null;
      }
    };
    setSession(getSessionFromCookie());
  }, []);

  const [docs, setDocs] = useState({
    gstin: "",
    pan: "",
    msme: "",
    cin: "",
    gstFile: null as File | null,
    panFile: null as File | null,
    msmeFile: null as File | null,
    incFile: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      setDocs({ ...docs, [key]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAtLeastOneFile = docs.gstFile || docs.panFile || docs.msmeFile || docs.incFile;

    if (!docs.gstin || !docs.pan) {
      alert("Please provide required GSTIN and PAN details for KYC verification.");
      return;
    }

    if (!hasAtLeastOneFile) {
      alert("At least one official verification document is required. Please upload your GST, PAN, MSME, or Certificate of Incorporation file.");
      return;
    }

    if (!session) {
      alert("Session expired. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const fileUploads = [];
      const docTypeMapping: Record<string, string> = {
        gstFile: "GST Certificate",
        panFile: "PAN Card",
        msmeFile: "MSME Certificate",
        incFile: "Certificate of Incorporation",
      };

      // Upload each file and submit for verification
      if (docs.gstFile) {
        fileUploads.push(uploadAndSubmit(docs.gstFile, "gstFile", docTypeMapping.gstFile));
      }
      if (docs.panFile) {
        fileUploads.push(uploadAndSubmit(docs.panFile, "panFile", docTypeMapping.panFile));
      }
      if (docs.msmeFile) {
        fileUploads.push(uploadAndSubmit(docs.msmeFile, "msmeFile", docTypeMapping.msmeFile));
      }
      if (docs.incFile) {
        fileUploads.push(uploadAndSubmit(docs.incFile, "incFile", docTypeMapping.incFile));
      }

      const results = await Promise.all(fileUploads);
      
      // Check if all uploads succeeded
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        alert(`Failed to upload ${failedUploads.length} document(s). Please try again.`);
        setLoading(false);
        return;
      }

      alert("Documents uploaded and submitted for verification!");
      router.push("/employer/employer-registration-complete");
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading documents. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const uploadAndSubmit = async (
    file: File,
    fileKey: string,
    docType: string
  ): Promise<{ success: boolean; fileUrl?: string }> => {
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "employer-docs");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadJson = await uploadResponse.json();

      // Submit for document verification
      const verifyResponse = await fetch("/api/admin/document-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          fileUrl: uploadJson.file.url,
          fileName: file.name,
          employerId: session?.id,
          companyName: docs.gstin,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error(`Verification submission failed: ${verifyResponse.statusText}`);
      }

      return { success: true, fileUrl: uploadJson.file.url };
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      alert(`Failed to upload ${file.name}`);
      return { success: false };
    }
  };

  // Sleek Input-Pill Upload Box Helper Component
  const RenderUploadPill = ({
    label,
    placeholder,
    file,
    fileKey,
    accept = ".pdf,.jpg,.jpeg,.png",
  }: {
    label: string;
    placeholder: string;
    file: File | null;
    fileKey: string;
    accept?: string;
  }) => {
    return (
      <div className="space-y-1">
        <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
          {label}
        </label>
        <label
          className={`input-pill w-full h-10 text-xs px-3.5 flex items-center justify-between cursor-pointer transition-all ${
            file
              ? "border-emerald-500/50 bg-emerald-500/10 text-white font-bold"
              : "text-text-secondary hover:border-amber-400/50"
          }`}
        >
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFileChange(e, fileKey)}
          />

          {file ? (
            /* Uploaded State: Centered Filename Only + Green Verified Badge */
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-emerald-400 text-[17px]">
                  check_circle
                </span>
                <span className="truncate text-xs font-bold text-white">
                  {file.name}
                </span>
              </div>
              <span className="text-[9.5px] text-emerald-400 font-extrabold uppercase tracking-wider flex-shrink-0">
                Uploaded
              </span>
            </div>
          ) : (
            /* Empty State: Placeholder + 3D Upload Icon */
            <div className="w-full flex items-center justify-between gap-2">
              <span className="truncate text-text-secondary font-medium">
                {placeholder}
              </span>
              <div className="w-6 h-6 rounded-md bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-400 text-[15px]">
                  upload_file
                </span>
              </div>
            </div>
          )}
        </label>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      

      {/* Main Container - Perfect Centering & Vertical Rhythm */}
      <div className="w-full max-w-[1050px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Stepper */}
        <section className="hidden md:flex md:col-span-5 lg:col-span-4 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-7 justify-between relative">
          {/* Brand Logo */}
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
              KYC & Compliance Verification
            </span>
          </div>

          {/* 3D Visual */}
          <div className="relative flex-grow flex items-center justify-center my-3">
            <div className="relative w-full max-w-[170px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[70px] rounded-full scale-75 animate-pulse" />
              <img
                className="relative z-10 w-full h-full object-contain"
                alt="3D Security Verification Graphic"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsxYV2aREJbeHmmorT35Kdd3Eyo3rEUnfqu8PxRQPv0VH8ujIhTLUb8DQRPXGOCON7Jwd8NgixwTtLgaXkPhyMiUFjnUPR_Xt_UFZkAUA7_YcFL6ppfQidkwR4fvvv_DpkvKSi9rWtHPc786GaIniskb5aoPGXRxexpW3BRhU7rhLu9tuFb_g8rJnv2P6R85J5SHixzoAHz333EDBu_GZ0tXCx7VDmUODACmisj7nxoRoR4uwDrQ6YZyGkmWBNnnOoeY6KghM9vyE"
              />
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="relative z-10 space-y-2.5 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] text-black font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[9.5px] text-emerald-400 uppercase font-bold">
                  Step 1
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Company Profile
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] text-black font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[9.5px] text-emerald-400 uppercase font-bold">
                  Step 2
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Identity OTP Check
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] text-black font-bold">
                ✓
              </div>
              <div>
                <p className="font-label-md text-[9.5px] text-emerald-400 uppercase font-bold">
                  Step 3
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Business Model & Plan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5.5 h-5.5 rounded-full bg-primary flex items-center justify-center text-[11px] text-white font-bold">
                4
              </div>
              <div>
                <p className="font-label-md text-[9.5px] text-primary uppercase font-bold">
                  FINAL STEP
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  KYC Document Verification
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Centered Document Collection Form */}
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-5 lg:p-7">
          <div className="w-full max-w-[540px] mx-auto">
            {/* Header */}
            <div className="mb-3.5 text-center md:text-left">
              <h1 className="font-display-xl text-xl font-bold text-primary mb-1">
                KYC & Document Collection
              </h1>
              <p className="font-body-lg text-[11.5px] text-text-secondary">
                Upload official corporate documents for manual KYC compliance review by the{" "}
                <strong className="font-extrabold text-white">HireGo AI team.</strong>
              </p>
            </div>

            {/* Form */}
            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* Row 1: GSTIN & GST Certificate Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                    GSTIN Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="27AAAAA0000A1Z5"
                    value={docs.gstin}
                    onChange={(e) => setDocs({ ...docs, gstin: e.target.value.toUpperCase() })}
                    className="input-pill w-full h-10 text-xs text-text-primary px-3.5 font-mono"
                  />
                </div>

                <RenderUploadPill
                  label="GST Certificate * (.pdf / .jpg)"
                  placeholder="Upload GST Document"
                  file={docs.gstFile}
                  fileKey="gstFile"
                />
              </div>

              {/* Row 2: Company PAN & PAN Card Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                    Company PAN / Tax ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABCDE1234F"
                    value={docs.pan}
                    onChange={(e) => setDocs({ ...docs, pan: e.target.value.toUpperCase() })}
                    className="input-pill w-full h-10 text-xs text-text-primary px-3.5 font-mono"
                  />
                </div>

                <RenderUploadPill
                  label="PAN Card Document * (.pdf / .jpg)"
                  placeholder="Upload PAN Card Document"
                  file={docs.panFile}
                  fileKey="panFile"
                />
              </div>

              {/* Row 3: MSME / Udyam & CIN Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                    MSME / Udyam Reg No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="UDYAM-MH-00-0000000"
                    value={docs.msme}
                    onChange={(e) => setDocs({ ...docs, msme: e.target.value })}
                    className="input-pill w-full h-10 text-xs text-text-primary px-3.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                    CIN / Incorporation No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="U72900MH2023PTC123456"
                    value={docs.cin}
                    onChange={(e) => setDocs({ ...docs, cin: e.target.value.toUpperCase() })}
                    className="input-pill w-full h-10 text-xs text-text-primary px-3.5 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: MSME & Incorporation Upload Pills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <RenderUploadPill
                  label="MSME Certificate (Optional)"
                  placeholder="Upload MSME Document"
                  file={docs.msmeFile}
                  fileKey="msmeFile"
                />
                <RenderUploadPill
                  label="Incorporation Certificate (Optional)"
                  placeholder="Upload Certificate of Inc."
                  file={docs.incFile}
                  fileKey="incFile"
                />
              </div>

              {/* Requirement Alert Banner */}
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[17px] flex-shrink-0">
                  info
                </span>
                <span className="text-[10.5px] text-amber-200 leading-tight">
                  <strong className="font-bold">Final Step Requirement:</strong> Upload at least 1 document (GST / PAN / MSME / CIN) for manual KYC compliance review by the <strong className="font-extrabold text-white">HireGo AI team.</strong>
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-0.5">
                <button
                  className="btn-3d-red w-full h-10.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 group shadow-md"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">loading</span>
                      <span>Uploading Documents...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit KYC & Complete Verification</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

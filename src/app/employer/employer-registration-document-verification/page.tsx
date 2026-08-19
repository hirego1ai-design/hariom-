"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EmployerDocumentVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationType, setVerificationType] = useState<"GST" | "MSME" | "INCORPORATION">("GST");

  const [docs, setDocs] = useState({
    gstin: "",
    msme: "",
    cin: "",
    gstFile: null as File | null,
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
    const selectedIdentifier = verificationType === "GST" ? docs.gstin : verificationType === "MSME" ? docs.msme : docs.cin;
    const selectedFile = verificationType === "GST" ? docs.gstFile : verificationType === "MSME" ? docs.msmeFile : docs.incFile;

    if (!selectedIdentifier || !selectedFile) {
      setError(`Please provide the ${verificationType === "GST" ? "GSTIN" : verificationType === "MSME" ? "MSME / Udyam registration number" : "CIN / incorporation number"} and upload the matching certificate.`);
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("The selected file is larger than 10 MB.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const fileUploads = [];
      const docType = verificationType === "GST" ? "GST Certificate" : verificationType === "MSME" ? "MSME Certificate" : "Certificate of Incorporation";
      fileUploads.push(uploadAndSubmit(selectedFile, docType, selectedIdentifier));

      const results = await Promise.all(fileUploads);
      
      // Check if all uploads succeeded
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} document(s). Please try again.`);
        setLoading(false);
        return;
      }

      const model = searchParams.get("model") === "managed" ? "managed" : "subscription";
      router.push(`/employer/employer-registration-complete?model=${model}`);
    } catch (error) {
      console.error("Upload error:", error);
      setError("An error occurred while uploading the document. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const uploadAndSubmit = async (file: File, docType: string, identifier: string): Promise<{ success: boolean; fileUrl?: string }> => {
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

      const uploadBody = await uploadResponse.text();
      if (!uploadBody.trim()) throw new Error("Upload service returned an empty response.");
      const uploadJson = JSON.parse(uploadBody);
      if (!uploadResponse.ok || !uploadJson.success || !uploadJson.file?.url) {
        throw new Error(uploadJson.error || "Upload failed.");
      }

      // Submit for document verification
      const verifyResponse = await fetch("/api/admin/document-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          fileUrl: uploadJson.file.url,
          fileName: file.name,
        }),
      });

      if (!verifyResponse.ok) {
        const verifyBody = await verifyResponse.text();
        let verifyError = verifyResponse.statusText;
        try { verifyError = JSON.parse(verifyBody).error || verifyError; } catch { /* keep status text */ }
        throw new Error(`Verification submission failed: ${verifyError}`);
      }

      return { success: true, fileUrl: uploadJson.file.url };
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      return { success: false };
    }
  };

  const selectedFileForForm = verificationType === "GST" ? docs.gstFile : verificationType === "MSME" ? docs.msmeFile : docs.incFile;

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

            <div className="flex items-center gap-3 opacity-70">
              <div className="w-5.5 h-5.5 rounded-full bg-white/10 flex items-center justify-center text-[11px] text-white font-bold">
                4
              </div>
              <div>
                <p className="font-label-md text-[9.5px] text-text-secondary uppercase font-bold">
                  Step 4
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  Plan Setup (Subscription Only)
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
                  Hiring Model
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5.5 h-5.5 rounded-full bg-primary flex items-center justify-center text-[11px] text-white font-bold">
                4
              </div>
              <div>
                <p className="font-label-md text-[9.5px] text-primary uppercase font-bold">
                  Step 5 · Final
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  One-Document KYC
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
              <div className="space-y-3">
                <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">Choose one verification document *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["GST", "MSME", "INCORPORATION"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setVerificationType(type)} className={`h-10 rounded-xl border text-[11px] font-bold transition-all ${verificationType === type ? "bg-primary text-white border-primary" : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10"}`}>
                      {type === "GST" ? "GST" : type === "MSME" ? "MSME / Udyam" : "Incorporation"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">
                      {verificationType === "GST" ? "GSTIN Number" : verificationType === "MSME" ? "MSME / Udyam Registration Number" : "CIN / Incorporation Number"} *
                    </label>
                    <input type="text" required placeholder={verificationType === "GST" ? "27AAAAA0000A1Z5" : verificationType === "MSME" ? "UDYAM-MH-00-0000000" : "U72900MH2023PTC123456"} value={verificationType === "GST" ? docs.gstin : verificationType === "MSME" ? docs.msme : docs.cin} onChange={(e) => setDocs({ ...docs, ...(verificationType === "GST" ? { gstin: e.target.value.toUpperCase() } : verificationType === "MSME" ? { msme: e.target.value.toUpperCase() } : { cin: e.target.value.toUpperCase() }) })} className="input-pill w-full h-10 text-xs text-text-primary px-3.5 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-[11px] font-bold text-on-surface-variant ml-1">{verificationType === "GST" ? "GST" : verificationType === "MSME" ? "MSME / Udyam" : "Incorporation"} Certificate *</label>
                    <label className={`input-pill w-full h-10 px-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${selectedFileForForm ? "border-emerald-500/60 bg-emerald-500/10" : "hover:border-primary/70"}`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required={!selectedFileForForm}
                        onChange={(e) => handleFileChange(e, verificationType === "GST" ? "gstFile" : verificationType === "MSME" ? "msmeFile" : "incFile")}
                        className="sr-only"
                      />
                      <span className={`material-symbols-outlined text-[17px] ${selectedFileForForm ? "text-emerald-400" : "text-primary"}`}>
                        {selectedFileForForm ? "check_circle" : "upload_file"}
                      </span>
                      <span className={`text-xs font-bold truncate max-w-[170px] ${selectedFileForForm ? "text-emerald-300" : "text-text-secondary"}`}>
                        {selectedFileForForm ? selectedFileForForm.name : "Choose File"}
                      </span>
                    </label>
                    <p className="text-[9px] text-text-muted text-center">PDF, JPG, JPEG or PNG · Max 10 MB</p>
                  </div>
                </div>
              </div>

              {/* Requirement Alert Banner */}
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[17px] flex-shrink-0">
                  info
                </span>
                <span className="text-[10.5px] text-amber-200 leading-tight">
                  <strong className="font-bold">Final Step Requirement:</strong> Submit any one certificate: GST, MSME / Udyam, or Incorporation. PAN is not required for this step.
                </span>
              </div>

              {error && (
                <p role="alert" className="text-center text-xs text-red-300">{error}</p>
              )}

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

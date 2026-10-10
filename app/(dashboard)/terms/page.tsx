"use client";

import { Button, message } from "antd";
import { useEffect, useState } from "react";

import Wrapper from "../wealth/_components/wapper";

const TermsPage = () => {
  const [pdfUrls, setPdfUrls] = useState<any>([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const API_BASE = "/api/v1";
  const getToken = () => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      // DB-first fetch for consistency (use 'conditions' category)
      const dbRes = await fetch(`${API_BASE}/uploads/db?category=conditions&provider=any`);
      if (!dbRes.ok) throw new Error("Failed to fetch terms");
      const dbData = await dbRes.json();
      let files = (dbData?.files || [])
        .filter((f: any) => f?.url && (f.resource_type === "image" || f.format === "pdf"))
        .map((f: any) => ({ name: f.filename || f.public_id, url: f.url }));

      // Fallback to provider listing (R2) if DB empty
      if (files.length === 0) {
        const r2Res = await fetch(`${API_BASE}/uploads/list?category=conditions&provider=r2`);
        if (r2Res.ok) {
          const r2Data = await r2Res.json();
          files = (r2Data?.files || [])
            .filter((f: any) => f?.url && (f.resource_type === "image" || f.format === "pdf"))
            .map((f: any) => ({ name: f.filename || f.public_id, url: f.url }));
        }
      }

      setPdfUrls(files);
      if (files.length > 0) setSelectedPdf(files[0].url);
    } catch (error) {
      console.error("Error fetching files:", error);
      message.error("Failed to fetch terms and conditions.");
    }
  };

  const handleUploadTerms = async (file: File) => {
    try {
      const isPdf = file.type === "application/pdf";
      if (!isPdf) {
        message.error("Only PDF files are allowed.");
        return;
      }
      const formData = new FormData();
      formData.append("category", "conditions");
      formData.append("files", file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: token } : undefined,
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      message.success("Terms uploaded successfully");
      await fetchFiles();
    } catch (e: any) {
      message.error(e?.message || "Upload failed");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: any) => setNumPages(numPages);

  return (
    <Wrapper>
      <div className="py-5 select-none">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            Terms & Conditions
          </h1>
          <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
            Review Lynchpin Global terms, compliance policies, and operational agreements
          </p>
        </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {pdfUrls.length > 1 &&
          pdfUrls.map((file: any, index: any) => (
            <button
              key={index}
              onClick={() => setSelectedPdf(file.url)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedPdf === file.url
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {file.name}
            </button>
          ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div />
        <label className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadTerms(file);
            }}
          />
          <span>Upload Terms (PDF)</span>
        </label>
      </div>

      <div className="mb-4" data-tour="policy-view">
        {selectedPdf ? (
          <iframe
            src={selectedPdf}
            title="Terms and Conditions"
            width="100%"
            height="800px"
            style={{ border: "none" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "24px",
            }}
          >
            <img
              src="/empty-doc.svg"
              alt="No terms and conditions found"
              style={{
                maxWidth: "320px",
                width: "100%",
                height: "auto",
                opacity: 0.85,
              }}
            />
          </div>
        )}
      </div>
      </div>
    </Wrapper>
  );
};

export default TermsPage;

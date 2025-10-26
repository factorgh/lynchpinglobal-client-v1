"use client";

import { Button, message } from "antd";
import { useEffect, useState } from "react";

import Wrapper from "../wealth/_components/wapper";

const TermsPage = () => {
  const [pdfUrls, setPdfUrls] = useState<any>([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
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
      const res = await fetch(`${API_BASE}/uploads/list?category=terms`);
      if (!res.ok) throw new Error("Failed to fetch terms");
      const data = await res.json();
      const files = (data?.files || [])
        .filter(
          (f: any) =>
            f?.url && (f.resource_type === "image" || f.format === "pdf")
        )
        .map((f: any) => ({ name: f.filename || f.public_id, url: f.url }));
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
      formData.append("category", "terms");
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
      <div className="flex items-center justify-center p-3 bg-white mt-3">
        <h1 className="text-2xl font-bold text-center ">Terms & Conditions</h1>
      </div>

      <div className="flex gap-4 mb-6">
        {pdfUrls.length > 1 &&
          pdfUrls.map((file: any, index: any) => (
            <button
              key={index}
              onClick={() => setSelectedPdf(file.url)}
              className={`px-4 py-2 rounded ${
                selectedPdf === file.url
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {file.name}
            </button>
          ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div />
        <label>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadTerms(file);
            }}
          />
          {/* <Button type="primary" data-tour="acknowledge">
            Upload Terms (PDF)
          </Button> */}
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
    </Wrapper>
  );
};

export default TermsPage;

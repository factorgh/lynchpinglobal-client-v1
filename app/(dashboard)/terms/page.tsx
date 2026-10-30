"use client";

import { useAuth } from "@/context/authContext";
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExportOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Spin, Tag, Tooltip, message } from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import Wrapper from "../wealth/_components/wapper";

interface ClientUploadedDoc {
  name: string;
  url: string;
  public_id: string;
  category?: string;
  docType?: string;
  note?: string;
  bytes?: number;
  created_at?: string;
  format?: string;
}

const DOCUMENT_TYPES = [
  { label: "Signed Mandate Agreement", value: "Signed Mandate Agreement" },
  { label: "Proof of Identity / Passport / Ghana Card", value: "Proof of Identity" },
  { label: "Proof of Residential Address", value: "Proof of Address" },
  { label: "Wire / Payment Confirmation Receipt", value: "Payment Receipt" },
  { label: "Tax & Compliance Record", value: "Tax & Compliance" },
  { label: "Power of Attorney / Authorization", value: "Authorization" },
  { label: "General Supporting Document", value: "Supporting Document" },
];

const TermsPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"terms" | "upload">("terms");

  // Institutional Terms State (Read-Only for Client)
  const [pdfUrls, setPdfUrls] = useState<any[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isTermsLoading, setIsTermsLoading] = useState(false);

  // Client Documents Upload Section State
  const [clientDocs, setClientDocs] = useState<ClientUploadedDoc[]>([]);
  const [isClientDocsLoading, setIsClientDocsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("Signed Mandate Agreement");
  const [docNote, setDocNote] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = "/api/v1";

  const getStoredToken = () => {
    try {
      if (token) return token;
      return typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchTerms();
    fetchClientDocuments();
  }, [user]);

  // 1. Fetch Official Institutional Terms & Conditions (Read-Only)
  const fetchTerms = async () => {
    setIsTermsLoading(true);
    try {
      const dbRes = await fetch(
        `${API_BASE}/uploads/db?category=conditions&provider=any`
      );
      if (!dbRes.ok) throw new Error("Failed to fetch terms");
      const dbData = await dbRes.json();
      let files = (dbData?.files || [])
        .filter(
          (f: any) =>
            f?.url && (f.resource_type === "image" || f.format === "pdf")
        )
        .map((f: any) => ({ name: f.filename || f.public_id, url: f.url }));

      if (files.length === 0) {
        const r2Res = await fetch(
          `${API_BASE}/uploads/list?category=conditions&provider=r2`
        );
        if (r2Res.ok) {
          const r2Data = await r2Res.json();
          files = (r2Data?.files || [])
            .filter(
              (f: any) =>
                f?.url && (f.resource_type === "image" || f.format === "pdf")
            )
            .map((f: any) => ({ name: f.filename || f.public_id, url: f.url }));
        }
      }

      setPdfUrls(files);
      if (files.length > 0 && !selectedPdf) {
        setSelectedPdf(files[0].url);
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setIsTermsLoading(false);
    }
  };

  // 2. Fetch Client's Uploaded Files for Admin
  const fetchClientDocuments = async () => {
    setIsClientDocsLoading(true);
    try {
      const currentUserId = user?._id || user?.id;
      const url = currentUserId
        ? `${API_BASE}/uploads/db?category=client-documents&user=${currentUserId}`
        : `${API_BASE}/uploads/db?category=client-documents`;

      const authToken = getStoredToken();
      const res = await fetch(url, {
        headers: authToken
          ? {
              Authorization: authToken.startsWith("Bearer ")
                ? authToken
                : `Bearer ${authToken}`,
            }
          : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        const items: ClientUploadedDoc[] = (data?.files || []).map((f: any) => ({
          name: f.filename || f.public_id,
          url: f.url,
          public_id: f.public_id,
          category: f.category,
          docType: f.docType || "Supporting Document",
          note: f.note || "",
          bytes: f.bytes,
          created_at: f.created_at,
          format: f.format,
        }));
        setClientDocs(items);
      }
    } catch (error) {
      console.error("Error fetching client documents:", error);
    } finally {
      setIsClientDocsLoading(false);
    }
  };

  // Handle Drag & Drop Selection
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSize) {
      message.error("File size exceeds 25 MB limit.");
      return;
    }
    setSelectedFile(file);
  };

  // Upload Client Document to Admin
  const handleUploadClientDocument = async () => {
    if (!selectedFile) {
      message.warning("Please choose a file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("category", "client-documents");
      formData.append("docType", docType);
      formData.append("note", docNote.trim());
      if (user?._id || user?.id) {
        formData.append("user", user._id || user.id);
      }
      formData.append("files", selectedFile);

      const authToken = getStoredToken();
      const bearerHeader = authToken
        ? authToken.startsWith("Bearer ")
          ? authToken
          : `Bearer ${authToken}`
        : undefined;

      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: bearerHeader ? { Authorization: bearerHeader } : undefined,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload document");
      }

      Swal.fire({
        icon: "success",
        title: "Document Submitted to Admin",
        text: `"${selectedFile.name}" has been securely uploaded and delivered to Lynchpin administrators.`,
        timer: 3000,
        showConfirmButton: false,
      });

      setSelectedFile(null);
      setDocNote("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchClientDocuments();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: e?.message || "There was an error uploading your document. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Client Document with Confirmation
  const handleDeleteDocument = async (doc: ClientUploadedDoc) => {
    const result = await Swal.fire({
      title: "Remove Document?",
      text: `Are you sure you want to delete "${doc.name}" from your submissions?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const authToken = getStoredToken();
      const res = await fetch(
        `${API_BASE}/uploads?public_id=${encodeURIComponent(
          doc.public_id
        )}&provider=r2`,
        {
          method: "DELETE",
          headers: authToken ? { Authorization: authToken } : undefined,
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      message.success("Document deleted successfully");
      fetchClientDocuments();
    } catch (error: any) {
      message.error(error.message || "Failed to delete document");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDocIcon = (format?: string, name?: string) => {
    const ext = (format || name?.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") {
      return <FilePdfOutlined className="text-rose-500 text-xl" />;
    }
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      return <FileImageOutlined className="text-sky-500 text-xl" />;
    }
    return <FileTextOutlined className="text-emerald-600 text-xl" />;
  };

  return (
    <Wrapper>
      <div className="py-6 select-none max-w-7xl mx-auto">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 backdrop-blur-xs">
              <SafetyCertificateOutlined />
              <span>Compliance & Institutional Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Terms & Client Document Vault
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
              Review official Lynchpin Global agreements or upload records for administrative review
            </p>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "terms"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileTextOutlined />
              <span>Terms & Policies</span>
              {pdfUrls.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {pdfUrls.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <CloudUploadOutlined />
              <span>Submit Files to Admin</span>
              {clientDocs.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-extrabold font-mono">
                  {clientDocs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: INSTITUTIONAL TERMS & CONDITIONS (READ-ONLY)            */}
        {/* ============================================================== */}
        {activeTab === "terms" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Document Selector Pills & Download */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
                  Official Documents:
                </span>
                {pdfUrls.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    No terms documents published yet
                  </span>
                ) : (
                  pdfUrls.map((file, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPdf(file.url)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedPdf === file.url
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                      }`}
                    >
                      <FilePdfOutlined />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </button>
                  ))
                )}
              </div>

              {selectedPdf && (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <a
                    href={selectedPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <ExportOutlined className="text-xs" />
                    <span>Open in Window</span>
                  </a>
                  <a
                    href={selectedPdf}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                  >
                    <DownloadOutlined className="text-xs" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Terms Viewer / Iframe */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-2">
              {isTermsLoading ? (
                <div className="flex flex-col items-center justify-center py-28 text-slate-400">
                  <Spin size="large" />
                  <p className="text-xs font-semibold mt-3 text-slate-500">
                    Loading Lynchpin Global terms...
                  </p>
                </div>
              ) : selectedPdf ? (
                <iframe
                  src={selectedPdf}
                  title="Official Terms & Conditions"
                  width="100%"
                  height="780px"
                  className="rounded-xl border border-slate-200"
                  style={{ border: "none" }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <img
                    src="/empty-doc.svg"
                    alt="No terms and conditions found"
                    className="max-w-[260px] w-full h-auto opacity-80 mb-4"
                  />
                  <h3 className="text-base font-bold text-slate-800">
                    No Policy Documents Published Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mt-1 mb-5">
                    Official Lynchpin Global terms and conditions are configured by the portfolio compliance team. You can submit your verification documents to admin below.
                  </p>
                  <Button
                    type="primary"
                    onClick={() => setActiveTab("upload")}
                    icon={<CloudUploadOutlined />}
                    className="bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold h-9"
                  >
                    Submit Documents to Admin
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CLIENT DOCUMENT UPLOADING SECTION FOR ADMIN              */}
        {/* ============================================================== */}
        {activeTab === "upload" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Institutional Information Banner */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CloudUploadOutlined className="text-xl" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">
                    Secure Client Document Vault
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                    Upload signed mandate agreements, identity verification records (Ghana Card, Passport), payment proofs, or compliance forms. Files uploaded here are stored in Cloudflare R2 and routed directly to Lynchpin Global portfolio administrators.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold shrink-0">
                <SafetyCertificateOutlined />
                <span>256-Bit Encrypted</span>
              </div>
            </div>

            {/* Document Upload Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Upload New Document for Admin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a document category and attach your file (PDF, PNG, JPG, or DOCX up to 25 MB)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                {/* Category Selection */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Document Classification</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={docType}
                    onChange={setDocType}
                    options={DOCUMENT_TYPES}
                    className="w-full text-xs"
                    size="large"
                  />
                </div>

                {/* Optional Note */}
                <div className="md:col-span-7 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Description / Reference Note</span>
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. Signed Q4 Mandate Amendment or Updated Ghana Card"
                    value={docNote}
                    onChange={(e) => setDocNote(e.target.value)}
                    size="large"
                    className="rounded-xl text-xs"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Drag and Drop Upload Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/60 scale-[1.005]"
                    : selectedFile
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,.doc,.docx"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-xs">
                      {getDocIcon(selectedFile.name.split(".").pop(), selectedFile.name)}
                    </div>
                    <p className="font-bold text-sm text-slate-900 truncate max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFileSize(selectedFile.size)} · Click to choose a different file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                      <InboxOutlined className="text-2xl text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag and drop your file here, or{" "}
                      <span className="text-emerald-700 underline font-extrabold">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, PNG, JPG, JPEG, DOCX · Maximum file size: 25 MB
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <InfoCircleOutlined className="text-slate-400" />
                  <span>Admin will be notified and can inspect files under your client account.</span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedFile && (
                    <Button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded-xl text-xs font-semibold px-4 h-9"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    type="primary"
                    onClick={handleUploadClientDocument}
                    disabled={!selectedFile || isUploading}
                    loading={isUploading}
                    icon={!isUploading && <CloudUploadOutlined />}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-6 h-9 shadow-sm"
                  >
                    Submit Document to Admin
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Documents Uploaded by Client */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Your Submitted Documents to Admin
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All documents you have delivered to the Lynchpin Global administration team
                  </p>
                </div>
                <Tag color="green" className="font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {clientDocs.length} {clientDocs.length === 1 ? "File" : "Files"}
                </Tag>
              </div>

              {isClientDocsLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <Spin size="default" />
                  <p className="text-xs font-medium mt-2">Loading your documents...</p>
                </div>
              ) : clientDocs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <InboxOutlined className="text-4xl text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No documents submitted yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    When you upload signed contracts, IDs, or receipts using the section above, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientDocs.map((doc, index) => (
                    <div
                      key={doc.public_id || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 transition-all bg-white"
                    >
                      {/* Document Details */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                          {getDocIcon(doc.format, doc.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                              {doc.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {doc.docType || "Supporting Document"}
                            </span>
                          </div>

                          {doc.note && (
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 italic">
                              “{doc.note}”
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            {doc.bytes && <span>{formatFileSize(doc.bytes)}</span>}
                            {doc.created_at && (
                              <>
                                <span>•</span>
                                <span>
                                  Uploaded {moment(doc.created_at).format("MMM D, YYYY · h:mm A")}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <CheckCircleOutlined className="text-[10px]" /> Received by Admin
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 w-full sm:w-auto justify-end">
                        <Tooltip title="Preview / Open in browser">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ExportOutlined className="text-xs" />
                            <span className="sm:hidden">View</span>
                          </a>
                        </Tooltip>

                        <Tooltip title="Download file">
                          <a
                            href={doc.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <DownloadOutlined className="text-xs" />
                            <span className="sm:hidden">Download</span>
                          </a>
                        </Tooltip>

                        <Tooltip title="Delete file">
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <DeleteOutlined className="text-xs" />
                            <span className="sm:hidden">Delete</span>
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default TermsPage;

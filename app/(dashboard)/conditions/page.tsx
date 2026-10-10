"use client";

import React, { useEffect, useState, useRef } from "react";
import { message, Spin } from "antd";
import Swal from "sweetalert2";

interface UploadedFile {
  name: string;
  url: string;
  public_id: string;
  resource_type?: string;
  size?: number;
  createdAt?: string;
}

const ConditionsUploader = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);
    try {
      // DB-first fetch (authoritative)
      const dbRes = await fetch(
        `${API_BASE}/uploads/db?category=conditions&provider=any`
      );
      if (!dbRes.ok) throw new Error("Failed to fetch terms");
      const dbData = await dbRes.json();
      let items: UploadedFile[] = (dbData?.files || []).map((f: any) => ({
        name: f.filename || f.public_id,
        url: f.url,
        public_id: f.public_id,
        resource_type: f.resource_type,
        size: f.bytes,
        createdAt: f.createdAt || f.updatedAt,
      }));

      // Fallback to direct R2 listing if DB returns empty
      if (items.length === 0) {
        const r2Res = await fetch(
          `${API_BASE}/uploads/list?category=conditions&provider=r2`
        );
        if (r2Res.ok) {
          const r2Data = await r2Res.json();
          items = (r2Data?.files || []).map((f: any) => ({
            name: f.filename || f.public_id,
            url: f.url,
            public_id: f.public_id,
            resource_type: f.resource_type,
            size: f.bytes,
            createdAt: f.createdAt || f.updatedAt,
          }));
        }
      }

      setFiles(items);
    } catch (error) {
      console.error("Error fetching files:", error);
      message.error("Failed to fetch terms and conditions.");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Active";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Active";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Active";
    }
  };

  const handleUpload = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      message.error("You can only upload PDF files.");
      return;
    }

    // 10 MB limit as stated in the design
    if (file.size > 10 * 1024 * 1024) {
      message.error("File size exceeds 10 MB limit.");
      return;
    }

    try {
      setLoading(true);
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
      message.success(`${file.name} uploaded successfully.`);
      fetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Failed to upload file.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const confirmDelete = async (
    public_id: string,
    name?: string,
    resource_type?: string
  ) => {
    const result = await Swal.fire({
      title: "Delete Document?",
      text: `Are you sure you want to delete "${name || "this document"}"? It will no longer be available to partners.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      background: "#ffffff",
      color: "#0f172a",
    });

    if (result.isConfirmed) {
      await handleDelete(public_id, resource_type);
    }
  };

  const handleDelete = async (public_id: string, resource_type?: string) => {
    try {
      setLoading(true);
      const token = getToken();
      const qs = new URLSearchParams({ public_id, provider: "r2" });
      if (resource_type) qs.set("resource_type", resource_type);

      const res = await fetch(`${API_BASE}/uploads?${qs.toString()}`, {
        method: "DELETE",
        headers: token
          ? {
              Authorization: token.startsWith("Bearer ")
                ? token
                : `Bearer ${token}`,
            }
          : undefined,
      });

      if (!res.ok) {
        let msg = "Delete failed";
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {}
        throw new Error(msg);
      }

      message.success(`Deleted successfully.`);
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      message.error((error as Error)?.message || "Failed to delete file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-5 px-3 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] flex flex-col select-none">
      {/* Crisp White & Black Themed Container - Full Page */}
      <div className="w-full flex-1 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xl text-slate-900 space-y-8 relative flex flex-col">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl gap-3">
            <Spin size="large" />
            <span className="text-xs text-slate-600 font-medium tracking-wide">
              Processing request...
            </span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileInputChange}
        />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 pb-6">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1.5 block">
              LEGAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Terms & Conditions
            </h1>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {files.length} {files.length === 1 ? "document" : "documents"} · PDF only
          </div>
        </div>

        {/* Upload Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
            isDragging
              ? "border-slate-900 bg-slate-100/90 scale-[1.005]"
              : "border-slate-300 hover:border-slate-800 bg-slate-50/70 hover:bg-slate-100/80"
          }`}
        >
          {/* Circle Icon with Upward Arrow */}
          <div className="w-12 h-12 rounded-full border border-slate-300 bg-white shadow-xs flex items-center justify-center text-slate-800 group-hover:border-slate-800 group-hover:scale-105 transition-all mb-4">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16" />
              <path d="M12 20V8" />
              <path d="m7 13 5-5 5 5" />
            </svg>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            Drop a PDF to upload
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm">
            It replaces the active terms for all partners. Max 10 MB.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={loading}
            className="bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            Choose file
          </button>
        </div>

        {/* Active Document Section */}
        <div className="pt-2">
          <h4 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-3">
            ACTIVE DOCUMENT
          </h4>

          <div data-tour="policy-view">
            {files.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
                No active terms document uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file, idx) => (
                  <div
                    key={file.public_id || idx}
                    className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs"
                  >
                    {/* Left: PDF badge and File Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 text-[11px] font-bold shadow-xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <h5
                          className="text-sm font-semibold text-slate-900 truncate max-w-sm sm:max-w-md"
                          title={file.name}
                        >
                          {file.name}
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatBytes(file.size) || "PDF"} · Uploaded{" "}
                          {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Live Badge & Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                      {/* Live Status Badge */}
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>

                      {/* View Button */}
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors shadow-2xs"
                      >
                        View
                      </a>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete(
                            file.public_id,
                            file.name,
                            file.resource_type
                          )
                        }
                        disabled={loading}
                        className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionsUploader;

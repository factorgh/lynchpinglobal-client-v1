"use client";

import React, { useEffect, useRef, useState } from "react";
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

type LibrarySection = "shared" | "adminOnly";

const SECTIONS: Record<
  LibrarySection,
  { category: string; title: string; button: string; description: string; badge: string; badgeClass: string }
> = {
  shared: {
    category: "conditions",
    title: "Clients & Admins",
    button: "Upload for Clients & Admins",
    description: "Every client and every admin can see and open these documents.",
    badge: "Visible to clients & admins",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  adminOnly: {
    category: "lp-library-admin",
    title: "Admins Only",
    button: "Upload for Admins Only",
    description: "Only admins can see these documents. Clients cannot see or open them.",
    badge: "Admins only",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
};

const MAX_SIZE_MB = 25;
const ACCEPT =
  "application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/png,image/jpeg,image/webp";

const LPLibraryAdmin = () => {
  const [files, setFiles] = useState<Record<LibrarySection, UploadedFile[]>>({
    shared: [],
    adminOnly: [],
  });
  const [loading, setLoading] = useState(false);
  const [pendingSection, setPendingSection] = useState<LibrarySection>("shared");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = "/api/v1";

  const authHeaders = (): Record<string, string> | undefined => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return undefined;
      return { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` };
    } catch {
      return undefined;
    }
  };

  const fetchSection = async (section: LibrarySection): Promise<UploadedFile[]> => {
    const { category } = SECTIONS[section];
    const res = await fetch(`${API_BASE}/uploads/db?category=${category}&provider=any`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch LP Library documents");
    const data = await res.json();
    return (data?.files || []).map((f: any) => ({
      name: f.filename || f.public_id,
      url: f.url,
      public_id: f.public_id,
      resource_type: f.resource_type,
      size: f.bytes,
      createdAt: f.created_at,
    }));
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const [shared, adminOnly] = await Promise.all([
        fetchSection("shared"),
        fetchSection("adminOnly"),
      ]);
      setFiles({ shared, adminOnly });
    } catch (error) {
      console.error("Error fetching LP Library:", error);
      message.error("Failed to fetch LP Library documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const openPicker = (section: LibrarySection) => {
    setPendingSection(section);
    fileInputRef.current?.click();
  };

  const handleUpload = async (file: File, section: LibrarySection) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      message.error(`File size exceeds ${MAX_SIZE_MB} MB limit.`);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("category", SECTIONS[section].category);
      formData.append("files", file);

      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Upload failed");
      }
      message.success(`${file.name} uploaded to LP Library (${SECTIONS[section].title}).`);
      fetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
      message.error((error as Error)?.message || "Failed to upload file.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, pendingSection);
  };

  const confirmDelete = async (file: UploadedFile, section: LibrarySection) => {
    const result = await Swal.fire({
      title: "Delete Document?",
      text: `Are you sure you want to delete "${file.name}"? It will be removed from the LP Library (${SECTIONS[section].title}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const qs = new URLSearchParams({ public_id: file.public_id, provider: "r2" });
      if (file.resource_type) qs.set("resource_type", file.resource_type);
      const res = await fetch(`${API_BASE}/uploads?${qs.toString()}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Delete failed");
      }
      message.success("Deleted successfully.");
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      message.error((error as Error)?.message || "Failed to delete file.");
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section: LibrarySection) => {
    const cfg = SECTIONS[section];
    const list = files[section];
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{cfg.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.description}</p>
          </div>
          <button
            type="button"
            onClick={() => openPicker(section)}
            disabled={loading}
            className={`${
              section === "shared"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-900 hover:bg-slate-800"
            } active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer whitespace-nowrap disabled:opacity-60`}
          >
            {cfg.button}
          </button>
        </div>

        {list.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-white">
            No documents uploaded here yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((file, idx) => (
              <div
                key={file.public_id || idx}
                className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-slate-900 truncate max-w-sm sm:max-w-md" title={file.name}>
                    {file.name}
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[formatBytes(file.size), formatDate(file.createdAt) && `Uploaded ${formatDate(file.createdAt)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className={`border px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badgeClass}`}>
                    {cfg.badge}
                  </span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => confirmDelete(file, section)}
                    disabled={loading}
                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-5 px-3 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] flex flex-col select-none">
      <div className="w-full flex-1 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xl text-slate-900 space-y-6 relative flex flex-col">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl gap-3">
            <Spin size="large" />
            <span className="text-xs text-slate-600 font-medium tracking-wide">Processing request...</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileInputChange}
        />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 pb-5">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">LP Library</h1>
          <div className="text-xs text-slate-500 font-medium">
            {files.shared.length + files.adminOnly.length} documents · PDF, Word, PowerPoint, Excel or images · Max {MAX_SIZE_MB} MB
          </div>
        </div>

        <div data-tour="policy-view" className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {renderSection("shared")}
          {renderSection("adminOnly")}
        </div>
      </div>
    </div>
  );
};

export default LPLibraryAdmin;

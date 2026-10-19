"use client";

import React, { useEffect, useMemo, useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import {
  FileText,
  Search,
  RefreshCw,
  FolderArchive,
  FolderOpen,
  Users,
  UserCheck,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import {
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ExportOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  InboxOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { message, Modal } from "antd";
import moment from "moment";
import Swal from "sweetalert2";
import Link from "next/link";
import { useAuth } from "@/context/authContext";

interface ClientUploadItem {
  url: string;
  public_id: string;
  filename: string;
  bytes?: number;
  format?: string;
  created_at?: string;
  category?: string;
  docType?: string;
  note?: string;
  user?: {
    _id?: string;
    name?: string;
    displayName?: string;
    email?: string;
    photo?: string;
    license?: string;
  } | null;
}

const DOCUMENT_TYPES = [
  "All Types",
  "Signed Mandate Agreement",
  "Proof of Identity",
  "Proof of Address",
  "Payment Receipt",
  "Tax & Compliance",
  "Authorization",
  "Supporting Document",
];

const ClientVaultPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [uploads, setUploads] = useState<ClientUploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("All Types");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [previewDoc, setPreviewDoc] = useState<ClientUploadItem | null>(null);

  const API_BASE = "/api/v1";

  const fetchUploads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/uploads/db?category=client-documents`);
      if (!res.ok) throw new Error("Failed to fetch client submissions");
      const data = await res.json();
      setUploads(data.files || []);
    } catch (err: any) {
      console.error("Error loading client vault documents:", err);
      message.error("Could not load client documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // Compute unique client options for filter
  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    uploads.forEach((item) => {
      if (item.user && item.user._id) {
        const label = item.user.displayName || item.user.name || item.user.email || "Unknown Client";
        map.set(item.user._id, label);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [uploads]);

  // Filtered uploads
  const filteredUploads = useMemo(() => {
    return uploads.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const clientName = (item.user?.displayName || item.user?.name || "").toLowerCase();
      const clientEmail = (item.user?.email || "").toLowerCase();
      const fileName = (item.filename || item.public_id || "").toLowerCase();
      const note = (item.note || "").toLowerCase();
      const type = (item.docType || "Supporting Document").toLowerCase();

      const matchesSearch =
        !q ||
        clientName.includes(q) ||
        clientEmail.includes(q) ||
        fileName.includes(q) ||
        note.includes(q) ||
        type.includes(q);

      const matchesType =
        selectedDocType === "All Types" ||
        (item.docType || "").toLowerCase() === selectedDocType.toLowerCase();

      const matchesUser =
        selectedUserFilter === "all" ||
        (item.user && item.user._id === selectedUserFilter);

      return matchesSearch && matchesType && matchesUser;
    });
  }, [uploads, searchTerm, selectedDocType, selectedUserFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = uploads.length;
    const signedAgreements = uploads.filter(
      (u) => (u.docType || "").toLowerCase().includes("mandate") || (u.docType || "").toLowerCase().includes("signed")
    ).length;
    const identityDocs = uploads.filter(
      (u) =>
        (u.docType || "").toLowerCase().includes("identity") ||
        (u.docType || "").toLowerCase().includes("address") ||
        (u.docType || "").toLowerCase().includes("passport")
    ).length;
    const receipts = uploads.filter(
      (u) => (u.docType || "").toLowerCase().includes("receipt") || (u.docType || "").toLowerCase().includes("payment")
    ).length;
    const uniqueClients = new Set(uploads.map((u) => u.user?._id).filter(Boolean)).size;

    return { total, signedAgreements, identityDocs, receipts, uniqueClients };
  }, [uploads]);

  const handleDelete = async (doc: ClientUploadItem) => {
    const result = await Swal.fire({
      title: "Delete Document?",
      text: `Are you sure you want to permanently remove "${doc.filename}" from the client vault?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          key: doc.public_id,
          provider: "r2",
          resource_type: "raw",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete document from storage.");
      }

      message.success("Document removed successfully.");
      setUploads((prev) => prev.filter((d) => d.public_id !== doc.public_id));
      if (previewDoc?.public_id === doc.public_id) {
        setPreviewDoc(null);
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      message.error(err?.message || "Failed to delete document.");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "Unknown size";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDocTypeBadge = (type?: string) => {
    const t = type || "Supporting Document";
    const lower = t.toLowerCase();
    if (lower.includes("signed") || lower.includes("agreement")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <SafetyCertificateOutlined className="text-emerald-600" />
          {t}
        </span>
      );
    }
    if (lower.includes("identity") || lower.includes("passport") || lower.includes("address")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <UserOutlined className="text-sky-600" />
          {t}
        </span>
      );
    }
    if (lower.includes("receipt") || lower.includes("payment")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <FilePdfOutlined className="text-amber-600" />
          {t}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <FileTextOutlined className="text-slate-600" />
        {t}
      </span>
    );
  };

  const getFileIcon = (filename: string, format?: string) => {
    const ext = (format || filename?.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") {
      return <FilePdfOutlined className="text-rose-500 text-lg" />;
    }
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      return <FileImageOutlined className="text-sky-500 text-lg" />;
    }
    return <FileTextOutlined className="text-emerald-600 text-lg" />;
  };

  return (
    <Wrapper>
      <div className="py-6 select-none max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 backdrop-blur-xs">
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Administrative Compliance & Document Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Client Document Vault
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
              Live repository of signed mandate agreements, identity records, payment receipts, and client filings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchUploads}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all border border-white/20 backdrop-blur-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Vault</span>
            </button>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/30"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clients Directory</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Uploads</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FolderArchive className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
            <span className="text-[11px] text-slate-500 font-medium">All archived files</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Signed Mandates</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <SafetyCertificateOutlined className="text-emerald-700" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">{stats.signedAgreements}</p>
            <span className="text-[11px] text-slate-500 font-medium">Executed contracts</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Identity & KYC</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <UserOutlined className="text-sky-700" />
              </div>
            </div>
            <p className="text-2xl font-black text-sky-700 mt-2">{stats.identityDocs}</p>
            <span className="text-[11px] text-slate-500 font-medium">ID & residential proofs</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Proofs</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileTextOutlined className="text-amber-700" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">{stats.receipts}</p>
            <span className="text-[11px] text-slate-500 font-medium">Wire & bank slips</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Clients</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-700 mt-2">{stats.uniqueClients}</p>
            <span className="text-[11px] text-slate-500 font-medium">With submitted files</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-md mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client name, email, file name, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Document Type Filter */}
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Client Filter */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">All Clients</option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "table" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Table or Grid */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading client submissions...</p>
              <p className="text-xs text-slate-400 mt-1">Fetching records from encrypted storage</p>
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="p-16 text-center">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No documents found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchTerm || selectedDocType !== "All Types" || selectedUserFilter !== "all"
                  ? "No client uploads matched your search or filter parameters. Try clearing your filters."
                  : "No client documents have been submitted to the vault yet. Uploaded files will appear here immediately."}
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">Client</th>
                    <th className="py-3.5 px-4">Document Details</th>
                    <th className="py-3.5 px-4">Type & Classification</th>
                    <th className="py-3.5 px-4">Size & Format</th>
                    <th className="py-3.5 px-4">Uploaded</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUploads.map((item, idx) => {
                    const client = item.user;
                    const clientName = client?.displayName || client?.name || "Direct Client";
                    const clientEmail = client?.email || "No email";
                    const clientInitials = clientName
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr key={item.public_id || idx} className="hover:bg-slate-50/70 transition-colors">
                        {/* Client Identity */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            {client?.photo ? (
                              <img
                                src={client.photo}
                                alt={clientName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-200">
                                {clientInitials || "CL"}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{clientName}</p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{clientEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Document Name & Note */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5 max-w-xs sm:max-w-md">
                            <div className="mt-0.5">{getFileIcon(item.filename, item.format)}</div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate" title={item.filename}>
                                {item.filename || item.public_id}
                              </p>
                              {item.note && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5 truncate" title={item.note}>
                                  "{item.note}"
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Doc Type Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getDocTypeBadge(item.docType)}
                        </td>

                        {/* File Size & Format */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-medium text-slate-700">{formatFileSize(item.bytes)}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 ml-1.5 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.format || (item.filename || "").split(".").pop() || "raw"}
                          </span>
                        </td>

                        {/* Upload Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-700 font-medium">
                            {item.created_at ? moment(item.created_at).format("MMM D, YYYY") : "Recently"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.created_at ? moment(item.created_at).fromNow() : ""}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Preview Document"
                            >
                              <EyeOutlined className="text-sm" />
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors inline-flex items-center"
                              title="Open / Download"
                            >
                              <DownloadOutlined className="text-sm" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Submission"
                            >
                              <DeleteOutlined className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid Card View */
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUploads.map((item, idx) => {
                const client = item.user;
                const clientName = client?.displayName || client?.name || "Direct Client";
                const clientEmail = client?.email || "No email";
                const clientInitials = clientName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={item.public_id || idx}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top: Client Identity */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {client?.photo ? (
                            <img
                              src={client.photo}
                              alt={clientName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {clientInitials || "CL"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{clientName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{clientEmail}</p>
                          </div>
                        </div>
                        {getDocTypeBadge(item.docType)}
                      </div>

                      {/* Middle: File details */}
                      <div className="py-3 flex items-start gap-2.5">
                        <div className="mt-1">{getFileIcon(item.filename, item.format)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-slate-800 break-words" title={item.filename}>
                            {item.filename || item.public_id}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>{formatFileSize(item.bytes)}</span>
                            <span>•</span>
                            <span>{item.created_at ? moment(item.created_at).format("MMM D, YYYY") : "Recent"}</span>
                          </div>
                          {item.note && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic mt-2">
                              "{item.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(item)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <EyeOutlined />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <DownloadOutlined />
                          <span>Open</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* In-Browser Preview Modal */}
        <Modal
          open={!!previewDoc}
          onCancel={() => setPreviewDoc(null)}
          footer={null}
          width={880}
          title={
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2 truncate">
                {previewDoc && getFileIcon(previewDoc.filename, previewDoc.format)}
                <span className="truncate font-bold text-sm text-slate-900">
                  {previewDoc?.filename}
                </span>
              </div>
              {previewDoc && getDocTypeBadge(previewDoc.docType)}
            </div>
          }
        >
          {previewDoc && (
            <div className="mt-4">
              {/* Client summary pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <UserOutlined className="text-slate-400 text-sm" />
                  <div>
                    <span className="font-bold text-slate-800">
                      {previewDoc.user?.displayName || previewDoc.user?.name || "Client"}
                    </span>
                    <span className="text-slate-500 ml-2">({previewDoc.user?.email || "No email"})</span>
                  </div>
                </div>
                <div className="text-slate-500">
                  {previewDoc.created_at ? moment(previewDoc.created_at).format("LLL") : ""}
                </div>
              </div>

              {previewDoc.note && (
                <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold mr-1">Client Note:</span>
                  {previewDoc.note}
                </div>
              )}

              {/* Embedded Document Preview */}
              <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                {["png", "jpg", "jpeg", "webp", "gif"].includes(
                  (previewDoc.format || previewDoc.filename.split(".").pop() || "").toLowerCase()
                ) ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.filename}
                    className="max-h-full max-w-full object-contain mx-auto"
                  />
                ) : (previewDoc.format || previewDoc.filename.split(".").pop() || "").toLowerCase() === "pdf" ? (
                  <iframe
                    src={`${previewDoc.url}#toolbar=1`}
                    className="w-full h-full border-0"
                    title={previewDoc.filename}
                  />
                ) : (
                  <div className="text-center text-white p-8">
                    <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                    <p className="font-semibold text-sm">Preview not available for this file type</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">You can download or open the file directly in a new window.</p>
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <DownloadOutlined />
                      <span>Download File</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Size: {formatFileSize(previewDoc.bytes)}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExportOutlined />
                    <span>Open in New Tab</span>
                  </a>
                  <a
                    href={previewDoc.url}
                    download={previewDoc.filename}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <DownloadOutlined />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Wrapper>
  );
};

export default ClientVaultPage;

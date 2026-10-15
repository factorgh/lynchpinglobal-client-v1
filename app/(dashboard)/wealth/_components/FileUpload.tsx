import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button, Col, Form } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { File, FileVideo } from "lucide-react";

interface FileEntry {
  file?: File;
  previewUrl: string;
  uploaded?: boolean;
  mimeType?: string;
  name?: string;
}

interface FileUploadComponentProps {
  onFileUpload: (uploadedFiles: Record<string, string[]>) => void;
  initialFiles?: Record<string, string[]>;
}

const FILE_CATEGORIES = [
  "certificate",
  "partnerForm",
  "checklist",
  "mandate",
  "others",
] as const;

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  certificate: "Ledger",
  partnerForm: "Partner Form",
  checklist: "Checklist",
  mandate: "Mandate",
  others: "Others",
};

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileUpload,
  initialFiles,
}) => {
  const [fileCategories, setFileCategories] = useState<
    Record<string, FileEntry[]>
  >({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const API_BASE = "/api/v1";

  const getAuthToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const token = localStorage.getItem("token");
      return token
        ? token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`
        : null;
    } catch {
      return null;
    }
  }, []);

  const propagateToParent = (categories: Record<string, FileEntry[]>) => {
    const result: Record<string, string[]> = {};
    FILE_CATEGORIES.forEach((cat) => {
      result[cat] = (categories[cat] || [])
        .filter((f) => f.uploaded)
        .map((f) => f.previewUrl);
    });
    console.log("[FileUpload] propagateToParent result:", result);
    onFileUpload(result);
  };

  /** Initialize with pre-uploaded URLs (only when prop actually changes and is non-empty) */
  const prevInitialStrRef = useRef<string | null>(null);
  useEffect(() => {
    console.log("[FileUpload] initialFiles received:", initialFiles);
    const hasInitial = initialFiles && Object.keys(initialFiles).length > 0;
    const currStr = hasInitial ? JSON.stringify(initialFiles) : null;
    if (currStr === prevInitialStrRef.current) return;

    if (!hasInitial) {
      console.log("[FileUpload] No initial files or empty initialFiles");
      setFileCategories({});
      prevInitialStrRef.current = null;
      return;
    }

    const formatted = Object.entries(
      initialFiles as Record<string, string[]>
    ).reduce<Record<string, FileEntry[]>>((acc, [category, urls]) => {
      acc[category] = (urls || []).map((url) => ({
        previewUrl: url,
        uploaded: true,
        name: url.split("/").pop() || "",
      }));
      return acc;
    }, {});
    console.log("[FileUpload] formatted state set to fileCategories:", formatted);
    setFileCategories(formatted);
    propagateToParent(formatted);
    prevInitialStrRef.current = currStr;
  }, [initialFiles]);

  /** File validation and state update */
  const handleFileChange = (
    category: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter((file) => {
      const valid =
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type.startsWith("video/");
      if (!valid) toast.error("Only PDF, image, or video files are allowed.");
      return valid;
    });

    const newEntries = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      mimeType: file.type,
      name: file.name,
    }));

    setFileCategories((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ...newEntries],
    }));

    // Reset input to allow reselecting the same file
    e.target.value = "";
  };

  /** Delete file locally */
  const handleFileDelete = (category: string, index: number) => {
    setFileCategories((prev) => {
      const updated = [...(prev[category] || [])];
      updated.splice(index, 1);
      const nextCategories = { ...prev, [category]: updated };
      propagateToParent(nextCategories);
      return nextCategories;
    });
  };

  /** Upload to backend */
  const handleUpload = async (category: string) => {
    const entries = fileCategories[category] || [];
    const pending = entries.filter((f) => !f.uploaded && f.file);

    if (!pending.length) {
      toast.info(`No new files to upload for "${category}".`);
      return;
    }

    if (!API_BASE) {
      toast.error("Upload endpoint not configured.");
      return;
    }

    setUploading((prev) => ({ ...prev, [category]: true }));

    const formData = new FormData();
    formData.append("category", category);
    pending.forEach(({ file }) => file && formData.append("files", file));

    const token = getAuthToken();
    const headers: Record<string, string> = token
      ? { Authorization: token }
      : {};

    try {
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error((await res.text()) || "Upload failed");

      const data = await res.json();
      // Support both legacy { urls: [] } and new R2 { uploads: [] }
      const r2Urls: string[] = Array.isArray(data?.uploads)
        ? data.uploads.map((u: any) => u.url).filter(Boolean)
        : [];
      const legacyUrls: string[] = Array.isArray(data?.urls)
        ? data.urls.map((u: any) => u.secure_url || u.url).filter(Boolean)
        : [];
      const urls: string[] = [...r2Urls, ...legacyUrls];

      if (!urls.length) throw new Error("Server returned no URLs.");

      toast.success(`${category} uploaded successfully.`);

      setFileCategories((prev) => {
        const currentCategoryEntries = prev[category] || [];
        let urlIndex = 0;
        const updatedEntries = currentCategoryEntries.map((entry) => {
          if (!entry.uploaded && entry.file) {
            const remoteUrl = urls[urlIndex++];
            return {
              previewUrl: remoteUrl || entry.previewUrl,
              uploaded: true,
              mimeType: entry.mimeType,
              name: entry.name,
            };
          }
          return entry;
        });

        const nextCategories = {
          ...prev,
          [category]: updatedEntries,
        };

        propagateToParent(nextCategories);

        return nextCategories;
      });
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
      console.error(`[Upload Error - ${category}]`, err);
    } finally {
      setUploading((prev) => ({ ...prev, [category]: false }));
    }
  };

  /** File preview helper */
  const renderPreview = (url: string, mimeType?: string) => {
    const isPdf =
      mimeType?.toLowerCase() === "application/pdf" || /\.pdf($|\?)/i.test(url);
    const isImage =
      mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(url);
    const isVideo =
      mimeType?.startsWith("video/") || /\.(mp4|mov|avi|webm|ogg)$/i.test(url);

    if (isPdf) {
      // Inline PDF preview (works with blob: and Cloudinary URLs). Fallback link is kept.
      return (
        <div className="w-28 h-20 border rounded overflow-hidden bg-gray-50">
          <embed src={url} type="application/pdf" className="w-full h-full" />
        </div>
      );
    }
    if (isImage) {
      return (
        <img
          src={url}
          alt="preview"
          className="w-28 h-20 object-cover rounded border"
          loading="lazy"
        />
      );
    }
    if (isVideo) {
      return (
        <video
          src={url}
          className="w-28 h-20 object-cover rounded border"
          muted
          controls={false}
        />
      );
    }
    return <UploadOutlined />;
  };

  const CLIENT_CATEGORIES = ["mandate", "certificate", "others"] as const;
  const ADMIN_CATEGORIES = ["checklist", "partnerForm"] as const;

  const renderCategoryField = (category: string) => (
    <div key={category} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
      <Form.Item
        label={<span className="font-semibold text-xs text-slate-800">{CATEGORY_DISPLAY_NAMES[category] || category}</span>}
        className="mb-0"
      >
        <input
          type="file"
          accept="application/pdf,image/*,video/*"
          multiple
          onChange={(e) => handleFileChange(category, e)}
          className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer w-full"
        />

        <ul className="w-full mt-2.5 space-y-1.5">
          {(fileCategories[category] || []).map(
            ({ previewUrl, mimeType, name }, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:border-slate-200 text-xs"
              >
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0"
                >
                  {renderPreview(previewUrl, mimeType)}
                  <span className="truncate text-xs font-medium text-slate-700 max-w-[120px]">
                    {name || previewUrl.split("/").pop()}
                  </span>
                </a>
                <DeleteOutlined
                  className="text-red-500 cursor-pointer hover:text-red-600 p-1"
                  onClick={() => handleFileDelete(category, index)}
                />
              </li>
            )
          )}
        </ul>

        <Button
          className="mt-2.5 w-full text-xs font-medium"
          icon={<UploadOutlined />}
          type="dashed"
          size="small"
          onClick={() => handleUpload(category)}
          disabled={uploading[category]}
        >
          {uploading[category] ? "Uploading to Cloud..." : `Save ${CATEGORY_DISPLAY_NAMES[category]}`}
        </Button>
      </Form.Item>
    </div>
  );

  return (
    <div className="space-y-5 my-4">
      {/* 1. Client-Facing Documents Section */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/60">
          <div>
            <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
              Client Documents Section (Visible to Client)
            </h4>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              These documents are published directly to the client's portfolio vault
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
            Client Shared
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CLIENT_CATEGORIES.map(renderCategoryField)}
        </div>
      </div>

      {/* 2. Admin Documents Section */}
      <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200/60">
          <div>
            <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">
              Admin Documents Section (Confidential / Internal)
            </h4>
            <p className="text-[11px] text-amber-700/80 mt-0.5">
              Strictly internal due diligence checklists and partner contracts (hidden from client)
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800">
            Admin Only
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADMIN_CATEGORIES.map(renderCategoryField)}
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;

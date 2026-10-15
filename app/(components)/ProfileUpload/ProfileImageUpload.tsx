"use client";

import React, { useState, useRef, DragEvent } from "react";
import {
  UploadOutlined,
  DeleteOutlined,
  LoadingOutlined,
  CloudOutlined,
  CameraOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { toast } from "react-toastify";

interface ProfileImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  initialsFallback?: string;
  disabled?: boolean;
}

export default function ProfileImageUpload({
  value,
  onChange,
  label = "Profile Picture",
  initialsFallback = "CL",
  disabled = false,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP)");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB");
      return;
    }

    try {
      setIsUploading(true);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const formData = new FormData();
      formData.append("files", file);
      formData.append("category", "profiles");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed");
      }

      const data = await res.json();

      // Retrieve uploaded URL (R2 format or fallback)
      const uploadedUrl =
        data?.uploads?.[0]?.url ||
        data?.urls?.[0]?.secure_url ||
        data?.urls?.[0]?.url;

      if (!uploadedUrl) {
        throw new Error("No URL returned from R2 storage");
      }

      onChange(uploadedUrl);
      toast.success("Profile photo uploaded to Cloudflare R2");
    } catch (err: any) {
      console.error("[ProfileImageUpload] Error:", err);
      toast.error(err?.message || "Failed to upload photo to R2");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const triggerSelect = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayInitials = (initialsFallback || "CL")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "CL";

  return (
    <div className="space-y-2">
      {/* Label and R2 Storage Indicator */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50/90 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <CloudOutlined className="text-[11px]" />
            Cloudflare R2
          </span>
        </div>
      )}

      {/* Upload Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-200 overflow-hidden w-full max-w-full ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
            : "border-dashed border-slate-200 bg-gradient-to-b from-slate-50/60 to-white hover:border-slate-300 hover:bg-slate-50/80"
        }`}
      >
        {/* Strictly Hidden Native File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/png, image/jpeg, image/webp, image/gif"
          style={{ display: "none" }}
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled || isUploading}
        />

        {/* Interactive Avatar with Overlay and Camera Badge - Strictly Fixed 72x72px */}
        <div
          onClick={triggerSelect}
          role="button"
          tabIndex={0}
          title={value ? "Click to change photo" : "Click to upload photo"}
          style={{
            width: "72px",
            height: "72px",
            minWidth: "72px",
            minHeight: "72px",
            maxWidth: "72px",
            maxHeight: "72px",
          }}
          className={`relative rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md flex items-center justify-center cursor-pointer group transition-all duration-200 active:scale-95 ${
            value
              ? "bg-slate-100 ring-2 ring-slate-200/80"
              : "bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 ring-2 ring-emerald-500/30"
          }`}
        >
          {value ? (
            <img
              src={value}
              alt="Profile Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-white font-extrabold text-base tracking-wider select-none">
              {displayInitials}
            </span>
          )}

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
            <CameraOutlined className="text-sm text-white" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">
              {value ? "Change" : "Upload"}
            </span>
          </div>

          {/* Camera Icon Badge */}
          <div
            style={{ width: "22px", height: "22px" }}
            className="absolute bottom-0 right-0 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:bg-emerald-500 transition-colors pointer-events-none"
          >
            <CameraOutlined className="text-[9px]" />
          </div>

          {/* Uploading Spinner Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center text-white z-10">
              <LoadingOutlined className="text-base animate-spin" />
              <span className="text-[8px] font-bold mt-1">Uploading...</span>
            </div>
          )}
        </div>

        {/* Action Controls & Guidance */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={triggerSelect}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <UploadOutlined className="text-emerald-600 text-xs" />
              {value ? "Replace Photo" : "Upload Photo"}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <DeleteOutlined className="text-xs" />
                Remove
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Drag and drop or click avatar to upload.
            <span className="block text-slate-400 text-[10px]">
              JPG, PNG or WebP up to 5MB
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}


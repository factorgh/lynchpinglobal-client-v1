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

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileUpload,
  initialFiles,
}) => {
  const [fileCategories, setFileCategories] = useState<
    Record<string, FileEntry[]>
  >({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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

  /** Initialize with pre-uploaded URLs (only when prop actually changes and is non-empty) */
  const prevInitialStrRef = useRef<string | null>(null);
  useEffect(() => {
    const hasInitial = initialFiles && Object.keys(initialFiles).length > 0;
    const currStr = hasInitial ? JSON.stringify(initialFiles) : null;
    if (!currStr || currStr === prevInitialStrRef.current) return;

    const formatted = Object.entries(initialFiles as Record<string, string[]>).reduce<
      Record<string, FileEntry[]>
    >((acc, [category, urls]) => {
      acc[category] = urls.map((url) => ({ previewUrl: url, uploaded: true }));
      return acc;
    }, {});
    setFileCategories(formatted);
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
      return { ...prev, [category]: updated };
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
      const urls: string[] = (data?.urls || [])
        .map((u: any) => u.secure_url || u.url)
        .filter(Boolean);

      if (!urls.length) throw new Error("Server returned no URLs.");

      toast.success(`${category} uploaded successfully.`);
      onFileUpload({ [category]: urls });

      setFileCategories((prev) => ({
        ...prev,
        [category]: prev[category].map((f) => ({ ...f, uploaded: true })),
      }));
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
      console.error(`[Upload Error - ${category}]`, err);
    } finally {
      setUploading((prev) => ({ ...prev, [category]: false }));
    }
  };

  /** File preview helper */
  const renderPreview = (url: string, mimeType?: string) => {
    const isPdf = mimeType?.toLowerCase() === "application/pdf" || /\.pdf($|\?)/i.test(url);
    const isImage = mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(url);
    const isVideo = mimeType?.startsWith("video/") || /\.(mp4|mov|avi|webm|ogg)$/i.test(url);

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

  return (
    <div className="grid grid-cols-2 gap-4">
      {FILE_CATEGORIES.map((category) => (
        <Col key={category} span={6}>
          <Form.Item
            label={`Upload ${category[0].toUpperCase()}${category.slice(1)}`}
          >
            <input
              type="file"
              accept="application/pdf,image/*,video/*"
              multiple
              onChange={(e) => handleFileChange(category, e)}
            />

            <ul className="w-60 mt-3 space-y-1">
              {(fileCategories[category] || []).map(({ previewUrl, mimeType, name }, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 rounded-md border border-gray-200 hover:border-gray-300"
                >
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    {renderPreview(previewUrl, mimeType)}
                    <span className="truncate text-sm text-gray-700 max-w-[140px]">
                      {name || previewUrl.split("/").pop()}
                    </span>
                  </a>
                  <DeleteOutlined
                    className="text-red-500 cursor-pointer hover:text-red-600"
                    onClick={() => handleFileDelete(category, index)}
                  />
                </li>
              ))}
            </ul>

            <Button
              className="mt-2"
              icon={<UploadOutlined />}
              type="dashed"
              onClick={() => handleUpload(category)}
              disabled={uploading[category]}
            >
              {uploading[category] ? "Uploading..." : "Upload"}
            </Button>
          </Form.Item>
        </Col>
      ))}
    </div>
  );
};

export default FileUploadComponent;

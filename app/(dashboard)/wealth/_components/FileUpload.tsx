import { useEffect, useState } from "react";
import { Button, Col, Form } from "antd";
import { toast } from "react-toastify";
import { UploadOutlined } from "@ant-design/icons";

const categories = [
  "certificate",
  "partnerForm",
  "checklist",
  "mandate",
  "others",
];

interface FileUploadComponentProps {
  onFileUpload: (uploadedFiles: { [key: string]: string[] }) => void;
  initialFiles?: { [key: string]: string[] };
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileUpload,
  initialFiles = {},
}) => {
  const [fileCategories, setFileCategories] = useState<{
    [key: string]: { file?: File; previewUrl: string; uploaded?: boolean }[];
  }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
  const getToken = () => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem("token") : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const formattedFiles = Object.keys(initialFiles).reduce((acc, category) => {
      acc[category] = initialFiles[category].map((url) => ({
        previewUrl: url,
        uploaded: true,
      }));
      return acc;
    }, {} as { [key: string]: { previewUrl: string; uploaded: boolean }[] });
    setFileCategories(formattedFiles);
  }, [initialFiles]);

  const handleFileChange = (
    category: string,
    event: React.ChangeEvent<HTMLInputElement> | null
  ) => {
    if (!event?.target.files) return;
    const files = Array.from(event.target.files).filter((file) => {
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isPdf && !isImage && !isVideo) {
        toast.error("Only PDF, image, or video files are allowed.");
        return false;
      }
      return true;
    });

    const fileObjects = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setFileCategories((prev) => ({ ...prev, [category]: [...(prev[category] || []), ...fileObjects] }));
  };

  const handleFileDelete = (category: string, index: number) => {
    setFileCategories((prev) => {
      const updatedFiles = [...(prev[category] || [])];
      updatedFiles.splice(index, 1);
      return { ...prev, [category]: updatedFiles };
    });
  };

  const handleUpload = async (category: string) => {
    const entries = fileCategories[category] || [];
    if (!entries.some(({ file }) => !!file)) {
      toast.error(`No new files to upload for ${category}`);
      return;
    }

    setUploading((prev) => ({ ...prev, [category]: true }));
    try {
      const formData = new FormData();
      formData.append("category", category);
      for (const { file } of entries) {
        if (file) formData.append("files", file);
      }
      const token = getToken();
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: token } : undefined,
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const urls: string[] = (data?.urls || []).map((u: any) => u.secure_url || u.url).filter(Boolean);

      toast.success(`${category} uploaded successfully!`);
      onFileUpload({ [category]: urls });

      setFileCategories((prev) => ({
        ...prev,
        [category]: prev[category].map((fileObj) => ({ ...fileObj, uploaded: true })),
      }));
    } catch (error) {
      toast.error("Upload failed. Try again.");
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [category]: false }));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {categories.map((category) => (
        <Col key={category} span={6}>
          <Form.Item
            label={`Upload ${category.charAt(0).toUpperCase()}${category.slice(1)}`}
          >
            <input
              type="file"
              accept="application/pdf,image/*,video/*"
              onChange={(e) => handleFileChange(category, e)}
              multiple
            />

            <ul className="w-60 mt-3">
              {(fileCategories[category] || []).map(({ previewUrl, uploaded }, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 rounded-md border border-gray-200 hover:border-gray-300 cursor-pointer"
                >
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <img height={30} width={100} src="/pdf-icon.png" alt="PDF Preview" />
                  </a>
                 
                    <span
                      className="cursor-pointer text-red-500"
                      onClick={() => handleFileDelete(category, index)}
                    >
                      ❌
                    </span>
                  
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

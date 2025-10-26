"use client";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, List, Upload, message } from "antd";
import { useEffect, useState } from "react";

const ConditionsUploader = () => {
  const [files, setFiles] = useState<any[]>([]); // List of files from Cloudinary
  const [loading, setLoading] = useState(false);
  console.log(files);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
  const getToken = () => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem("token") : null;
    } catch {
      return null;
    }
  };

  // Fetch all terms and conditions from Firebase on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/uploads/list?category=conditions`);
      if (!res.ok) throw new Error("Failed to fetch terms");
      const data = await res.json();
      const mapped = (data?.files || []).map((f: any) => ({
        name: f.filename || f.public_id,
        url: f.url,
        public_id: f.public_id,
      }));
      setFiles(mapped);
    } catch (error) {
      console.error("Error fetching files:", error);
      message.error("Failed to fetch terms and conditions.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: any) => {
    try {
      const isPdf = file.type === "application/pdf";
      if (!isPdf) {
        message.error("You can only upload PDF files.");
        return false;
      }
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
    }
    return false;
  };

  const handleDelete = async (public_id: string) => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/uploads?public_id=${encodeURIComponent(public_id)}`, {
        method: "DELETE",
        headers: token ? { Authorization: token } : undefined,
      });
      if (!res.ok) throw new Error("Delete failed");
      message.success(`Deleted successfully.`);
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      message.error("Failed to delete file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
      <h2>Terms and Conditions Uploader</h2>

      {/* Upload Button */}
      <Upload
        beforeUpload={(file) => {
          const isPdf = file.type === "application/pdf";
          if (!isPdf) {
            message.error("You can only upload PDF files.");
          }
          return isPdf || Upload.LIST_IGNORE;
        }}
        customRequest={({ file }) => handleUpload(file)} // Use custom upload handler
        showUploadList={false} // Hide default file list
      >
        <Button type="primary" loading={loading} data-tour="acknowledge">
          Upload Terms & Conditions
        </Button>
      </Upload>

      {/* List of Uploaded Files */}
      <h3 style={{ marginTop: "20px" }}>Uploaded Files:</h3>
      {!loading && files.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
          <img
            src="/empty-doc.svg"
            alt="No terms and conditions found"
            style={{ maxWidth: "320px", width: "100%", height: "auto", opacity: 0.85 }}
          />
        </div>
      ) : (
        <List
          loading={loading}
          bordered
          dataSource={files}
          data-tour="policy-view"
          renderItem={(file: any) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(file.public_id)}
                >
                  Delete
                </Button>,
              ]}
            >
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name}
              </a>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default ConditionsUploader;

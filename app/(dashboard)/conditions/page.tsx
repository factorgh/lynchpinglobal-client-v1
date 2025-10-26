"use client";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, List, Upload, message, Typography, Card, Space, Empty, Popconfirm } from "antd";
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
      // DB-first fetch (authoritative)
      const dbRes = await fetch(`${API_BASE}/uploads/db?category=conditions&provider=any`);
      if (!dbRes.ok) throw new Error("Failed to fetch terms");
      const dbData = await dbRes.json();
      let items = (dbData?.files || []).map((f: any) => ({
        name: f.filename || f.public_id,
        url: f.url,
        public_id: f.public_id,
        resource_type: f.resource_type,
        size: f.bytes,
      }));

      // Fallback to direct R2 listing if DB returns empty
      if (items.length === 0) {
        const r2Res = await fetch(`${API_BASE}/uploads/list?category=conditions&provider=r2`);
        if (r2Res.ok) {
          const r2Data = await r2Res.json();
          items = (r2Data?.files || []).map((f: any) => ({
            name: f.filename || f.public_id,
            url: f.url,
            public_id: f.public_id,
            resource_type: f.resource_type,
            size: f.bytes,
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
    <div style={{ maxWidth: 940, margin: "0 auto", padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Terms and Conditions
          </Typography.Title>
          <Typography.Text type="secondary">
            Upload and manage your Terms & Conditions documents (PDF only).
          </Typography.Text>
        </div>

        <Card>
          <Upload.Dragger
            multiple={false}
            accept="application/pdf"
            beforeUpload={(file) => {
              const isPdf = file.type === "application/pdf";
              if (!isPdf) message.error("You can only upload PDF files.");
              return isPdf || Upload.LIST_IGNORE;
            }}
            customRequest={({ file }) => handleUpload(file)}
            showUploadList={false}
            disabled={loading}
          >
            <p style={{ marginBottom: 8 }}>
              <Typography.Text strong>Drag & drop a PDF here</Typography.Text>
            </p>
            <Typography.Text type="secondary">
              or click to browse and upload
            </Typography.Text>
          </Upload.Dragger>
        </Card>

        <Card title="Uploaded Files" bodyStyle={{ paddingTop: 0 }}>
          {!loading && files.length === 0 ? (
            <Empty
              image={
                <img
                  src="/empty-doc.svg"
                  alt="No terms and conditions found"
                  style={{ maxWidth: 200, opacity: 0.9 }}
                />
              }
              description={<span>No files yet</span>}
            />
          ) : (
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={files}
              data-tour="policy-view"
              renderItem={(file: any) => (
                <List.Item
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Delete file"
                      description={`Delete “${file.name}”?`}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDelete(file.public_id, file.resource_type)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        Delete
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        {file.name}
                      </a>
                    }
                    description={formatBytes(file.size)}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default ConditionsUploader;

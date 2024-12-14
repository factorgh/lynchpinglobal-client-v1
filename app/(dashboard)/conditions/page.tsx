"use client";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, List, Upload, message } from "antd";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import { storage } from "../../../firebase/firebaseConfig"; // Import Firebase Storage

const ConditionsUploader = () => {
  const [files, setFiles] = useState([]); // List of files from Firebase
  const [loading, setLoading] = useState(false);

  // Fetch all terms and conditions from Firebase on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const termsRef = ref(storage, "terms"); // Reference to the "terms" folder
      const response = await listAll(termsRef); // List all files in the folder

      const fileUrls: any = await Promise.all(
        response.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url }; // Return file name and URL
        })
      );

      setFiles(fileUrls); // Update state with fetched files
    } catch (error) {
      console.error("Error fetching files:", error);
      message.error("Failed to fetch terms and conditions.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: any) => {
    const termsRef = ref(storage, `terms/${file.name}`); // Reference to upload location

    try {
      setLoading(true);
      await uploadBytes(termsRef, file); // Upload file to Firebase
      message.success(`${file.name} uploaded successfully.`);
      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Failed to upload file.");
    } finally {
      setLoading(false);
    }

    // Prevent default upload behavior
    return false;
  };

  const handleDelete = async (fileName: any) => {
    const fileRef = ref(storage, `terms/${fileName}`); // Reference to the file

    try {
      setLoading(true);
      await deleteObject(fileRef); // Delete file from Firebase
      message.success(`${fileName} deleted successfully.`);
      fetchFiles(); // Refresh file list
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
        <Button type="primary" loading={loading}>
          Upload Terms & Conditions
        </Button>
      </Upload>

      {/* List of Uploaded Files */}
      <h3 style={{ marginTop: "20px" }}>Uploaded Files:</h3>
      <List
        loading={loading}
        bordered
        dataSource={files}
        renderItem={(file: any) => (
          <List.Item
            actions={[
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(file.name)}
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
    </div>
  );
};

export default ConditionsUploader;

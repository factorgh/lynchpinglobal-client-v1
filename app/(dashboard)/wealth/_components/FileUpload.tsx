import { useEffect, useState } from "react";
import { Button, Col, Form } from "antd";
import { toast } from "react-toastify";
import { storage } from "../../../../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { UploadOutlined } from "@ant-design/icons";
import Image from "next/image";

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
    [key: string]: { file: File; previewUrl: string }[];
  }>({});

  console.log(initialFiles);
  useEffect(() => {
    const formattedFiles: any = Object.keys(initialFiles).reduce(
      (acc, category) => {
        acc[category] = initialFiles[category].map((url) => ({
          previewUrl: url,
          uploaded: true, // Mark these as already uploaded
        }));
        return acc;
      },
      {} as { [key: string]: { previewUrl: string; uploaded: boolean }[] }
    );

    setFileCategories(formattedFiles);
  }, [initialFiles]);

  const handleFileChange = (
    category: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter((file) => {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed.");
        return false;
      }
      return true;
    });

    const fileObjects = newFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setFileCategories((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ...fileObjects],
    }));
  };

  const handleFileDelete = (category: string, index: number) => {
    setFileCategories((prev) => {
      const updatedFiles = [...(prev[category] || [])];
      updatedFiles.splice(index, 1);
      return { ...prev, [category]: updatedFiles };
    });
  };

  const handleUpload = async (category: string) => {
    if (!fileCategories[category] || fileCategories[category].length === 0) {
      toast.error(`No files to upload for ${category}`);
      return;
    }

    try {
      const uploadPromises = fileCategories[category].map(async ({ file }) => {
        const storageRef = ref(storage, `uploads/${category}/${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });

      const urls = await Promise.all(uploadPromises);
      toast.success(`${category} uploaded successfully!`);

      // Send uploaded URLs to the parent component
      onFileUpload({ [category]: urls });

      console.log("Uploaded Files:", urls);
    } catch (error) {
      toast.error("Upload failed. Try again.");
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {categories.map((category) => (
        <Col key={category} span={6}>
          <Form.Item
            label={`Upload ${category.charAt(0).toUpperCase()}${category.slice(
              1
            )}`}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(category, e)}
              multiple
            />

            <ul>
              {(fileCategories[category] || []).map(
                ({ file, previewUrl }, index) => (
                  <li
                    key={index}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    {file ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.name}
                      </a>
                    ) : (
                      <img
                        height={100}
                        width={100}
                        src={previewUrl}
                        alt="Preview"
                      />
                    )}
                    <Button
                      type="link"
                      danger
                      onClick={() => handleFileDelete(category, index)}
                    >
                      ❌
                    </Button>
                  </li>
                )
              )}
            </ul>

            <Button
              className="mt-2"
              icon={<UploadOutlined />}
              type="dashed"
              onClick={() => handleUpload(category)}
            >
              Upload
            </Button>
          </Form.Item>
        </Col>
      ))}
    </div>
  );
};

export default FileUploadComponent;

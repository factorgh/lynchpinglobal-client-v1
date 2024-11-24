import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { Button, message, Upload } from "antd";
import React, { useState } from "react";

type BulkFileUploadProps = {
  onFileListChange: (fileList: UploadFile[]) => void; // Callback prop to send file list
};

const BulkFileUpload: React.FC<BulkFileUploadProps> = ({
  onFileListChange,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList); // Update local state
    onFileListChange(newFileList); // Pass the updated list to the parent
  };

  const beforeUpload = (file: File) => {
    const isPdfOrImage =
      file.type === "application/pdf" || file.type.startsWith("image/");

    if (!isPdfOrImage) {
      message.error("You can only upload PDF or image files!");
      return Upload.LIST_IGNORE; // Prevent invalid files from being added
    }

    const isSmallEnough = file.size / 1024 / 1024 < 5; // Max size 5MB
    if (!isSmallEnough) {
      message.error("File must be smaller than 5MB!");
      return Upload.LIST_IGNORE; // Prevent oversized files
    }

    return true; // Allow valid files
  };

  const uploadButton = (
    <Button icon={<PlusOutlined />} type="dashed">
      Upload
    </Button>
  );

  return (
    <Upload
      //   action={null} // Set to null to handle uploads manually
      listType="text"
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={beforeUpload}
      accept="application/pdf,image/*"
    >
      {uploadButton}
    </Upload>
  );
};

export default BulkFileUpload;

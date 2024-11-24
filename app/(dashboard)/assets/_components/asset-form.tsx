"use client";

import BulkImage from "@/app/(components)/bulkImage";
import { useCreateAssetsMutation } from "@/services/assets";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Upload,
  UploadProps,
} from "antd";
import React, { useState } from "react";
import { toast } from "react-toastify";
const AssetForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createAssets, { isLoading }] = useCreateAssetsMutation();

  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  // File list change handler
  const handleFileListChange = (fileList: any[]) => {
    setSelectedFiles(fileList);
  };

  // Function to upload files to Cloudinary
  const handleUploadToCloudinary = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected for upload.");
      return [];
    }

    const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dzvwqvww2/upload";
    const uploadPreset = "burchells";

    try {
      // Upload all files concurrently
      const uploadPromises = selectedFiles.map((file) => {
        const formData = new FormData();
        formData.append("file", file.originFileObj);
        formData.append("upload_preset", uploadPreset);

        return fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to upload file: ${file.name}`);
          return res.json();
        });
      });

      const uploadResults = await Promise.all(uploadPromises);

      const uploadedUrls = uploadResults.map((result) => result.secure_url);

      toast.success("All files uploaded successfully!");
      return uploadedUrls;
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("File upload failed.");
      return [];
    }
  };

  // Form submission handler
  const handleFormSubmit = async (values: any) => {
    // Upload files and get URLs
    const uploadedUrls = await handleUploadToCloudinary();

    // Format form values with uploaded URLs
    const formattedValues = {
      ...values,
      pdf: uploadedUrls,
    };

    try {
      await createAssets(formattedValues).unwrap();
      toast.success("Investment created successfully");
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating investment:", error);
      toast.error(error?.data?.message || error.message || "An error occurred");
    }
  };

  // Upload props
  const props: UploadProps = {
    name: "file",
    action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  // Show drawer
  const showDrawer = () => setOpen(true);

  // Close drawer
  const onClose = () => setOpen(false);

  return (
    <>
      <Button type="primary" onClick={showDrawer} icon={<PlusOutlined />}>
        New Asset
      </Button>
      <Drawer
        title="Create a New Asset"
        width={720}
        onClose={onClose}
        open={open}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          hideRequiredMark
        >
          <Row gutter={16}>
            {/* User Selection */}
            <Col span={12}>
              <Form.Item
                name="asset_class"
                label="Asset Class"
                rules={[
                  { required: true, message: "Please enter the principal" },
                ]}
              >
                <Input
                  placeholder="Enter asset class"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            {/* Principal */}
            <Col span={12}>
              <Form.Item
                name="asset_designation"
                label="Asset Designation"
                rules={[
                  {
                    required: true,
                    message: "Please enter the asset designation",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter asset designation"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Performance Yield */}
            <Col span={12}>
              <Form.Item
                name="accrued_interest"
                label="Accrued Interest"
                rules={[
                  {
                    required: true,
                    message: "Please enter the accrued interest",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter accrued interest"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            {/* Guaranteed Rate */}

            <Col span={12}>
              <Form.Item
                name="maturity_date"
                label="Maturity Date"
                rules={[
                  { required: true, message: "Please select a maturity date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Management Fee */}
            <Col span={12}>
              <Form.Item
                name="managementFee"
                label="Management Fee"
                rules={[
                  { required: true, message: "Please select a management fee" },
                ]}
              >
                <Select
                  placeholder="Select management fee"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={Array.from({ length: 100 }, (_, i) => ({
                    value: i + 1,
                    label: `${i + 1}%`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quarter"
                label="Quater"
                rules={[{ required: true, message: "Please select a quater" }]}
              >
                <Select
                  placeholder="Select management fee"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={["Q1", "Q2", "Q3", "Q4"].map((quater) => ({
                    value: quater,
                    label: quater,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="asset_class"
                label="Asset Class"
                rules={[
                  { required: true, message: "Please enter the principal" },
                ]}
              >
                <InputNumber
                  placeholder="Enter asset class"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="asset_designation"
                label="Asset Image"
                rules={[
                  {
                    required: true,
                    message: "Please enter the asset designation",
                  },
                ]}
              >
                <Upload {...props}>
                  <Button icon={<UploadOutlined />}>
                    Click to Upload Asset Image
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            {/* File Upload */}
            <BulkImage onFileListChange={handleFileListChange} />
          </Row>

          <Form.Item>
            <Button
              className="w-full mt-6"
              type="primary"
              htmlType="submit"
              loading={isLoading}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default AssetForm;

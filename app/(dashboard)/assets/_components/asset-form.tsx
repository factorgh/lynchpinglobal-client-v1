"use client";

import { useCreateAssetsMutation } from "@/services/assets";
import { useGetUsersQuery } from "@/services/auth";
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

import axios from "axios"; // We need axios to handle the file upload to backend
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AssetForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createAssets, { isLoading }] = useCreateAssetsMutation();
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [fileCategories, setFileCategories] = useState<any>({
    certificate: [],
    partnerForm: [],
    checklist: [],
    mandate: [],
    others: [],
  });
  const [uploading, setUploading] = useState({
    certificate: false,
    partnerForm: false,
    checklist: false,
    mandate: false,
  });

  const { data } = useGetUsersQuery(null);

  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  const handleFileChange = (category: string, fileList: any[]) => {
    setFileCategories((prev: any) => ({
      ...prev,
      [category]: fileList,
    }));
  };

  const handleFileUpload = async (
    category: string,
    files: any[]
  ): Promise<string[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file.originFileObj);
      });
      formData.append("category", category); // Indicating the file category

      // Send files to the backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        return response.data.urls; // List of URLs returned from S3
      } else {
        throw new Error("Failed to upload files");
      }
    } catch (error) {
      console.error("File upload error:", error);
      message.error("Error uploading files");
      return [];
    }
  };

  const handleFormSubmit = async (values: any) => {
    const uploadedFiles: Record<string, string[]> = {};
    setUploading({
      certificate: true,
      partnerForm: true,
      checklist: true,
      mandate: true,
    });

    for (const category in fileCategories) {
      if (fileCategories[category].length > 0) {
        uploadedFiles[category] = await handleFileUpload(
          category,
          fileCategories[category]
        );
      }
    }

    const formattedValues = {
      ...values,
      certificate: uploadedFiles.certificate || [],
      mandate: uploadedFiles.mandate || [],
      partnerForm: uploadedFiles.partnerForm || [],
      checklist: uploadedFiles.checklist || [],
      others: uploadedFiles.others || [],
    };
    setUploading({
      certificate: false,
      partnerForm: false,
      checklist: false,
      mandate: false,
    });

    try {
      await createAssets(formattedValues).unwrap();
      toast.success("Asset created successfully");
      setOpen(false);
    } catch (error: any) {
      setUploading({
        certificate: false,
        partnerForm: false,
        checklist: false,
        mandate: false,
      });
      toast.error(
        "Error creating asset: " + (error?.data?.message || error.message)
      );
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <>
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        icon={<PlusOutlined />}
      >
        New Asset
      </Button>
      <Drawer
        title="Create a New Asset"
        width={720}
        onClose={() => setOpen(false)}
        open={open}
      >
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          {/* Other fields */}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="user"
                label="User"
                rules={[{ required: true, message: "Please select a user" }]}
              >
                <Select
                  placeholder="Select a user"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={users?.map((user: any) => ({
                    value: user._id,
                    label: user.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="assetName"
                label="Asset Name"
                rules={[
                  { required: true, message: "Please enter the asset name" },
                ]}
              >
                <Input
                  placeholder="Enter principal"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            {/* User Selection */}
            <Col span={12}>
              <Form.Item
                name="assetClass"
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
                name="assetDesignation"
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
                name="accruedInterest"
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
                name="maturityDate"
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
                    // label: ${i + 1}%,
                    label: `${i + 1}%`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quater"
                label="Quarter"
                rules={[{ required: true, message: "Please select a quater" }]}
              >
                <Select
                  placeholder="Select a quarter"
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
                name="timeCourse"
                label="Time course"
                rules={[
                  { required: true, message: "Please select a time course" },
                ]}
              >
                <Select
                  placeholder="Select a time course"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    "Weekly",
                    "Monthly",
                    "Quarterly",
                    "Biannually",
                    "Annually",
                  ].map((quater) => ({
                    value: quater,
                    label: quater,
                  }))}
                />
              </Form.Item>
            </Col>
            {/* <Col span={12}>
              <Form.Item
                name="assetImage"
                label="Asset Image"
                rules={[
                  { required: true, message: "Please upload an asset image" },
                ]}
              >
                <Upload {...props}>
                  <Button
                    onChange={handleAssetImageChange}
                    icon={<UploadOutlined />}
                  >
                    Click to Upload Asset Image
                  </Button>
                </Upload>
              </Form.Item>
            </Col> */}
          </Row>

          <Row gutter={16}>
            {[
              "certificate",
              "partnerForm",
              "checklist",
              "mandate",
              "others",
            ].map((category) => (
              <Col key={category} span={6}>
                <Form.Item label={`Upload ${category}`}>
                  <Upload
                    listType="picture-card"
                    fileList={fileCategories[category]}
                    onChange={({ fileList }) =>
                      handleFileChange(category, fileList)
                    }
                    beforeUpload={() => false}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading || Object.values(uploading).includes(true)}
              disabled={Object.values(uploading).includes(true)}
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

"use client";

import { useGetUsersQuery } from "@/services/auth";
import { useCreateInvestmentMutation } from "@/services/investment";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Form,
  InputNumber,
  Row,
  Select,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const WealthForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createInvestment, { isLoading }] = useCreateInvestmentMutation();
  const { data, isFetching } = useGetUsersQuery(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  const [fileCategories, setFileCategories] = useState({
    certificate: [],
    partnerForm: [],
    checklist: [],
    mandate: [],
  });

  // UpLoading State
  const [uploading, setUploading] = useState({
    certificate: false,
    partnerForm: false,
    checklist: false,
    mandate: false,
  });

  // Update user list when data is fetched
  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  // Handle file changes for each category
  const handleFileChange = (category: string, fileList: any[]) => {
    setFileCategories((prev) => ({
      ...prev,
      [category]: fileList,
    }));
  };

  // Function to upload files to Cloudinary
  const handleUploadToCloudinary = async (
    categoryFiles: any[]
  ): Promise<string[]> => {
    const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dzvwqvww2/upload";
    const uploadPreset = "burchells";

    try {
      const uploadPromises = categoryFiles.map((file) => {
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
      return uploadResults.map((result) => result.secure_url);
    } catch (error) {
      console.error("File upload error:", error);
      return [];
    }
  };

  // Form submission handler
  const handleFormSubmit = async (values: any) => {
    const uploadedFiles: Record<string, string[]> = {};

    setUploading((prev) => ({
      ...prev,
      certificate: fileCategories.certificate.length > 0,
      partnerForm: fileCategories.partnerForm.length > 0,
      checklist: fileCategories.checklist.length > 0,
      mandate: fileCategories.mandate.length > 0,
    }));

    for (const category in fileCategories) {
      if (Object.prototype.hasOwnProperty.call(fileCategories, category)) {
        uploadedFiles[category as keyof typeof fileCategories] =
          await handleUploadToCloudinary(
            fileCategories[category as keyof typeof fileCategories]
          );
      }
    }
    // After uploads
    setUploading({
      certificate: false,
      partnerForm: false,
      checklist: false,
      mandate: false,
    });

    // Formatted values
    const { certificate, mandate, partnerForm, checklist } = uploadedFiles;
    const formattedValues = {
      ...values,
      certificate,
      mandate,
      partnerForm,
      checklist,
    };

    // Check values
    console.log(formattedValues);
    try {
      await createInvestment(formattedValues).unwrap();
      toast.success("Investment created successfully");
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error("Error creating investment:", error);
      toast.error(error?.data?.message || "An error occurred");
      setUploading({
        certificate: false,
        partnerForm: false,
        checklist: false,
        mandate: false,
      });
    }
  };

  // Show drawer
  const showDrawer = () => setOpen(true);

  // Close drawer
  const onClose = () => setOpen(false);

  return (
    <>
      <Button type="primary" onClick={showDrawer} icon={<PlusOutlined />}>
        New Investment
      </Button>
      <Drawer
        title="Create a New Investment"
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
          {/* Existing form fields */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userId"
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
                name="principal"
                label="Principal"
                rules={[
                  { required: true, message: "Please enter the principal" },
                ]}
              >
                <InputNumber
                  placeholder="Enter principal"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="performanceYield"
                label="Performance Yield"
                rules={[
                  {
                    required: true,
                    message: "Please enter the performance yield",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter performance yield"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="guaranteedRate"
                label="Guaranteed Rate"
                rules={[
                  {
                    required: true,
                    message: "Please select a guaranteed rate",
                  },
                ]}
              >
                <Select
                  placeholder="Select guaranteed rate"
                  options={Array.from({ length: 100 }, (_, i) => ({
                    value: i + 1,
                    label: `${i + 1}%`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
                label="Quarter"
                rules={[{ required: true, message: "Please select a quarter" }]}
              >
                <Select
                  placeholder="Select quarter"
                  options={["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({
                    value: quarter,
                    label: quarter,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item
                name="operationalCost"
                label="Operational Cost"
                rules={[
                  {
                    required: true,
                    message: "Please enter the operational cost",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter operational cost"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* File upload sections */}
          <Row gutter={16}>
            {["certificate", "partnerForm", "checklist", "mandate"].map(
              (category) => (
                <Col key={category} span={6}>
                  <Form.Item label={`Upload ${category}`}>
                    <Upload
                      listType="picture-card"
                      fileList={
                        fileCategories[category as keyof typeof fileCategories]
                      }
                      onChange={({ fileList }) =>
                        handleFileChange(category, fileList)
                      }
                      beforeUpload={() => false} // Disable auto-upload
                    >
                      <Button type="dashed">Upload</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              )
            )}
          </Row>

          <Form.Item>
            <Button
              className="w-full mt-6"
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

export default WealthForm;

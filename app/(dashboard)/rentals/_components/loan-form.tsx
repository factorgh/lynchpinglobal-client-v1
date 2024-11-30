"use client";

import { useGetUsersQuery } from "@/services/auth";
import { useCreateInvestmentMutation } from "@/services/investment";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  InputNumber,
  Row,
  Select,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
const LoanForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createInvestment, { isLoading }] = useCreateInvestmentMutation();
  const { data, isFetching } = useGetUsersQuery(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  // Hnadle file category

  const [fileCategories, setFileCategories] = useState({
    certificate: [],
    partnerForm: [],
    checklist: [],
    mandate: [],
  });

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
  const handleFileChange = (category: string, fileList: any[]) => {
    setFileCategories((prev) => ({
      ...prev,
      [category]: fileList,
    }));
  };

  // Update user list when data is fetched
  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  // File list change handler
  // const handleFileListChange = (fileList: any[]) => {
  //   setSelectedFiles(fileList);
  // };

  // // Function to upload files to Cloudinary
  // Form submission handler
  const handleFormSubmit = async (values: any) => {
    // Upload files and get URLs
    const uploadedFiles: Record<string, string[]> = {};

    for (const category in fileCategories) {
      if (Object.prototype.hasOwnProperty.call(fileCategories, category)) {
        uploadedFiles[category as keyof typeof fileCategories] =
          await handleUploadToCloudinary(
            fileCategories[category as keyof typeof fileCategories]
          );
      }
    }

    const formattedValues = {
      ...values,
      files: uploadedFiles,
    };

    try {
      await createInvestment(formattedValues).unwrap();
      toast.success("Investment created successfully");
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating investment:", error);
      toast.error(error?.data?.message || "An error occurred");
    }
  };

  // Show drawer
  const showDrawer = () => setOpen(true);

  // Close drawer
  const onClose = () => setOpen(false);

  return (
    <>
      <Button type="primary" onClick={showDrawer} icon={<PlusOutlined />}>
        New Loan
      </Button>
      <Drawer
        title="Create a New Loan"
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

            {/* Principal */}
            <Col span={12}>
              <Form.Item
                name="loan"
                label="Loan Amount"
                rules={[
                  { required: true, message: "Please enter the loan amount " },
                ]}
              >
                <InputNumber
                  placeholder="Enter loan amount"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Performance Yield */}

            {/* Guaranteed Rate */}
            <Col span={12}>
              <Form.Item
                name="overdueRate"
                label="Overdue Rate"
                rules={[
                  {
                    required: true,
                    message: "Please select a overdue rate",
                  },
                ]}
              >
                <Select
                  placeholder="Select overdue rate"
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
                name="overdueRate"
                label="Overdue Rate"
                rules={[
                  { required: true, message: "Please enter overdue rate" },
                ]}
              >
                <InputNumber
                  placeholder="Enter overdue rate"
                  style={{ width: "100%" }}
                  min={1}
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
                name="loanRate"
                label="Loan Rate"
                rules={[{ required: true, message: "Please ENTER LOAN RATE" }]}
              >
                <InputNumber
                  placeholder="Enter loan rate"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amountDue"
                label="Amount Due"
                rules={[{ required: true, message: "Please enter amount due" }]}
              >
                <InputNumber
                  placeholder="Enter amount due"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

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

export default LoanForm;

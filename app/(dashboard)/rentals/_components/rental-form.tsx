"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../../firebase/firebaseConfig"; // Import Firebase configuration

import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useGetUsersQuery } from "@/services/auth";
import { useCreateRentalMutation } from "@/services/rental";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
const RentalForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createRental, { isLoading }] = useCreateRentalMutation();
  const { data, isFetching } = useGetUsersQuery(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [createActivity] = useCreateActivityLogMutation();
  // Hnadle file category
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  // Hnadle file category
  const [fileCategories, setFileCategories] = useState({
    agreements: [],
    others: [],
  });

  // Update user list when data is fetched
  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  // File list change handler
  const handleFileChange = (category: string, fileList: any[]) => {
    setFileCategories((prev) => ({
      ...prev,
      [category]: fileList,
    }));
  };

  const [uploading, setUploading] = useState({
    agreements: false,
    others: false,
  });
  // Function to upload files to Cloudinary
  const handleUploadToFirebase = async (
    categoryFiles: any[]
  ): Promise<string[]> => {
    try {
      const uploadPromises = categoryFiles.map(async (file) => {
        const storageRef = ref(storage, `uploads/${file.name}-${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file.originFileObj);
        return await getDownloadURL(snapshot.ref); // Get the file's download URL
      });

      const uploadResults = await Promise.all(uploadPromises);
      return uploadResults; // Array of download URLs
    } catch (error) {
      console.error("File upload error:", error);
      return [];
    }
  };
  // Form submission handler
  const handleFormSubmit = async (values: any) => {
    const uploadedFiles: Record<string, string[]> = {};

    setUploading({
      agreements: true,
      others: true,
    });
    for (const category in fileCategories) {
      if (Object.prototype.hasOwnProperty.call(fileCategories, category)) {
        uploadedFiles[category as keyof typeof fileCategories] =
          await handleUploadToFirebase(
            fileCategories[category as keyof typeof fileCategories]
          );
      }
    }

    const { agreements, others } = uploadedFiles;
    const formattedValues = {
      ...values,
      agreements,
      others,
    };
    try {
      await createRental(formattedValues).unwrap();
      await createActivity({
        activity: "Rental Created",
        description: "A new rental was created",
        user: loggedInUser._id,
      }).unwrap();
      toast.success("Rental created successfully");
      setUploading({
        agreements: false,
        others: false,
      });
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating rental:", error);
      toast.error(error?.data?.message || "An error occurred");
      setUploading({
        agreements: false,
        others: false,
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
        New Rental
      </Button>
      <Drawer
        title="Create a New Asset Rental"
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
            <Col span={12}>
              <Form.Item
                name="amountDue"
                label="Amount Due"
                rules={[
                  {
                    required: true,
                    message: "Please enter the  amount due",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter amount due"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
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
          </Row>
          <Row gutter={16}>
            {/* Performance Yield */}
            <Col span={12}>
              <Form.Item
                name="returnDate"
                label="Return Date"
                rules={[
                  { required: true, message: "Please select a maturity date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="overdueRate"
                label="Overdue Rate"
                rules={[
                  {
                    required: true,
                    message: "Please enter overdue due",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter overdue rate"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            {/* Guaranteed Rate */}
          </Row>

          {/* Changes border line  */}
          <Row gutter={16}>
            {/* Management Fee */}

            <Col span={12}>
              <Form.Item
                name="quater"
                label="Quater"
                rules={[{ required: true, message: "Please select a quater" }]}
              >
                <Select
                  placeholder="Select a quater"
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
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select a status" }]}
              >
                <Select
                  placeholder="Select a status"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={["Active", "Inactive"].map((quater) => ({
                    value: quater,
                    label: quater,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {["agreements", "others"].map((category) => (
              <Col key={category} span={6}>
                <Form.Item
                  label={`Upload ${
                    category.charAt(0).toUpperCase() + category.slice(1)
                  }`}
                >
                  <Upload
                    listType="text" // Use text for non-image files like PDFs
                    fileList={
                      fileCategories[category as keyof typeof fileCategories]
                    }
                    onChange={({ fileList }) =>
                      handleFileChange(category, fileList)
                    }
                    beforeUpload={(file) => {
                      const isPdf = file.type === "application/pdf";
                      if (!isPdf) {
                        toast.error("You can only upload PDF files.");
                      }
                      return isPdf || Upload.LIST_IGNORE; // Prevent upload if not PDF
                    }}
                  >
                    <Button type="dashed">Upload PDF</Button>
                  </Upload>
                </Form.Item>
              </Col>
            ))}
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

export default RentalForm;

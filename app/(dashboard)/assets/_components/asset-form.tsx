"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../../firebase/firebaseConfig"; // Import Firebase configuration

import { useCreateActivityLogMutation } from "@/services/activity-logs";
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
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
const AssetForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [createAssets, { isLoading }] = useCreateAssetsMutation();

  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const { data, isFetching } = useGetUsersQuery(null);
  const [assetImageUrl, setAssetImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [createActivity] = useCreateActivityLogMutation();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [fileCategories, setFileCategories] = useState({
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
    others: false,
  });

  useEffect(() => {
    setUsers(data?.allUsers || []);
  }, [data]);

  // const handleUploadAssetImageToCloudinary = async (
  //   file: any
  // ): Promise<string | null> => {
  //   const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dzvwqvww2/upload";
  //   const uploadPreset = "burchells"; // Use the correct upload preset for your project

  //   try {
  //     setUploadingImage(true);
  //     // Prepare FormData for the file upload
  //     const formData = new FormData();
  //     formData.append("file", file.originFileObj); // The file object
  //     formData.append("upload_preset", uploadPreset);

  //     // Upload the image to Cloudinary
  //     const response = await fetch(cloudinaryUrl, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to upload file: ${file.name}`);
  //     }

  //     // Parse the response from Cloudinary
  //     const result = await response.json();
  //     setUploadingImage(false);

  //     // Return only the secure URL of the uploaded image
  //     return result.secure_url;
  //   } catch (error) {
  //     console.error("Image upload error:", error);
  //     setUploadingImage(false);
  //     return null; // Return null if the upload failed
  //   }
  // };

  const handleAssetImageChange = async ({ file }: any) => {
    if (file.status === "done") {
      console.log("-----------------------Asset Image Change ----------------");
      console.log(file);
      // Call the dedicated Cloudinary upload function for the asset image
      const imageUrl: string | null = await handleSingleUploadToFirebase(file);

      if (imageUrl) {
        console.log("Image URL:", imageUrl);
        setAssetImageUrl(imageUrl);
        form.setFieldsValue({ assetImage: imageUrl });
      } else {
        message.error("Image upload failed.");
      }
    }
  };

  const handleSingleUploadToFirebase = async (
    selectedFile: any
  ): Promise<string> => {
    try {
      if (!selectedFile) {
        throw new Error("No file selected for upload");
      }

      // Create a reference to the storage location
      const storageRef = ref(
        storage,
        `others/${selectedFile.name}-${Date.now()}`
      );

      // Upload the file to Firebase
      const snapshot = await uploadBytes(
        storageRef,
        selectedFile.originFileObj
      );

      // Get the download URL of the uploaded file
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL; // Return the download URL
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  };

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
      return uploadResults;
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

  // Form submission handler
  const handleFormSubmit = async (values: any) => {
    setUploading({
      certificate: true,
      partnerForm: true,
      checklist: true,
      mandate: true,
      others: true,
    });
    // Upload files and get URLs
    const uploadedFiles: Record<string, string[]> = {};

    for (const category in fileCategories) {
      if (Object.prototype.hasOwnProperty.call(fileCategories, category)) {
        uploadedFiles[category as keyof typeof fileCategories] =
          await handleUploadToFirebase(
            fileCategories[category as keyof typeof fileCategories]
          );
      }
    }

    setUploading({
      certificate: false,
      partnerForm: false,
      checklist: false,
      mandate: false,
      others: false,
    });

    const { certificate, mandate, partnerForm, checklist, others } =
      uploadedFiles;
    const formattedValues = {
      ...values,
      certificate,
      mandate,
      partnerForm,
      checklist,
      others,
      assetImage: assetImageUrl,
    };

    try {
      await createAssets(formattedValues).unwrap();
      await createActivity({
        activity: " Assets Entry",
        description: "An asset entry was made successfully",
        user: loggedInUser._id,
      }).unwrap();
      toast.success("Asset created successfully");
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating asset:", error);
      toast.error(error?.data?.message || error.message || "An error occurred");
      setUploading({
        certificate: false,
        partnerForm: false,
        checklist: false,
        mandate: false,
        others: false,
      });
    }
  };

  // Upload props
  const props: UploadProps = {
    name: "file",
    multiple: true,
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
                  placeholder="Enter asset name"
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
                <Input
                  placeholder="Enter asset designation"
                  style={{ width: "100%" }}
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
                <InputNumber
                  placeholder="Enter management fee"
                  style={{ width: "100%" }}
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

            <Col span={12}>
              <Form.Item
                name="assetValue"
                label="Asset Value"
                rules={[
                  {
                    required: true,
                    message: "Please enter the asset value",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter asset value"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Upload Files */}
          <Row gutter={16}>
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
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[
                  { required: true, message: "Please select a start date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
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
              loading={
                isLoading ||
                Object.values(uploading).includes(true) ||
                uploadingImage
              }
              disabled={
                Object.values(uploading).includes(true) || uploadingImage
              }
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

// "use client";

// // Firebase imPORTS
// import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import { storage } from "../../../../firebase/firebaseConfig"; // Import Firebase configuration

// import { useCreateActivityLogMutation } from "@/services/activity-logs";
// import { useGetUsersQuery } from "@/services/auth";
// import { useCreateInvestmentMutation } from "@/services/investment";
// import { PlusOutlined } from "@ant-design/icons";
// import {
//   Button,
//   Col,
//   DatePicker,
//   Drawer,
//   Form,
//   InputNumber,
//   Row,
//   Select,
//   Upload,
//   message,
// } from "antd";
// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";

// const WealthForm: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const [createInvestment, { isLoading }] = useCreateInvestmentMutation();
//   const [createActivity] = useCreateActivityLogMutation();
//   const { data, isFetching } = useGetUsersQuery(null);
//   const [users, setUsers] = useState([]);

//   const [form] = Form.useForm();
//   const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

//   const [fileCategories, setFileCategories] = useState({
//     certificate: [],
//     partnerForm: [],
//     checklist: [],
//     mandate: [],
//     others: [],
//   });

//   // UpLoading State
//   const [uploading, setUploading] = useState({
//     certificate: false,
//     partnerForm: false,
//     checklist: false,
//     mandate: false,
//     others: false,
//   });

//   // Update user list when data is fetched
//   useEffect(() => {
//     setUsers(data?.allUsers || []);
//   }, [data]);

//   // Handle file changes for each category
//   const handleFileChange = (category: string, fileList: any[]) => {
//     setFileCategories((prev) => ({
//       ...prev,
//       [category]: fileList,
//     }));
//   };

//   // Handle file preview
//   const handlePreview = async (file: any) => {
//     let previewUrl;
//     if (file.type.startsWith("image")) {
//       previewUrl = URL.createObjectURL(file.originFileObj);
//     } else {
//       previewUrl = file.url;
//     }
//     const newWindow = window.open(previewUrl, "_blank");
//     newWindow?.document.write(`<img src="${previewUrl}" style="width:100%;" />`);
//   };

//   // Handle file deletion
//   const handleFileRemove = async (category: string, file: any) => {
//     setFileCategories((prev) => ({
//       ...prev,
//       [category]: prev[category].filter((f: any) => f.uid !== file.uid),
//     }));
//   };

//   const handleUploadToFirebase = async (
//     categoryFiles: any[]
//   ): Promise<string[]> => {
//     try {
//       const uploadPromises = categoryFiles.map(async (file) => {
//         const storageRef = ref(storage, `uploads/${file.name}-${Date.now()}`);
//         const snapshot = await uploadBytes(storageRef, file.originFileObj);
//         return await getDownloadURL(snapshot.ref); // Get the file's download URL
//       });

//       const uploadResults = await Promise.all(uploadPromises);
//       return uploadResults; // Array of download URLs
//     } catch (error) {
//       console.error("File upload error:", error);
//       return [];
//     }
//   };

//   // Form submission handler
//   const handleFormSubmit = async (values: any) => {
//     const uploadedFiles: Record<string, string[]> = {};

//     setUploading({
//       certificate: true,
//       partnerForm: true,
//       checklist: true,
//       mandate: true,
//       others: true,
//     });

//     for (const category in fileCategories) {
//       if (Object.prototype.hasOwnProperty.call(fileCategories, category)) {
//         uploadedFiles[category as keyof typeof fileCategories] =
//           await handleUploadToFirebase(
//             fileCategories[category as keyof typeof fileCategories]
//           );
//       }
//     }

//     setUploading({
//       certificate: false,
//       partnerForm: false,
//       checklist: false,
//       mandate: false,
//       others: false,
//     });

//     const { certificate, mandate, partnerForm, checklist, others } =
//       uploadedFiles;

//     const formattedValues = {
//       ...values,
//       certificate,
//       mandate,
//       partnerForm,
//       checklist,
//       others,
//     };

//     try {
//       await createInvestment(formattedValues).unwrap();
//       await createActivity({
//         activity: "New Investment",
//         description: "A new investment was created",
//         user: loggedInUser._id,
//       }).unwrap();

//       toast.success("Investment created successfully");
//       setOpen(false);
//       form.resetFields();
//     } catch (error: any) {
//       console.error("Error creating investment:", error);
//       toast.error(error?.data?.message || "An error occurred");
//     }
//   };

//   // Show drawer
//   const showDrawer = () => setOpen(true);

//   // Close drawer
//   const onClose = () => setOpen(false);

//   return (
//     <>
//       <Button type="primary" onClick={showDrawer} icon={<PlusOutlined />}>
//         New Wealth
//       </Button>
//       <Drawer
//         title="Create a New Wealth"
//         width={720}
//         onClose={onClose}
//         open={open}
//       >
//         <Form
//           form={form}
//           onFinish={handleFormSubmit}
//           layout="vertical"
//           hideRequiredMark
//         >
//           {/* Existing form fields */}
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="userId"
//                 label="User"
//                 rules={[{ required: true, message: "Please select a user" }]}
//               >
//                 <Select
//                   placeholder="Select a user"
//                   showSearch
//                   filterOption={(input, option) =>
//                     (option?.label ?? "")
//                       .toLowerCase()
//                       .includes(input.toLowerCase())
//                   }
//                   options={users?.map((user: any) => ({
//                     value: user._id,
//                     label: user.name,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>

//             <Col span={12}>
//               <Form.Item
//                 name="principal"
//                 label="Principal"
//                 rules={[
//                   { required: true, message: "Please enter the principal" },
//                 ]}
//               >
//                 <InputNumber
//                   placeholder="Enter principal"
//                   style={{ width: "100%" }}
//                   min={1}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           {/* File upload sections */}
//           <Row gutter={16}>
//             {[
//               "certificate",
//               "partnerForm",
//               "checklist",
//               "mandate",
//               "others",
//             ].map((category) => (
//               <Col key={category} span={6}>
//                 <Form.Item
//                   label={`Upload ${category
//                     .charAt(0)
//                     .toUpperCase()}${category.slice(1)}`}
//                 >
//                   <Upload
//                     listType="picture-card" // For images
//                     fileList={
//                       fileCategories[category as keyof typeof fileCategories]
//                     }
//                     onChange={({ fileList }) =>
//                       handleFileChange(category, fileList)
//                     }
//                     onPreview={handlePreview}
//                     onRemove={(file) => handleFileRemove(category, file)}
//                     beforeUpload={(file) => {
//                       const isPdf = file.type === "application/pdf";
//                       const isImage = file.type.startsWith("image/");
//                       if (!isPdf && !isImage) {
//                         message.error("You can only upload PDF or image files.");
//                       }
//                       return isPdf || isImage || Upload.LIST_IGNORE; // Allow PDF or image
//                     }}
//                   >
//                     <Button type="dashed">Upload PDF/Image</Button>
//                   </Upload>
//                 </Form.Item>
//               </Col>
//             ))}
//           </Row>

//           <Form.Item>
//             <Button
//               className="w-full mt-6"
//               type="primary"
//               htmlType="submit"
//               loading={isLoading || Object.values(uploading).includes(true)}
//               disabled={Object.values(uploading).includes(true)}
//             >
//               Submit
//             </Button>
//           </Form.Item>
//         </Form>
//       </Drawer>
//     </>
//   );
// };

// export default WealthForm;

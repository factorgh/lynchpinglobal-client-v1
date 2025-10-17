"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../../firebase/firebaseConfig"; // Import Firebase configuration

import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import {
  useDeleteAssetsMutation,
  useGetAllAssetssQuery,
  useUpdateAssetsMutation,
} from "@/services/assets";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  SmileOutlined,
} from "@ant-design/icons";
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
  Table,
  Upload,
} from "antd";
import moment from "moment";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import AssetsDrawer from "./assets-drawer";

/*************  ✨ Codeium Command ⭐  *************/
/**
 * WealthTable component renders a table of general investment expenses with functionalities
 * to add, edit, and delete entries. It includes a search feature for filtering data and a drawer
 * form for editing entries. The component uses Ant Design for UI elements and integrates with
 * a backend API to fetch and mutate investment data.
 */
/******  9086d653-a04c-4e0b-bac6-b7052991ffc2  *******/ const WealthTable =
  () => {
    const searchInput = useRef(null);
    const { data: assetsData, isFetching: investmentLoading } =
      useGetAllAssetssQuery<any>(null);
    console.log("-------------------------assetsData-------------------------");
    console.log(assetsData?.data);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editRentalId, setEditRentalId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [users, setUsers] = useState([]);
    const [form] = Form.useForm();
    const [createActivity] = useCreateActivityLogMutation();
    const [updateAssets, { isLoading }] = useUpdateAssetsMutation();
    const [deleteAsset] = useDeleteAssetsMutation();
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    const [assetsDetailsDrawerVisible, setAssetDetailsDrawerVisible] =
      useState(false);
    const [fileCategories, setFileCategories] = useState({
      others: [],
    });

    const [uploading, setUploading] = useState({
      others: false,
    });

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

    console.log(selectedFiles);

    const handleFileListChange = (fileList: any[]) => {
      setSelectedFiles(fileList);
    };

    const handleFileChange = (category: string, fileList: any[]) => {
      setFileCategories((prev) => ({
        ...prev,
        [category]: fileList,
      }));
    };

    const handleCloseDrawer = () => {
      setIsDrawerVisible(false);
      form.resetFields();
      setEditRentalId(null);
      setIsEditMode(false);
    };
    const showEditDrawer = (investment: any) => {
      if (!investment) return; // Guard against null or undefined investment

      console.log("Editing investment:", investment); // Debugging

      setIsEditMode(true);
      setEditRentalId(investment._id);

      // Set form values based on the data of the investment
      form.setFieldsValue({
        assetClass: investment.assetClass,
        assetDesignation: investment.assetDesignation,
        accruedInterest: investment.accruedInterest,
        maturityDate: moment(investment.maturityDate), // Ensure this is a moment object
        managementFee: investment.managementFee,
        timeCourse: investment.timeCourse,
        quater: investment.quater,
        deduction: investment.deduction,
      });

      setIsDrawerVisible(true);
    };

    const closeAssetsDetailsDrawer = () => {
      setSelectedAsset(null);
      setAssetDetailsDrawerVisible(false);
    };
    // Menu section
    const showAssetsDetailsDrawer = (asset: any) => {
      setSelectedAsset(asset);
      setAssetDetailsDrawerVisible(true);
    };
    const handleFormSubmit = async (values: any) => {
      const uploadedFiles: Record<string, string[]> = {};

      for (const category in fileCategories) {
        if (Object.prototype.hasOwnProperty.call(fileCategories, category)) {
          uploadedFiles[category as keyof typeof fileCategories] =
            await handleUploadToFirebase(
              fileCategories[category as keyof typeof fileCategories]
            );
        }
      }

      try {
        const { others } = uploadedFiles;
        const formattedValues = {
          ...values,
          managementFee: toTwoDecimalPlaces(values.managementFee),
          assetDesignation: toTwoDecimalPlaces(values.assetDesignation),
          accruedInterest: toTwoDecimalPlaces(values.accruedInterest),
          maturityDate: values.maturityDate.toISOString(),
          timeCourse: values.timeCourse,
          quater: values.quater,
          others,
        };

        if (isEditMode) {
          await updateAssets({
            id: editRentalId,
            data: formattedValues,
          }).unwrap();
          toast.success("Assets updated successfully");
          await createActivity({
            activity: "Asset Updated",
            description: "An asset entry was updated successfully",
            user: loggedInUser._id,
          }).unwrap();
        } else {
          toast.success("New Asset added successfully");
        }

        setIsDrawerVisible(false);
        form.resetFields();
      } catch (error: any) {
        toast.error("Failed to save update entry: " + error?.data?.message);
      }
    };

    const handleDelete = async (id: any) => {
      try {
        const result = await Swal.fire({
          title: "Are you sure?",
          text: "Do you want to delete this entry?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
          await deleteAsset(id).unwrap();
          await createActivity({
            activity: "Asset Deleted",
            description: "An asset entry was deleted successfully",
            user: loggedInUser._id,
          }).unwrap();
          toast.success("Entry deleted successfully");
        }
      } catch (error: any) {
        toast.error("Failed to delete entry: " + error?.message);
      }
    };

    const getColumnSearchProps = (dataIndex: any) => ({
      filterDropdown: ({ setSelectedKeys, selectedKeys }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            ref={searchInput}
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            style={{ marginBottom: 8, display: "block" }}
          />
        </div>
      ),
      filterIcon: (filtered: any) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: any, record: any) =>
        record[dataIndex]
          ? record[dataIndex]
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase())
          : "",
    });

    const columns = [
      {
        title: "Customer",
        dataIndex: "user", // This contains the user object
        key: "user",
        render: (user: any) => user?.displayName || "Unknown User", // Access displayName directly
      },
      {
        title: "Type",
        dataIndex: "isJoint",
        key: "isJoint",
        render: (isJoint: boolean) => (isJoint ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">Joint</span> : <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-600 text-xs">Single</span>),
      },
      {
        title: "Owners",
        dataIndex: "owners",
        key: "owners",
        render: (owners: any[]) =>
          Array.isArray(owners) && owners.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {owners.map((o, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs">
                  {o?.user?.displayName || o?.user?.name || o?.user?.email || o?.user?._id}
                </span>
              ))}
            </div>
          ) : (
            <span>—</span>
          ),
      },
      {
        title: "Asset Class",
        dataIndex: "assetClass",
        key: "assetClass",
        ...getColumnSearchProps("assetClass"),
      },
      {
        title: "Asset Designation",
        dataIndex: "assetDesignation",
        key: "assetDesignation",
        ...getColumnSearchProps("assetDesignation"),
      },

      {
        title: "Accrued Interest",
        dataIndex: "accruedInterest",
        key: "accruedInterest",
        ...getColumnSearchProps("accruedInterest"),
        render: (value: any) => formatPriceGHS(value), // Format performance yield
      },
      {
        title: "Management Fee ",
        dataIndex: "managementFee",
        key: "managementFee",
        ...getColumnSearchProps("managementFee"),
        render: (value: any) => formatPriceGHS(value), // Add "%" suffix
      },
      {
        title: "Quarter",
        dataIndex: "quater",
        key: "quater",
        ...getColumnSearchProps("quater"),
      },
      {
        title: "Maturity Date",
        dataIndex: "maturityDate",
        key: "maturityDate",
        ...getColumnSearchProps("maturityDate"),
        render: (value: any) => moment(value).format("YYYY-MM-DD"), // Format the value correctly
      },
      {
        title: "Action",
        key: "action",
        render: (text: any, record: any) => (
          <div className="flex gap-3">
            <EyeOutlined
              className="text-emerald-500"
              onClick={() => showAssetsDetailsDrawer(record)}
            />

            <EditOutlined
              className="text-blue-500"
              onClick={() => showEditDrawer(record)}
            />
            <DeleteOutlined
              onClick={() => handleDelete(record._id)}
              className="text-red-500"
              style={{ marginLeft: "10px" }}
            />
          </div>
        ),
      },
    ];

    return (
      <>
        <Table
          pagination={{
            pageSize: 10,
          }}
          loading={investmentLoading}
          columns={columns}
          dataSource={assetsData?.data.data}
          // scroll={{ x: 1000 }}
          className="border border-slate-200 rounded-md"
          rowKey="id"
          locale={{
            emptyText: (
              <div style={{ textAlign: "center" }}>
                <SmileOutlined style={{ fontSize: 35, color: "#1890ff" }} />
                <p style={{ fontSize: 20, color: "#1890ff" }}>
                  No data available
                </p>
              </div>
            ),
          }}
        />
        <Drawer
          title="Edit Asset"
          placement="right"
          width="50%" // Adjust to center the drawer
          onClose={handleCloseDrawer}
          open={isDrawerVisible}
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
                    {
                      required: true,
                      message: "Please select a maturity date",
                    },
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
                    {
                      required: true,
                      message: "Please select a management fee",
                    },
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
                  label="Quater"
                  rules={[
                    { required: true, message: "Please select a quater" },
                  ]}
                >
                  <Select
                    placeholder="Select quater"
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
                  name="status"
                  label="Status"
                  rules={[
                    { required: true, message: "Please select a status" },
                  ]}
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
              <Col span={24}>
                <Form.Item name="deduction" label="Outstanding Deduction">
                  <InputNumber
                    placeholder="Enter outstanding deduction"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              {["others"].map((category) => (
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
        {/* Investment Details Drawer */}
        <AssetsDrawer
          assets={selectedAsset}
          visible={assetsDetailsDrawerVisible}
          onClose={closeAssetsDetailsDrawer}
        />
      </>
    );
  };

export default WealthTable;

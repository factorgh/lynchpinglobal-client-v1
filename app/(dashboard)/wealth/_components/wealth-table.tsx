"use client";
import DotLoader from "@/app/(components)/dot-loader";
import InvestmentDetailDrawer from "@/app/(components)/investemnt_drawer";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useCreateAddOffMutation } from "@/services/addOff";
import { useCreateAddOnMutation } from "@/services/addOn";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../../firebase/firebaseConfig"; // Import Firebase configuration

import {
  useDeleteInvestmentMutation,
  useGetAllInvestmentsQuery,
  useUpdateInvestmentMutation,
} from "@/services/investment";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PayCircleOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Menu,
  Row,
  Select,
  Table,
  Upload,
} from "antd";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const WealthTable = () => {
  const searchInput = useRef(null);
  const { data: investmentData, isFetching: investmentLoading } =
    useGetAllInvestmentsQuery<any>(null);
  console.log(
    "-------------------------InvestmentData-------------------------"
  );
  console.log(investmentData?.data);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [investmentDetailsDrawerVisible, setInvestmentDetailsDrawerVisible] =
    useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);

  const [updateInvestment, { isLoading }] = useUpdateInvestmentMutation();
  const [createAddOn, { isLoading: addOnLoading }] = useCreateAddOnMutation();
  const [createActivity] = useCreateActivityLogMutation();

  const [createAddOff, { isLoading: addOffLoading }] =
    useCreateAddOffMutation();
  const [deleteInvestment] = useDeleteInvestmentMutation();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  console.log(selectedFiles);
  const [isAddOnDrawerVisible, setIsAddOnDrawerVisible] = useState(false);
  const [isAddOffDrawerVisible, setIsAddOffDrawerVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const [fileCategories, setFileCategories] = useState({
    others: [],
  });

  const [uploading, setUploading] = useState({
    others: false,
  });
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
    setIsActive(checked);
    // Send request to backend for update
  };

  const showAddOnDrawer = (investment: any) => {
    setEditRentalId(investment._id);
    setIsAddOnDrawerVisible(true);
  };

  const showAddOffDrawer = (investment: any) => {
    setEditRentalId(investment._id);
    setIsAddOffDrawerVisible(true);
  };

  const closeAddOnDrawer = () => {
    setIsAddOnDrawerVisible(false);
    form.resetFields(); // Reset the form
  };

  const closeAddOffDrawer = () => {
    setIsAddOffDrawerVisible(false);
    form.resetFields(); // Reset the form
  };

  const showInvestmentDetailsDrawer = (investment: any) => {
    setSelectedInvestment(investment);
    setInvestmentDetailsDrawerVisible(true);
  };

  const closeInvestmentDetailsDrawer = () => {
    setSelectedInvestment(null);
    setInvestmentDetailsDrawerVisible(false);
  };
  // Menu section
  const menu = (record: any) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => showInvestmentDetailsDrawer(record)}
      >
        View
      </Menu.Item>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => showEditDrawer(record)}
      >
        Edit
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={() => handleDelete(record._id)}
      >
        Delete
      </Menu.Item>
      {/* Add more actions here */}
      <Menu.Item
        key="addOn"
        icon={<PayCircleOutlined />}
        onClick={() => showAddOnDrawer(record)}
      >
        Create Add On
      </Menu.Item>
      <Menu.Item
        key="addOff"
        icon={<PlusCircleOutlined />}
        onClick={() => showAddOffDrawer(record)}
      >
        Create One Off
      </Menu.Item>
    </Menu>
  );

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
    console.log(investment);
    setIsEditMode(true);
    setEditRentalId(investment._id);

    form.setFieldsValue({
      managementFee: investment.managementFee,
      performanceYield: investment.performanceYield,
      guaranteedRate: investment.guaranteedRate,
      quater: investment.quater,
    });

    setIsDrawerVisible(true);
  };
  const showViewDrawer = (investment: any) => {
    setIsEditMode(true);
    setEditRentalId(investment.id);
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
      return uploadResults; // Array of download URLs
    } catch (error) {
      console.error("File upload error:", error);
      return [];
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (isAddOnDrawerVisible) {
        console.log("Add On submitted", values);
        console.log(editRentalId);
        await createAddOn({
          amount: values.amount,
          status: values.status,
          investmentId: editRentalId,
        });

        await createActivity({
          activity: "New Add On",
          description: "A new addon was added",
          user: loggedInUser._id,
        }).unwrap();
        closeAddOnDrawer();

        toast.success("Add On has been created successfully");

        form.resetFields(); // Reset form fiel
        console.log("Add On submitted", values);
      } else if (isAddOffDrawerVisible) {
        // Handle Add Off submission
        await createAddOff({
          amount: values.amount,
          currency: values.currency,
          oneOffYield: values.oneOffYield,
          investmentId: editRentalId,
        });
        await createActivity({
          activity: "One off Added",
          description: "A new one off was Added",
          user: loggedInUser._id,
        }).unwrap();
        closeAddOffDrawer();
        console.log("Add Off submitted", values);

        toast.success("One Off has been created successfully");
      } else {
        // Handle Investment submission (same logic as before)
        console.log(values);
        if (isEditMode) {
          // Update logic
          const uploadedFiles: Record<string, string[]> = {};
          for (const category in fileCategories) {
            if (
              Object.prototype.hasOwnProperty.call(fileCategories, category)
            ) {
              uploadedFiles[category as keyof typeof fileCategories] =
                await handleUploadToFirebase(
                  fileCategories[category as keyof typeof fileCategories]
                );
            }
          }
          const { others } = uploadedFiles;
          const formattedValues = {
            ...values,
            others,
          };

          await updateInvestment({
            id: editRentalId,
            data: formattedValues,
          }).unwrap();
          await createActivity({
            activity: "Investment Updated",
            description: ` An investment was updated with id${editRentalId} and name ${values.name}`,
            user: loggedInUser._id,
          }).unwrap();

          toast.success("Investment updated successfully");
        } else {
          toast.success("New invesrtment added successfully");
          await createActivity({
            activity: "New Investment",
            description: "A new investment was created",
            user: loggedInUser._id,
          }).unwrap();
        }

        setIsDrawerVisible(false);
        form.resetFields();
      }
    } catch (error: any) {
      toast.error("Unexpected error occurred");
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
        await deleteInvestment(id).unwrap();
        await createActivity({
          activity: "Investment Deleted",
          description: `An investment with id ${id} was deleted`,
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
      dataIndex: "userId", // This contains the user object
      key: "userId",
      render: (user: any) => user?.displayName || "Unknown User", // Access displayName directly
    },
    {
      title: "Principal",
      dataIndex: "principal",
      key: "principal",
      ...getColumnSearchProps("principal"),
      render: (value: any) => formatPriceGHS(value), // Format principal
    },
    {
      title: "Guaranteed Return",
      dataIndex: "guaranteedRate",
      key: "guaranteedRate",
      ...getColumnSearchProps("guaranteedRate"),
      render: (value: any) => `${toTwoDecimalPlaces(value)}%`, // Add "%" suffix
    },
    {
      title: "Performance Yield",
      dataIndex: "performanceYield",
      key: "performanceYield",
      ...getColumnSearchProps("performanceYield"),
      render: (value: any) => formatPriceGHS(value), // Format performance yield
    },
    {
      title: "Management Fee Rate",
      dataIndex: "managementFeeRate",
      key: "managementFeeRate",
      ...getColumnSearchProps("managementFeeRate"),
      render: (value: any) => `${toTwoDecimalPlaces(value)}%`, // Add "%" suffix
    },
    {
      title: "Total Accrued Return",
      dataIndex: "totalAccruedReturn",
      key: "totalAccruedReturn",
      ...getColumnSearchProps("totalAccruedReturn"),
      render: (value: any) => formatPriceGHS(value),
      // Format with currency
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: any) => (
        <Dropdown
          overlay={menu(record)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} type="text" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="mt-7">
      <Table
        pagination={{
          pageSize: 10,
        }}
        loading={investmentLoading}
        columns={columns}
        dataSource={investmentData?.data}
        // scroll={{ x: 1000 }}
        className="border border-slate-200 rounded-md"
        rowKey="id" // Correct rowKey
      />
      <Drawer
        title="Edit Wealth"
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
            {/* Performance Yield */}
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

            {/* Guaranteed Rate */}
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
                <InputNumber
                  placeholder="Enter guaranteed rate"
                  style={{ width: "100%" }}
                />
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
            {["others"].map((category) => (
              <Col key={category} span={6}>
                <Form.Item
                  label={`Upload ${category
                    .charAt(0)
                    .toUpperCase()}${category.slice(1)}}`}
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
            {isLoading ? (
              <Button
                className="w-full mt-6"
                type="default"
                htmlType="submit"
                disabled
              >
                <DotLoader />
              </Button>
            ) : (
              <Button
                className="w-full mt-6"
                type="primary"
                htmlType="submit"
                loading={isLoading || Object.values(uploading).includes(true)}
                disabled={Object.values(uploading).includes(true)}
              >
                Submit
              </Button>
            )}
          </Form.Item>
        </Form>
      </Drawer>
      {/* Investment Details Drawer */}
      <InvestmentDetailDrawer
        investment={selectedInvestment}
        visible={investmentDetailsDrawerVisible}
        onClose={closeInvestmentDetailsDrawer}
      />
      <Drawer
        title="Create Add On"
        placement="right"
        width="50%"
        onClose={closeAddOnDrawer}
        open={isAddOnDrawerVisible}
      >
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Form.Item
            name="amount"
            label="Add On Amount"
            rules={[{ required: true, message: "Please enter an add-on" }]}
          >
            <Input placeholder="Enter add-on amount" />
          </Form.Item>

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
              options={["active", "inactive"].map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={addOnLoading}
              className="w-full mt-6"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Create One Off"
        placement="right"
        width="50%"
        onClose={closeAddOffDrawer}
        open={isAddOffDrawerVisible}
      >
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Form.Item
            name="amount"
            label="One Off Amount"
            rules={[{ required: true, message: "Please enter an add-off" }]}
          >
            <Input placeholder="Enter add-off details" />
          </Form.Item>

          <Form.Item
            name="oneOffYield"
            label="Yield"
            rules={[
              {
                required: true,
                message: "Please enter a yield",
              },
            ]}
          >
            <InputNumber placeholder="Enter yield" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true, message: "Please select a currency" }]}
          >
            <Select
              placeholder="Select a currency"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={["USD", "GHC"].map((currency) => ({
                value: currency,
                label: currency,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={addOffLoading}
              className="w-full mt-6"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default WealthTable;

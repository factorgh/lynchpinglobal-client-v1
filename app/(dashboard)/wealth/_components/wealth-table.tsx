"use client";
import DotLoader from "@/app/(components)/dot-loader";
import InvestmentDetailDrawer from "@/app/(components)/investemnt_drawer";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateAddOffMutation } from "@/services/addOff";
import { useCreateAddOnMutation } from "@/services/addOn";
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
  const [createAddOff, { isLoading: addOffLoading }] =
    useCreateAddOffMutation();
  const [deleteInvestment] = useDeleteInvestmentMutation();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  console.log(selectedFiles);
  const [isAddOnDrawerVisible, setIsAddOnDrawerVisible] = useState(false);
  const [isAddOffDrawerVisible, setIsAddOffDrawerVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [fileCategories, setFileCategories] = useState({
    certificate: [],
    partnerForm: [],
    checklist: [],
    mandate: [],
  });

  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
    setIsActive(checked);
    // Send request to backend for update
  };

  const showAddOnDrawer = (investment: any) => {
    setEditRentalId(investment._id);
    setIsAddOnDrawerVisible(true);
  };

  const showAddOffDrawer = () => {
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
        onClick={() => handleDelete(record.id)}
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
        onClick={showAddOffDrawer}
      >
        Create Add Off
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
        closeAddOnDrawer();
        toast.success("Add On has been created successfully");
        form.resetFields(); // Reset form fiel
        console.log("Add On submitted", values);
      } else if (isAddOffDrawerVisible) {
        // Handle Add Off submission
        await createAddOff({
          amount: values.amount,
          currency: values.currnecy,
          rate: values.rate,
          investmentId: editRentalId,
        });
        closeAddOffDrawer();
        console.log("Add Off submitted", values);
        toast.success("Add Off has been created successfully");
      } else {
        // Handle Investment submission (same logic as before)
        console.log(values);
        if (isEditMode) {
          await updateInvestment({
            id: editRentalId,
            data: values,
          }).unwrap();
          toast.success("Wealth updated successfully");
        } else {
          toast.success("New wealth added successfully");
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
      title: "Admin",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Principal",
      dataIndex: "principal",
      key: "principal",
      ...getColumnSearchProps("principal"),
      render: (value: any) => toTwoDecimalPlaces(value), // Format principal
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
      render: (value: any) => toTwoDecimalPlaces(value), // Format performance yield
    },
    {
      title: "Management Fee",
      dataIndex: "managementFee",
      key: "managementFee",
      ...getColumnSearchProps("managementFee"),
      render: (value: any) => `${toTwoDecimalPlaces(value)}%`, // Add "%" suffix
    },
    {
      title: "Total Accrued Return",
      dataIndex: "totalAccruedReturn",
      key: "totalAccruedReturn",
      ...getColumnSearchProps("totalAccruedReturn"),
      render: (value: any) =>
        `${formatPriceGHS(Number(toTwoDecimalPlaces(value)))}`, // Format with currency
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
                <Select
                  placeholder="Select guaranteed rate"
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
          {/* <Row gutter={16}>
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
          </Row> */}
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
                loading={isLoading}
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
        title="Create Add Off"
        placement="right"
        width="50%"
        onClose={closeAddOffDrawer}
        open={isAddOffDrawerVisible}
      >
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Form.Item
            name="amount"
            label="Add Off Amount"
            rules={[{ required: true, message: "Please enter an add-off" }]}
          >
            <Input placeholder="Enter add-off details" />
          </Form.Item>

          <Form.Item
            name="Rate"
            label="Rate"
            rules={[
              {
                required: true,
                message: "Please select a  rate",
              },
            ]}
          >
            <Select
              placeholder="Select rate"
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

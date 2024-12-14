"use client";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useDeleteInvestmentMutation } from "@/services/investment";
import { useGetRentalsQuery, useUpdateRentalMutation } from "@/services/rental";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
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
} from "antd";
import moment from "moment";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import RentalDrawer from "./rental-drawer";

/*************  ✨ Codeium Command ⭐  *************/
/**
 * WealthTable component renders a table of general investment expenses with functionalities
 * to add, edit, and delete entries. It includes a search feature for filtering data and a drawer
 * form for editing entries. The component uses Ant Design for UI elements and integrates with
 * a backend API to fetch and mutate investment data.
 */
/******  9086d653-a04c-4e0b-bac6-b7052991ffc2  *******/ const RentalTable =
  () => {
    const searchInput = useRef(null);
    const { data: investmentData, isFetching: investmentLoading } =
      useGetRentalsQuery<any>(null);
    console.log(
      "-------------------------InvestmentData-------------------------"
    );
    console.log(investmentData);

    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editRentalId, setEditRentalId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [users, setUsers] = useState([]);
    const [form] = Form.useForm();
    const [createActivity] = useCreateActivityLogMutation();

    const [updateInvestment, { isLoading }] = useUpdateRentalMutation();
    const [deleteInvestment] = useDeleteInvestmentMutation();
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    console.log(selectedFiles);

    const [rentalDrawerVisible, setRentalDrawerVisible] = useState(false);

    const [selectedRental, setSelectedRental] = useState(null);

    const handleFileListChange = (fileList: any[]) => {
      setSelectedFiles(fileList);
    };

    const closeRentalsDetailsDrawer = () => {
      setSelectedRental(null);
      setRentalDrawerVisible(false);
    };
    const showRentalDetailsDrawer = (asset: any) => {
      setSelectedRental(asset);
      setRentalDrawerVisible(true);
    };
    const handleCloseDrawer = () => {
      setIsDrawerVisible(false);
      form.resetFields();
      setEditRentalId(null);
      setIsEditMode(false);
    };
    const showEditDrawer = (investment: any) => {
      setIsEditMode(true);
      setEditRentalId(investment._id);

      form.setFieldsValue({
        assetClass: investment.assetClass,
        assetDesignation: investment.assetDesignation,
        overdueRate: toTwoDecimalPlaces(investment.overdueRate),
        returnDate: moment(investment.returnDate),
        overdueDate: moment(investment.overdueDate),
        quater: investment.quater,
        amountDue: toTwoDecimalPlaces(investment.amountDue),
        status: investment.status,
      });

      setIsDrawerVisible(true);
    };
    const handleFormSubmit = async (values: any) => {
      try {
        const formattedValues = {
          ...values,
          managementFee: toTwoDecimalPlaces(values.managementFee),
          performanceYield: toTwoDecimalPlaces(values.performanceYield),
          principal: toTwoDecimalPlaces(values.principal),
        };

        if (isEditMode) {
          await updateInvestment({
            id: editRentalId,
            data: formattedValues,
          }).unwrap();
          await createActivity({
            activity: "Rental Updated",
            description: "A rental entry was updated successfully",
            user: loggedInUser._id,
          }).unwrap();
          toast.success("Asset Rental updated successfully");
        } else {
          toast.success("New Rental added successfully");
        }

        setIsDrawerVisible(false);
        form.resetFields();
      } catch (error: any) {
        toast.error("Failed to save investment entry: " + error?.data?.message);
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
            activity: "Rental Deleted",
            description: "A rental entry was deleted successfully",
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
        dataIndex: "user",
        key: "user",
        ...getColumnSearchProps("user"),
        render: (value: any) => value?.name,
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
        // Format principal
      },
      {
        title: "Amount Due",
        dataIndex: "amountDue",
        key: "amountDue",
        ...getColumnSearchProps("amountDue"),
        render: (value: any) => formatPriceGHS(value),
      },
      {
        title: "Due Date",
        dataIndex: "dueDate",
        key: "dueDate",
        ...getColumnSearchProps("dueDate"),
        render: (value: any) => moment(value).format("YYYY-MM-DD"),
      },

      {
        title: "Action",
        key: "action",
        render: (text: any, record: any) => (
          <div className="flex gap-3">
            <EyeOutlined
              className="text-emerald-500"
              onClick={() => showRentalDetailsDrawer(record)}
            />
            <EditOutlined
              className="text-blue-500"
              onClick={() => showEditDrawer(record)}
            />
            <DeleteOutlined
              onClick={() => handleDelete(record.id)}
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
          dataSource={investmentData?.data?.data}
          // scroll={{ x: 1000 }}
          className="border border-slate-200 rounded-md"
          rowKey="id" // Correct rowKey
        />
        <Drawer
          title="Edit Asset Details"
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
                    min={1}
                    max={100}
                  />
                </Form.Item>
              </Col>

              {/* Guaranteed Rate */}
              <Col span={12}>
                <Form.Item
                  name="returnDate"
                  label="Return Date"
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
                  name="overdueDate"
                  label="Overdue Date"
                  rules={[
                    {
                      required: true,
                      message: "Please select an overdue date",
                    },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
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
                    options={["Active", "InActive"].map((quater) => ({
                      value: quater,
                      label: quater,
                    }))}
                  />
                </Form.Item>
              </Col>
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
        <RentalDrawer
          rental={selectedRental}
          visible={rentalDrawerVisible}
          onClose={closeRentalsDetailsDrawer}
        />
      </>
    );
  };

export default RentalTable;

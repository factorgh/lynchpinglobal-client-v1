"use client";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import {
  useDeleteLoanMutation,
  useGetLoansQuery,
  useUpdateLoanMutation,
} from "@/services/loan";
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
import LoanDrawer from "./loan-drawer";

/*************  ✨ Codeium Command ⭐  *************/
/**
 * WealthTable component renders a table of general investment expenses with functionalities
 * to add, edit, and delete entries. It includes a search feature for filtering data and a drawer
 * form for editing entries. The component uses Ant Design for UI elements and integrates with
 * a backend API to fetch and mutate investment data.
 */
/******  9086d653-a04c-4e0b-bac6-b7052991ffc2  *******/ const LoanTable =
  () => {
    const searchInput = useRef(null);
    const { data: investmentData, isFetching: investmentLoading } =
      useGetLoansQuery<any>(null);
    console.log(
      "-------------------------InvestmentData-------------------------"
    );
    console.log(investmentData);

    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editRentalId, setEditRentalId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [users, setUsers] = useState([]);
    const [form] = Form.useForm();

    const [updateInvestment, { isLoading }] = useUpdateLoanMutation();
    const [deleteInvestment] = useDeleteLoanMutation();
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [createActivity] = useCreateActivityLogMutation();
    console.log(selectedFiles);
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

    const [loanDrawerVisible, setLoanDrawerVisible] = useState(false);

    const [selectedLoan, setSelectedLoan] = useState(null);

    const closeLoansDetailsDrawer = () => {
      setSelectedLoan(null);
      setLoanDrawerVisible(false);
    };
    const showLoanDetailsDrawer = (asset: any) => {
      setSelectedLoan(asset);
      setLoanDrawerVisible(true);
    };

    const handleFileListChange = (fileList: any[]) => {
      setSelectedFiles(fileList);
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
        name: investment.name,
        loanAmount: toTwoDecimalPlaces(investment.loanAmount),
        managementFee: toTwoDecimalPlaces(investment.managementFee),
        overdueRate: toTwoDecimalPlaces(investment.overdueRate),
        quater: investment.quater,
        amountDue: toTwoDecimalPlaces(investment.amountDue),
        overdueDate: moment(investment.overdueDate),
        loanRate: toTwoDecimalPlaces(investment.loanRate),
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
            activity: "Loan Updated",
            description: "A loan entry was updated successfully",
            user: loggedInUser._id,
          }).unwrap();
          toast.success("Loan updated successfully");
        } else {
          toast.success("New Loan added successfully");
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
            activity: "Loan Deleted",
            description: "A loan entry was deleted",
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
        key: "userId",
        ...getColumnSearchProps("userId"),
        render: (value: any) => value?.name,
      },
      {
        title: "Loan Amount",
        dataIndex: "loanAmount",
        key: "loanAmount",
        ...getColumnSearchProps("loanAmount"),
        render: (value: any) => formatPriceGHS(value), // Format principal
      },
      {
        title: "Overdue Date",
        dataIndex: "dueDate",
        key: "dueDate",
        ...getColumnSearchProps("dueDate"),
        render: (value: any) => moment(value).format("YYYY-MM-DD"),
      },
      {
        title: "Overdue Rate",
        dataIndex: "overdueRate",
        key: "overdueRate",
        ...getColumnSearchProps("overdueRate"),
        render: (value: any) => `${toTwoDecimalPlaces(value)}%`, // Add "%" suffix
        // Format performance yield
      },

      {
        title: "Action",
        key: "action",
        render: (text: any, record: any) => (
          <div className="flex gap-3">
            <EyeOutlined
              className="text-emerald-500"
              onClick={() => showLoanDetailsDrawer(record)}
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
          dataSource={investmentData?.data?.data}
          // scroll={{ x: 1000 }}
          className="border border-slate-200 rounded-md"
          rowKey="id" // Correct rowKey
        />
        <Drawer
          title="Edit Loan"
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
                  name="dueDate"
                  label="Due Date"
                  rules={[
                    { required: true, message: "Please select due date" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              {/* Principal */}
              <Col span={12}>
                <Form.Item
                  name="loanAmount"
                  label="Loan Amount"
                  rules={[
                    {
                      required: true,
                      message: "Please enter the loan amount ",
                    },
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
                  name="quater"
                  label="Quarter"
                  rules={[
                    { required: true, message: "Please select a quater" },
                  ]}
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
                  rules={[
                    { required: true, message: "Please enter loan rate" },
                  ]}
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
              {/* Performance Yield */}

              {/* Guaranteed Rate */}
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
        <LoanDrawer
          loan={selectedLoan}
          visible={loanDrawerVisible}
          onClose={closeLoansDetailsDrawer}
        />
      </>
    );
  };

export default LoanTable;

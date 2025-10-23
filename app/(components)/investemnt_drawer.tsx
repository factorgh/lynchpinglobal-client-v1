import { formatMultipleCurrency, formatPriceGHS } from "@/lib/helper";
import { AiOutlineFilePdf } from "react-icons/ai";
import {
  useDeleteAddOnMutation,
  useUpdateAddOnMutation,
} from "@/services/addOn";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const { Text } = Typography;
const { Option } = Select;

interface AddOn {
  _id: string;
  amount: number;
  accruedInterest: number;
  startDate: Date;
  status: string;
}

interface InvestmentData {
  transactionId: string;
  name: string;
  principal: number;
  guaranteedRate: number;
  addOns: AddOn[];
  oneOffs: any[];
  principalAccruedReturn: number;
  addOnAccruedReturn: number;
  oneOffAccruedReturn: number;
  totalAccruedReturn: number;
  quarterEndDate: string;
  quarter: string;
  archived: boolean;
  active: boolean;
  startDate: Date;
  managementFee: number;
  performanceYield: number;
  certificate: string[];
  checklist: string[];
  mandate: string[];
  partnerForm: string[];
  lastModified: string;
  userId: any;
  managementFeeRate?: number;
}

const InvestmentDetailDrawer = ({ investment, visible, onClose }: any) => {
  const [form] = Form.useForm();
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const [updateAddOn] = useUpdateAddOnMutation();
  const [deleteAddOn] = useDeleteAddOnMutation();

  const handleEdit = (record: AddOn) => {
    setEditingAddOn(record);
    form.setFieldsValue({
      status: record.status,
      startDate: moment(record.startDate),
    });
    setEditModalVisible(true);
  };

  const handleDelete = (record: AddOn) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able t revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteAddOn(record._id).unwrap();
          Swal.fire("Deleted!", "Add-on has been deleted.", "success");
        } catch (error) {
          Swal.fire("Error!", "Failed to delete add-on.", "error");
        }
      }
    });
  };

  const handleFinishEdit = async (values: any) => {
    if (editingAddOn) {
      try {
        await updateAddOn({
          id: editingAddOn._id,
          data: {
            ...values,
            startDate: values.startDate.toISOString(),
          },
        }).unwrap();
        message.success("Add-on updated successfully");
        setEditModalVisible(false);
        setEditingAddOn(null);
      } catch (error) {
        message.error("Failed to update add-on");
      }
    }
  };

  const handleDeleteAddOff = (record: any) => {
    Modal.confirm({
      title: "Delete Add-off",
      content: "Are you sure you want to delete this add-off?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteAddOn({ id: record._id }).unwrap();
          message.success("Add-off deleted successfully");
        } catch (error) {
          message.error("Failed to delete add-off");
        }
      },
    });
  };

  const isPdfUrl = (url: string) => /\.pdf($|\?)/i.test(url);
  const handlePreviewOut = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Detect user role for admin-only controls
  const [userRole, setUserRole] = useState<string | null>(null);
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed?.role ?? null);
      }
    } catch (e) {
      // ignore parsing errors
    }
  }, []);

  const renderDocSection = (title: string, list?: string[]) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return (
      <div>
        <Title level={5}>{title}</Title>
        <Row gutter={16}>
          {list.map((url: string, index: number) => (
            <Col span={6} key={`${title}-${index}`}>
              <div className="mt-3 space-y-2">
                {isPdfUrl(url) ? (
                  <div
                    className="w-full h-40 border rounded overflow-hidden bg-gray-50"
                    onClick={() => handlePreviewOut(url)}
                  >
                    <embed src={url} type="application/pdf" className="w-full h-full" />
                  </div>
                ) : (
                  <AiOutlineFilePdf
                    size={40}
                    className="cursor-pointer text-red-500"
                    onClick={() => handlePreviewOut(url)}
                  />
                )}
                {userRole === "admin" && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewOut(url)}
                    size="small"
                  >
                    Preview
                  </Button>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const addOnColumns = [
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `GH₵${amount.toFixed(2)}`,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: Date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: AddOn) => (
        <div className="flex gap-2">
          <EditOutlined
            onClick={() => handleEdit(record)}
            className="text-blue-500 cursor-pointer"
          />
          <DeleteOutlined
            onClick={() => handleDelete(record)}
            className="text-red-500 cursor-pointer"
          />
        </div>
      ),
    },
  ];

  const addOffColumns = [
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: any) =>
        formatMultipleCurrency(amount, record.currency),
    },
    {
      title: "Currency",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Yield",
      dataIndex: "oneOffYield",
      key: "oneOffYield",
      render: (rate: number, record: any) =>
        formatMultipleCurrency(rate, record.currency),
    },
    {
      title: "Date Added",
      dataIndex: "dateOfEntry",
      key: "dateOfEntry",
      render: (date: Date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <DeleteOutlined onClick={() => handleDeleteAddOff(record)} />
      ),
    },
  ];

  return (
    <>
      <Drawer
        title="Investment Details"
        width={1000}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Card title="Investment Summary" bordered={false}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Transaction ID">
              {investment?.transactionId}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {investment?.userId?.displayName}
            </Descriptions.Item>
            <Descriptions.Item label="Ownership">
              {investment?.isJoint ? (
                <Tag color="blue">Joint</Tag>
              ) : (
                <Tag>Single</Tag>
              )}
            </Descriptions.Item>
            {Array.isArray(investment?.owners) && investment?.owners.length > 0 && (
              <Descriptions.Item label="Co-Owners">
                <div className="space-y-1">
                  {investment?.owners.map((o: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      {o?.user?.displayName || o?.user?.name || o?.user?.email || o?.user?._id}
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Start Date">
              {moment(investment?.startDate).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label="Principal">
              {formatPriceGHS(investment?.principal)}
            </Descriptions.Item>
            <Descriptions.Item label="Principal Accrued Return">
              {formatPriceGHS(investment?.principalAccruedReturn)}
            </Descriptions.Item>
            <Descriptions.Item label="Guaranteed Rate">
              {investment?.guaranteedRate}%
            </Descriptions.Item>
            <Descriptions.Item label="Addon Accrued Return">
              {formatPriceGHS(investment?.addOnAccruedReturn)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Accrued Return">
              {formatPriceGHS(investment?.totalAccruedReturn)}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter End Date">
              {moment(investment?.quarterEndDate).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              {investment?.quarter}
            </Descriptions.Item>
            <Descriptions.Item label="Management Fee Rate">
              {investment?.managementFeeRate ?? "-"}%
            </Descriptions.Item>
            <Descriptions.Item label="Management Fee">
              {formatPriceGHS(investment?.managementFee)}
            </Descriptions.Item>
            <Descriptions.Item label="Performance Yield">
              {formatPriceGHS(investment?.performanceYield)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Add-ons" bordered={false}>
          <Table
            columns={addOnColumns}
            dataSource={investment?.addOns}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="One-Offs" bordered={false}>
          <Table
            columns={addOffColumns}
            dataSource={investment?.oneOffs}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Investment Documents" bordered={false}>
          {renderDocSection("Certificates", investment?.certificate)}
          {renderDocSection("Partner Forms", investment?.partnerForm)}
          {renderDocSection("Checklists", investment?.checklist)}
          {renderDocSection("Mandates", investment?.mandate)}
          {renderDocSection("Others", investment?.others)}
        </Card>
      </Drawer>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        title="Edit Add-on"
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText="Update"
      >
        <Form form={form} layout="vertical" onFinish={handleFinishEdit}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InvestmentDetailDrawer;

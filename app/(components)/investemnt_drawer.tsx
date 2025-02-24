import { formatMultipleCurrency, formatPriceGHS } from "@/lib/helper";
import {
  useDeleteAddOnMutation,
  useUpdateAddOnMutation,
} from "@/services/addOn";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
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
import Image from "next/image";
import { useState } from "react";

const { Text } = Typography;

interface AddOn {
  _id: string;
  amount: number;
  accruedInterest: number;
  startDate: Date;
  status: string; // status is a string, can be 'active' or 'inactive'
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
  startDate:Date;
  managementFee: number;
  performanceYield: number;
  certificate: string[];
  checklist: string[]; // Array of document URLs (checklists)
  mandate: string[]; // Array of document URLs (mandates)
  partnerForm: string[]; // Array of document URLs (partner forms)
  lastModified: string;
}

const InvestmentDetailDrawer = ({ investment, visible, onClose }: any) => {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);

  const [form] = Form.useForm();
  const [updateAddOn, { isLoading: updatingAddOn }] = useUpdateAddOnMutation();
  const [deleteAddOn, { isLoading: deletingAddOn }] = useDeleteAddOnMutation();

  const handleEdit = (record: AddOn) => {
    setEditingAddOn(record);
    form.setFieldsValue({ status: record.status, startDate: record.startDate });
    setEditModalVisible(true);
  };

  const handleDelete = (record: AddOn) => {
    Modal.confirm({
      title: "Delete Add-on",
      content: "Are you sure you want to delete this add-on?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await deleteAddOn({ id: record._id }).unwrap();
          message.success("Add-on deleted successfully");
        } catch (error) {
          message.error("Failed to delete add-on");
        }
      },
    });
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
          message.success("Add-on deleted successfully");
        } catch (error) {
          message.error("Failed to delete add-on");
        }
      },
    });
  };

  const addOnColumns = [
    {
      title: "Add-on Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `GH₵${amount.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: AddOn) => (
        <div className="flex gap-2">
          <EditOutlined
            className="text-blue-500"
            onClick={() => handleEdit(record)}
          />
          <DeleteOutlined
            className="text-red-500"
            onClick={() => handleDelete(record)}
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
      key: "rdateOfEntry",
      render: (rate: number) => moment(rate).format("YYYY-MM-DD"),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any, index: number) => (
        <DeleteOutlined onClick={() => handleDeleteAddOff(record)} />
      ),
    },
  ];

  const handleFinishEdit = async (values: any) => {
    console.log(values);
    if (editingAddOn) {
      try {
        await updateAddOn({ id: editingAddOn._id, data: values });
        message.success("Add-on status updated successfully");
      } catch (error) {
        message.error("Failed to update add-on status");
      }
      // Close the modal
      handleCloseEdit();
    }
  };

  const handleCloseEdit = () => {
    setEditModalVisible(false);
    setEditingAddOn(null);
  };

  // Handle preview modal
  const handlePreview = (fileUrl: string) => {
    setPreviewFile(fileUrl); // Set the file URL to preview
    setIsPreviewVisible(true); // Open the modal for preview
  };

  // Close the preview modal
  const handleClosePreview = () => {
    setIsPreviewVisible(false);
    setPreviewFile(null);
  };

  const handlePreviewOut = (previewFile: string, index: number) => {
    setEditModalVisible(false);
    window.open(previewFile, "_blank");
  };
  return (
    <>
      <Drawer
        title={`Investment Details `}
        width={1000}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        {/* Investment Summary Section */}
        <Card title="Investment Summary" bordered={false}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Transaction ID">
              {investment?.transactionId}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {investment?.userId.displayName}
            </Descriptions.Item>
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
              {formatPriceGHS(investment?.addOnAccruedReturn?.toFixed(2))}
            </Descriptions.Item>
            <Descriptions.Item label="Total Accrued Return">
              {formatPriceGHS(investment?.totalAccruedReturn?.toFixed(2))}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter End Date">
              {new Date(investment?.quarterEndDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              {investment?.quarter}
            </Descriptions.Item>
            <Descriptions.Item label="Management Fee Rate">
              {investment?.managementFeeRate}%
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
          {investment?.addOns.length > 0 ? (
            <Table
              columns={addOnColumns}
              dataSource={investment?.addOns}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          ) : (
            <Tag color="orange">No add-ons added</Tag>
          )}
        </Card>
        <Card title="One-Offs" bordered={false}>
          {investment?.oneOffs.length > 0 ? (
            <Table
              columns={addOffColumns}
              dataSource={investment?.oneOffs}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          ) : (
            <Tag color="orange">No One Offs added </Tag>
          )}
        </Card>

        {/* Investment Documents Section */}
        <Card title="Investment Documents" bordered={false}>
          {investment?.certificate.length > 0 && (
            <div>
              <Title level={4}>Certificates</Title>
              <Row gutter={16}>
                {investment?.certificate.map(
                  (fileUrl: string, index: number) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Certificate ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  )
                )}
              </Row>
            </div>
          )}

          {investment?.checklist.length > 0 && (
            <div>
              <Title level={4}>Checklists</Title>
              <Row gutter={16}>
                {investment?.checklist.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      onClick={() => handlePreviewOut(fileUrl, index)}
                      hoverable
                    >
                      <Text>{`Checklist ${index + 1}`}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {investment?.mandate?.length > 0 && (
            <div>
              <Title level={4}>Mandates</Title>
              <Row gutter={16}>
                {investment?.mandate.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      hoverable
                      onClick={() => handlePreviewOut(fileUrl, index)}
                    >
                      <Text>{`Mandate ${index + 1}`}</Text>
                      <br />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {investment?.partnerForm.length > 0 && (
            <div>
              <Title level={4}>Partner Forms</Title>
              <Row gutter={16}>
                {investment?.partnerForm.map(
                  (fileUrl: string, index: number) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Partner Form ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  )
                )}
              </Row>
            </div>
          )}
          {investment?.others.length > 0 && (
            <div>
              <Title level={4}>Others</Title>
              <Row gutter={16}>
                {investment?.others.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      hoverable
                      onClick={() => handlePreviewOut(fileUrl, index)}
                    >
                      <Text>{`Others ${index + 1}`}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {!investment?.certificate.length &&
            !investment?.checklist.length &&
            !investment?.mandate.length &&
            !investment?.partnerForm.length && (
              <Tag color="red">No Documents available</Tag>
            )}
        </Card>
      </Drawer>

      {/* Preview Modal */}
      <Modal
        visible={isPreviewVisible}
        footer={null}
        onCancel={handleClosePreview}
        width={800}
      >
        {previewFile?.endsWith(".pdf") ? (
          <iframe
            src={previewFile}
            width="100%"
            height="600px"
            title="PDF Preview"
            frameBorder="0"
          />
        ) : (
          <Image
            src={previewFile!}
            alt="Document Preview"
            style={{ width: "100%", height: "auto" }}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        footer={null}
        onCancel={handleCloseEdit}
        width={400}
        title={`Edit Add-on Status`}
      >
        <Form form={form} onFinish={handleFinishEdit}>
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
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select a start date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Button
            loading={updatingAddOn}
            type="primary"
            htmlType="submit"
            block
          >
            Save Changes
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default InvestmentDetailDrawer;

import { formatPriceGHS } from "@/lib/helper";
import { useUpdateAddOnMutation } from "@/services/addOn";
import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Image,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import Title from "antd/es/typography/Title";
import { useState } from "react";

const { Text } = Typography;

interface AddOn {
  _id: string;
  amount: number;
  accruedInterest: number;
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
  managementFee: number;
  performanceYield: number;
  certificate: string[]; // Array of document URLs (certificates)
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

  const handleEdit = (record: AddOn, index: number) => {
    setEditingAddOn(record);
    form.setFieldsValue({ status: record.status });
    setEditModalVisible(true);
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
      render: (_: any, record: AddOn, index: number) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEdit(record, index)}
          size="small"
          type="link"
        >
          Edit
        </Button>
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

  // Utility function to render document previews (Image or Button for PDFs)
  const renderDocumentPreview = (fileUrl: string, index: number) => {
    if (fileUrl.endsWith(".pdf")) {
      return (
        <Button type="link" onClick={() => handlePreview(fileUrl)}>
          <Text strong>Preview PDF {index + 1}</Text>
        </Button>
      );
    } else {
      return (
        <Image
          src={fileUrl}
          alt={`Document ${index + 1}`}
          onClick={() => handlePreview(fileUrl)}
          style={{ cursor: "pointer" }}
        />
      );
    }
  };

  return (
    <>
      <Drawer
        title={`Investment Details - ${investment?.name}`}
        width={800}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        {/* Investment Summary Section */}
        <Card title="Investment Summary" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Transaction ID: </Text>
              {investment?.transactionId}
            </Col>
            <Col span={12}>
              <Text strong>Name: </Text>
              {investment?.name}
            </Col>

            <Col span={12}>
              <Text strong>Principal: </Text>GH{investment?.principal}
            </Col>
            <Col span={12}>
              <Text strong>Guaranteed Rate: </Text>
              {investment?.guaranteedRate}%
            </Col>
            <Col span={12}>
              <Text strong>Principal Accrued Return: </Text>
              {formatPriceGHS(investment?.principalAccruedReturn.toFixed(2))}
            </Col>
            <Col span={12}>
              <Text strong>Addon Accrued Return: </Text>
              {formatPriceGHS(investment?.addOnAccruedReturn.toFixed(2))}
            </Col>
            <Col span={12}>
              <Text strong>Total Accrued Return: </Text>
              {formatPriceGHS(investment?.totalAccruedReturn.toFixed(2))}
            </Col>
            <Col span={12}>
              <Text strong>Quarter End Date: </Text>
              {new Date(investment?.quarterEndDate).toLocaleDateString()}
            </Col>
            <Col span={12}>
              <Text strong>Quarter: </Text>
              {investment?.quarter}
            </Col>
            <Col span={12}>
              <Text strong>Management Fee: </Text>
              {investment?.managementFee}%
            </Col>
            <Col span={12}>
              <Text strong>Performance Yield: </Text>
              {formatPriceGHS(investment?.performanceYield)}
            </Col>
          </Row>
        </Card>

        <Card title="Add-ons" bordered={false}>
          {investment?.addOns.length > 0 ? (
            <Table
              columns={addOnColumns}
              dataSource={investment?.addOns}
              rowKey="_id" // Assuming 'name' is unique in the AddOn array, otherwise use a different field like 'id'
              pagination={false}
              size="small"
            />
          ) : (
            <Tag color="orange">No add-ons</Tag>
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
                        cover={renderDocumentPreview(fileUrl, index)}
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
                      hoverable
                      cover={renderDocumentPreview(fileUrl, index)}
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
                      cover={renderDocumentPreview(fileUrl, index)}
                    >
                      <Text>{`Mandate ${index + 1}`}</Text>
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
                        cover={renderDocumentPreview(fileUrl, index)}
                      >
                        <Text>{`Partner Form ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  )
                )}
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

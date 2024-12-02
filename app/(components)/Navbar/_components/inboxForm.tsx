import { formatPriceGHS } from "@/lib/helper";
import { useGetAdminsQuery } from "@/services/auth";
import { useCreateNotificationMutation } from "@/services/notifications";
import { Alert, Col, Form, InputNumber, Modal, Select, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRef } from "react";
import { toast } from "react-toastify";

interface Admin {
  _id: string;
  name: string;
  // Define other fields for admin if necessary
}

const InboxForm = ({ showInboxForm, setShowInboxForm }: any) => {
  const [form] = useForm();
  const formRef: any = useRef(null);
  const [createNotification, { isLoading, isError, error }] =
    useCreateNotificationMutation();
  const {
    data: adminsData,
    isLoading: adminsLoading,
    isError: adminsError,
  } = useGetAdminsQuery(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  console.log(adminsData?.users);

  const onFinish = async (values: any) => {
    console.log("Received values of form:", values);
    try {
      // Send notification to admin and close the modal
      await createNotification({
        title: "Request Form",
        message: `I would love to have a new ${
          values.type
        } request for ${formatPriceGHS(values.amount)}.Customer name: ${
          currentUser.name
        }`,
        users: adminsData?.users.map((admin: any) => admin._id),
      });
      toast.success("Request sent successfully");
      setShowInboxForm(false); // Close modal after submit
    } catch (error) {
      toast.error("Failed to send request: " + error);
      setShowInboxForm(false); // Close modal after error
    }
  };

  const handleSubmit = () => {
    formRef.current?.submit(); // Trigger form submit manually
  };

  if (adminsLoading) {
    return <Spin size="small" />;
  }

  if (adminsError) {
    return <Alert message="Error loading admins" type="error" />;
  }

  return (
    <Modal
      open={showInboxForm}
      onCancel={() => setShowInboxForm(false)}
      title="Compose New Request"
      width={500}
      centered={true}
      okText="Send"
      onOk={handleSubmit}
      confirmLoading={isLoading} // Show loading indicator while the notification is being created
    >
      <Form layout="vertical" ref={formRef} form={form} onFinish={onFinish}>
        {/* Select field with a 'name' prop */}
        <Form.Item
          name="type"
          label="Request Type"
          rules={[{ required: true, message: "Please select a request type!" }]}
        >
          <Select placeholder="Select Type">
            <Select.Option value="payment">Payment</Select.Option>
            <Select.Option value="withdrawal">Withdrawal</Select.Option>
          </Select>
        </Form.Item>

        {/* InputNumber with 'name' prop */}
        <Col span={24}>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter an amount!" }]}
          >
            <InputNumber placeholder="Enter Amount" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Form>
    </Modal>
  );
};

export default InboxForm;

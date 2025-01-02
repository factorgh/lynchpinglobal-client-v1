import { formatPriceGHS } from "@/lib/helper";
import { Card, Col, Descriptions, Drawer, Row, Tag, Typography } from "antd";
import moment from "moment";

interface Loan {
  loanAmount: number;
  overdueRate: number;
  loanRate: number;
  quater: string;
  amountDue?: number;
  status: string;
  overdueDate: string;
  agreements: string[];
  others: string[];
  mandate: string[]; // Added missing property
}

const { Text, Title } = Typography;

const LoanDrawer = ({
  visible,
  onClose,
  loan,
}: {
  visible: boolean;
  onClose: () => void;
  loan?: any;
}) => {
  const handlePreviewOut = (url: string) => {
    window.open(url, "_blank");
  };

  const renderAgreements = () => {
    if (loan?.agreements?.length) {
      return (
        <div>
          <Title level={4}>Agreements</Title>
          <Row gutter={16}>
            {loan?.agreements.map((fileUrl: any, index: any) => (
              <Col span={8} key={index}>
                <Card hoverable onClick={() => handlePreviewOut(fileUrl)}>
                  <Text>{`Agreements ${index + 1}`}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
    return null;
  };
  const renderOthers = () => {
    if (loan?.others?.length) {
      return (
        <div>
          <Title level={4}>Mandates</Title>
          <Row gutter={16}>
            {loan.others.map((fileUrl: any, index: any) => (
              <Col span={8} key={index}>
                <Card hoverable onClick={() => handlePreviewOut(fileUrl)}>
                  <Text>{`Agreements ${index + 1}`}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
    return null;
  };

  return (
    <Drawer
      title="Loan Details"
      placement="right"
      closable={true}
      onClose={onClose}
      open={visible} // Updated from `visible` to `open`
      width={600}
    >
      {loan ? (
        <>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Loan Amount">
              {formatPriceGHS(loan.loanAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="Overdue Rate">
              {loan.overdueRate}%
            </Descriptions.Item>
            <Descriptions.Item label="Loan Rate">
              {loan.loanRate}%
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              <Tag color="blue">{loan.quater}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount Due">
              {loan.amountDue ? formatPriceGHS(loan.amountDue) : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={loan.status === "Active" ? "green" : "red"}>
                {loan.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Overdue Date">
              {loan.dueDate
                ? moment(loan.dueDate).format("MMM D, YYYY")
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
          <div className="mt-4">
            {renderAgreements()}
            {renderOthers()}
          </div>
        </>
      ) : (
        <p>No loan details available</p>
      )}
    </Drawer>
  );
};

export default LoanDrawer;

import { formatPriceGHS } from "@/lib/helper";
import { Card, Col, Descriptions, Drawer, Row, Tag, Typography } from "antd";

interface Rental {
  assetClass: string;
  assetDesignation: number;
  amountDue: number;
  overdueRate: number;
  quater: string;
  returnDate: string;
  status: string;
  agreements: string[];
  others: string[];
  active: boolean;
}
const { Text, Title } = Typography;

const RentalDrawer = ({ visible, onClose, rental }: any) => {
  const handlePreviewOut = (url: string) => {
    window.open(url, "_blank");
  };

  const renderAgreements = () => {
    if (rental?.agreements?.length) {
      return (
        <div>
          <Title level={4}>Agreements</Title>
          <Row gutter={16}>
            {rental?.agreements.map((fileUrl: any, index: any) => (
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
    if (rental?.others?.length) {
      return (
        <div>
          <Title level={4}>Others</Title>
          <Row gutter={16}>
            {rental.others.map((fileUrl: any, index: any) => (
              <Col span={8} key={index}>
                <Card hoverable onClick={() => handlePreviewOut(fileUrl)}>
                  <Text>{`Others ${index + 1}`}</Text>
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
      title="Rental Details"
      onClose={onClose}
      visible={visible}
      width={600}
    >
      {rental ? (
        <>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Asset Class">
              {rental.assetClass}
            </Descriptions.Item>
            <Descriptions.Item label="Asset Designation">
              {rental.assetDesignation}
            </Descriptions.Item>
            <Descriptions.Item label="Amount Due">
              {formatPriceGHS(rental.amountDue)}
            </Descriptions.Item>
            <Descriptions.Item label="Overdue Rate">
              {formatPriceGHS(rental.overdueFee)}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              <Tag color="blue">{rental.quater}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Return Date">
              {new Date(rental.returnDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={rental.status === "Active" ? "green" : "red"}>
                {rental.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-4">
            {renderAgreements()}
            {renderOthers()}
          </div>
        </>
      ) : (
        <p>No rental details available</p>
      )}
    </Drawer>
  );
};

export default RentalDrawer;

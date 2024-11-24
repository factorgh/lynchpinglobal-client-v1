import { formatPriceGHS } from "@/lib/helper";
import { Button, Card, Col, Drawer, List, Row, Tag, Typography } from "antd";
import { useState } from "react";
import Zoom from "react-medium-image-zoom"; // Import the zoom component

const { Title, Text } = Typography;

interface AddOn {
  name: string;
  accruedInterest: number;
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
  pdf: string[]; // These are now PNG URLs
  lastModified: string;
}

const InvestmentDetailDrawer = ({ investment, visible, onClose }: any) => {
  const [imageIndex, setImageIndex] = useState<number>(0);

  // Function to move to the next image
  const goToNextImage = () => {
    if (imageIndex < investment?.pdf.length - 1) {
      setImageIndex(imageIndex + 1);
    }
  };

  // Function to move to the previous image
  const goToPreviousImage = () => {
    if (imageIndex > 0) {
      setImageIndex(imageIndex - 1);
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

        {/* Add-ons Section */}
        <Card title="Add-ons" bordered={false}>
          {investment?.addOns.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={investment?.addOns}
              renderItem={(addOn: any) => (
                <List.Item>
                  <Text strong>{addOn.name}: </Text>
                  {addOn.accruedInterest}%
                </List.Item>
              )}
            />
          ) : (
            <Tag color="orange">No add-ons</Tag>
          )}
        </Card>

        {/* One-Offs (Add-offs) Section */}
        <Card title="One-Offs (Add-offs)" bordered={false}>
          {investment?.oneOffs.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={investment?.oneOffs}
              renderItem={(oneOff: any) => (
                <List.Item>
                  <Text strong>{oneOff.name}: </Text>
                  {formatPriceGHS(oneOff.accruedInterest)}{" "}
                  {/* Format the return */}
                </List.Item>
              )}
            />
          ) : (
            <Tag color="orange">No one-offs</Tag>
          )}
        </Card>

        {/* Investment Documents Section */}
        <Card title="Investment Documents (PNG)" bordered={false}>
          {investment?.pdf.length > 0 ? (
            <div>
              <p>
                Viewing Image {imageIndex + 1} of {investment?.pdf.length}
              </p>
              {/* Full-Screen Image Zoom */}
              <Zoom zoomMargin={20}>
                <img
                  src={investment?.pdf[imageIndex]} // Image URL from Cloudinary
                  alt={`Investment Document ${imageIndex + 1}`}
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    cursor: "zoom-in",
                  }}
                />
              </Zoom>
              <br />
              <div>
                <Button onClick={goToPreviousImage} disabled={imageIndex <= 0}>
                  Previous Image
                </Button>
                <Button
                  onClick={goToNextImage}
                  disabled={imageIndex >= investment?.pdf.length - 1}
                >
                  Next Image
                </Button>
              </div>
            </div>
          ) : (
            <Tag color="red">No Documents available</Tag>
          )}
        </Card>
      </Drawer>
    </>
  );
};

export default InvestmentDetailDrawer;

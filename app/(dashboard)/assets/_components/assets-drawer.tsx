import { formatPriceGHS } from "@/lib/helper";
import { Card, Col, Descriptions, Drawer, Row, Tag, Typography } from "antd";
import Title from "antd/es/typography/Title";
import { useState } from "react";

const { Text } = Typography;

interface AddOn {
  _id: string;
  amount: number;
  accruedInterest: number;
  status: string; // status is a string, can be 'active' or 'inactive'
}

export interface AssetModel {
  user: string; // Reference to the User model
  assetName: string; // Name of the asset
  assetClass: string; // Class/category of the asset
  assetDesignation: string; // Designation or identifier for the asset
  assetValue: number; // Designation or identifier for the asset
  accruedInterest: number; // Accrued interest on the asset
  maturityDate: Date; // Maturity date of the asset
  managementFee: number; // Management fee associated with the asset
  quarter: "Q1" | "Q2" | "Q3" | "Q4"; // Current quarter
  assetImage?: string; // Optional image for the asset
  timeCourse: string; // Duration/period of the investment
  mandate: string[]; // Array of document URLs for mandates
  certificate: string[]; // Array of document URLs for certificates
  partnerForm: string[]; // Array of document URLs for partner forms
  checklist: string[]; // Array of document URLs for checklists
  others: string[]; // Array of other associated documents
  active: boolean; // Indicates whether the asset is active
  createdAt?: Date; // Auto-generated creation timestamp
  updatedAt?: Date; // Auto-generated update timestamp
}
const AssetsDrawer = ({ assets, visible, onClose }: any) => {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

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
  // const renderDocumentPreview = (fileUrl: string, index: number) => {
  //   if (fileUrl.endsWith(".pdf")) {
  //     return (
  //       <Button type="link" onClick={() => handlePreview(fileUrl)}>
  //         <Text strong>Preview PDF {index + 1}</Text>
  //       </Button>
  //     );
  //   } else {
  //     return (
  //       <Image
  //         src={fileUrl}
  //         alt={`Document ${index + 1}`}
  //         onClick={() => handlePreview(fileUrl)}
  //         style={{ cursor: "pointer" }}
  //       />
  //     );
  //   }
  // };
  const handlePreviewOut = (previewFile: string, index: number) => {
    setEditModalVisible(false);
    window.open(previewFile, "_blank");
  };

  return (
    <>
      <Drawer
        title={`Asset Details - ${assets?.assetName}`}
        width={1000}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        {/* Investment Summary Section */}
        <Card title="Asset Summary" bordered={false}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Asset Name">
              {assets?.assetName}
            </Descriptions.Item>
            <Descriptions.Item label="Asset Class">
              {assets?.assetClass}
            </Descriptions.Item>
            <Descriptions.Item label="Asset Designation">
              {assets?.assetDesignation}
            </Descriptions.Item>
            <Descriptions.Item label="Asset Value">
              {formatPriceGHS(assets?.assetValue)}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              {assets?.quater}
            </Descriptions.Item>
            <Descriptions.Item label="Time Course">
              {assets?.timeCourse}
            </Descriptions.Item>
            <Descriptions.Item label="Maturity Date">
              {new Date(assets?.maturityDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Management Fee">
              {formatPriceGHS(assets?.managementFee)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Investment Documents Section */}
        <Card title="Investment Documents" bordered={false}>
          {assets?.certificate.length > 0 && (
            <div>
              <Title level={4}>Certificates</Title>
              <Row gutter={16}>
                {assets?.certificate.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      hoverable
                      onClick={() => handlePreviewOut(fileUrl, index)}
                    >
                      <Text>{`Certificate ${index + 1}`}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {assets?.checklist.length > 0 && (
            <div>
              <Title level={4}>Checklists</Title>
              <Row gutter={16}>
                {assets?.checklist.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      hoverable
                      onClick={() => handlePreviewOut(fileUrl, index)}
                    >
                      <Text>{`Checklist ${index + 1}`}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {assets?.mandate?.length > 0 && (
            <div>
              <Title level={4}>Mandates</Title>
              <Row gutter={16}>
                {assets?.mandate.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      hoverable
                      onClick={() => handlePreviewOut(fileUrl, index)}
                    >
                      <Text>{`Mandate ${index + 1}`}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {assets?.partnerForm.length > 0 && (
            <div>
              <Title level={4}>Partner Forms</Title>
              <Row gutter={16}>
                {assets?.partnerForm.map((fileUrl: string, index: number) => (
                  <Col span={8} key={index}>
                    <Card
                      hoverable
                      onClick={() => handlePreviewOut(fileUrl, index)}
                    >
                      <Text>{`Partner Form ${index + 1}`}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {!assets?.certificate.length &&
            !assets?.checklist.length &&
            !assets?.mandate.length &&
            !assets?.partnerForm.length && (
              <Tag color="red">No Documents available</Tag>
            )}
        </Card>
      </Drawer>
    </>
  );
};

export default AssetsDrawer;

import { formatPriceGHS } from "@/lib/helper";
import { Descriptions, Drawer, Tag } from "antd";

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

const RentalDrawer = ({ visible, onClose, rental }: any) => {
  return (
    <Drawer
      title="Rental Details"
      onClose={onClose}
      visible={visible}
      width={600}
    >
      {rental ? (
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
            {rental.overdueRate}%
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
      ) : (
        <p>No rental details available</p>
      )}
    </Drawer>
  );
};

export default RentalDrawer;

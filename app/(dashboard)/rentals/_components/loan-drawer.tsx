import { formatPriceGHS } from "@/lib/helper";
import { Descriptions, Drawer, Tag } from "antd";

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
}

const LoanDrawer = ({ visible, onClose, loan }: any) => {
  return (
    <Drawer
      title="Loan Details"
      placement="right"
      closable={true}
      onClose={onClose}
      visible={visible}
      width={600}
    >
      {loan ? (
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
            {new Date(loan.overdueDate).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p>No loan details available</p>
      )}
    </Drawer>
  );
};

export default LoanDrawer;

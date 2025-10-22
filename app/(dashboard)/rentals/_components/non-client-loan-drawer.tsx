"use client";

import { Descriptions, Drawer, Tag } from "antd";
import React from "react";
import { formatPriceGHS } from "@/lib/helper";

interface NonClientLoanDrawerProps {
  loan: any | null;
  visible: boolean;
  onClose: () => void;
}

const NonClientLoanDrawer: React.FC<NonClientLoanDrawerProps> = ({ loan, visible, onClose }) => {
  return (
    <Drawer title="Non-Client Loan Details" placement="right" width={420} onClose={onClose} open={visible}>
      {loan && (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">{loan.externalName}</Descriptions.Item>
          <Descriptions.Item label="Phone">{loan.externalPhone}</Descriptions.Item>
          <Descriptions.Item label="Ghana Card">{loan.externalGhanaCard}</Descriptions.Item>
          <Descriptions.Item label="Loan Amount">{formatPriceGHS(loan.loanAmount)}</Descriptions.Item>
          <Descriptions.Item label="Loan Rate">{loan.loanRate}%</Descriptions.Item>
          <Descriptions.Item label="Overdue Rate">{loan.overdueRate}%</Descriptions.Item>
          <Descriptions.Item label="Quarter">{loan.quater}</Descriptions.Item>
          <Descriptions.Item label="Amount Due">{formatPriceGHS(loan.amountDue)}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={loan.status === "Active" ? "green" : "default"}>{loan.status}</Tag>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  );
};

export default NonClientLoanDrawer;

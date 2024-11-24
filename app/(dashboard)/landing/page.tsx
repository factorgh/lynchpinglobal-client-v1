"use client";

import DashboardItemCustomer from "@/app/(components)/dashboardItemCustomer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Pagination, Table } from "antd";
import {
  ArrowDownCircle,
  Briefcase,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";

const dataSource = [
  {
    key: "1", // Use key as the unique identifier
    client: "John Anderson",
    description: "Tesla Model 3",
    amount: "$850.00",
    date: "2024-11-08",
    status: "Completed",
  },
  {
    key: "2",
    client: "Sarah Wilson",
    description: "Ford Mustang",
    amount: "$1,200.00",
    date: "2024-11-10",
    status: "Pending",
  },
];

const CustomerLanding = () => {
  return (
    <div>
      <Wrapper>
        <div className="grid grid-cols-4 gap-4">
          <DashboardItemCustomer
            item={{
              title: "Principal",
              number: 80000,
              change: 10,
              icon: <DollarSign />, // Money-related icon
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Total Accrued Interest",
              number: 2500.56,
              change: 10,
              icon: <TrendingUp />, // Interest or growth-related icon
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Add Ons",
              number: 7000,
              change: 10,
              icon: <Briefcase />, // Add-ons or portfolio-related icon
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Assets",
              number: 123,
              change: 10,
              icon: <Home />,
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Loans",
              number: 123,
              change: 10,
              icon: <FileText />,
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Rentals",
              number: 123,
              change: 10,
              icon: <Home />,
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Accrued Addon Interest",
              number: 300.25,
              change: 10,
              icon: <CreditCard />,
            }}
          />
          <DashboardItemCustomer
            item={{
              title: "Withdrawals",
              number: 300.25,
              change: 10,
              icon: <ArrowDownCircle />,
            }}
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest withdrawal transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <PaginatedTable data={dataSource} />
          </CardContent>
        </Card>
      </Wrapper>
    </div>
  );
};

const PaginatedTable = ({ data }: { data: Array<any> }) => {
  const pageSize = 5; // Number of items per page
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const columns = [
    {
      title: "Client", // Changed from 'ID' to 'Client'
      dataIndex: "client", // Should match data source field
      key: "client",
    },
    {
      title: "Description", // Updated title to match data
      dataIndex: "description", // Should match data source field
      key: "description",
    },
    {
      title: "Amount", // Corrected
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Date", // Corrected
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status", // Corrected
      dataIndex: "status",
      key: "status",
    },
  ];

  return (
    <div>
      {/* Table */}
      <Table
        columns={columns}
        dataSource={paginatedData}
        pagination={false} // Disable AntD pagination as we will use custom pagination
        rowKey="key" // Key should match the unique field in dataSource
      />

      {/* Pagination */}
      <Pagination
        total={data.length}
        current={currentPage}
        pageSize={pageSize}
        onChange={(page) => setCurrentPage(page)}
        className="mt-4"
      />
    </div>
  );
};

export default CustomerLanding;

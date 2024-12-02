"use client";

import { Card } from "@/components/ui/card";

import {
  AccountBookOutlined,
  AuditOutlined,
  BlockOutlined,
  DollarOutlined,
  PieChartOutlined,
  PlusCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { Divider, Pagination, Table } from "antd";
import { HandCoins } from "lucide-react";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import AssetsUnder from "./_components/assetsUnder";
import CustomCard from "./_components/customCard";
import CustomList from "./_components/customList";
import CustomSlider from "./_components/customSlider";
import LandingCard from "./_components/landingCard";

const dataSource = [
  {
    key: "1",
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
    <div className="  ">
      <Wrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
          {/* first card */}
          <Card className="p-5 flex flex-col gap-8  justify-start ">
            <div className="flex justify-between items-center ">
              <h3 className="mt-6 text-md">TOTAL BALANCE</h3>
              <DollarOutlined className="text-2xl" />
            </div>
            <p className="text-4xl font-bold">$10,000</p>
            <p>Last updated: 2024-11-08</p>
            <div className="mt-2 h-1 w-full bg-gradient-to-r from-sky-400 to-green-400 rounded-full "></div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 col-span-2 ">
            <LandingCard
              icon={<HandCoins />}
              title="PRINCIPAL"
              amount="$24,000"
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ACCRUED INTEREST"
              amount="15%"
            />
            <LandingCard
              icon={<PlusCircleOutlined />}
              title="ADD ONS"
              amount="$8,000"
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ADD ON INTEREST"
              amount="$16,000"
            />
          </div>

          <CustomSlider />
        </div>
        <Divider className="bg-white" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <CustomCard
              icon={<AccountBookOutlined />}
              title="MANAGEMENT FEE"
              amount="1200"
            />
            <CustomCard
              icon={<AuditOutlined />}
              title="PERFORMANCE YIELD"
              amount="150"
            />
            <CustomCard icon={<RiseOutlined />} title="ADD OFFS" amount="15%" />
            <CustomCard
              icon={<BlockOutlined />}
              title="OPERATIONAL COST"
              amount="150"
            />
            <CustomCard icon={<RiseOutlined />} title="Additions" amount="0" />
            <CustomCard icon={<RiseOutlined />} title="More" amount="0" />
          </div>
          <Card className="p-3 ">
            <AssetsUnder />
          </Card>
          <Card className="p-3">
            <CustomList />
          </Card>
        </div>
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

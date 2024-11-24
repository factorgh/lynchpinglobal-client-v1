"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPriceGHS } from "@/lib/helper";
import { Pagination, Table, Tag } from "antd";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";

const sampleData = [
  {
    key: 1,
    id: 1,
    name: "Investment A",
    amount: 10000,
    date: "2024-11-01",
    status: "Active",
  },
  {
    key: 2,
    id: 2,
    name: "Investment B",
    amount: 15000,
    date: "2024-11-15",
    status: "Closed",
  },
  {
    key: 3,
    id: 3,
    name: "Investment C",
    amount: 7500,
    date: "2024-12-01",
    status: "Closed",
  },
  // Add more data as needed
];

const PortfolioPage = () => {
  return (
    <div className=" min-h-screen p-8 bg-slate-50">
      {" "}
      {/* Background and shadow for the page */}
      <Wrapper>
        <div>
          <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
          <Tabs defaultValue="investment">
            {/* Tab List */}
            <TabsList className="mb-6">
              <TabsTrigger value="investment">Investment</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="rentals">Rentals</TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="investment">
              <h2 className="text-lg font-semibold mb-2">Investment</h2>
              <PaginatedTable data={sampleData} />
            </TabsContent>

            <TabsContent value="assets">
              <h2 className="text-lg font-semibold mb-2">Assets</h2>
              <PaginatedTable data={sampleData} />
            </TabsContent>

            <TabsContent value="loans">
              <h2 className="text-lg font-semibold mb-2">Loans</h2>
              <PaginatedTable data={sampleData} />
            </TabsContent>

            <TabsContent value="rentals">
              <h2 className="text-lg font-semibold mb-2">Rentals</h2>
              <PaginatedTable data={sampleData} />
            </TabsContent>
          </Tabs>
        </div>
      </Wrapper>
    </div>
  );
};

// Paginated Table Component
const PaginatedTable = ({ data }: { data: Array<any> }) => {
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: string) => <span>{formatPriceGHS(Number(amount))}</span>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "green";
        if (status === "Closed") {
          color = "red";
        }

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div>
      {/* Table */}
      <Table
        columns={columns}
        dataSource={paginatedData}
        pagination={false}
        rowKey="id"
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

export default PortfolioPage;

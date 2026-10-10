"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPriceGHS } from "@/lib/helper";
import { Card, Pagination, Table, Tag } from "antd";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import CustomerInvestment from "./_components/customerInvestment";
import CustomerLoan from "./_components/customerLoan";

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
    <Wrapper>
      <div className="py-5 text-white mb-6 select-none">
        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          My Portfolio & Mandates
        </h1>
        <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
          View all your mandate participations, lending transactions, and portfolio records
        </p>
      </div>

      <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
        <Tabs defaultValue="investment" className="w-full" data-tour="portfolio-tabs">
          {/* Tab List */}
          <div className="border-b border-slate-100 pb-3 mb-5">
            <TabsList data-tour="portfolio-tab-list">
              <TabsTrigger value="investment">Mandates</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="assets">Asset Transactions</TabsTrigger>
              <TabsTrigger value="rentals">Rentals</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="investment">
            <div data-tour="positions-table">
              <CustomerInvestment />
            </div>
          </TabsContent>

          <TabsContent value="assets">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <img
                src="/fallback.png"
                alt="Coming soon"
                className="max-w-[180px] h-auto mb-3 opacity-75"
              />
              <p className="text-xs text-slate-500 font-medium">
                Asset documentation is currently being compiled.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="loans">
            <div data-tour="customer-loans">
              <CustomerLoan />
            </div>
          </TabsContent>

          <TabsContent value="rentals">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <img
                src="/fallback.png"
                alt="Coming soon"
                className="max-w-[180px] h-auto mb-3 opacity-75"
              />
              <p className="text-xs text-slate-500 font-medium">
                No active rental agreements found for this period.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Wrapper>
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
    <Card>
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
    </Card>
  );
};

export default PortfolioPage;

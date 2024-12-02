"use client";

import { Card } from "@/components/ui/card";
import { useGetAllInvestmentsQuery } from "@/services/investment";
import {
  DollarOutlined,
  PieChartOutlined,
  PlusCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { Divider, Pagination, Table } from "antd";
import { HandCoins } from "lucide-react";
import { useEffect, useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import AssetsUnder from "./_components/assetsUnder";
import CustomCard from "./_components/customCard";
import CustomList from "./_components/customList";
import CustomSlider from "./_components/customSlider";
import LandingCard from "./_components/landingCard";

const CustomerLanding = () => {
  const { data: userInvestments } = useGetAllInvestmentsQuery(null); // Fetch user investments data

  const [totalBalance, setTotalBalance] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [accruedInterest, setAccruedInterest] = useState(0);
  const [addOns, setAddOns] = useState(0);
  const [addonAccruedReturn, setAddonAccruedReturn] = useState(0);

  useEffect(() => {
    if (userInvestments?.data) {
      // Filter investments where archived is false
      const activeInvestments = userInvestments.data.filter(
        (investment: any) => !investment.archived
      );

      let totalPrincipal = 0;
      let totalAccruedInterest = 0;
      let totalAddOns = 0;
      let totalAddonAccruedReturn = 0;

      // Calculate the totals
      activeInvestments.forEach((investment: any) => {
        totalPrincipal += investment.principal;
        totalAccruedInterest += investment.totalAccruedReturn;
        totalAddOns += investment.addOns.reduce(
          (sum: any, addOn: any) => sum + (addOn.amount || 0),
          0
        ); // Assuming addOn has amount
        totalAddonAccruedReturn += investment.addOnAccruedReturn;
      });

      const totalCalculatedBalance =
        totalPrincipal +
        totalAccruedInterest +
        totalAddOns +
        totalAddonAccruedReturn;

      // Set the calculated values to state
      setTotalBalance(totalCalculatedBalance);
      setPrincipal(totalPrincipal);
      setAccruedInterest(totalAccruedInterest);
      setAddOns(totalAddOns);
      setAddonAccruedReturn(totalAddonAccruedReturn);
    }
  }, [userInvestments]);

  return (
    <div className="  ">
      <Wrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-5">
          {/* first card */}
          <Card className="p-5 flex flex-col gap-8 justify-start ">
            <div className="flex justify-between items-center ">
              <h3 className="mt-6 text-md">TOTAL BALANCE</h3>
              <DollarOutlined className="text-2xl" />
            </div>
            <p className="text-4xl font-bold">
              ${totalBalance.toLocaleString()}
            </p>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <div className="mt-2 h-1 w-full bg-gradient-to-r from-sky-400 to-green-400 rounded-full "></div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 col-span-2">
            <LandingCard
              icon={<HandCoins />}
              title="PRINCIPAL"
              amount={`$${principal.toLocaleString()}`}
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ACCRUED INTEREST"
              amount={`${((accruedInterest / principal) * 100).toFixed(2)}%`}
            />
            <LandingCard
              icon={<PlusCircleOutlined />}
              title="ADD ONS"
              amount={`$${addOns.toLocaleString()}`}
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ADD ON INTEREST"
              amount={`$${addonAccruedReturn.toLocaleString()}`}
            />
          </div>

          <div className="col-span-2">
            <CustomSlider />
          </div>
        </div>
        <Divider className="bg-white" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <CustomCard
              icon={<PlusCircleOutlined />}
              title="MANAGEMENT FEE"
              amount="1200"
            />
            <CustomCard
              icon={<PlusCircleOutlined />}
              title="PERFORMANCE YIELD"
              amount="150"
            />
            <CustomCard icon={<RiseOutlined />} title="ADD OFFS" amount="15%" />
            <CustomCard
              icon={<PlusCircleOutlined />}
              title="OPERATIONAL COST"
              amount="150"
            />
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

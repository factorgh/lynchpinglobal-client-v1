"use client";

import { Card } from "@/components/ui/card";
import { formatPriceGHS } from "@/lib/helper";
import { useGetUserAssetsQuery } from "@/services/assets";
import { useGetUserInvestmentsQuery } from "@/services/investment";
import { useGetUserPaymentsQuery } from "@/services/payments";
import {
  MinusCircleOutlined,
  PieChartOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Divider, Pagination, Table } from "antd";
import { HandCoins, LucideCreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import Wrapper from "../wealth/_components/wapper";
import AssetsUnder from "./_components/assetsUnder";
import CustomCard from "./_components/customCard";
import CustomList from "./_components/customList";
import CustomSlider from "./_components/customSlider";
import LandingCard from "./_components/landingCard";

const CustomerLanding = () => {
  const { data: userInvestments } = useGetUserInvestmentsQuery(null);
  const { data: userPayments, isFetching: isFetchingPayment } =
    useGetUserPaymentsQuery(null);

  const [totalBalance, setTotalBalance] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [accruedInterest, setAccruedInterest] = useState(0);
  const [addOns, setAddOns] = useState(0);
  const [oneOffs, setOneOffs] = useState(0);
  const [addonAccruedReturn, setAddonAccruedReturn] = useState(0);
  const [managementFee, setManagementFee] = useState(0);
  const [performanceYield, setPerformanceYield] = useState(0);
  const [operationalCost, setOperationalCost] = useState(0);
  const [guaranteedRate, setGuaranteedRate] = useState(0);
  const [activeInves, setActiveInves] = useState([]);
  const [quarter, setQuarter] = useState("");

  //  others
  const { data: assetsData, isFetching } = useGetUserAssetsQuery(null);
  console.log(assetsData?.data.data);

  useEffect(() => {
    if (userInvestments?.data) {
      // Filter investments where archived is false
      const activeInvestments = userInvestments.data.filter(
        (investment: any) => !investment.archived
      );
      console.log(activeInvestments);
      setActiveInves(activeInvestments);

      let totalPrincipal = 0;
      let totalAccruedInterest = 0;
      let totalAddOns = 0;
      let totalAddonAccruedReturn = 0;
      let totalManagementFee = 0;
      let totalPerformanceYield = 0;
      let totalOneOffs = 0;
      let totalOperationalCost = 0;
      let guaranteedRate = 0;
      let quarter = "";

      // Calculate the totals and gather additional fields
      activeInvestments.forEach((investment: any) => {
        totalPrincipal += investment.principal;
        totalAccruedInterest += investment.totalAccruedReturn;
        totalAddOns += investment.addOns.reduce(
          (sum: any, addOn: any) => sum + (addOn.amount || 0),
          0
        );
        const exchangeRateUSDToGHS = 11; // Replace this with the actual exchange rate

        // Calculate the total for one-off investments
        totalOneOffs += investment.oneOffs.reduce((sum: any, oneOff: any) => {
          // Check the currency of the one-off investment
          if (oneOff.currency === "USD") {
            // Convert to GHS and add to the sum
            return sum + (oneOff.oneOffYield || 0) * exchangeRateUSDToGHS;
          } else if (oneOff.currency === "GHS") {
            // Add directly to the sum
            return sum + (oneOff.oneOffYield || 0);
          } else {
            console.warn(`Unhandled currency: ${oneOff.currency}`);
            return sum; // Ignore unhandled currencies
          }
        }, 0);
        totalAddonAccruedReturn += investment.addOnAccruedReturn;
        totalManagementFee += investment.managementFee || 0; // Assuming managementFee is a field
        totalPerformanceYield += investment.performanceYield || 0; // Assuming performanceYield is a field
        totalOperationalCost += investment.operationalCost || 0;
        guaranteedRate += investment.guaranteedRate || 0;
        quarter = investment.quarter;
      });

      const totalCalculatedBalance =
        totalPrincipal +
        totalAccruedInterest +
        totalAddOns +
        totalAddonAccruedReturn +
        totalPerformanceYield +
        totalOneOffs;

      const totalDeductions = totalOperationalCost + totalManagementFee;

      const totalCalculatedBalanceAfterDeductions =
        totalCalculatedBalance - totalDeductions;
      // Set the calculated values to state
      setTotalBalance(totalCalculatedBalanceAfterDeductions);
      setPrincipal(totalPrincipal);
      setAccruedInterest(totalAccruedInterest);
      setAddOns(totalAddOns);
      setAddonAccruedReturn(totalAddonAccruedReturn);
      setManagementFee(totalManagementFee);
      setPerformanceYield(totalPerformanceYield);
      setOperationalCost(totalOperationalCost);
      setGuaranteedRate(guaranteedRate);
      setQuarter(quarter);
      setOneOffs(totalOneOffs);
    }
  }, [userInvestments]);

  return (
    <div className="">
      <Wrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-5">
          {/* first card */}
          <Card className="p-5 flex flex-col gap-8 justify-start ">
            <div className="flex justify-between items-center ">
              <h3 className="mt-6 text-md">TOTAL BALANCE</h3>
              <LucideCreditCard className="text-2xl" />
            </div>
            <p className="text-xl font-bold">{formatPriceGHS(totalBalance)}</p>
            <p>Current Quarter: {quarter}</p>
            <div className="mt-2 h-1 w-full bg-gradient-to-r from-sky-400 to-green-400 rounded-full "></div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 col-span-2">
            <LandingCard
              icon={<HandCoins />}
              title="PRINCIPAL"
              amount={formatPriceGHS(principal)}
              color={principal > 0 ? "bg-green-400" : "bg-blue-400"}
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ACCRUED INTEREST"
              amount={formatPriceGHS(accruedInterest)}
              color={accruedInterest > 0 ? "bg-green-400" : "bg-blue-400"}
            />
            <LandingCard
              icon={<PlusCircleOutlined />}
              title="ADD ONS"
              amount={formatPriceGHS(addOns)}
              color={addOns > 0 ? "bg-green-400" : "bg-blue-400"}
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ADD ON INTEREST"
              amount={formatPriceGHS(addonAccruedReturn)}
              color={addonAccruedReturn > 0 ? "bg-green-400" : "bg-blue-400"}
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
              title="ONE-OFF YIELD"
              amount={formatPriceGHS(oneOffs)}
              color={oneOffs > 0 ? "bg-green-400" : "bg-blue-400"}
            />
            <CustomCard
              icon={<PlusCircleOutlined />}
              title="PERFORMANCE YIELD"
              amount={formatPriceGHS(performanceYield)}
              color={performanceYield > 0 ? "bg-green-400" : "bg-blue-400"}
            />
            <CustomCard
              icon={<MinusCircleOutlined />}
              title="MANAGEMENT FEE"
              amount={formatPriceGHS(managementFee)}
              color="bg-red-500"
            />
            <CustomCard
              icon={<MinusCircleOutlined />}
              title="OPERATIONAL COST"
              amount={formatPriceGHS(operationalCost)}
              color="bg-red-400"
            />
          </div>
          <Card className="p-3 ">
            <AssetsUnder
              loading={isFetching}
              dataSource={assetsData?.data.data}
            />
          </Card>
          <Card className="p-3">
            <CustomList
              dataSource={userPayments?.data.data}
              loading={isFetchingPayment}
            />
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

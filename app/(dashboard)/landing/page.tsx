"use client";

import { Card } from "@/components/ui/card";
import { formatPriceGHS, round2 } from "@/lib/helper";
import { useGetUserAssetsQuery } from "@/services/assets";
import { useGetUserInvestmentsQuery } from "@/services/investment";
import { useGetUserPaymentsQuery } from "@/services/payments";
import {
  MinusCircleOutlined,
  PieChartOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Divider, Pagination, Table, Modal, Button, Tag } from "antd";
import { HandCoins, LucideCreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import moment from "moment";
import Wrapper from "../wealth/_components/wapper";
import AssetsUnder from "./_components/assetsUnder";
import CustomCard from "./_components/customCard";
import CustomList from "./_components/customList";
import CustomSlider from "./_components/customSlider";
import LandingCard from "./_components/landingCard";
import QuarterlyMandateStatementCard from "./_components/QuarterlyMandateStatementCard";
import QuarterlyDisbursementReportCard from "./_components/QuarterlyDisbursementReportCard";

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
  const [isAddOnModalVisible, setIsAddOnModalVisible] = useState(false);

  //  others
  const { data: assetsData, isFetching } = useGetUserAssetsQuery(null);
  console.log(assetsData?.data.data);

  useEffect(() => {
    if (userInvestments?.data) {
      // Filter investments where archived is false
      const activeInvestments = userInvestments.data.filter(
        (investment: any) => !investment.archived,
      );
      console.log(
        "---------------------------Active Investment section--------------------------",
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

      const currentQuarterLabel = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

      // Calculate the totals and gather additional fields
      activeInvestments.forEach((investment: any) => {
        totalPrincipal = round2(totalPrincipal + Number(investment.principal || 0));
        totalAccruedInterest = round2(
          totalAccruedInterest + Number(investment.totalAccruedReturn || 0)
        );
        const addOnSum = (investment.addOns || []).reduce(
          (sum: any, addOn: any) => round2(sum + Number(addOn.amount || 0)),
          0,
        );
        totalAddOns = round2(totalAddOns + addOnSum);
        const exchangeRateUSDToGHS = 11; // Replace this with the actual exchange rate

        // Calculate the total for one-off investments
        const oneOffSum = (investment.oneOffs || []).reduce((sum: any, oneOff: any) => {
          const yieldAmt = Number(oneOff.oneOffYield || 0);
          if (oneOff.currency === "USD") {
            return round2(sum + round2(yieldAmt * exchangeRateUSDToGHS));
          } else if (oneOff.currency === "GHS") {
            return round2(sum + yieldAmt);
          } else {
            console.warn(`Unhandled currency: ${oneOff.currency}`);
            return sum;
          }
        }, 0);
        totalOneOffs = round2(totalOneOffs + oneOffSum);

        totalAddonAccruedReturn = round2(
          totalAddonAccruedReturn + Number(investment.addOnAccruedReturn || 0)
        );
        totalManagementFee = round2(
          totalManagementFee + Number(investment.managementFee || 0)
        );
        totalPerformanceYield = round2(
          totalPerformanceYield + Number(investment.performanceYield || 0)
        );
        totalOperationalCost = round2(
          totalOperationalCost + Number(investment.operationalCost || 0)
        );
        guaranteedRate = round2(
          guaranteedRate + Number(investment.guaranteedRate || 0)
        );
      });

      const totalCalculatedBalance = round2(
        totalPrincipal +
        totalAccruedInterest +
        totalAddOns +
        totalAddonAccruedReturn +
        totalPerformanceYield +
        totalOneOffs
      );

      const totalDeductions = round2(totalOperationalCost + totalManagementFee);

      const totalCalculatedBalanceAfterDeductions = round2(
        totalCalculatedBalance - totalDeductions
      );
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
      setQuarter(currentQuarterLabel);
      setOneOffs(totalOneOffs);
    }
  }, [userInvestments]);

  // Extract all add-ons from active investments
  const allAddOns = activeInves.flatMap((investment: any) =>
    (investment.addOns || []).map((addOn: any) => ({
      ...addOn,
      investmentQuarter: investment.quarter || "N/A",
      investmentId: investment._id,
    })),
  );

  const addOnColumns = [
    {
      title: "Mandate Quarter",
      dataIndex: "investmentQuarter",
      key: "investmentQuarter",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatPriceGHS(amount || 0),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: any) => (date ? moment(date).format("YYYY-MM-DD") : "—"),
    },
    {
      title: "Accrued Interest",
      dataIndex: "accruedAddOnInterest",
      key: "accruedAddOnInterest",
      render: (value: number, record: any) =>
        formatPriceGHS(
          record.accruedAddOnInterest || record.accruedInterest || 0,
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {(status || "inactive").charAt(0).toUpperCase() +
            (status || "inactive").slice(1)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="">
      <Wrapper>
        <div
          className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 mt-5 items-stretch"
          data-tour="cta-primary"
        >
          {/* first card */}
          <Card className="p-5 sm:p-6 flex flex-col justify-between col-span-1 md:col-span-12 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow border border-slate-200/80 rounded-2xl bg-white/95 backdrop-blur-xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  TOTAL BALANCE
                </span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <LucideCreditCard className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 tracking-tight truncate">
                {formatPriceGHS(totalBalance)}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <span>Current Quarter:</span>
                <span className="font-semibold text-slate-800">{quarter}</span>
              </div>
            </div>
            <div className="mt-5 h-1.5 w-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"></div>
          </Card>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 col-span-1 md:col-span-12 lg:col-span-5"
            data-tour="feature-cards"
          >
            <LandingCard
              icon={<HandCoins className="w-4 h-4" />}
              title="MANDATE CONTRIBUTION"
              amount={formatPriceGHS(principal)}
              color={principal > 0 ? "bg-emerald-400" : "bg-sky-400"}
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ACCRUED DISBURSEMENTS"
              amount={formatPriceGHS(accruedInterest)}
              color={accruedInterest > 0 ? "bg-emerald-400" : "bg-sky-400"}
            />
            <LandingCard
              icon={<PlusCircleOutlined />}
              title="ADDITIONAL CONTRIBUTIONS"
              amount={formatPriceGHS(addOns)}
              color={addOns > 0 ? "bg-emerald-400" : "bg-sky-400"}
              action={
                <Button
                  type="link"
                  size="small"
                  className="p-0 h-auto font-semibold text-xs text-sky-600 hover:text-sky-800"
                  onClick={() => setIsAddOnModalVisible(true)}
                >
                  View All
                </Button>
              }
            />
            <LandingCard
              icon={<PieChartOutlined />}
              title="ADDITIONAL DISBURSEMENTS"
              amount={formatPriceGHS(addonAccruedReturn)}
              color={addonAccruedReturn > 0 ? "bg-emerald-400" : "bg-sky-400"}
            />
          </div>

          <div className="col-span-1 md:col-span-12 lg:col-span-4 h-full min-h-[220px]">
            <CustomSlider />
          </div>
        </div>
        <Divider className="bg-white/40 my-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-6 mb-10 items-stretch">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 col-span-1 md:col-span-2 lg:col-span-1"
            data-tour="yield-cards"
          >
            <CustomCard
              icon={<PlusCircleOutlined />}
              title="ONE-OFF DISBURSEMENT"
              amount={formatPriceGHS(oneOffs)}
              color={oneOffs > 0 ? "bg-emerald-400" : "bg-sky-400"}
            />
            <CustomCard
              icon={<PlusCircleOutlined />}
              title="PERFORMANCE-LINKED DISBURSEMENT"
              amount={formatPriceGHS(performanceYield)}
              color={performanceYield > 0 ? "bg-emerald-400" : "bg-sky-400"}
            />
            <CustomCard
              icon={<MinusCircleOutlined />}
              title="SERVICE FEE"
              amount={formatPriceGHS(managementFee)}
              color="bg-rose-500"
            />
            <CustomCard
              icon={<MinusCircleOutlined />}
              title="OPERATIONAL CHARGE"
              amount={formatPriceGHS(operationalCost)}
              color="bg-rose-400"
            />
          </div>
          <div data-tour="assets-under" className="h-full">
            <QuarterlyMandateStatementCard
              quarter={quarter || "Q4"}
              totalBalance={totalBalance}
              principal={principal}
              accruedInterest={accruedInterest}
              addOns={addOns}
              addonAccruedReturn={addonAccruedReturn}
              oneOffs={oneOffs}
              performanceYield={performanceYield}
              managementFee={managementFee}
              operationalCost={operationalCost}
              guaranteedRate={guaranteedRate}
              activeInvestmentsCount={activeInves?.length || 1}
            />
          </div>
          <div data-tour="payments-list" className="h-full">
            <QuarterlyDisbursementReportCard
              quarter={quarter || "Q4"}
              totalBalance={totalBalance}
              principal={principal}
              accruedInterest={accruedInterest}
              addOns={addOns}
              addonAccruedReturn={addonAccruedReturn}
              oneOffs={oneOffs}
              performanceYield={performanceYield}
              managementFee={managementFee}
              operationalCost={operationalCost}
              guaranteedRate={guaranteedRate}
              activeInvestmentsCount={activeInves?.length || 1}
              investments={activeInves}
            />
          </div>
        </div>
        <Modal
          title="Additional Contributions Details"
          visible={isAddOnModalVisible}
          onCancel={() => setIsAddOnModalVisible(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setIsAddOnModalVisible(false)}
            >
              Close
            </Button>,
          ]}
          width={750}
          style={{ maxWidth: "calc(100vw - 24px)", top: 20 }}
        >
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Total Contributions
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {formatPriceGHS(addOns)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Total Accumulated Interest
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {formatPriceGHS(addonAccruedReturn)}
                </p>
              </div>
            </div>
            <Table
              dataSource={allAddOns}
              columns={addOnColumns}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
              size="middle"
            />
          </div>
        </Modal>
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
        pagination={false}
        rowKey="key"
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

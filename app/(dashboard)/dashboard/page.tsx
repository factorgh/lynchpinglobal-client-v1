"use client";

import { Card } from "@/components/ui/card";
import { formatPriceGHS, round2 } from "@/lib/helper";
import { useGetAllAssetssQuery } from "@/services/assets";
import { useGetUsersQuery } from "@/services/auth";
import { useGetAllInvestmentsQuery } from "@/services/investment";
import { useGetLoansQuery } from "@/services/loan";
import { useCreateUserMutation } from "@/services/users";
import {
  CreditCard,
  FileText,
  Percent,
  Plus,
  Users as UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Drawer, Form, Input, Button } from "antd";
import { toast } from "react-toastify";
import { ClientRow } from "../_components/ClientRow";
import { DashboardCard } from "../_components/DashboardItem";
import Statistics from "../_components/Statistics";

export default function DashboardPage() {
  const { data: activeClients, refetch: refetchUsers } = useGetUsersQuery(null);
  const { data: userInvestments } = useGetAllInvestmentsQuery(null);
  const { data: assets } = useGetAllAssetssQuery(null);
  const { data: loans } = useGetLoansQuery(null);
  const [createUser, { isLoading: isCreatingClient }] = useCreateUserMutation();

  const [loansTotals, setLoansTotals] = useState(0);
  const [assetsUnderMgt, setAssetsUnderMgt] = useState(0);
  const [outstandingPayments, setOutstandingPayments] = useState(0);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (userInvestments?.data) {
      // Filter investments where archived is false
      const activeInvestments = userInvestments.data.filter(
        (investment: any) => !investment.archived
      );
      if (loans?.data?.data) {
        // Calculate the total loans
        const loansData = loans.data.data;
        const activeLoans = loansData.filter((loan: any) => !loan.Inactive);
        const loansTotal = activeLoans.reduce(
          (sum: any, loan: any) => sum + (loan.loanAmount || 0),
          0
        );
        setLoansTotals(loansTotal);
      }

      let totalAssetsUnderManagement = 0;
      let totalOutstandingPayments = 0;
      let totalPrincipal = 0;
      let totalAddOns = 0;
      let totalAddonAccruedReturn = 0;
      let totalAddOnIneterest = 0;
      let totalAccruedInterest = 0;
      let totalAssets = 0;
      let totalOneOff = 0;
      let totalPerformanceYield = 0;

      // Calculate total assets and outstanding payments
      assets?.data?.data?.forEach((asset: any) => {
        totalAssets = round2(totalAssets + (asset.assetValue || 0));
      });

      // Loop through all the data and add those needed
      activeInvestments.forEach((investment: any) => {
        totalPrincipal = round2(totalPrincipal + (investment.principal || 0));
        totalAccruedInterest = round2(totalAccruedInterest + (investment.totalAccruedReturn || 0));
        totalAddOns = round2(
          totalAddOns +
          (investment.addOns || []).reduce(
            (sum: any, addOn: any) => round2(sum + (addOn.amount || 0)),
            0
          )
        );
        const exchangeRateUSDToGHS = 11;

        // Calculate the total for one-off investments
        totalOneOff = round2(
          totalOneOff +
          (investment.oneOffs || []).reduce((sum: any, oneOff: any) => {
            if (oneOff.currency === "USD") {
              return round2(sum + round2((oneOff.yield || 0) * exchangeRateUSDToGHS));
            } else if (oneOff.currency === "GHS") {
              return round2(sum + (oneOff.yield || 0));
            } else {
              return sum;
            }
          }, 0)
        );

        totalAddOnIneterest = round2(totalAddOnIneterest + (investment.addOnAccruedReturn || 0));
        totalPerformanceYield = round2(totalPerformanceYield + (investment.performanceYield || 0));
        totalAddonAccruedReturn = round2(totalAddonAccruedReturn + (investment.addOnAccruedReturn || 0));
      });

      totalAssetsUnderManagement = round2(totalPrincipal + totalAddOns + totalAssets);

      totalOutstandingPayments = round2(
        totalAccruedInterest +
        totalAddOnIneterest +
        totalOneOff +
        totalPerformanceYield
      );

      setAssetsUnderMgt(totalAssetsUnderManagement);
      setOutstandingPayments(totalOutstandingPayments);
    }
  }, [userInvestments, loans, assets]);

  const handleAddClientSubmit = async (values: any) => {
    try {
      await createUser({
        ...values,
        role: "user",
      }).unwrap();
      toast.success("Client added successfully");
      setIsAddClientOpen(false);
      form.resetFields();
      if (refetchUsers) refetchUsers();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to add client");
    }
  };

  const clientList = activeClients?.allUsers || [];

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-5 w-full mx-auto select-none">
      {/* Page Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            Dashboard
          </h1>
          <p className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-xs">
            Portfolio overview for your clients
          </p>
        </div>
        <button
          onClick={() => setIsAddClientOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Stats Overview: 4 KPI Cards in a row */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"
        data-tour="portfolio-summary"
      >
        <DashboardCard
          title="Assets & Wealth"
          value={formatPriceGHS(Number(assetsUnderMgt))}
          subtitle="Total assets"
          icon={FileText}
        />
        <DashboardCard
          title="Active Clients"
          value={clientList.length}
          subtitle="Total active clients"
          icon={UsersIcon}
        />
        <DashboardCard
          title="Payments"
          value={formatPriceGHS(Number(outstandingPayments))}
          subtitle="Total outstanding payments"
          icon={CreditCard}
        />
        <DashboardCard
          title="Total Loans"
          value={formatPriceGHS(Number(loansTotals))}
          subtitle="Total outstanding loans"
          icon={Percent}
        />
      </div>

      {/* 2-Column Section: Statistics (Left) & Recent Clients (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Statistics Chart */}
        <div className="lg:col-span-7 xl:col-span-8" data-tour="statistics">
          <Statistics />
        </div>

        {/* Recent Clients List */}
        <div className="lg:col-span-5 xl:col-span-4 w-full flex flex-col">
          <Card className="bg-white/85 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full flex-1 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="mb-4">
                <h6 className="text-slate-900 mb-0.5 text-base font-bold tracking-tight">
                  Recent Clients
                </h6>
                <p className="text-slate-500 text-xs font-medium">
                  Latest client activities
                </p>
              </div>
              <div className="space-y-1">
                {clientList.length > 0 ? (
                  clientList
                    .slice(0, 5)
                    .map((client: any, index: number) => (
                      <ClientRow
                        key={client._id || index}
                        client={client}
                        index={index}
                      />
                    ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No recent clients found
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Client Drawer */}
      <Drawer
        title="Add New Client"
        open={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleAddClientSubmit}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter client name" }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="e.g. john@example.com" />
          </Form.Item>
          <Form.Item
            name="license"
            label="Client ID / Code"
            rules={[{ required: true, message: "Please enter client code" }]}
          >
            <Input placeholder="e.g. 2024015" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Temporary Password"
            rules={[{ required: true, message: "Please enter password" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreatingClient}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Client
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}


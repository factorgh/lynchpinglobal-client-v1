"use client";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPriceGHS } from "@/lib/helper";
import { useGetAllAssetssQuery } from "@/services/assets";
import { useGetUsersQuery } from "@/services/auth";
import { useGetAllInvestmentsQuery } from "@/services/investment";
import { useGetLoansQuery } from "@/services/loan";
import { AlertCircle, Users, Wallet, Wallet2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientRow } from "../_components/ClientRow";
import { DashboardCard } from "../_components/DashboardItem";
import Statistics from "../_components/Statistics";

// Types
interface DashboardData {
  totalLoans: number;
  activeClients: string;
  totalVehicles: string;
  outstandingPayments: number;
  trends: {
    loans: number;
    clients: number;
    vehicles: number;
    payments: number;
  };
}

interface Client {
  name: string;
  email: string;
  status: string;
  loanAmount: number;
  vehicle: string;
}

interface Vehicle {
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  status: string;
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: activeClients } = useGetUsersQuery(null);
  const { data: userInvestments } = useGetAllInvestmentsQuery(null);
  const { data: assets } = useGetAllAssetssQuery(null);
  console.log(assets?.data.data);
  const { data: loans } = useGetLoansQuery(null);
  const [loansTotals, setLoansTotals] = useState(0);
  const [assetsUnderMgt, setAssetsUnderMgt] = useState(0);
  const [outstandingPayments, setOutstandingPayments] = useState(0);
  console.log(loans?.data.data);

  console.log(
    activeClients?.allUsers?.length ? activeClients?.allUsers?.length : 0
  );

  // Sample data
  const dashboardData: DashboardData = {
    totalLoans: 2567890,
    activeClients: "87",
    totalVehicles: "92",
    outstandingPayments: 456789,
    trends: {
      loans: 12.5,
      clients: 8.3,
      vehicles: -2.1,
      payments: 15.7,
    },
  };

  const sampleClients: Client[] = [
    {
      name: "John Anderson",
      email: "john.a@example.com",
      status: "Active",
      loanAmount: 35000,
      vehicle: "Tesla Model 3",
    },
    {
      name: "Sarah Williams",
      email: "sarah.w@example.com",
      status: "Active",
      loanAmount: 28500,
      vehicle: "BMW X5",
    },
  ];

  const sampleVehicles: Vehicle[] = [
    {
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      vin: "1HGCM82633A123456",
      mileage: 12500,
      status: "Active",
    },
    {
      make: "BMW",
      model: "X5",
      year: 2022,
      vin: "5UXCR6C55KLL86553",
      mileage: 28900,
      status: "Active",
    },
  ];
  useEffect(() => {
    if (userInvestments?.data) {
      // Filter investments where archived is false
      const activeInvestments = userInvestments.data.filter(
        (investment: any) => !investment.archived
      );
      if (loans?.data.data) {
        // Calculate the total loans
        const loansData = loans.data.data;
        const loansTotal = loansData.reduce(
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

      // Calculate total assets and outstanding payments
      assets?.data.data.forEach((asset: any) => {
        totalAssets += asset.assetDesignation;
      });

      // Loop through all the data and add those needed
      activeInvestments.forEach((investment: any) => {
        totalPrincipal += investment.principal;
        totalAccruedInterest += investment.totalAccruedReturn;
        totalAddOns += investment.addOns.reduce(
          (sum: any, addOn: any) => sum + (addOn.amount || 0),
          0
        );

        totalAddOnIneterest += investment.addOnAccruedReturn;

        totalAddonAccruedReturn += investment.addOnAccruedReturn;

        totalAssetsUnderManagement = totalPrincipal + totalAddOns + totalAssets;

        totalOutstandingPayments = totalAccruedInterest + totalAddOnIneterest;

        // Update state with the new values
        setAssetsUnderMgt(totalAssetsUnderManagement);
        setOutstandingPayments(totalOutstandingPayments);
      });
    }
  }, [userInvestments]);

  return (
    <div className="min-h-screen bg-[url('/p1.jpeg')] pt-7">
      {/* Main Content */}
      <div className="ml-64 px-8 ">
        {/* Header */}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <DashboardCard
            title="Total Assets Under Mgt."
            value={formatPriceGHS(Number(assetsUnderMgt))}
            subtitle="Total assets"
            icon={Wallet}
            trend={dashboardData.trends.loans}
            color="blue"
          />
          <DashboardCard
            title="Active Clients"
            value={
              activeClients?.allUsers?.length
                ? activeClients?.allUsers?.length
                : 0
            }
            subtitle="Total active clients"
            icon={Users}
            trend={dashboardData.trends.clients}
            color="green"
          />
          <DashboardCard
            title="Payments"
            value={formatPriceGHS(Number(outstandingPayments))}
            subtitle="Total Outstanding Payments"
            icon={Wallet2}
            trend={dashboardData.trends.vehicles}
            color="purple"
          />
          <DashboardCard
            title="Total Loans"
            value={formatPriceGHS(Number(loansTotals))}
            subtitle="Total Outstanding Loans"
            icon={AlertCircle}
            trend={dashboardData.trends.payments}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Statistics />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Clients</CardTitle>
                <Button variant="outline" size="sm"></Button>
              </div>
              <CardDescription>Latest client activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeClients?.allUsers
                .slice(0, 5)
                .map((client: any, index: any) => (
                  <ClientRow key={index} client={client} />
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

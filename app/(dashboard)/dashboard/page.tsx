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
import { AlertCircle, Filter, Users, Wallet, Wallet2 } from "lucide-react";
import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-[url('/p1.jpeg')] pt-7">
      {/* Main Content */}
      <div className="ml-64 px-8 ">
        {/* Header */}
        {/* <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-gray-500">Welcome back, Admin</p>
          </div>

         

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <DashboardCard
            title="Total Loans"
            value={formatPriceGHS(Number(dashboardData.totalLoans))}
            subtitle="Total amount disbursed"
            icon={Wallet}
            trend={dashboardData.trends.loans}
            color="blue"
          />
          <DashboardCard
            title="Active Clients"
            value={dashboardData.activeClients}
            subtitle="Total active borrowers"
            icon={Users}
            trend={dashboardData.trends.clients}
            color="green"
          />
          <DashboardCard
            title="Payments"
            value={dashboardData.totalVehicles}
            subtitle="Total loan payments"
            icon={Wallet2}
            trend={dashboardData.trends.vehicles}
            color="purple"
          />
          <DashboardCard
            title="Outstanding"
            value={formatPriceGHS(Number(dashboardData.outstandingPayments))}
            subtitle="Total pending payments"
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
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <CardDescription>Latest client activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleClients.map((client, index) => (
                <ClientRow key={index} client={client} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

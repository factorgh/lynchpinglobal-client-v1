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
      {/* Sidebar */}
      {/* <div className="fixed left-0 top-0 h-full w-64 bg-white border-r p-4">
        <div className="flex items-center space-x-2 mb-8">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl">LoanPro</span>
        </div>

        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" /> Clients
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Car className="mr-2 h-4 w-4" /> Vehicles
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Wallet className="mr-2 h-4 w-4" /> Loans
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" /> Payments
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </nav>
      </div> */}

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

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients, vehicles..."
                className="pl-10 w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> New Loan
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div> */}

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

        {/* Recent Activity & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistcs */}
          <Statistics />

          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Clients</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <CardDescription>
                Latest client activities and loan status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleClients.map((client, index) => (
                <ClientRow key={index} client={client} />
              ))}
            </CardContent>
          </Card>

          {/* Vehicle List */}
          {/* <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vehicle Inventory</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <CardDescription>Currently financed vehicles</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              {sampleVehicles.map((vehicle, index) => (
                <VehicleCard key={index} vehicle={vehicle} />
              ))}
            </CardContent>
          </Card> */}
        </div>

        {/* Recent Payments Table */}
        {/* <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>JA</Avatar>
                        <div>
                          <p className="font-medium">John Anderson</p>
                          <p className="text-sm text-gray-500">Tesla Model 3</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">$850.00</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        <span>2024-11-08</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">Completed</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}

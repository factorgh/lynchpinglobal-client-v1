"use client";
import { Card } from "@/components/ui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "January", currentYear: 65, lastYear: 40 },
  { month: "February", currentYear: 78, lastYear: 68 },
  { month: "March", currentYear: 66, lastYear: 86 },
  { month: "April", currentYear: 44, lastYear: 74 },
  { month: "May", currentYear: 56, lastYear: 56 },
  { month: "June", currentYear: 67, lastYear: 60 },
  { month: "July", currentYear: 75, lastYear: 87 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
        <p style={{ margin: 0, color: "#3182ce" }}>
          Current Year: {payload[0]?.value}
        </p>
        <p style={{ margin: 0, color: "#ed64a6" }}>
          Last Year: {payload[1]?.value}
        </p>
      </div>
    );
  }

  return null;
};

export default function Statistics() {
  if (!data || data.length === 0) {
    return (
      <Card className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded p-4">
        <div className="text-center py-10">
          <h6 className="text-gray-500 text-md font-semibold">
            No data available
          </h6>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative flex flex-col min-w-0 break-words w-full  shadow-lg rounded p-4 ">
      <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
        <h6 className="text-blueGray-700 mb-1 text-md font-semibold">
          Statistics
        </h6>
        <h5 className="text-gray-500 text-sm">
          Investment metrics over the last year
        </h5>
      </div>
      <div
        style={{
          width: "100%",
          height: "450px",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <ResponsiveContainer
          className="mx-3 my-7 shadow-lg"
          width="100%"
          height={370}
        >
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(200, 200, 200, 0.5)"
            />
            <XAxis dataKey="month" stroke="#3182ce" />
            <YAxis stroke="#3182ce" />
            <Tooltip
              content={<CustomTooltip />}
              contentStyle={{
                backgroundColor: "#fff",
                borderColor: "#ccc",
              }}
              labelStyle={{ color: "#000" }}
              itemStyle={{ color: "#000" }}
            />
            <Legend
              wrapperStyle={{
                color: "#000",
              }}
            />
            <Line
              type="monotone"
              dataKey="currentYear"
              stroke="#3182ce"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="lastYear"
              stroke="#ed64a6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

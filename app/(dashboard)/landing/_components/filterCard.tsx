import { Button, Card, DatePicker, Select } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";

const { Option } = Select;

interface FilterCardProps {
  onFilter: (quarter: string, year: string) => void; // Callback to send filter values
}

const FilterCard: React.FC<FilterCardProps> = ({ onFilter }) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<string>(
    dayjs().format("YYYY")
  ); // Default to the current year

  const handleYearChange = (date: any) => {
    setSelectedYear(date ? date.format("YYYY") : "");
  };

  const handleFilter = () => {
    onFilter(selectedQuarter, selectedYear); // Pass values to parent
  };

  return (
    <Card className="w-full shadow-sm border rounded-lg">
      <div className="flex gap-4">
        {/* Quarter Selector */}
        <div className="w-[800px]">
          <label className="block text-gray-600 font-medium mb-1">
            Select Quarter
          </label>
          <Select
            value={selectedQuarter}
            onChange={(value) => setSelectedQuarter(value)}
            className="w-full"
          >
            <Option value="Q1">Q1</Option>
            <Option value="Q2">Q2</Option>
            <Option value="Q3">Q3</Option>
            <Option value="Q4">Q4</Option>
          </Select>
        </div>

        {/* Year Selector with DatePicker */}
        <div className="w-[800px]">
          <label className="block text-gray-600 font-medium mb-1">
            Select Year
          </label>
          <DatePicker
            picker="year"
            value={dayjs(selectedYear, "YYYY")}
            onChange={handleYearChange}
            className="w-full"
          />
        </div>

        {/* Filter Button */}
        <Button
          type="primary"
          className="w-full bg-blue-500 hover:bg-blue-600"
          onClick={handleFilter}
        >
          Apply Filters
        </Button>
      </div>
    </Card>
  );
};

export default FilterCard;

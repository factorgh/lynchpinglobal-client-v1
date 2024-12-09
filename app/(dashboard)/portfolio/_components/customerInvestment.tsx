import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useGetUserInvestmentsQuery } from "@/services/investment";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import type { InputRef, TableColumnType } from "antd";
import { Button, Descriptions, Drawer, Input, Space, Table } from "antd";
import React, { useRef, useState } from "react";
import Highlighter from "react-highlight-words";

interface DataType {
  key: string;
  name: string;
  principal: number;
  totalAccruedReturn: number;
  guaranteedRate: number;
  performanceYield: number;
  managementFee: number;
}

type DataIndex = keyof DataType;

const CustomerInvestment: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<DataType | null>(
    null
  );
  const searchInput = useRef<InputRef>(null);
  const { data: investments, isFetching } =
    useGetUserInvestmentsQuery<any>(null);

  const handleSearch = (
    selectedKeys: string[],

    dataIndex: DataIndex
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex
  ): TableColumnType<DataType> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys as string[], dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns: TableColumnType<DataType>[] = [
    {
      title: "Admin",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Principal",
      dataIndex: "principal",
      key: "principal",
      ...getColumnSearchProps("principal"),
      render: (value: any) => formatPriceGHS(value), // Format principal
    },
    {
      title: "Guaranteed Return",
      dataIndex: "guaranteedRate",
      key: "guaranteedRate",
      ...getColumnSearchProps("guaranteedRate"),
      render: (value: any) => `${toTwoDecimalPlaces(value)}%`, // Add "%" suffix
    },
    {
      title: "Performance Yield",
      dataIndex: "performanceYield",
      key: "performanceYield",
      ...getColumnSearchProps("performanceYield"),
      render: (value: any) => formatPriceGHS(value), // Format performance yield
    },
    {
      title: "Management Fee",
      dataIndex: "managementFee",
      key: "managementFee",
      ...getColumnSearchProps("managementFee"),
      render: (value: any) => `${toTwoDecimalPlaces(value)}%`, // Add "%" suffix
    },
    {
      title: "Total Accrued Return",
      dataIndex: "totalAccruedReturn",
      key: "totalAccruedReturn",
      ...getColumnSearchProps("totalAccruedReturn"),
      render: (value: any) => formatPriceGHS(value), // Format with currency
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: any) => (
        <div className="flex gap-3">
          <EyeOutlined
            className="text-blue-500"
            onClick={() => showViewDrawer(record)}
          />
        </div>
      ),
    },
  ];

  // Drawer show/hide logic
  const showViewDrawer = (investment: DataType) => {
    setSelectedInvestment(investment);
    setDrawerVisible(true);
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedInvestment(null);
  };

  return (
    <div>
      <Table<DataType>
        loading={isFetching}
        columns={columns}
        dataSource={investments?.data}
      />

      {/* Drawer for displaying detailed information */}
      <Drawer
        title="Investment Details"
        visible={drawerVisible}
        onClose={onCloseDrawer}
        width={600}
      >
        {selectedInvestment && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Admin">
              {selectedInvestment.name}
            </Descriptions.Item>
            <Descriptions.Item label="Principal">
              {formatPriceGHS(selectedInvestment.principal)}
            </Descriptions.Item>
            <Descriptions.Item label="Guaranteed Return">
              {toTwoDecimalPlaces(selectedInvestment.guaranteedRate)}%
            </Descriptions.Item>
            <Descriptions.Item label="Performance Yield">
              {formatPriceGHS(selectedInvestment.performanceYield)}
            </Descriptions.Item>
            <Descriptions.Item label="Management Fee">
              {toTwoDecimalPlaces(selectedInvestment.managementFee)}%
            </Descriptions.Item>
            <Descriptions.Item label="Total Accrued Return">
              {formatPriceGHS(
                Number(
                  toTwoDecimalPlaces(selectedInvestment.totalAccruedReturn)
                )
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerInvestment;

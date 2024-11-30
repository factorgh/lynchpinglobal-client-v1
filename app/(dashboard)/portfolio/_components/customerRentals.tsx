import { toTwoDecimalPlaces } from "@/lib/helper";
import { SearchOutlined } from "@ant-design/icons";
import type { InputRef, TableColumnType } from "antd";
import { Button, Input, Space, Table } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import React, { useRef, useState } from "react";
import Highlighter from "react-highlight-words";

interface DataType {
  key: string;
  assetClass: string;
  amountDue: number;
  assetDesignation: number;
  dueDate: number;
  overdueFee: number;
}

type DataIndex = keyof DataType;

const data: DataType[] = [];

const CustomerRentals: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps["confirm"],
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
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
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
            close
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
      title: "Asset Class",
      dataIndex: "assetClass",
      key: "assetClass",
      ...getColumnSearchProps("assetClass"),
      sorter: (a, b) => a.assetClass.length - b.assetClass.length,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Asset Designation",
      dataIndex: "assetDesignation",
      key: "assetDesignation",
      ...getColumnSearchProps("assetDesignation"),
      render: (value: number) => toTwoDecimalPlaces(value), // Type `value` properly
    },
    {
      title: "Amount Due",
      dataIndex: "amountDue",
      key: "amountDue",
      ...getColumnSearchProps("amountDue"),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      ...getColumnSearchProps("dueDate"),
      render: (value: number) => toTwoDecimalPlaces(value),
    },
    {
      title: "Overdue Fee",
      dataIndex: "overdueFee",
      key: "overdueFee",
      ...getColumnSearchProps("overdueFee"),
      render: (value: number) => `${toTwoDecimalPlaces(value)}%`,
    },
  ];

  return <Table<DataType> columns={columns} dataSource={data} />;
};

export default CustomerRentals;

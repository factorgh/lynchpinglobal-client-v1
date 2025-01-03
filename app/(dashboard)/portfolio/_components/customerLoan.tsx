import { formatPriceGHS } from "@/lib/helper";
import { useGetLoansQuery } from "@/services/loan";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import type { InputRef, TableColumnType } from "antd";
import { Button, Input, Space, Table } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import React, { useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import LoanDrawer from "../../rentals/_components/loan-drawer";

interface DataType {
  key: string;
  loanAmount: number;
  guaranteedRate: number;
  managementFee: number;
  overdueRate: number;
}

type DataIndex = keyof DataType;

const data: DataType[] = [];

const CustomerLoan: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const { data: loans, isFetching } = useGetLoansQuery(null);
  const [loanDrawerVisible, setLoanDrawerVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const closeLoansDetailsDrawer = () => {
    setSelectedLoan(null);
    setLoanDrawerVisible(false);
  };
  const showLoanDetailsDrawer = (asset: any) => {
    setSelectedLoan(asset);
    setLoanDrawerVisible(true);
  };

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
      title: "Loan Amount",
      dataIndex: "loanAmount",
      key: "loanAmount",
      ...getColumnSearchProps("loanAmount"),
      render: (value: any) => formatPriceGHS(value), // Format principal
    },
    {
      title: "Amount Due",
      dataIndex: "amountDue",
      key: "amountDue",

      render: (value: any) => formatPriceGHS(value),
    },
    {
      title: "Overdue Fee",
      dataIndex: "overdueFee",
      key: "overdueFee",

      render: (value: any) => formatPriceGHS(value),
    },
    {
      title: "Days Overdue",
      dataIndex: "overdueDays",
      key: "overdueDays",

      render: (value: any) => (value === 0 ? "0 days " : `${value} days`),
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: any) => (
        <div className="flex gap-3">
          <EyeOutlined
            className="text-emerald-500"
            onClick={() => showLoanDetailsDrawer(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Table<DataType>
        loading={isFetching}
        columns={columns}
        dataSource={loans?.data.data}
      />
      <LoanDrawer
        loan={selectedLoan}
        visible={loanDrawerVisible}
        onClose={closeLoansDetailsDrawer}
      />
    </>
  );
};

export default CustomerLoan;

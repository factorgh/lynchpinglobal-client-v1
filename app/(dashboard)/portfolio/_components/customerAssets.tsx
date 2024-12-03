import { toTwoDecimalPlaces } from "@/lib/helper";
import { useGetUserAssetsQuery } from "@/services/assets";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Drawer, Image, Input, Space, Table } from "antd";
import moment from "moment";
import React, { useRef, useState } from "react";
import Highlighter from "react-highlight-words";

// Updated DataType interface with all asset properties
interface DataType {
  key: string;
  assetClass: string;
  assetDesignation: number;
  accruedInterest: number;
  assetImage: string | null;
  assetName: string;
  certificate: string[];
  checklist: any[];
  createdAt: string;
  managementFee: number;
  maturityDate: string;
  quater: string;
  timeCourse: string;
  updatedAt: string;
  user: string;
  __v: number;
  _id: string;
}

type DataIndex = keyof DataType;

const CustomerAssets: React.FC = () => {
  // State for search and drawer visibility
  const [searchText, setSearchText] = useState<string>("");
  const [searchedColumn, setSearchedColumn] = useState<string>("");
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);

  const searchInput = useRef<any>(null);

  const { data: assets, isFetching } = useGetUserAssetsQuery(null); // Fetch assets data

  const handleSearch = (
    selectedKeys: string[],
    confirm: any,
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

  const getColumnSearchProps = (dataIndex: DataIndex): any => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }: any) => (
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
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open: any) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text: any) =>
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

  // Table columns definition
  const columns = [
    {
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      ...getColumnSearchProps("assetName"),
    },
    {
      title: "Asset Class",
      dataIndex: "assetClass",
      key: "assetClass",
      ...getColumnSearchProps("assetClass"),
    },
    {
      title: "Asset Designation",
      dataIndex: "assetDesignation",
      key: "assetDesignation",
      ...getColumnSearchProps("assetDesignation"),
      render: (value: number) => toTwoDecimalPlaces(value),
    },
    {
      title: "Accrued Interest",
      dataIndex: "accruedInterest",
      key: "accruedInterest",
      ...getColumnSearchProps("accruedInterest"),
      render: (value: number) => toTwoDecimalPlaces(value),
    },
    {
      title: "Management Fee",
      dataIndex: "managementFee",
      key: "managementFee",
      ...getColumnSearchProps("managementFee"),
      render: (value: number) => `${toTwoDecimalPlaces(value)}%`,
    },
    {
      title: "Maturity Date",
      dataIndex: "maturityDate",
      key: "maturityDate",
      ...getColumnSearchProps("maturityDate"),
      render: (value: string) => moment(value).format("DD MMM YYYY"),
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: DataType) => (
        <div className="flex gap-3">
          <EyeOutlined
            className="text-blue-500"
            onClick={() => showViewDrawer(record)}
          />
        </div>
      ),
    },
  ];

  // Show details in the drawer
  const showViewDrawer = (record: DataType) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  // Close the drawer
  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedRecord(null);
  };

  return (
    <div>
      {/* Table Component */}
      <Table<DataType>
        loading={isFetching}
        columns={columns}
        dataSource={assets?.data.data}
      />

      {/* Drawer Component */}
      <Drawer
        title="Asset Details"
        width={500}
        onClose={closeDrawer}
        visible={drawerVisible}
      >
        {selectedRecord && (
          <div>
            <p>
              <strong>Asset Name:</strong> {selectedRecord.assetName}
            </p>
            <p>
              <strong>Asset Class:</strong> {selectedRecord.assetClass}
            </p>
            <p>
              <strong>Asset Designation:</strong>{" "}
              {toTwoDecimalPlaces(selectedRecord.assetDesignation)}
            </p>
            <p>
              <strong>Accrued Interest:</strong>{" "}
              {toTwoDecimalPlaces(selectedRecord.accruedInterest)}
            </p>
            <p>
              <strong>Management Fee:</strong>{" "}
              {toTwoDecimalPlaces(selectedRecord.managementFee)}%
            </p>
            <p>
              <strong>Quarter:</strong> {selectedRecord.quater}
            </p>
            <p>
              <strong>Maturity Date:</strong>{" "}
              {moment(selectedRecord.maturityDate).format("DD MMM YYYY")}
            </p>
            {selectedRecord.assetImage && (
              <div>
                <strong>Asset Image:</strong>
                <Image
                  src={selectedRecord.assetImage}
                  alt="Asset Image"
                  width={200}
                />
              </div>
            )}
            {selectedRecord.certificate &&
              selectedRecord.certificate.length > 0 && (
                <div>
                  <strong>Certificates:</strong>
                  {selectedRecord.certificate.map((cert, idx) => (
                    <div key={idx}>
                      <a href={cert} target="_blank" rel="noopener noreferrer">
                        Certificate {idx + 1}
                      </a>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerAssets;

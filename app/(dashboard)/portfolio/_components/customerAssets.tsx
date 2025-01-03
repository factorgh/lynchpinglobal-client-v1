import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useGetUserAssetsQuery } from "@/services/assets";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Image,
  Input,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import moment from "moment";
import React, { useRef, useState } from "react";
import Highlighter from "react-highlight-words";
const { Text, Title } = Typography;

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
  mandate: string[];
  others: string[];
  partnerForm: string[];
  assetValue: number;
  active: boolean;
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
      render: (value: number) => formatPriceGHS(value),
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
            {/* Descriptions Component to show details at the top */}
            <Descriptions bordered column={1} style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Asset Name">
                {selectedRecord.assetName}
              </Descriptions.Item>
              <Descriptions.Item label="Asset Class">
                {selectedRecord.assetClass}
              </Descriptions.Item>
              <Descriptions.Item label="Asset Designation">
                {selectedRecord.assetDesignation}
              </Descriptions.Item>
              <Descriptions.Item label="Accrued Interest">
                {formatPriceGHS(selectedRecord.accruedInterest)}
              </Descriptions.Item>
              <Descriptions.Item label="Management Fee">
                {toTwoDecimalPlaces(selectedRecord.managementFee)}%
              </Descriptions.Item>
              <Descriptions.Item label="Quarter">
                {selectedRecord.quater}
              </Descriptions.Item>
              <Descriptions.Item label="Maturity Date">
                {moment(selectedRecord.maturityDate).format("DD MMM YYYY")}
              </Descriptions.Item>
            </Descriptions>

            {/* If there's an image, display it */}
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

            {/* Investment Documents Section */}
            <Card title="Assets Documents" bordered={false}>
              {selectedRecord.certificate.length > 0 && (
                <div>
                  <Title level={4}>Certificates</Title>
                  <Row gutter={16}>
                    {selectedRecord.certificate.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Certificate ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {selectedRecord.checklist.length > 0 && (
                <div>
                  <Title level={4}>Checklists</Title>
                  <Row gutter={16}>
                    {selectedRecord.checklist.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Checklist ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {selectedRecord.mandate.length > 0 && (
                <div>
                  <Title level={4}>Mandates</Title>
                  <Row gutter={16}>
                    {selectedRecord.mandate.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Mandate ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {selectedRecord.partnerForm.length > 0 && (
                <div>
                  <Title level={4}>Partner Forms</Title>
                  <Row gutter={16}>
                    {selectedRecord.partnerForm.map(
                      (fileUrl: string, index: number) => (
                        <Col span={8} key={index}>
                          <Card hoverable>
                            <Text>{`Partner Form ${index + 1}`}</Text>
                          </Card>
                        </Col>
                      )
                    )}
                  </Row>
                </div>
              )}

              {!selectedRecord.certificate.length &&
                !selectedRecord.checklist.length &&
                !selectedRecord.mandate.length &&
                !selectedRecord.partnerForm.length && (
                  <Tag color="red">No Documents available</Tag>
                )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerAssets;

import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useGetUserInvestmentsQuery } from "@/services/investment";
import { SearchOutlined } from "@ant-design/icons";
import type { InputRef, TableColumnType } from "antd";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Row,
  Table,
  Tag,
  Typography,
} from "antd";
import Title from "antd/es/typography/Title";
import React, { useRef, useState } from "react";
import Highlighter from "react-highlight-words";

interface AddOn {
  id: string;
  name: string;
  value: number;
}

interface DataType {
  key: string;
  name: string;
  principal: number;
  guaranteedRate: number;
  addOns: AddOn[];
  oneOffs: any[];
  principalAccruedReturn: number;
  addOnAccruedReturn: number;
  oneOffAccruedReturn: number;
  totalAccruedReturn: number;
  quarterEndDate: string;
  quarter: string;
  archived: boolean;
  active: boolean;
  managementFee: number;
  performanceYield: number;
  certificate: string[];
  checklist: string[];
  mandate: string[];
  partnerForm: string[];
  others: string[]; // Add "others" to the DataType
  lastModified: string;
}

const { Text } = Typography;
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
      title: "Principal",
      dataIndex: "principal",
      key: "principal",
      ...getColumnSearchProps("principal"),
      render: (value) => formatPriceGHS(value),
    },
    {
      title: "Expected Return",
      dataIndex: "guaranteedRate",
      key: "guaranteedRate",
      ...getColumnSearchProps("guaranteedRate"),
      render: (value) => `${toTwoDecimalPlaces(value)}%`,
    },
    {
      title: "Performance Yield",
      dataIndex: "performanceYield",
      key: "performanceYield",
      ...getColumnSearchProps("performanceYield"),
      render: (value) => formatPriceGHS(value),
    },
    {
      title: "Management Fee",
      dataIndex: "managementFee",
      key: "managementFee",
      render: (value) => formatPriceGHS(value),
    },
    {
      title: "Total Accrued Return",
      dataIndex: "totalAccruedReturn",
      key: "totalAccruedReturn",
      ...getColumnSearchProps("totalAccruedReturn"),
      render: (value) => formatPriceGHS(value),
    },
  ];

  const showViewDrawer = (investment: DataType) => {
    setSelectedInvestment(investment);
    setDrawerVisible(true);
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedInvestment(null);
  };

  const handlePreviewOut = (previewFile: string, index: number) => {
    setDrawerVisible(false);
    window.open(previewFile, "_blank");
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
              {formatPriceGHS(selectedInvestment.managementFee)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Accrued Return">
              {formatPriceGHS(selectedInvestment.totalAccruedReturn)}
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* Add-ons */}
        {selectedInvestment && (
          <>
            {" "}
            <Card title="Add-ons" bordered={false}>
              {selectedInvestment?.addOns.length > 0 ? (
                <Table
                  rowKey="id"
                  columns={[{ title: "Name", dataIndex: "name", key: "name" }]}
                  dataSource={selectedInvestment?.addOns}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Tag color="orange">No add-ons added</Tag>
              )}
            </Card>
            <Card title="One-Offs" bordered={false}>
              {selectedInvestment?.oneOffs.length > 0 ? (
                <Table
                  rowKey="id"
                  columns={[
                    { title: "One-Off", dataIndex: "name", key: "name" },
                  ]}
                  dataSource={selectedInvestment?.oneOffs}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Tag color="orange">No One Offs added</Tag>
              )}
            </Card>
          </>
        )}

        {/* Documents Section */}
        {selectedInvestment && (
          <Card title="Investment Documents" bordered={false}>
            {selectedInvestment?.certificate.length > 0 && (
              <div>
                <Title level={4}>Certificates</Title>
                <Row gutter={16}>
                  {selectedInvestment?.certificate.map((fileUrl, index) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Certificate ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Other document sections (checklist, mandate, partner form) */}
            {selectedInvestment?.checklist.length > 0 && (
              <div>
                <Title level={4}>Checklists</Title>
                <Row gutter={16}>
                  {selectedInvestment?.checklist.map((fileUrl, index) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Checklist ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {selectedInvestment?.mandate.length > 0 && (
              <div>
                <Title level={4}>Mandates</Title>
                <Row gutter={16}>
                  {selectedInvestment?.mandate.map((fileUrl, index) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Mandate ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {selectedInvestment?.partnerForm.length > 0 && (
              <div>
                <Title level={4}>Partner Forms</Title>
                <Row gutter={16}>
                  {selectedInvestment?.partnerForm.map((fileUrl, index) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Partner Form ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Display Others if available */}
            {selectedInvestment?.others.length > 0 && (
              <div>
                <Title level={4}>Others</Title>
                <Row gutter={16}>
                  {selectedInvestment?.others.map((fileUrl, index) => (
                    <Col span={8} key={index}>
                      <Card
                        hoverable
                        onClick={() => handlePreviewOut(fileUrl, index)}
                      >
                        <Text>{`Others ${index + 1}`}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* No documents */}
            {!selectedInvestment?.certificate.length &&
              !selectedInvestment?.checklist.length &&
              !selectedInvestment?.mandate.length &&
              !selectedInvestment?.partnerForm.length &&
              !selectedInvestment?.others.length && (
                <Tag color="red">No Documents available</Tag>
              )}
          </Card>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerInvestment;

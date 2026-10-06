"use client";

import InvestmentDetailDrawer from "@/app/(components)/investemnt_drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceGHS, toTwoDecimalPlaces } from "@/lib/helper";
import { useCreateActivityLogMutation } from "@/services/activity-logs";
import { useCreateAddOffMutation } from "@/services/addOff";
import { useCreateAddOnMutation } from "@/services/addOn";
import {
  useDeleteInvestmentMutation,
  useGetAllInvestmentsQuery,
  useUpdateInvestmentMutation,
} from "@/services/investment";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  PayCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Dropdown,
  Form,
  InputNumber,
  Menu,
  Row,
  Select,
  Skeleton,
} from "antd";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import FileUploadComponent from "./FileUpload";

const WealthTable = ({
  quarterFilter = "all",
  yearFilter = "all",
}: {
  quarterFilter?: string;
  yearFilter?: string;
}) => {
  const { data: investmentData, isFetching: investmentLoading } =
    useGetAllInvestmentsQuery<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editRentalId, setEditRentalId] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [investmentDetailsDrawerVisible, setInvestmentDetailsDrawerVisible] =
    useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    string | null
  >(null);

  const [updateInvestment, { isLoading }] = useUpdateInvestmentMutation();
  const [createAddOn, { isLoading: addOnLoading }] = useCreateAddOnMutation();
  const [createActivity] = useCreateActivityLogMutation();
  const [initialFiles, setInitialFiles] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState<any>({});

  const [createAddOff, { isLoading: addOffLoading }] = useCreateAddOffMutation();
  const [deleteInvestment] = useDeleteInvestmentMutation();
  const [isAddOnDrawerVisible, setIsAddOnDrawerVisible] = useState(false);
  const [isAddOffDrawerVisible, setIsAddOffDrawerVisible] = useState(false);

  const loggedInUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  // Filter Data by Quarter, Year, and Search
  const filteredData = useMemo(() => {
    if (!investmentData?.data) return [];
    return investmentData.data.filter((inv: any) => {
      if (quarterFilter !== "all" && inv.quarter !== quarterFilter) {
        return false;
      }
      if (yearFilter !== "all") {
        const invYear = dayjs(inv.startDate).format("YYYY");
        if (invYear !== yearFilter) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const customerName = (
          inv.userId?.displayName ||
          inv.userId?.name ||
          inv.name ||
          ""
        ).toLowerCase();
        const principal = (inv.principal || "").toString();
        const ownersNames = Array.isArray(inv.owners)
          ? inv.owners
              .map((o: any) => o?.user?.displayName || o?.user?.name || "")
              .join(" ")
              .toLowerCase()
          : "";
        return (
          customerName.includes(query) ||
          principal.includes(query) ||
          ownersNames.includes(query)
        );
      }
      return true;
    });
  }, [investmentData, quarterFilter, yearFilter, searchTerm]);

  // Paginated Data
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const showEditDrawer = (investment: any) => {
    setIsEditMode(true);
    setEditRentalId(investment._id);
    const files = {
      certificate: investment.certificate || [],
      partnerForm: investment.partnerForm || [],
      checklist: investment.checklist || [],
      mandate: investment.mandate || [],
      others: investment.others || [],
    };

    setInitialFiles(files);
    setUploadedFiles(files);

    form.setFieldsValue({
      principal: investment.principal,
      managementFeeRate: investment.managementFeeRate,
      performanceYield: investment.performanceYield,
      guaranteedRate: investment.guaranteedRate,
      quarter: investment.quarter,
      managementFee: investment.managementFee,
      operationalCost: investment.operationalCost,
      startDate: dayjs(investment.startDate),
    });

    setIsDrawerVisible(true);
  };

  const showAddOnDrawer = (investment: any) => {
    setEditRentalId(investment._id);
    setIsAddOnDrawerVisible(true);
  };

  const showAddOffDrawer = (investment: any) => {
    setEditRentalId(investment._id);
    setIsAddOffDrawerVisible(true);
  };

  const closeAddOnDrawer = () => {
    setIsAddOnDrawerVisible(false);
    form.resetFields();
  };

  const closeAddOffDrawer = () => {
    setIsAddOffDrawerVisible(false);
    form.resetFields();
  };

  const showInvestmentDetailsDrawer = (investment: any) => {
    setSelectedInvestmentId(investment._id);
    setInvestmentDetailsDrawerVisible(true);
  };

  const closeInvestmentDetailsDrawer = () => {
    setSelectedInvestmentId(null);
    setInvestmentDetailsDrawerVisible(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
    form.resetFields();
    setEditRentalId(null);
    setIsEditMode(false);
    setUploadedFiles({});
    setInitialFiles({});
  };

  const handleDelete = async (id: any) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this entry?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await deleteInvestment(id).unwrap();
        await createActivity({
          activity: "Mandate Deleted",
          description: `A mandate with id ${id} was deleted`,
          user: loggedInUser._id,
        }).unwrap();
        toast.success("Entry deleted successfully");
      }
    } catch (error: any) {
      toast.error("Failed to delete entry: " + error?.message);
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (isAddOnDrawerVisible) {
        await createAddOn({
          amount: values.amount,
          status: "inactive",
          investmentId: editRentalId,
        });

        await createActivity({
          activity: "New Add On",
          description: "A new addon was added",
          user: loggedInUser._id,
        }).unwrap();

        closeAddOnDrawer();
        toast.success("Add On has been created successfully");
        form.resetFields();
      } else if (isAddOffDrawerVisible) {
        await createAddOff({
          amount: values.amount,
          currency: values.currency,
          oneOffYield: values.oneOffYield,
          investmentId: editRentalId,
          startDate: values.startDate,
          endDate: values.endDate,
        });

        await createActivity({
          activity: "One off Added",
          description: "A new one-off was added",
          user: loggedInUser._id,
        }).unwrap();

        closeAddOffDrawer();
        toast.success("One Off has been created successfully");
      } else {
        if (isEditMode) {
          const { certificate, mandate, partnerForm, checklist, others } =
            uploadedFiles;

          const formattedValues = {
            ...values,
            certificate,
            mandate,
            partnerForm,
            checklist,
            others,
          };

          await updateInvestment({
            id: editRentalId,
            data: formattedValues,
          }).unwrap();

          await createActivity({
            activity: "Mandate Updated",
            description: `A mandate was updated with ID ${editRentalId}`,
            user: loggedInUser._id,
          }).unwrap();

          toast.success("Mandate updated successfully");
        } else {
          await createActivity({
            activity: "New Mandate",
            description: "A new mandate was created",
            user: loggedInUser._id,
          }).unwrap();

          toast.success("New mandate added successfully");
        }

        setIsDrawerVisible(false);
        form.resetFields();
        setUploadedFiles({});
        setInitialFiles({});
      }
    } catch (error: any) {
      toast.error("Unexpected error occurred");
    }
  };

  const menu = (record: any) => (
    <Menu className="shadow-lg rounded-xl border border-slate-100 p-1.5 min-w-[190px]">
      <Menu.Item
        key="view"
        icon={<EyeOutlined className="text-blue-500" />}
        onClick={() => showInvestmentDetailsDrawer(record)}
        className="rounded-lg text-xs font-semibold py-2"
      >
        View Details
      </Menu.Item>
      <Menu.Item
        key="edit"
        icon={<EditOutlined className="text-amber-500" />}
        onClick={() => showEditDrawer(record)}
        className="rounded-lg text-xs font-semibold py-2"
      >
        Edit Mandate
      </Menu.Item>
      <Menu.Item
        key="addOn"
        icon={<PayCircleOutlined className="text-emerald-500" />}
        onClick={() => showAddOnDrawer(record)}
        className="rounded-lg text-xs font-semibold py-2"
      >
        Add Contribution (Add-On)
      </Menu.Item>
      <Menu.Item
        key="addOff"
        icon={<PlusCircleOutlined className="text-purple-500" />}
        onClick={() => showAddOffDrawer(record)}
        className="rounded-lg text-xs font-semibold py-2"
      >
        One-Off Disbursement
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined className="text-red-500" />}
        onClick={() => handleDelete(record._id)}
        className="rounded-lg text-xs font-semibold py-2 text-red-600 hover:bg-red-50"
      >
        Delete Entry
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="w-full space-y-4">
      {/* Search and Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search customer, owner, or amount..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all shadow-xs font-medium"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing {paginatedData.length} of {totalItems} mandates
        </div>
      </div>

      {/* Shadcn UI Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        {investmentLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Customer
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Type
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5">
                  Owners
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Mandate Contribution
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Contractual Terms
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Performance-Linked
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Service Fee Rate
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">
                  Total Disbursements
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record: any) => {
                  const customerName =
                    record.userId?.displayName ||
                    record.userId?.name ||
                    record.name ||
                    "Unknown User";
                  const isJoint = !!record.isJoint;

                  return (
                    <TableRow
                      key={record._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Customer */}
                      <TableCell className="py-3.5 font-bold text-slate-900 text-xs">
                        {customerName}
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell className="py-3.5">
                        {isJoint ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Joint
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Single
                          </span>
                        )}
                      </TableCell>

                      {/* Owners */}
                      <TableCell className="py-3.5">
                        {Array.isArray(record.owners) &&
                        record.owners.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.owners.map((o: any, idx: number) => {
                              const ownerName =
                                o?.user?.displayName ||
                                o?.user?.name ||
                                o?.user?.email ||
                                "Owner";
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                  {ownerName}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Mandate Contribution */}
                      <TableCell className="py-3.5 text-right font-bold text-slate-900 text-xs">
                        {formatPriceGHS(record.principal || 0)}
                      </TableCell>

                      {/* Contractual Terms */}
                      <TableCell className="py-3.5 text-right font-semibold text-slate-700 text-xs">
                        {toTwoDecimalPlaces(record.guaranteedRate || 0)}%
                      </TableCell>

                      {/* Performance-Linked Disbursement */}
                      <TableCell className="py-3.5 text-right font-semibold text-slate-700 text-xs">
                        {formatPriceGHS(record.performanceYield || 0)}
                      </TableCell>

                      {/* Service Fee Rate */}
                      <TableCell className="py-3.5 text-right font-semibold text-slate-700 text-xs">
                        {toTwoDecimalPlaces(record.managementFeeRate || 0)}%
                      </TableCell>

                      {/* Total Disbursements */}
                      <TableCell className="py-3.5 text-right font-bold text-emerald-700 text-xs">
                        {formatPriceGHS(record.totalAccruedReturn || 0)}
                      </TableCell>

                      {/* Action Dropdown */}
                      <TableCell className="py-3.5 text-center">
                        <Dropdown
                          overlay={menu(record)}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors mx-auto cursor-pointer">
                            <MoreOutlined className="text-base" />
                          </button>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-14 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderOpenOutlined className="text-4xl text-slate-300" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        No Mandate Transactions Found
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs">
                        There are no mandates matching the selected filters or
                        search terms.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Mandate Drawer */}
      <Drawer
        title="Edit Mandate"
        placement="right"
        width="50%"
        onClose={handleCloseDrawer}
        open={isDrawerVisible}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          hideRequiredMark
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="principal"
                label="Mandate Contribution (GH)"
                rules={[
                  { required: true, message: "Please enter the mandate contribution" },
                ]}
              >
                <InputNumber
                  placeholder="Enter mandate contribution"
                  style={{ width: "100%" }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="performanceYield"
                label="Performance-Linked Disbursement (GH)"
              >
                <InputNumber
                  placeholder="Enter performance-linked disbursement"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="guaranteedRate"
                label="Contractual Terms (%)"
                rules={[
                  {
                    required: true,
                    message: "Please enter contractual terms",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter contractual terms"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="managementFeeRate"
                label="Service Fee Rate (%)"
                rules={[
                  { required: true, message: "Please enter a service fee rate" },
                ]}
              >
                <InputNumber
                  placeholder="Enter service fee"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="quarter"
                label="Quarter"
                rules={[{ required: true, message: "Please select a quarter" }]}
              >
                <Select
                  placeholder="Select quarter"
                  options={["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({
                    value: quarter,
                    label: quarter,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <FileUploadComponent
            onFileUpload={(files) => setUploadedFiles(files)}
            initialFiles={initialFiles}
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Update Mandate
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Add-On Drawer */}
      <Drawer
        title="Create Additional Contribution (Add-On)"
        open={isAddOnDrawerVisible}
        onClose={closeAddOnDrawer}
        width={400}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="amount"
            label="Additional Amount (GH₵)"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber
              placeholder="e.g. 5000"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={closeAddOnDrawer}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={addOnLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Contribution
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Add-Off Drawer */}
      <Drawer
        title="Create One-Off Disbursement"
        open={isAddOffDrawerVisible}
        onClose={closeAddOffDrawer}
        width={450}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="amount"
            label="Disbursement Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber
              placeholder="e.g. 1000"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>
          <Form.Item
            name="currency"
            label="Currency"
            initialValue="GHS"
            rules={[{ required: true, message: "Please select currency" }]}
          >
            <Select
              options={[
                { value: "GHS", label: "GHS (Ghana Cedi)" },
                { value: "USD", label: "USD (US Dollar)" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="oneOffYield"
            label="One-Off Yield (%)"
            rules={[{ required: true, message: "Please enter yield rate" }]}
          >
            <InputNumber placeholder="e.g. 5" style={{ width: "100%" }} />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={closeAddOffDrawer}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={addOffLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Disbursement
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Details Drawer */}
      {selectedInvestmentId && (
        <InvestmentDetailDrawer
          investmentId={selectedInvestmentId}
          open={investmentDetailsDrawerVisible}
          onClose={closeInvestmentDetailsDrawer}
        />
      )}
    </div>
  );
};

export default WealthTable;

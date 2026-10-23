import { formatMultipleCurrency, formatPriceGHS } from "@/lib/helper";
import { AiOutlineFilePdf } from "react-icons/ai";
import {
  useDeleteAddOnMutation,
  useUpdateAddOnMutation,
} from "@/services/addOn";
import {
  useGetAllInvestmentsQuery,
  useUpdateInvestmentMutation,
} from "@/services/investment";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

const { Text } = Typography;
const { Option } = Select;

interface AddOn {
  _id: string;
  amount: number;
  accruedInterest: number;
  startDate: Date;
  status: string;
}

interface InvestmentData {
  transactionId: string;
  name: string;
  principal: number;
  guaranteedRate: number;
  addOns: AddOn[];
  principalAccruedReturn: number;
  addOnAccruedReturn: number;
  totalAccruedReturn: number;
  quarterEndDate: string;
  quarter: string;
  archived: boolean;
  active: boolean;
  startDate: Date;
  managementFee: number;
  performanceYield: number;
  certificate: string[];
  checklist: string[];
  mandate: string[];
  partnerForm: string[];
  lastModified: string;
  userId: any;
  managementFeeRate?: number;
  operationalCost?: number;
}

const InvestmentDetailDrawer = ({
  investment: propInvestment,
  investmentId,
  visible,
  open,
  onClose,
}: any) => {
  const isOpen = open !== undefined ? Boolean(open) : Boolean(visible);

  const { data: allInvestmentsData } = useGetAllInvestmentsQuery(null, {
    skip: !isOpen,
  });

  const investment =
    propInvestment ||
    (investmentId &&
      allInvestmentsData?.data?.find(
        (i: any) => String(i._id) === String(investmentId),
      )) ||
    null;

  const [form] = Form.useForm();
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [updateAddOn] = useUpdateAddOnMutation();
  const [deleteAddOn] = useDeleteAddOnMutation();
  const [updateInvestment] = useUpdateInvestmentMutation();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("mandate");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDeleteDoc = async (categoryKey: string, urlToDelete: string) => {
    if (!investment?._id) return;
    const result = await Swal.fire({
      title: "Remove Document?",
      text: "Are you sure you want to remove this document from the mandate?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Remove",
    });

    if (result.isConfirmed) {
      try {
        const currentList = investment[categoryKey] || [];
        const updatedList = currentList.filter((u: string) => u !== urlToDelete);
        await updateInvestment({
          id: investment._id,
          data: { [categoryKey]: updatedList },
        }).unwrap();
        message.success("Document removed successfully");
      } catch (err: any) {
        message.error(
          err?.data?.message || err?.message || "Failed to remove document"
        );
      }
    }
  };

  const handleAdminUploadSubmit = async () => {
    if (!uploadFile) {
      message.error("Please select a file to upload");
      return;
    }
    if (uploadFile.size > 15 * 1024 * 1024) {
      message.error("File size exceeds 15MB limit");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", uploadFile);
      formData.append("folder", "mandates");
      formData.append("category", uploadCategory);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        headers: token
          ? {
              Authorization: token.startsWith("Bearer ")
                ? token
                : `Bearer ${token}`,
            }
          : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const uploadedUrl =
        data?.uploads?.[0]?.url ||
        data?.urls?.[0]?.secure_url ||
        data?.urls?.[0]?.url;
      if (!uploadedUrl) throw new Error("No URL returned from upload");

      const currentList = investment[uploadCategory] || [];
      const updatedList = [...currentList, uploadedUrl];

      await updateInvestment({
        id: investment._id,
        data: { [uploadCategory]: updatedList },
      }).unwrap();

      message.success("Document attached to mandate successfully");
      setIsUploadModalOpen(false);
      setUploadFile(null);
    } catch (err: any) {
      message.error(
        err?.data?.message || err?.message || "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (record: AddOn) => {
    setEditingAddOn(record);
    form.setFieldsValue({
      status: record.status,
      startDate: moment(record.startDate),
    });
    setEditModalVisible(true);
  };

  const handleDelete = (record: AddOn) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able t revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteAddOn(record._id).unwrap();
          Swal.fire(
            "Deleted!",
            "Additional Contribution has been deleted.",
            "success",
          );
        } catch (error) {
          Swal.fire(
            "Error!",
            "Failed to delete Additional Contribution.",
            "error",
          );
        }
      }
    });
  };

  const handleFinishEdit = async (values: any) => {
    if (editingAddOn) {
      try {
        await updateAddOn({
          id: editingAddOn._id,
          data: {
            ...values,
            startDate: values.startDate.toISOString(),
          },
        }).unwrap();
        message.success("Additional Contribution updated successfully");
        setEditModalVisible(false);
        setEditingAddOn(null);
      } catch (error) {
        message.error("Failed to update Additional Contribution");
      }
    }
  };

  const isPdfUrl = (url: string) => /\.pdf($|\?)/i.test(url);
  const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/i.test(url);
  const isVideoUrl = (url: string) => /\.(mp4|mov|webm|ogg)($|\?)/i.test(url);

  const getCleanFileName = (url: string, defaultName: string) => {
    try {
      const raw = url.split("/").pop()?.split("?")[0] || defaultName;
      const clean = raw.replace(/^\d+[-_]/, "");
      return decodeURIComponent(clean) || defaultName;
    } catch {
      return defaultName;
    }
  };

  const handlePreviewOut = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenPreview = (url: string, title: string) => {
    setPreviewDoc({ url, title });
  };

  const deriveQuarterFromDate = (date?: string | Date | null) => {
    if (!date) return "N/A";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return `Q${Math.ceil((parsed.getMonth() + 1) / 3)}`;
  };

  const displayedQuarter = investment
    ? investment.quarter === deriveQuarterFromDate(investment.quarterEndDate)
      ? investment.quarter
      : deriveQuarterFromDate(investment.quarterEndDate)
    : "N/A";

  const renderDocSection = (
    title: string,
    list?: string[],
    categoryKey?: string
  ) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <Title level={5} className="!mb-0 !text-xs !font-bold text-slate-800 uppercase tracking-wider">
            {title} ({list.length})
          </Title>
        </div>
        <Row gutter={[12, 12]}>
          {list.map((url: string, index: number) => {
            const fileName = getCleanFileName(url, `${title}-${index + 1}`);
            const isPdf = isPdfUrl(url);
            const isImg = isImageUrl(url);
            const isVid = isVideoUrl(url);

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={`${title}-${index}`}>
                <div className="group rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between h-full">
                  {/* Thumbnail / Preview Area */}
                  <div
                    className="w-full h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative cursor-pointer overflow-hidden"
                    onClick={() => handleOpenPreview(url, fileName)}
                    title={`Click to preview ${fileName}`}
                  >
                    {isImg ? (
                      <img
                        src={url}
                        alt={fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : isPdf ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                        <FilePdfOutlined className="text-3xl text-rose-500" />
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          PDF Document
                        </span>
                      </div>
                    ) : isVid ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                        <span className="text-2xl">🎬</span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          Video File
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                        <FileTextOutlined className="text-3xl text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          Document
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="small"
                        type="primary"
                        icon={<EyeOutlined />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview(url, fileName);
                        }}
                      >
                        Preview
                      </Button>
                    </div>
                  </div>

                  {/* Document Info & Actions */}
                  <div className="p-2.5 flex items-center justify-between gap-1.5 bg-white">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
                        {fileName}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isPdf ? "PDF" : isImg ? "Image" : isVid ? "Video" : "File"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined className="text-emerald-600" />}
                        onClick={() => handleOpenPreview(url, fileName)}
                        title="Preview Document"
                        className="hover:bg-emerald-50 h-7 w-7 p-0 flex items-center justify-center"
                      />
                      <Button
                        size="small"
                        type="text"
                        icon={<ExportOutlined className="text-slate-500" />}
                        onClick={() => handlePreviewOut(url)}
                        title="Open in new tab"
                        className="hover:bg-slate-100 h-7 w-7 p-0 flex items-center justify-center"
                      />
                      {categoryKey && (
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined className="text-rose-500" />}
                          onClick={() => handleDeleteDoc(categoryKey, url)}
                          title="Remove from mandate"
                          className="hover:bg-rose-50 h-7 w-7 p-0 flex items-center justify-center"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  const addOnColumns = [
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `GH₵${amount.toFixed(2)}`,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: Date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Accrued Yield",
      dataIndex: "accruedInterest",
      key: "accruedInterest",
      render: (value: number) => formatPriceGHS(value || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: AddOn) => (
        <div className="flex gap-2">
          <EditOutlined
            onClick={() => handleEdit(record)}
            className="text-blue-500 cursor-pointer"
          />
          <DeleteOutlined
            onClick={() => handleDelete(record)}
            className="text-red-500 cursor-pointer"
          />
        </div>
      ),
    },
  ];


  return (
    <>
      <Drawer
        title="Mandate Details"
        width={1000}
        onClose={onClose}
        open={isOpen}
        visible={isOpen}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Card title="Mandate Summary" bordered={false}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Transaction ID">
              {investment?.transactionId}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {investment?.userId?.displayName}
            </Descriptions.Item>
            <Descriptions.Item label="Ownership">
              {investment?.isJoint ? (
                <Tag color="blue">Joint</Tag>
              ) : (
                <Tag>Single</Tag>
              )}
            </Descriptions.Item>
            {Array.isArray(investment?.owners) &&
              investment?.owners.length > 0 && (
                <Descriptions.Item label="Co-Owners">
                  <div className="space-y-1">
                    {investment?.owners.map((o: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {o?.user?.displayName ||
                          o?.user?.name ||
                          o?.user?.email ||
                          o?.user?._id}
                      </div>
                    ))}
                  </div>
                </Descriptions.Item>
              )}
            <Descriptions.Item label="Start Date">
              {moment(investment?.startDate).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label="Mandate Contribution (GHS)">
              {formatPriceGHS(investment?.principal)}
            </Descriptions.Item>
            <Descriptions.Item label="Accrued Disbursements (GHS)">
              {formatPriceGHS(investment?.principalAccruedReturn)}
            </Descriptions.Item>
            <Descriptions.Item label="Contractual Terms (%)">
              {investment?.guaranteedRate}% (Contractual Terms)
            </Descriptions.Item>
            <Descriptions.Item label="Additional Disbursements (GHS)">
              {formatPriceGHS(investment?.addOnAccruedReturn)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Disbursements (GHS)">
              {formatPriceGHS(investment?.totalAccruedReturn)}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter End Date">
              {moment(investment?.quarterEndDate).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              {displayedQuarter}
            </Descriptions.Item>
            <Descriptions.Item label="Service Fee Rate (%)">
              {investment?.managementFeeRate ?? "-"}%
            </Descriptions.Item>
            <Descriptions.Item label="Service Fee (GHS)">
              {formatPriceGHS(investment?.managementFee)}
            </Descriptions.Item>
            <Descriptions.Item label="Performance-Linked Disbursement (GHS)">
              {formatPriceGHS(investment?.performanceYield)}
            </Descriptions.Item>
            <Descriptions.Item label="Operational Charge (GHS)">
              {formatPriceGHS(investment?.operationalCost || 0)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Additional Contributions" bordered={false}>
          <Table
            columns={addOnColumns}
            dataSource={investment?.addOns}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Mandate Documentation Vault
              </span>
              <Button
                size="small"
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
              >
                Upload Document
              </Button>
            </div>
          }
          bordered={false}
          className="shadow-xs rounded-xl"
        >
          {/* Section 1: User & Mandate Documents (Visible to Both Client & Admin) */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded">
                  Mandate Documents (Visible to Both Client & Admin)
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  User docs synchronized and visible to both parties for this mandate
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                Visible to Both
              </span>
            </div>
            {renderDocSection("Mandates", investment?.mandate, "mandate")}
            {renderDocSection("Ledger & Certificate", investment?.certificate, "certificate")}
            {renderDocSection("Client & Supporting Documents (Others)", investment?.others, "others")}
            {!investment?.mandate?.length && !investment?.certificate?.length && !investment?.others?.length && (
              <p className="text-xs text-slate-400 italic py-2">No user mandate documents attached yet.</p>
            )}
          </div>

          {/* Section 2: Admin Section (Just Backend View & Access) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded">
                  Admin Section (Just Backend View or Access)
                </span>
                <p className="text-[11px] text-amber-700/80 mt-1">
                  Strictly internal due diligence checklists and partner contracts (backend view only)
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800">
                Admin Backend Only
              </span>
            </div>
            {renderDocSection("Checklists", investment?.checklist, "checklist")}
            {renderDocSection("Partner Forms", investment?.partnerForm, "partnerForm")}
            {!investment?.checklist?.length && !investment?.partnerForm?.length && (
              <p className="text-xs text-slate-400 italic py-2">No backend admin documents attached yet.</p>
            )}
          </div>
        </Card>
      </Drawer>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        title="Edit Additional Contribution"
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText="Update"
      >
        <Form form={form} layout="vertical" onFinish={handleFinishEdit}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Admin Upload Document to Mandate Modal */}
      <Modal
        open={isUploadModalOpen}
        title="Upload Document to Mandate"
        onCancel={() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
        }}
        footer={null}
        width={480}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Document Section & Category
            </label>
            <Select
              value={uploadCategory}
              onChange={(val) => setUploadCategory(val)}
              className="w-full text-xs"
              options={[
                {
                  label: "Mandate Documents (Visible to Both Parties)",
                  options: [
                    { label: "Mandate Agreement", value: "mandate" },
                    { label: "Ledger & Certificate", value: "certificate" },
                    { label: "Client & Supporting Documents (Others)", value: "others" },
                  ],
                },
                {
                  label: "Admin Section (Just Backend View / Access)",
                  options: [
                    { label: "Checklist (Internal)", value: "checklist" },
                    { label: "Partner Form (Internal)", value: "partnerForm" },
                  ],
                },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select File (PDF, Image, Video, up to 15MB)
            </label>
            <input
              type="file"
              accept="application/pdf,image/*,video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 15 * 1024 * 1024) {
                    message.error("File exceeds 15MB limit");
                    return;
                  }
                  setUploadFile(f);
                }
              }}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
            {uploadFile && (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadFile(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isUploading}
              onClick={handleAdminUploadSubmit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Upload to Mandate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full In-Drawer Document Preview Modal */}
      <Modal
        open={!!previewDoc}
        onCancel={() => setPreviewDoc(null)}
        footer={null}
        width={980}
        title={
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2 min-w-0">
              <FileTextOutlined className="text-emerald-600 text-lg" />
              <span className="font-bold text-sm text-slate-800 truncate">
                {previewDoc?.title || "Document Preview"}
              </span>
            </div>
            {previewDoc?.url && (
              <Button
                size="small"
                icon={<ExportOutlined />}
                onClick={() => handlePreviewOut(previewDoc.url)}
                className="text-xs"
              >
                Open in New Tab
              </Button>
            )}
          </div>
        }
        centered
        destroyOnClose
        className="rounded-2xl overflow-hidden"
      >
        <div className="w-full min-h-[480px] max-h-[80vh] flex items-center justify-center bg-slate-900/5 rounded-xl overflow-hidden p-2">
          {previewDoc?.url && isPdfUrl(previewDoc.url) && (
            <iframe
              src={`${previewDoc.url}#toolbar=1`}
              className="w-full h-[72vh] rounded-lg border border-slate-200 bg-white"
              title={previewDoc.title}
            />
          )}
          {previewDoc?.url && isImageUrl(previewDoc.url) && (
            <div className="flex items-center justify-center p-4 max-h-[72vh] overflow-auto">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
          )}
          {previewDoc?.url && isVideoUrl(previewDoc.url) && (
            <video
              src={previewDoc.url}
              controls
              autoPlay
              className="max-w-full max-h-[72vh] rounded-lg shadow-md"
            />
          )}
          {previewDoc?.url &&
            !isPdfUrl(previewDoc.url) &&
            !isImageUrl(previewDoc.url) &&
            !isVideoUrl(previewDoc.url) && (
              <div className="text-center p-8 space-y-3">
                <FileTextOutlined className="text-5xl text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">
                  {previewDoc.title}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  This document format cannot be rendered inline in the browser. You can open it in a separate tab or download it directly.
                </p>
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  onClick={() => handlePreviewOut(previewDoc.url)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                >
                  Open or Download File
                </Button>
              </div>
            )}
        </div>
      </Modal>
    </>
  );
};

export default InvestmentDetailDrawer;

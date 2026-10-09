"use client";

import React, { useRef } from "react";
import { Modal, Button, Tag, Divider } from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { formatPriceGHS } from "@/lib/helper";
import moment from "moment";

interface DocumentModalProps {
  visible: boolean;
  onClose: () => void;
  documentType: "mandate-statement" | "yield-report";
  quarter: string;
  year: number;
  data: {
    totalBalance: number;
    principal: number;
    accruedInterest: number;
    addOns: number;
    addonAccruedReturn: number;
    oneOffs: number;
    performanceYield: number;
    managementFee: number;
    operationalCost: number;
    guaranteedRate: number;
    activeInvestmentsCount: number;
    quarterEndDate: string;
    daysElapsed: number;
    totalDays: number;
    isClosed: boolean;
  };
}

export const QuarterlyDocumentModal: React.FC<DocumentModalProps> = ({
  visible,
  onClose,
  documentType,
  quarter,
  year,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isStatement = documentType === "mandate-statement";
  const docTitle = isStatement
    ? `Quarterly Mandate Statement (${quarter} ${year})`
    : `Quarterly Ledger Report (${quarter} ${year})`;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={780}
      style={{ maxWidth: "calc(100vw - 24px)", top: 20 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="print"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          className="border-gray-300"
        >
          Print / PDF
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-700 border-none"
        >
          Download PDF
        </Button>,
      ]}
    >
      <div
        ref={printRef}
        className="p-6 bg-white text-gray-800 rounded-lg space-y-6 print:p-0 print:m-0"
      >
        {/* Document Header with Lynchpin Global Branding */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                LG
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                  LYNCHPIN GLOBAL
                </h1>
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold mt-0.5">
                  Partners Wealth & Asset Management
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Accredited Partner Quarterly Ledger • Financial Services
            </p>
          </div>

          <div className="text-right">
            <Tag
              color={data.isClosed ? "green" : "blue"}
              className="text-xs px-2.5 py-0.5 uppercase font-medium"
            >
              {data.isClosed ? "Official Closed Statement" : "Interim Progress Ledger"}
            </Tag>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              REF: LPG-{year}-{quarter}-
              {Math.abs(Math.round(data.principal)).toString().slice(-4) || "8801"}
            </p>
            <p className="text-xs text-gray-400">
              Date: {moment().format("MMMM Do, YYYY")}
            </p>
          </div>
        </div>

        {/* Document Title Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-100/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              {isStatement ? "Holding Statement" : "Disbursement Ledger"}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{docTitle}</h2>
            <p className="text-xs text-gray-600">
              Accounting Period: {quarter} {year} • Quarter Closing: {data.quarterEndDate}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Day Count Convention</span>
            <p className="text-xs font-semibold text-emerald-800">
              30/360 Daily Accrual
            </p>
            <span className="text-xs text-gray-500">
              {data.daysElapsed} of {data.totalDays} Days Tracked
            </span>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
            <span className="text-xs uppercase text-gray-500 font-medium">
              Mandate Principal
            </span>
            <p className="text-base font-bold text-gray-900 mt-1">
              {formatPriceGHS(data.principal)}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
            <span className="text-xs uppercase text-gray-500 font-medium">
              Accrued Disbursements
            </span>
            <p className="text-base font-bold text-emerald-600 mt-1">
              {formatPriceGHS(data.accruedInterest)}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
            <span className="text-xs uppercase text-gray-500 font-medium">
              Net Total Valuation
            </span>
            <p className="text-base font-bold text-gray-900 mt-1">
              {formatPriceGHS(data.totalBalance)}
            </p>
          </div>
        </div>

        {/* Comprehensive Schedule Table */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">
            Quarterly Breakdown Schedule
          </h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-[11px] font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3.5">Line Item</th>
                  <th className="py-2.5 px-3.5">Classification</th>
                  <th className="py-2.5 px-3.5 text-right">Yield / Terms</th>
                  <th className="py-2.5 px-3.5 text-right">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-2.5 px-3.5 font-semibold text-gray-900">
                    Active Mandate Principal
                  </td>
                  <td className="py-2.5 px-3.5 text-gray-500">Committed Capital</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">
                    {data.guaranteedRate ? `${data.guaranteedRate}% p.a.` : "Agreed"}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-gray-900 font-bold">
                    {formatPriceGHS(data.principal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-800">
                    Daily Accrued Return to Date
                  </td>
                  <td className="py-2.5 px-3.5 text-emerald-600">Earned Accrual</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">
                    Day {data.daysElapsed}/{data.totalDays}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-emerald-700">
                    +{formatPriceGHS(data.accruedInterest)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-800">
                    Additional Mandate Contributions
                  </td>
                  <td className="py-2.5 px-3.5 text-gray-500">Add-ons</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">During Term</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-900">
                    +{formatPriceGHS(data.addOns)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-800">
                    Additional Accrued Disbursements
                  </td>
                  <td className="py-2.5 px-3.5 text-emerald-600">Add-on Yield</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">Calculated</td>
                  <td className="py-2.5 px-3.5 text-right text-emerald-700">
                    +{formatPriceGHS(data.addonAccruedReturn)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-800">
                    One-Off Disbursements & Yield
                  </td>
                  <td className="py-2.5 px-3.5 text-blue-600">Performance One-Off</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">Disbursed</td>
                  <td className="py-2.5 px-3.5 text-right text-blue-700">
                    +{formatPriceGHS(data.oneOffs)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-800">
                    Performance-Linked Disbursement
                  </td>
                  <td className="py-2.5 px-3.5 text-blue-600">Incentive Yield</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">Milestone</td>
                  <td className="py-2.5 px-3.5 text-right text-blue-700">
                    +{formatPriceGHS(data.performanceYield)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-600">
                    Service & Portfolio Management Fee
                  </td>
                  <td className="py-2.5 px-3.5 text-rose-500">Contractual Deduction</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">Quarterly</td>
                  <td className="py-2.5 px-3.5 text-right text-rose-600">
                    -{formatPriceGHS(data.managementFee)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 text-gray-600">
                    Operational Charges
                  </td>
                  <td className="py-2.5 px-3.5 text-rose-500">Administration</td>
                  <td className="py-2.5 px-3.5 text-right text-gray-600">Quarterly</td>
                  <td className="py-2.5 px-3.5 text-right text-rose-600">
                    -{formatPriceGHS(data.operationalCost)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 border-t border-emerald-200">
                  <td
                    colSpan={3}
                    className="py-3 px-3.5 font-bold text-gray-900 text-right uppercase tracking-wider"
                  >
                    Net Closing Valuation ({quarter} {year})
                  </td>
                  <td className="py-3 px-3.5 text-right font-extrabold text-emerald-800 text-sm">
                    {formatPriceGHS(data.totalBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit & Legal Footer */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <SafetyCertificateOutlined />
            <span>Digitally Verified & Certified by Lynchpin Global Portfolio Engine</span>
          </div>
          <div>Page 1 of 1 • System Generated</div>
        </div>
      </div>
    </Modal>
  );
};

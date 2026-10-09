"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Input, DatePicker, Button, Tag, Space, Divider, Alert } from "antd";
import { formatPriceGHS } from "@/lib/helper";
import dayjs from "dayjs";
import { Calculator, CheckCircle2, TrendingUp, Calendar, AlertCircle } from "lucide-react";

interface RolloverEditModalProps {
  visible: boolean;
  candidate: any;
  targetQuarter: string;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
}

export const RolloverEditModal: React.FC<RolloverEditModalProps> = ({
  visible,
  candidate,
  targetQuarter,
  onClose,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();
  const [newPrincipal, setNewPrincipal] = useState<number>(0);
  const [guaranteedRate, setGuaranteedRate] = useState<number>(8);
  const [managementFeeRate, setManagementFeeRate] = useState<number>(20);

  useEffect(() => {
    if (candidate && visible) {
      const initialPrincipal = candidate.suggestedNewPrincipal ?? candidate.netClosingBalance ?? 0;
      const initialRate = candidate.guaranteedRate ?? 8;
      const initialFee = candidate.managementFeeRate ?? 20;

      setNewPrincipal(initialPrincipal);
      setGuaranteedRate(initialRate);
      setManagementFeeRate(initialFee);

      form.setFieldsValue({
        newPrincipal: initialPrincipal,
        guaranteedRate: initialRate,
        managementFeeRate: initialFee,
        operationalCost: candidate.operationalCost ?? 0,
        performanceYield: candidate.performanceYield ?? 0,
        startDate: candidate.startDate ? dayjs(candidate.startDate) : dayjs(),
        quarterEndDate: candidate.quarterEndDate
          ? dayjs(candidate.quarterEndDate).add(3, "month")
          : dayjs().add(3, "month"),
        notes: "",
      });
    }
  }, [candidate, visible, form]);

  if (!candidate) return null;

  // Calculation helpers
  const closingBalance = candidate.netClosingBalance || 0;
  const principalDiff = (newPrincipal || 0) - closingBalance;

  // Quarterly projected returns
  const projectedGrossInterest = (newPrincipal || 0) * ((guaranteedRate || 0) / 100);
  const projectedManagementFee = projectedGrossInterest * ((managementFeeRate || 0) / 100);
  const projectedNetAccrued = Math.max(0, projectedGrossInterest - projectedManagementFee);
  const projectedEndingValue = (newPrincipal || 0) + projectedNetAccrued;

  const handleApplyPreset = (type: "full" | "principal") => {
    let value = 0;
    if (type === "full") {
      value = candidate.netClosingBalance || 0;
    } else if (type === "principal") {
      value = candidate.endingPrincipal || 0;
    }
    setNewPrincipal(value);
    form.setFieldsValue({ newPrincipal: value });
  };

  const handleFinish = async (values: any) => {
    const payload = {
      investmentId: candidate.investmentId,
      targetQuarter,
      newPrincipal: Number(values.newPrincipal),
      guaranteedRate: Number(values.guaranteedRate),
      managementFeeRate: Number(values.managementFeeRate),
      operationalCost: Number(values.operationalCost || 0),
      performanceYield: Number(values.performanceYield || 0),
      startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
      quarterEndDate: values.quarterEndDate ? values.quarterEndDate.toISOString() : undefined,
      notes: values.notes,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Configure Mandate Rollover
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Client: <span className="text-slate-800 font-semibold">{candidate.user?.name || "N/A"}</span> • License:{" "}
              <span className="font-mono text-emerald-700 font-bold">{candidate.user?.license || "N/A"}</span>
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={680}
      footer={null}
      destroyOnClose
      className="rounded-2xl"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        {/* Previous Quarter Summary Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Ending Quarter Summary ({candidate.sourceQuarter || "Previous"})</span>
            <Tag color="blue">{candidate.name || "Main Mandate"}</Tag>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block">Ending Principal</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {formatPriceGHS(candidate.endingPrincipal || 0)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-emerald-600 font-semibold block">Accrued Return</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700">
                +{formatPriceGHS(candidate.accruedReturn || 0)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-600 font-semibold block">Net Closing Balance</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {formatPriceGHS(candidate.netClosingBalance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60">
          <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Quick Capital Presets:
          </span>
          <Space>
            <Button
              size="small"
              onClick={() => handleApplyPreset("full")}
              className="text-xs rounded-lg font-medium border-emerald-200 hover:border-emerald-500 text-emerald-800"
            >
              100% Rollover (Full Balance)
            </Button>
            <Button
              size="small"
              onClick={() => handleApplyPreset("principal")}
              className="text-xs rounded-lg font-medium border-slate-200 hover:border-slate-400 text-slate-700"
            >
              Principal Only (Disburse Accrued)
            </Button>
          </Space>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                New Rollover Principal (GH₵)
              </span>
            }
            name="newPrincipal"
            rules={[{ required: true, message: "Please enter new principal" }]}
            extra={
              principalDiff !== 0 ? (
                <span
                  className={`text-[11px] font-semibold mt-1 block ${
                    principalDiff > 0 ? "text-blue-600" : "text-amber-600"
                  }`}
                >
                  {principalDiff > 0 ? `+${formatPriceGHS(principalDiff)} added` : `${formatPriceGHS(principalDiff)} adjustment`} compared to closing balance
                </span>
              ) : (
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  Exact 100% rollover of closing balance
                </span>
              )
            }
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={1000}
              size="large"
              placeholder="0.00"
              onChange={(val) => setNewPrincipal(Number(val) || 0)}
              className="rounded-xl font-bold text-slate-900"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Target Quarter
              </span>
            }
          >
            <div className="h-10 px-3 flex items-center rounded-xl bg-slate-100 border border-slate-200 font-bold text-sm text-slate-800">
              {targetQuarter}
            </div>
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Guaranteed Rate (%)
              </span>
            }
            name="guaranteedRate"
            rules={[{ required: true, message: "Rate required" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              step={0.5}
              onChange={(val) => setGuaranteedRate(Number(val) || 0)}
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Management Fee Rate (%)
              </span>
            }
            name="managementFeeRate"
            rules={[{ required: true, message: "Fee required" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              step={1}
              onChange={(val) => setManagementFeeRate(Number(val) || 0)}
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Start Date
              </span>
            }
            name="startDate"
            rules={[{ required: true, message: "Start date required" }]}
          >
            <DatePicker style={{ width: "100%" }} className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Quarter End Date
              </span>
            }
            name="quarterEndDate"
            rules={[{ required: true, message: "End date required" }]}
          >
            <DatePicker style={{ width: "100%" }} className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Operational Cost (GH₵)
              </span>
            }
            name="operationalCost"
          >
            <InputNumber style={{ width: "100%" }} min={0} step={100} className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-semibold text-slate-700">
                Performance Yield (GH₵)
              </span>
            }
            name="performanceYield"
          >
            <InputNumber style={{ width: "100%" }} min={0} step={100} className="rounded-xl" />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span className="text-xs font-semibold text-slate-700">
              Admin Notes / Remarks (Optional)
            </span>
          }
          name="notes"
        >
          <Input.TextArea
            rows={2}
            placeholder="e.g. Rollover executed with partial principal payout as requested by partner..."
            className="rounded-xl text-xs"
          />
        </Form.Item>

        {/* Live Calculation Preview Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-md mb-5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Projected Metrics for {targetQuarter}
            </span>
            <Tag color="cyan">Automatic Recalculation</Tag>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Rollover Capital</span>
              <span className="font-bold text-sm text-white">{formatPriceGHS(newPrincipal)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Projected Gross ({guaranteedRate}%)</span>
              <span className="font-bold text-sm text-emerald-300">+{formatPriceGHS(projectedGrossInterest)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Mgmt Fee ({managementFeeRate}%)</span>
              <span className="font-bold text-sm text-rose-300">-{formatPriceGHS(projectedManagementFee)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Projected End Value</span>
              <span className="font-bold text-sm text-emerald-400">{formatPriceGHS(projectedEndingValue)}</span>
            </div>
          </div>
        </div>

        {candidate.isRolledOver && (
          <Alert
            message="Notice: This mandate already has a rolled-over record."
            description={`Already assigned Transaction ID: ${candidate.existingRolloverTransactionId || "Existing"}. Submitting will prevent duplicate creation.`}
            type="warning"
            showIcon
            className="mb-4 rounded-xl text-xs"
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button onClick={onClose} disabled={loading} className="rounded-xl font-medium">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 h-10 shadow-md shadow-emerald-600/20"
          >
            Execute Rollover for Client
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RolloverEditModal;

"use client";

import React from "react";
import { Modal, Button, Alert, Tag, Space } from "antd";
import { formatPriceGHS } from "@/lib/helper";
import { CheckCircle2, AlertTriangle, Layers, ArrowRight } from "lucide-react";

interface RolloverBatchModalProps {
  visible: boolean;
  candidates: any[];
  targetQuarter: string;
  sourceQuarter: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const RolloverBatchModal: React.FC<RolloverBatchModalProps> = ({
  visible,
  candidates,
  targetQuarter,
  sourceQuarter,
  onClose,
  onConfirm,
  loading,
}) => {
  const pendingCandidates = candidates.filter((c) => !c.isRolledOver);
  const totalRolloverCapital = pendingCandidates.reduce(
    (acc, curr) => acc + (curr.suggestedNewPrincipal || curr.netClosingBalance || 0),
    0
  );
  const totalAccruedProfit = pendingCandidates.reduce(
    (acc, curr) => acc + (curr.accruedReturn || 0),
    0
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Batch Rollover Confirmation
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Advance all eligible ending mandates into <span className="font-bold text-slate-800">{targetQuarter}</span>
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={560}
      footer={null}
      destroyOnClose
      className="rounded-2xl"
    >
      <div className="py-3">
        <div className="flex items-center justify-center gap-4 my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-center">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Source Quarter</span>
            <Tag color="orange" className="text-sm font-bold px-3 py-0.5 mt-1">
              {sourceQuarter}
            </Tag>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="text-center">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Target Quarter</span>
            <Tag color="green" className="text-sm font-bold px-3 py-0.5 mt-1">
              {targetQuarter}
            </Tag>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block">Pending Mandates</span>
            <span className="text-xl font-black text-slate-900">{pendingCandidates.length}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-700 font-semibold block">Total Rollover Value</span>
            <span className="text-xl font-black text-emerald-800">{formatPriceGHS(totalRolloverCapital)}</span>
          </div>
        </div>

        <Alert
          message="Notice on Batch Rollover Action"
          description={
            <div className="text-xs text-slate-600 space-y-1 mt-1">
              <p>• All pending mandates in {sourceQuarter} will be archived as completed quarter records.</p>
              <p>• New transactions will be generated in {targetQuarter} with 100% full compounding balances.</p>
              <p>• Each mandate will be immediately recalculated with active interest generation.</p>
            </div>
          }
          type="info"
          showIcon
          className="rounded-xl mb-5"
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button onClick={onClose} disabled={loading} className="rounded-xl font-medium">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={onConfirm}
            loading={loading}
            disabled={pendingCandidates.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 h-10 shadow-md shadow-emerald-600/20"
          >
            Confirm & Execute Batch ({pendingCandidates.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RolloverBatchModal;

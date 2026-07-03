import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Order } from '../types';

interface RefundModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export default function RefundModal({ order, isOpen, onClose, onConfirm }: RefundModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 select-none backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 text-[15px]">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>退款确认</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 hover:bg-slate-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-[13px] text-slate-600">
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-800 font-medium leading-relaxed">
              确认后将按原支付路径退款，请与客户及时核对
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
            <div className="grid grid-cols-3 py-3 px-5">
              <span className="text-slate-400 font-medium">订单编号</span>
              <span className="col-span-2 text-slate-800 font-mono font-semibold select-all">{order.id}</span>
            </div>
            <div className="grid grid-cols-3 py-3 px-5">
              <span className="text-slate-400 font-medium">商品名称</span>
              <span className="col-span-2 text-slate-800 font-semibold">{order.productName}</span>
            </div>
            <div className="grid grid-cols-3 py-3 px-5">
              <span className="text-slate-400 font-medium">数量</span>
              <span className="col-span-2 text-slate-800 font-semibold">{order.quantity}</span>
            </div>
            <div className="grid grid-cols-3 py-3 px-5">
              <span className="text-slate-400 font-medium">订单总额</span>
              <span className="col-span-2 text-red-500 font-bold text-sm">{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 py-3 px-5">
              <span className="text-slate-400 font-medium">订单时间</span>
              <span className="col-span-2 text-slate-600 font-mono font-medium">{order.orderTime}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(order.id)}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 active:bg-red-800 shadow-sm transition-colors cursor-pointer"
          >
            确认退款
          </button>
        </div>

      </div>
    </div>
  );
}

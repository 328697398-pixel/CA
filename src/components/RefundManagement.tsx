import React, { useState } from 'react';
import { RefundSlip } from '../types';
import { Search, RotateCcw, ShieldCheck } from 'lucide-react';

interface RefundManagementProps {
  refundSlips: RefundSlip[];
}

export default function RefundManagement({ refundSlips }: RefundManagementProps) {
  const [keyword, setKeyword] = useState('');
  const [advisor, setAdvisor] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const advisors = ['陈献红1', '周鸿祎', '宋青书', '殷素素'];

  // Filter refund slips
  const filteredSlips = refundSlips.filter(slip => {
    const matchesKeyword = keyword === '' || 
      slip.refundId.toLowerCase().includes(keyword.toLowerCase()) ||
      slip.orderId.toLowerCase().includes(keyword.toLowerCase()) ||
      slip.productName.toLowerCase().includes(keyword.toLowerCase()) ||
      slip.advisor.toLowerCase().includes(keyword.toLowerCase());

    const matchesAdvisor = advisor === 'all' || slip.advisor === advisor;

    return matchesKeyword && matchesAdvisor;
  });

  const totalItems = filteredSlips.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSlips = filteredSlips.slice(startIndex, endIndex);

  const handleReset = () => {
    setKeyword('');
    setAdvisor('all');
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 flex flex-col gap-6 overflow-y-auto min-h-0 select-none text-[13px]">
      
      {/* Search Filter Panel */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="退款单号/原订单号/商品名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 w-64 text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">护理顾问</span>
          <select
            value={advisor}
            onChange={(e) => {
              setAdvisor(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-3 py-2 w-44 text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
          >
            <option value="all">请选择</option>
            {advisors.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCurrentPage(1)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-5 py-2 rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5 border border-blue-600"
        >
          <Search className="w-4 h-4" />
          <span>查询</span>
        </button>

        <button
          onClick={handleReset}
          className="bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 border-b border-slate-200 font-medium h-[44px]">
              <tr>
                <th className="px-6 w-[180px] font-semibold text-slate-600">退款单号</th>
                <th className="px-6 w-[180px] font-semibold text-slate-600">原订单号</th>
                <th className="px-6 w-[140px] font-semibold text-slate-600">商品名称</th>
                <th className="px-6 w-[80px] font-semibold text-slate-600 text-center">退款数量</th>
                <th className="px-6 w-[100px] font-semibold text-slate-600 text-right">退款总额</th>
                <th className="px-6 w-[150px] font-semibold text-slate-600">原订单时间</th>
                <th className="px-6 w-[150px] font-semibold text-slate-600">退款时间</th>
                <th className="px-6 w-[110px] font-semibold text-slate-600">护理顾问</th>
                <th className="px-6 w-[100px] font-semibold text-slate-600 text-center">退款状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedSlips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="font-semibold text-slate-600 text-sm">暂无退款单记录</span>
                      <span className="text-xs text-slate-400">在“订单管理”列表中，点击今日订单的“退款”按钮进行退款</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSlips.map((slip) => (
                  <tr key={slip.refundId} className="hover:bg-slate-50/50 transition-colors h-[48px]">
                    <td className="px-6 font-mono font-semibold truncate text-blue-600 select-all" title={slip.refundId}>
                      {slip.refundId}
                    </td>
                    <td className="px-6 font-mono truncate select-all text-slate-800" title={slip.orderId}>
                      {slip.orderId}
                    </td>
                    <td className="px-6 truncate font-medium" title={slip.productName}>
                      {slip.productName}
                    </td>
                    <td className="px-6 text-center font-medium text-slate-900">
                      {slip.quantity}
                    </td>
                    <td className="px-6 text-right font-mono font-semibold text-red-500">
                      -{slip.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 font-mono text-slate-500 truncate" title={slip.orderTime}>
                      {slip.orderTime}
                    </td>
                    <td className="px-6 font-mono text-slate-500 truncate" title={slip.refundTime}>
                      {slip.refundTime}
                    </td>
                    <td className="px-6 truncate text-slate-600" title={slip.advisor}>
                      {slip.advisor}
                    </td>
                    <td className="px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>已退原路</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            <span>共 {totalItems} 条</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 rounded-lg border border-slate-200 flex items-center justify-center min-w-[32px] h-[32px] transition-all ${
                currentPage === 1
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100'
                  : 'bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer text-slate-600 font-semibold'
              }`}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const isSelected = currentPage === idx + 1;
              return (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-2.5 py-1 rounded-lg border min-w-[32px] h-[32px] transition-all cursor-pointer font-semibold text-center ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2.5 py-1 rounded-lg border border-slate-200 flex items-center justify-center min-w-[32px] h-[32px] transition-all ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100'
                  : 'bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer text-slate-600 font-semibold'
              }`}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

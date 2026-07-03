import React, { useState } from 'react';
import { RevenueTransaction } from '../types';
import { Info, ExternalLink } from 'lucide-react';

interface RevenueManagementProps {
  transactions: RevenueTransaction[];
  onAddWithdrawal?: () => void;
}

export default function RevenueManagement({ transactions, onAddWithdrawal }: RevenueManagementProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculate dynamic stats from transactions
  // Latest transaction has the current active balance
  const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;
  
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="flex-1 p-8 bg-slate-50 flex flex-col gap-6 overflow-y-auto min-h-0 select-none text-[13px]">
      
      {/* Financial Stats Section */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 grid grid-cols-3 gap-6 shrink-0 divide-x divide-slate-100">
        <div className="space-y-1">
          <div className="text-slate-400 font-medium text-xs">总金额</div>
          <div className="text-3xl font-bold text-slate-900 font-sans tracking-tight">
            {currentBalance.toFixed(2)}
          </div>
        </div>
        <div className="space-y-1 pl-6">
          <div className="text-slate-400 font-medium text-xs">待结算金额</div>
          <div className="text-3xl font-bold text-slate-900 font-sans tracking-tight">0.00</div>
        </div>
        <div className="space-y-1 pl-6">
          <div className="text-slate-400 font-medium text-xs">待提现金额</div>
          <div className="text-3xl font-bold text-slate-900 font-sans tracking-tight">0.00</div>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="shrink-0 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-800">交易明细</h2>
        <button
          onClick={onAddWithdrawal}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all cursor-pointer shadow-sm border border-blue-600"
        >
          申请提现
        </button>
      </div>

      {/* Transactions Table Panel */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 border-b border-slate-200 font-medium h-[44px]">
              <tr>
                <th className="px-6 w-[160px] font-semibold text-slate-600">记账时间</th>
                <th className="px-6 w-[160px] font-semibold text-slate-600">业务单据时间</th>
                <th className="px-6 w-[180px] font-semibold text-slate-600">业务单号</th>
                <th className="px-6 w-[110px] font-semibold text-slate-600">业务类型</th>
                <th className="px-6 w-[110px] font-semibold text-slate-600 text-right">收入 (元)</th>
                <th className="px-6 w-[110px] font-semibold text-slate-600 text-right">支出 (元)</th>
                <th className="px-6 w-[110px] font-semibold text-slate-600 text-right">账户余额</th>
                <th className="px-6 w-[100px] font-semibold text-slate-600 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    暂无账单数据明细
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const isRefund = tx.businessType === '订单退款';
                  const isWithdrawal = tx.businessType === '提现';
                  const isShare = tx.businessType === '订单分账';

                  return (
                    <tr 
                      key={`${tx.transactionId}-${idx}`} 
                      className={`hover:bg-slate-50/50 transition-colors h-[48px] ${
                        isRefund ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Accounting Time */}
                      <td className="px-6 font-mono text-slate-500 truncate" title={tx.accountingTime}>
                        {tx.accountingTime}
                      </td>

                      {/* Business Document Time */}
                      <td className="px-6 font-mono text-slate-500 truncate" title={tx.documentTime}>
                        {tx.documentTime}
                      </td>

                      {/* Transaction ID */}
                      <td className="px-6 font-mono font-medium truncate select-all text-slate-800" title={tx.transactionId}>
                        {tx.transactionId}
                      </td>

                      {/* Business Type */}
                      <td className="px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isRefund 
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : isWithdrawal
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {tx.businessType}
                        </span>
                      </td>

                      {/* Income */}
                      <td className={`px-6 text-right font-mono font-semibold ${isShare ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {tx.income !== null ? tx.income.toFixed(2) : '-'}
                      </td>

                      {/* Expense */}
                      <td className={`px-6 text-right font-mono font-semibold ${isWithdrawal || isRefund ? 'text-red-500' : 'text-slate-400'}`}>
                        {tx.expense !== null ? tx.expense.toFixed(2) : '-'}
                      </td>

                      {/* Balance */}
                      <td className="px-6 text-right font-mono font-semibold text-slate-900">
                        {tx.balance.toFixed(2)}
                      </td>

                      {/* Action column */}
                      <td className="px-6 text-center">
                        {isWithdrawal ? (
                          <button 
                            onClick={() => alert(`提现详情单号: ${tx.transactionId}\n类型: 提现\n状态: 成功\n金额: ¥${tx.expense?.toFixed(2)}`)}
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors flex items-center justify-center gap-0.5 mx-auto cursor-pointer focus:outline-none"
                          >
                            <span>查看详情</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
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

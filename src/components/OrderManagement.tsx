import React, { useState } from 'react';
import { Order } from '../types';
import { Search, RotateCcw } from 'lucide-react';

interface OrderManagementProps {
  orders: Order[];
  onTriggerRefund: (order: Order) => void;
}

export default function OrderManagement({ orders, onTriggerRefund }: OrderManagementProps) {
  // Query Filters State
  const [keyword, setKeyword] = useState('');
  const [advisor, setAdvisor] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // List of unique advisors for filter dropdown
  const advisors = ['陈献红1', '周鸿祎', '宋青书', '殷素素'];

  // Handle Search Query
  const filteredOrders = orders.filter(order => {
    // Keyword match (Order ID, Product Name, Advisor, or Remark)
    const matchesKeyword = keyword === '' || 
      order.id.toLowerCase().includes(keyword.toLowerCase()) ||
      order.productName.toLowerCase().includes(keyword.toLowerCase()) ||
      order.advisor.toLowerCase().includes(keyword.toLowerCase()) ||
      order.remark.toLowerCase().includes(keyword.toLowerCase());

    // Advisor selection match
    const matchesAdvisor = advisor === 'all' || order.advisor === advisor;

    return matchesKeyword && matchesAdvisor;
  });

  // Calculate pagination details
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Check if order date is "当日" (2026-06-24 based on environment metadata)
  const isTodayOrder = (orderTime: string) => {
    return orderTime.startsWith('2026-06-24');
  };

  const handleReset = () => {
    setKeyword('');
    setAdvisor('all');
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 flex flex-col gap-6 overflow-y-auto min-h-0 select-none text-[13px]">
      
      {/* Search Filter Panel */}
      <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center gap-4 flex-wrap shrink-0">
        
        {/* Keyword Search Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="创享家/护理中心/护理顾问"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 w-64 text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
          />
        </div>

        {/* Advisor Select Dropdown */}
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

        {/* Query Button */}
        <button
          onClick={() => setCurrentPage(1)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-5 py-2 rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5 border border-blue-600"
        >
          <Search className="w-4 h-4" />
          <span>查询</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          title="重置"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 border-b border-slate-200 font-medium h-[44px]">
              <tr>
                <th className="px-6 w-[180px] font-semibold text-slate-600">订单编号</th>
                <th className="px-6 w-[160px] font-semibold text-slate-600">商品名称</th>
                <th className="px-6 w-[90px] font-semibold text-slate-600 text-center">订单数量</th>
                <th className="px-6 w-[100px] font-semibold text-slate-600 text-right">订单总额</th>
                <th className="px-6 w-[120px] font-semibold text-slate-600">护理顾问</th>
                <th className="px-6 w-[160px] font-semibold text-slate-600">订单时间</th>
                <th className="px-6 w-[160px] font-semibold text-slate-600">订单备注</th>
                <th className="px-6 w-[120px] font-semibold text-slate-600 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    暂无符合条件的订单数据
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const today = isTodayOrder(order.orderTime);
                  const canRefund = today && order.status === 'paid';
                  
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50/50 transition-colors h-[48px] ${
                        order.status === 'refunded' ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Order ID */}
                      <td className="px-6 font-mono font-medium truncate select-all text-slate-800" title={order.id}>
                        {order.id}
                      </td>
                      
                      {/* Product Name */}
                      <td className="px-6 truncate font-medium" title={order.productName}>
                        {order.productName}
                      </td>
                      
                      {/* Order Quantity */}
                      <td className="px-6 text-center font-medium text-slate-900">
                        {order.quantity}
                      </td>
                      
                      {/* Order Total Amount */}
                      <td className="px-6 text-right font-mono font-semibold text-slate-900">
                        {order.totalAmount.toFixed(2)}
                      </td>
                      
                      {/* Advisor Name */}
                      <td className="px-6 truncate text-slate-600" title={order.advisor}>
                        {order.advisor}
                      </td>

                      {/* Order Time */}
                      <td className="px-6 font-mono text-slate-500 truncate" title={order.orderTime}>
                        {order.orderTime}
                      </td>
                      
                      {/* Order Remark */}
                      <td className="px-6 text-slate-400 truncate" title={order.remark || '-'}>
                        {order.remark || '-'}
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 text-center">
                        {order.status === 'refunded' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            已退款
                          </span>
                        ) : canRefund ? (
                          <button
                            onClick={() => onTriggerRefund(order)}
                            className="text-red-500 hover:text-red-700 font-semibold transition-colors cursor-pointer focus:outline-none"
                          >
                            退款
                          </button>
                        ) : (
                          <span className="text-slate-300">已过退款期</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span>共 {totalItems} 条</span>
            <div className="flex items-center gap-1">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2 py-1 bg-white hover:border-slate-300 transition-all focus:outline-none text-slate-600 outline-none"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev Button */}
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

            {/* Pagination buttons */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = currentPage === pageNum;
              
              if (totalPages > 7) {
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 rounded-lg border min-w-[32px] h-[32px] transition-all cursor-pointer font-semibold text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2.5 py-1 rounded-lg border min-w-[32px] h-[32px] transition-all cursor-pointer font-semibold text-center ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
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

            {/* Page Jumper */}
            <span className="ml-1 text-slate-400">前往</span>
            <input
              type="text"
              value={currentPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 w-12 text-center font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
            <span className="text-slate-400">页</span>
          </div>
        </div>
      </div>



    </div>
  );
}

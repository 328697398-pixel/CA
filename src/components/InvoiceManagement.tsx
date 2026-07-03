import React, { useState } from 'react';
import { Order } from '../types';
import { Search, RotateCcw } from 'lucide-react';
import InvoiceModal from './InvoiceModal';

interface InvoiceManagementProps {
  orders: Order[];
  onConfirmInvoice: (
    orderIds: string[], 
    invoiceData: { title: string; taxId: string; email?: string; fileUrl: string }
  ) => void;
}

export default function InvoiceManagement({ orders, onConfirmInvoice }: InvoiceManagementProps) {
  // Query Filters State
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTrigger, setSearchTrigger] = useState(''); // state to trigger search on button click

  // Local Modal States for Invoicing
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrdersForBatch, setSelectedOrdersForBatch] = useState<Order[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalMode, setInvoiceModalMode] = useState<'auto' | 'manual'>('auto');

  // Multi-select state
  const [checkedOrderIds, setCheckedOrderIds] = useState<Record<string, boolean>>({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    // Clear the message after 5 seconds
    setTimeout(() => {
      setAlertMessage(prev => prev === msg ? null : prev);
    }, 5000);
    
    // Fallback standard alert
    try {
      alert(msg);
    } catch (e) {
      console.warn("Standard alert blocked by iframe sandbox:", e);
    }
  };

  // Filter only paid (non-refunded) orders for invoicing to match mockup
  const invoicingEligibleOrders = orders.filter(o => o.status === 'paid');

  // Filter based on keyword search
  const filteredOrders = invoicingEligibleOrders.filter(order => {
    const searchVal = searchTrigger.trim().toLowerCase();
    if (searchVal === '') return true;
    
    const matchesId = order.id.toLowerCase().includes(searchVal);
    const matchesProduct = order.productName.toLowerCase().includes(searchVal);
    const matchesAmount = order.totalAmount.toFixed(2).includes(searchVal) || String(order.totalAmount).includes(searchVal);
    
    return matchesId || matchesProduct || matchesAmount;
  });

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Checkbox helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const nextChecked: Record<string, boolean> = {};
    if (checked) {
      paginatedOrders.forEach(o => {
        nextChecked[o.id] = true;
      });
    }
    setCheckedOrderIds(nextChecked);
  };

  const handleSelectRow = (orderId: string, checked: boolean) => {
    setCheckedOrderIds(prev => ({
      ...prev,
      [orderId]: checked
    }));
  };

  const isAllSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => checkedOrderIds[o.id]);

  // Actions
  const handleOpenSingleInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setSelectedOrdersForBatch([]); // clear batch
    setInvoiceModalMode('auto');
    setIsInvoiceModalOpen(true);
  };

  const handleOpenManualInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setSelectedOrdersForBatch([]); // clear batch
    setInvoiceModalMode('manual');
    setIsInvoiceModalOpen(true);
  };

  const handleOpenBatchInvoice = () => {
    const selectedIds = Object.keys(checkedOrderIds).filter(id => checkedOrderIds[id]);
    const selectedList = orders.filter(o => selectedIds.includes(o.id));
    
    if (selectedList.length === 0) {
      triggerAlert('请先勾选未开票的订单！');
      return;
    }

    // Check if any selected order is already invoiced or failed
    const hasOtherStatus = selectedList.some(o => o.invoiceStatus === 'invoiced' || o.invoiceStatus === 'failed');
    if (hasOtherStatus) {
      triggerAlert('批量自动开票只能选择‘未开票’的数据！');
      return;
    }

    setSelectedOrderForInvoice(null);
    setSelectedOrdersForBatch(selectedList);
    setInvoiceModalMode('auto');
    setIsInvoiceModalOpen(true);
  };

  const handleOpenBatchManualInvoice = () => {
    const selectedIds = Object.keys(checkedOrderIds).filter(id => checkedOrderIds[id]);
    const selectedList = orders.filter(o => selectedIds.includes(o.id));
    
    if (selectedList.length === 0) {
      triggerAlert('请先勾选开票失败的订单！');
      return;
    }

    // Check if any selected order is not failed (i.e. invoiced or uninvoiced)
    const hasOtherStatus = selectedList.some(o => o.invoiceStatus !== 'failed');
    if (hasOtherStatus) {
      triggerAlert('批量手动开票只能选择‘开票失败’的数据！');
      return;
    }

    setSelectedOrderForInvoice(null);
    setSelectedOrdersForBatch(selectedList);
    setInvoiceModalMode('manual');
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadInvoice = (order: Order) => {
    if (!order.invoiceFileUrl) return;
    const link = document.createElement('a');
    link.href = order.invoiceFileUrl;
    const filename = order.invoiceFileUrl.substring(order.invoiceFileUrl.lastIndexOf('/') + 1) || `invoice-${order.id}.pdf`;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSearchTrigger('');
    setCurrentPage(1);
    setCheckedOrderIds({});
  };

  const handleSearchClick = () => {
    setSearchTrigger(keyword);
    setCurrentPage(1);
    setCheckedOrderIds({});
  };

  // Helper to format dynamic submit/pay times
  const getSubmittingAndPayingTimes = (orderTime: string) => {
    try {
      // e.g. "2026-03-03 17:06:06"
      // Let's deduct 6 seconds for submitting time
      const parts = orderTime.split(' ');
      if (parts.length === 2) {
        const [dateStr, timeStr] = parts;
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, min, sec] = timeStr.split(':').map(Number);
        
        const payDate = new Date(year, month - 1, day, hour, min, sec);
        const submitDate = new Date(payDate.getTime() - 6000); // 6 seconds before
        
        const pad = (n: number) => String(n).padStart(2, '0');
        const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        
        return {
          submitTime: format(submitDate),
          payTime: format(payDate)
        };
      }
    } catch (e) {
      // fallback
    }
    return {
      submitTime: orderTime,
      payTime: orderTime
    };
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-slate-50 text-[13px] text-slate-600 select-none relative">
      
      {/* Custom beautiful local alert notification toast */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-600 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg border border-rose-500 animate-bounce">
          <span className="text-base">⚠️</span>
          <span className="text-sm font-semibold">{alertMessage}</span>
          <button 
            onClick={() => setAlertMessage(null)} 
            className="ml-3 hover:text-rose-200 focus:outline-none text-white font-bold cursor-pointer text-lg"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Search Header Form mimicking exactly mockup styling */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="订单编号 / 商品名称 / 实付金额"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchClick();
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleSearchClick}
            className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center gap-2 bg-white"
          >
            查询
          </button>

          <button
            onClick={handleOpenBatchInvoice}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center gap-2 shadow-xs"
          >
            批量开票
          </button>

          <button
            onClick={handleOpenBatchManualInvoice}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center gap-2 shadow-xs"
          >
            批量手动开票
          </button>

          {(keyword !== '' || searchTrigger !== '') && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 font-medium rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 border-b border-slate-200 font-medium h-[44px]">
              <tr>
                <th className="px-4 w-[50px] text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 w-[180px] font-semibold text-slate-600">订单编号</th>
                <th className="px-4 w-[160px] font-semibold text-slate-600">商品信息</th>
                <th className="px-4 w-[80px] font-semibold text-slate-600 text-center">商品数量</th>
                <th className="px-4 w-[100px] font-semibold text-slate-600 text-right">订单总额(元)</th>
                <th className="px-4 w-[100px] font-semibold text-slate-600 text-right">实付金额</th>
                <th className="px-4 w-[120px] font-semibold text-slate-600">护理顾问姓名</th>
                <th className="px-4 w-[110px] font-semibold text-slate-600 text-center">开票状态</th>
                <th className="px-4 w-[240px] font-semibold text-slate-600">订单时间</th>
                <th className="px-4 w-[120px] font-semibold text-slate-600 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    暂无符合条件的发票数据
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const { submitTime, payTime } = getSubmittingAndPayingTimes(order.orderTime);
                  const isChecked = !!checkedOrderIds[order.id];
                  const isInvoiced = order.invoiceStatus === 'invoiced';
                  const isFailed = order.invoiceStatus === 'failed';

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isInvoiced ? 'bg-slate-50/10 text-slate-500' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(order.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="px-4 py-3 font-mono font-medium truncate select-all text-slate-800" title={order.id}>
                        {order.id}
                      </td>

                      {/* Product Info */}
                      <td className="px-4 py-3 truncate font-medium text-slate-800" title={order.productName}>
                        {order.productName}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-center font-medium">
                        {order.quantity}
                      </td>

                      {/* Order Total */}
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {order.totalAmount.toFixed(2)}
                      </td>

                      {/* Actual Paid */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        {order.totalAmount.toFixed(2)}
                      </td>

                      {/* Advisor Name */}
                      <td className="px-4 py-3 truncate text-slate-600 font-medium" title={order.advisor}>
                        {order.advisor}
                      </td>

                      {/* Invoicing Status Tag */}
                      <td className="px-4 py-3 text-center">
                        {isInvoiced ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            已开票
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                            开票失败
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            未开票
                          </span>
                        )}
                      </td>

                      {/* Submit / Pay Times */}
                      <td className="px-4 py-3 text-xs text-slate-500 leading-relaxed font-mono">
                        <div className="truncate" title={`订单提交时间: ${submitTime}`}>
                          <span className="text-slate-400">订单提交时间: </span>{submitTime}
                        </div>
                        <div className="truncate" title={`订单支付时间: ${payTime}`}>
                          <span className="text-slate-400">订单支付时间: </span>{payTime}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center font-semibold">
                        {isInvoiced ? (
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer focus:outline-none"
                          >
                            下载发票
                          </button>
                        ) : isFailed ? (
                          <button
                            onClick={() => handleOpenManualInvoice(order)}
                            className="text-amber-600 hover:text-amber-800 transition-colors cursor-pointer focus:outline-none"
                          >
                            手动开票
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSingleInvoice(order)}
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer focus:outline-none"
                          >
                            开票
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats / Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 shrink-0 flex items-center justify-between text-slate-500 text-xs">
          <div>
            <span>共 </span>
            <span className="font-semibold text-slate-800">{totalItems}</span>
            <span> 条数据</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                  setCheckedOrderIds({});
                }}
                className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  setCheckedOrderIds({});
                }}
                className={`w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-semibold transition-colors bg-white ${
                  currentPage === 1 
                    ? 'text-slate-300 border-slate-100 cursor-not-allowed' 
                    : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    setCheckedOrderIds({});
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  setCheckedOrderIds({});
                }}
                className={`w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-semibold transition-colors bg-white ${
                  currentPage === totalPages 
                    ? 'text-slate-300 border-slate-100 cursor-not-allowed' 
                    : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
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
                    setCheckedOrderIds({});
                  }
                }}
                className="border border-slate-200 rounded-lg px-2 py-1 w-12 text-center font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
              <span className="text-slate-400 font-normal">页</span>
            </div>
          </div>
        </div>

      </div>

      {/* Invoice Modal Popup (handles both single and batch orders) */}
      <InvoiceModal
        order={selectedOrderForInvoice}
        selectedOrders={selectedOrdersForBatch}
        isOpen={isInvoiceModalOpen}
        mode={invoiceModalMode}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedOrderForInvoice(null);
          setSelectedOrdersForBatch([]);
        }}
        onConfirmInvoice={(orderIds, invoiceData) => {
          onConfirmInvoice(orderIds, invoiceData);
          setIsInvoiceModalOpen(false);
          setSelectedOrderForInvoice(null);
          setSelectedOrdersForBatch([]);
          setCheckedOrderIds({});
        }}
      />

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TabsHeader from './components/TabsHeader';
import OrderManagement from './components/OrderManagement';
import RefundManagement from './components/RefundManagement';
import RevenueManagement from './components/RevenueManagement';
import RefundModal from './components/RefundModal';
import InvoiceManagement from './components/InvoiceManagement';
import { Order, RefundSlip, RevenueTransaction, Tab } from './types';
import { initialOrders, initialRevenueTransactions, initialRefundSlips } from './data/mockData';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  // Global States loaded with LocalStorage persistence for realistic experience
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cienbei_orders');
    if (saved) {
      try {
        const parsed: Order[] = JSON.parse(saved);
        // Backfill or force-update failed status from initialOrders
        return parsed.map(o => {
          const initial = initialOrders.find(io => io.id === o.id);
          if (initial && initial.invoiceStatus === 'failed') {
            return { ...o, invoiceStatus: 'failed' };
          }
          return o;
        });
      } catch (e) {
        return initialOrders;
      }
    }
    return initialOrders;
  });

  const [refundSlips, setRefundSlips] = useState<RefundSlip[]>(() => {
    const saved = localStorage.getItem('cienbei_refund_slips');
    return saved ? JSON.parse(saved) : initialRefundSlips;
  });

  const [revenueTransactions, setRevenueTransactions] = useState<RevenueTransaction[]>(() => {
    const saved = localStorage.getItem('cienbei_revenue_tx');
    return saved ? JSON.parse(saved) : initialRevenueTransactions;
  });

  // Multi-tab Management State
  const [openTabs, setOpenTabs] = useState<Tab[]>([
    { id: 'order-list', title: '订单管理' }
  ]);
  const [activeTab, setActiveTab] = useState<string>('order-list');

  // Modal Control States
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);

  // Success Notification / Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('cienbei_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('cienbei_refund_slips', JSON.stringify(refundSlips));
  }, [refundSlips]);

  useEffect(() => {
    localStorage.setItem('cienbei_revenue_tx', JSON.stringify(revenueTransactions));
  }, [revenueTransactions]);

  // Handle Tab Selection from Sidebar or Tabs Bar
  const handleSelectTab = (tabId: string, title?: string) => {
    // Check if it is a leaf menu item that should open a tab
    const tabFriendlyIds = ['order-list', 'refund-list', 'revenue-list', 'invoice-list'];
    if (!tabFriendlyIds.includes(tabId)) {
      // Just set active sidebar item if not a major tab, or treat as custom
      return;
    }

    const exists = openTabs.find(tab => tab.id === tabId);
    if (!exists) {
      const newTabTitle = title || (
        tabId === 'order-list' ? '订单管理' :
        tabId === 'refund-list' ? '退款单管理' :
        tabId === 'revenue-list' ? '收益管理' :
        tabId === 'invoice-list' ? '发票管理' : '新标签页'
      );
      setOpenTabs(prev => [...prev, { id: tabId, title: newTabTitle }]);
    }
    setActiveTab(tabId);
  };

  // Close tab callback
  const handleCloseTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Don't close if it is the only tab remaining
    if (openTabs.length <= 1) return;

    const targetIndex = openTabs.findIndex(t => t.id === tabId);
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);

    // If closing the active tab, select another tab
    if (activeTab === tabId) {
      const nextActiveIndex = Math.max(0, targetIndex - 1);
      setActiveTab(newTabs[nextActiveIndex].id);
    }
  };

  // Trigger refund flow
  const handleTriggerRefund = (order: Order) => {
    setSelectedOrderForRefund(order);
    setIsRefundModalOpen(true);
  };

  // Perform refund confirmation
  const handleConfirmRefund = (orderId: string) => {
    const orderToRefund = orders.find(o => o.id === orderId);
    if (!orderToRefund) return;

    // 1. Generate Refund Slip
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    // Custom formatted refund ID: R + order number numbers
    const cleanNum = orderId.replace(/\D/g, '');
    const refundId = `R${cleanNum || Date.now().toString().substring(5)}`;

    const newRefundSlip: RefundSlip = {
      refundId,
      orderId: orderToRefund.id,
      productName: orderToRefund.productName,
      quantity: orderToRefund.quantity,
      totalAmount: orderToRefund.totalAmount,
      orderTime: orderToRefund.orderTime,
      refundTime: timestamp,
      advisor: orderToRefund.advisor,
    };

    // 2. Generate Revenue Ledger Transaction (REQ 4: 订单退款)
    // Running balance is subtracted by the refunded order total
    const latestBalance = revenueTransactions.length > 0 ? revenueTransactions[0].balance : 0;
    const newBalance = parseFloat((latestBalance - orderToRefund.totalAmount).toFixed(2));

    const newRevenueTx: RevenueTransaction = {
      accountingTime: timestamp,
      documentTime: timestamp,
      transactionId: refundId,
      businessType: '订单退款',
      income: null,
      expense: orderToRefund.totalAmount,
      balance: newBalance,
    };

    // Update state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'refunded' as const } : o));
    setRefundSlips(prev => [newRefundSlip, ...prev]);
    setRevenueTransactions(prev => [newRevenueTx, ...prev]);

    // Close Modal and Show success toast
    setIsRefundModalOpen(false);
    setSelectedOrderForRefund(null);
    showToast(`退款成功！已生成退款单 ${refundId}，且已冲销财务收益。`);

    // Auto-open or switch to Refund Slip tab so they can see the generated slip!
    handleSelectTab('refund-list', '退款单管理');
  };

  // Perform invoicing confirmation and send out email simulation
  const handleConfirmInvoice = async (
    orderIds: string[], 
    invoiceData: { title: string; taxId: string; email?: string; fileUrl: string }
  ) => {
    // 1. Update order invoicing state
    setOrders(prev => prev.map(o => orderIds.includes(o.id) ? {
      ...o,
      invoiceStatus: 'invoiced' as const,
      invoiceFileUrl: invoiceData.fileUrl,
      invoiceEmail: invoiceData.email,
      invoiceTitle: invoiceData.title,
      invoiceTaxId: invoiceData.taxId
    } : o));

    // 2. If email is provided, call server to simulate sending email
    if (invoiceData.email) {
      try {
        const orderCount = orderIds.length;
        const totalAmount = orders
          .filter(o => orderIds.includes(o.id))
          .reduce((sum, o) => sum + o.totalAmount, 0);
        
        const response = await fetch('/api/send-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: invoiceData.email,
            fileUrl: invoiceData.fileUrl,
            orderId: orderIds.join(', '),
            title: invoiceData.title,
            taxId: invoiceData.taxId,
            amount: totalAmount,
          }),
        });
        
        if (response.ok) {
          showToast(`开票成功！共对 ${orderCount} 笔订单开具了发票，发票已保存至服务器，且已向邮箱 ${invoiceData.email} 发送通知邮件！`);
        } else {
          showToast(`开票成功！但发票邮件发送失败，请稍后检查邮件服务。`);
        }
      } catch (err) {
        console.error('Email sending error:', err);
        showToast(`开票成功！已保存发票至服务器。`);
      }
    } else {
      showToast(`开票成功！共对 ${orderIds.length} 笔订单开具发票，发票已保存至服务器。`);
    }
  };

  // Helper to trigger simulated withdrawal
  const handleSimulatedWithdrawal = () => {
    const latestBalance = revenueTransactions.length > 0 ? revenueTransactions[0].balance : 0;
    if (latestBalance <= 0) {
      alert('当前可提现余额不足，无法提现。');
      return;
    }

    const amountStr = prompt(`请输入提现金额 (当前余额: ¥${latestBalance.toFixed(2)})`, latestBalance.toFixed(2));
    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > latestBalance) {
      alert('输入金额无效或超过当前可提现余额！');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randomId = `S10586897${Math.floor(100000 + Math.random() * 900000)}`;
    const newBalance = parseFloat((latestBalance - amount).toFixed(2));

    const newTx: RevenueTransaction = {
      accountingTime: timestamp,
      documentTime: timestamp,
      transactionId: randomId,
      businessType: '提现',
      income: null,
      expense: amount,
      balance: newBalance,
    };

    setRevenueTransactions(prev => [newTx, ...prev]);
    showToast(`申请提现成功！已提现金额: ¥${amount.toFixed(2)}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Render correct page content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'order-list':
        return (
          <OrderManagement 
            orders={orders} 
            onTriggerRefund={handleTriggerRefund} 
          />
        );
      case 'refund-list':
        return (
          <RefundManagement 
            refundSlips={refundSlips} 
          />
        );
      case 'revenue-list':
        return (
          <RevenueManagement 
            transactions={revenueTransactions} 
            onAddWithdrawal={handleSimulatedWithdrawal}
          />
        );
      case 'invoice-list':
        return (
          <InvoiceManagement 
            orders={orders} 
            onConfirmInvoice={handleConfirmInvoice}
          />
        );
      default:
        // Render a generic beautiful placeholder page for other tabs
        return (
          <div className="flex-1 p-8 bg-gray-50 flex items-center justify-center text-center select-none text-[13px]">
            <div className="bg-white p-10 rounded-lg shadow-xs border border-gray-100 max-w-md space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">模块演示建设中</h3>
              <p className="text-gray-400 leading-relaxed text-xs">
                西恩贝销售管理系统的该模块目前为静态展示。请访问侧边栏的 <b>订单管理 - 订单管理</b> 或 <b>财务管理 - 收益管理</b> 体验完整的退款冲记流转交互！
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-700 font-sans overflow-hidden antialiased relative">
      
      {/* Dynamic Toast Message */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={handleSelectTab} 
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          
          {/* Tab Bar Selection */}
          <TabsHeader 
            openTabs={openTabs} 
            activeTab={activeTab} 
            onSelectTab={(id) => setActiveTab(id)} 
            onCloseTab={handleCloseTab} 
          />

          {/* Dynamic Rendered Page Panel */}
          {renderTabContent()}
        </div>
      </div>

      {/* Secondary Confirmation Refund Modal */}
      <RefundModal 
        order={selectedOrderForRefund}
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedOrderForRefund(null);
        }}
        onConfirm={handleConfirmRefund}
      />

    </div>
  );
}

export interface Order {
  id: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  advisor: string;
  orderTime: string;
  remark: string;
  status: 'paid' | 'refunded';
  invoiceStatus?: 'un-invoiced' | 'invoiced' | 'failed';
  invoiceFileUrl?: string;
  invoiceEmail?: string;
  invoiceTitle?: string;
  invoiceTaxId?: string;
}

export interface RefundSlip {
  refundId: string;
  orderId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  orderTime: string;
  refundTime: string;
  advisor: string;
}

export interface RevenueTransaction {
  accountingTime: string;
  documentTime: string;
  transactionId: string;
  businessType: '提现' | '订单分账' | '订单退款';
  income: number | null;
  expense: number | null;
  balance: number;
}

export interface Tab {
  id: string;
  title: string;
}

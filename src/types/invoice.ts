export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" | "PENDING_VERIFICATION";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  agreementId: string;
  companyName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  createdAt: string;
  updatedAt?: string;
}

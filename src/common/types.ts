export type LoanStatus = 'active' | 'overdue' | 'completed' | 'defaulted' | 'written_off';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';
export type NotificationType = 'loan_completed' | 'loan_overdue' | 'payment_received';

export interface Customer {
  id: string;
  full_name: string;
  contact_number: string;
  address: string;
  city: string;
  province: string;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  customer_id: string;
  principal_amount: number;
  interest_rate: number;
  interest_amount: number;
  total_payable: number;
  daily_payment: number;
  term_days: number;
  release_date: string;
  due_date: string;
  total_paid: number;
  agreement_signature_url: string | null;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Payment {
  id: string;
  loan_id: string;
  day_number: number;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  paid_date: string | null;
  signature_url: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  loan?: Loan & { customer?: Customer };
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

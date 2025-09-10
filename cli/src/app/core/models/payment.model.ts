export interface Payment {
  id: number;
  user_id: number;
  course_id?: number | null;
  hint_id?: number | null;
  amount: number;
  payment_method: 'credit_card' | 'paypal' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed';
  type: 'course' | 'hint' | 'subscription';
  created_at: string;
  updated_at?: string | null;
}

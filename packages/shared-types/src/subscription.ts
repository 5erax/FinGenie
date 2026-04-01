export type SubscriptionPlan = 'free' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  subscriptionId: string;
  payosOrderId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

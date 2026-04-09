import { api } from "@/lib/api";
import type { Subscription, PaymentOrder } from "@fingenie/shared-types";

export interface CreatePaymentDto {
  plan: "monthly" | "yearly";
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
  subscription: Subscription;
  order: PaymentOrder;
}

export interface PaymentStatusResponse {
  subscription: Subscription | null;
  isPremium: boolean;
}

export interface VerifyPaymentResponse {
  status: "success" | "pending" | "expired";
  isPremium: boolean;
  premiumUntil: string | null;
  message: string;
}

export const paymentService = {
  async createCheckout(data: CreatePaymentDto): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutResponse>(
      "/payments/create-checkout",
      data,
    );
    return response.data;
  },

  async verifyPayment(sessionId: string): Promise<VerifyPaymentResponse> {
    const response = await api.post<VerifyPaymentResponse>(
      `/payments/verify/${sessionId}`,
    );
    return response.data;
  },

  async cancelPayment(sessionId: string): Promise<void> {
    await api.post(`/payments/${sessionId}/cancel`);
  },

  async getStatus(): Promise<PaymentStatusResponse> {
    const response = await api.get<PaymentStatusResponse>("/payments/status");
    return response.data;
  },

  async getHistory(): Promise<PaymentOrder[]> {
    const response = await api.get<{
      data: PaymentOrder[];
      total: number;
      page: number;
      limit: number;
    }>("/payments/history");
    return response.data.data;
  },
};

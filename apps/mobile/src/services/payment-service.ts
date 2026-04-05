import { api } from "@/lib/api";
import type { Subscription, PaymentOrder } from "@fingenie/shared-types";

export interface CreatePaymentDto {
  plan: "monthly" | "yearly";
}

export interface PaymentLink {
  paymentLink: string;
  subscription: Subscription;
  order: PaymentOrder;
}

export interface PaymentStatusResponse {
  subscription: Subscription | null;
  isPremium: boolean;
}

export const paymentService = {
  async createPaymentLink(data: CreatePaymentDto): Promise<PaymentLink> {
    const response = await api.post<PaymentLink>("/payments/create-link", data);
    return response.data;
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
    // Backend returns paginated shape; extract the data array
    return response.data.data;
  },

  async cancelPayment(orderCode: string): Promise<void> {
    await api.post(`/payments/${orderCode}/cancel`);
  },
};

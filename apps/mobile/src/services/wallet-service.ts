import { api } from "@/lib/api";
import type { Wallet } from "@fingenie/shared-types";

export interface CreateWalletDto {
  name: string;
  type: "cash" | "bank" | "e_wallet" | "other";
  balance?: number;
  currency?: "VND" | "USD";
}

export interface UpdateWalletDto {
  name?: string;
  type?: "cash" | "bank" | "e_wallet" | "other";
}

export const walletService = {
  async getAll(): Promise<Wallet[]> {
    const response = await api.get<Wallet[]>("/wallets");
    return response.data;
  },

  async getById(id: string): Promise<Wallet> {
    const response = await api.get<Wallet>(`/wallets/${id}`);
    return response.data;
  },

  async create(data: CreateWalletDto): Promise<Wallet> {
    const response = await api.post<Wallet>("/wallets", data);
    return response.data;
  },

  async update(id: string, data: UpdateWalletDto): Promise<Wallet> {
    const response = await api.patch<Wallet>(`/wallets/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/wallets/${id}`);
  },
};

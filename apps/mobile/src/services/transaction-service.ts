import { api } from "@/lib/api";
import type { Transaction } from "@fingenie/shared-types";

/** Matches the actual backend pagination shape: { data, total, page, limit } */
export interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTransactionDto {
  walletId: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  note?: string;
  date: string; // ISO date string
}

export interface UpdateTransactionDto {
  amount?: number;
  type?: "income" | "expense";
  categoryId?: string;
  note?: string;
  date?: string;
}

export interface TransactionFilter {
  walletId?: string;
  categoryId?: string;
  type?: "income" | "expense";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
}

export const transactionService = {
  async getAll(
    filters?: TransactionFilter,
  ): Promise<BackendPaginatedResponse<Transaction>> {
    const response = await api.get<BackendPaginatedResponse<Transaction>>(
      "/transactions",
      {
        params: filters,
      },
    );
    return response.data;
  },

  async getById(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const response = await api.post<Transaction>("/transactions", data);
    return response.data;
  },

  async update(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await api.patch<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getSummary(filters?: {
    walletId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionSummary> {
    const response = await api.get<TransactionSummary>(
      "/transactions/summary",
      {
        params: filters,
      },
    );
    return response.data;
  },
};

import { api } from "@/lib/api";
import type { SavingPlan, SafeMoneyConfig } from "@fingenie/shared-types";

export interface CreateSavingPlanDto {
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  savingPercent: number;
}

export interface UpdateSavingPlanDto {
  monthlyIncome?: number;
  fixedExpenses?: number;
  variableExpenses?: number;
  savingPercent?: number;
}

export interface SafeMoneyConfigDto {
  mode: "basic" | "advanced";
  sensitivity?: number; // 0-100
}

export interface SpendingCheck {
  dailyBudget: number;
  todaySpent: number;
  remaining: number;
  safeMoney: number;
  isOverBudget: boolean;
  isNearThreshold: boolean;
}

export const savingPlanService = {
  async getAll(): Promise<SavingPlan[]> {
    const response = await api.get<SavingPlan[]>("/saving-plans");
    return response.data;
  },

  async getCurrent(): Promise<SavingPlan | null> {
    try {
      const response = await api.get<SavingPlan>("/saving-plans/current");
      return response.data;
    } catch (error) {
      if (__DEV__) console.warn("savingPlanService.getCurrent failed:", error);
      return null;
    }
  },

  async getById(id: string): Promise<SavingPlan> {
    const response = await api.get<SavingPlan>(`/saving-plans/${id}`);
    return response.data;
  },

  async create(data: CreateSavingPlanDto): Promise<SavingPlan> {
    const response = await api.post<SavingPlan>("/saving-plans", data);
    return response.data;
  },

  async update(id: string, data: UpdateSavingPlanDto): Promise<SavingPlan> {
    const response = await api.patch<SavingPlan>(`/saving-plans/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/saving-plans/${id}`);
  },

  async updateSafeMoneyConfig(
    id: string,
    data: SafeMoneyConfigDto,
  ): Promise<SafeMoneyConfig> {
    const response = await api.put<SafeMoneyConfig>(
      `/saving-plans/${id}/safe-money`,
      data,
    );
    return response.data;
  },

  async checkSpending(id: string): Promise<SpendingCheck> {
    const response = await api.get<SpendingCheck>(`/saving-plans/${id}/check`);
    return response.data;
  },
};

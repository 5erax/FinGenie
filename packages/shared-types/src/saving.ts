export type SafeMoneyMode = 'basic' | 'advanced';

export interface SavingPlan {
  id: string;
  userId: string;
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  savingPercent: number;
  dailyBudget: number;
  safeMoney: number;
  createdAt: string;
  updatedAt: string;
}

export interface SafeMoneyConfig {
  id: string;
  savingPlanId: string;
  mode: SafeMoneyMode;
  sensitivity: number; // 0-100
  threshold: number;
}

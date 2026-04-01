export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string | null;
  date: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  userId: string | null; // null = system default
}

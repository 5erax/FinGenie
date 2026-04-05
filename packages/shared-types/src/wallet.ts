export type WalletType = "cash" | "bank" | "e_wallet" | "other";
export type Currency = "VND" | "USD";

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

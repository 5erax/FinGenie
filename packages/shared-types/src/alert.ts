export type AlertType =
  | "overspend"
  | "budget_warning"
  | "saving_milestone"
  | "system";

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

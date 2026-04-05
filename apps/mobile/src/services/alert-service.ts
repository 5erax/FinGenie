import { api } from "@/lib/api";
import type { Alert } from "@fingenie/shared-types";

export type { Alert };

export const alertService = {
  async getAll(params?: { type?: string; isRead?: boolean }): Promise<Alert[]> {
    const response = await api.get<{
      data: Alert[];
      total: number;
      page: number;
      limit: number;
    }>("/alerts", { params });
    // API returns paginated response { data, total, page, limit } — extract the array
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>("/alerts/unread-count");
    return response.data.count;
  },

  async getById(id: string): Promise<Alert> {
    const response = await api.get<Alert>(`/alerts/${id}`);
    return response.data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/alerts/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/alerts/read-all");
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/alerts/${id}`);
  },
};

const BASE_URL = 'https://aliishaq.site/wp-json/ims/v1';

export interface NotificationData {
  id: number;
  type: "low_stock" | "overdue_payment" | "new_order" | "system";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationData[];
    unreadCount: number;
  };
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Notifications API request failed:', error);
    throw error;
  }
};

export const notificationsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: "low_stock" | "overdue_payment" | "new_order" | "system";
    read?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return apiRequest<NotificationsResponse>(`/notifications${query ? `?${query}` : ''}`);
  },

  markAsRead: (id: number) =>
    apiRequest<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    apiRequest<{ success: boolean; message: string }>('/notifications/mark-all-read', {
      method: 'PUT',
    }),
};

const BASE_URL = 'https://aliishaq.site/wp-json/ims/v1';

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  type: "call" | "delivery" | "payment" | "meeting";
  date: string;
  time: string;
  customerId?: number;
  customerName?: string;
  priority: "high" | "medium" | "low";
  status: "scheduled" | "completed" | "cancelled";
  reminder?: number;
}

export interface CalendarResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
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
    console.error('Calendar API request failed:', error);
    throw error;
  }
};

export const calendarApi = {
  getEvents: (params?: {
    date?: string;
    month?: string;
    type?: "call" | "delivery" | "payment" | "meeting";
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return apiRequest<CalendarResponse>(`/calendar/events${query ? `?${query}` : ''}`);
  },

  createEvent: (event: Omit<CalendarEvent, 'id' | 'status'>) =>
    apiRequest<{ success: boolean; data: CalendarEvent }>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
};

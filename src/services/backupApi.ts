const BASE_URL = 'https://aliishaq.site/wp-json/ims/v1';

export interface BackupStatus {
  lastBackup: string;
  backupSize: string;
  storageUsed: string;
  storageLimit: string;
  autoBackupEnabled: boolean;
  syncStatus: "up_to_date" | "syncing" | "error";
  lastSync: string;
}

export interface BackupItem {
  id: string;
  date: string;
  size: string;
  status: "completed" | "failed" | "in_progress";
  type: "automatic" | "manual";
}

export interface BackupStatusResponse {
  success: boolean;
  data: BackupStatus;
}

export interface BackupHistoryResponse {
  success: boolean;
  data: {
    backups: BackupItem[];
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
    console.error('Backup API request failed:', error);
    throw error;
  }
};

export const backupApi = {
  getStatus: () => apiRequest<BackupStatusResponse>('/backup/status'),
  
  createBackup: () =>
    apiRequest<{ success: boolean; data: { backupId: string; status: string; estimatedTime: string }; message: string }>('/backup/create', {
      method: 'POST',
    }),
  
  getHistory: () => apiRequest<BackupHistoryResponse>('/backup/history'),
};

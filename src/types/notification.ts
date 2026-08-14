export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  link?: string;
  createdAt: Date | string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  details?: Record<string, unknown> | string;
  timestamp: Date | string;
}

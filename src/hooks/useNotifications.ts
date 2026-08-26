"use client";

import { useCallback, useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type NotificationType = "renewal" | "request" | "system" | "security";

export type NotificationPriority = "HIGH" | "MEDIUM" | "LOW";

export type NotificationStatus = "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";

export interface Notification {
  id: string;

  type: NotificationType;

  title: string;

  message: string;

  priority: NotificationPriority;

  status: NotificationStatus;

  adminId: string | null;

  renewalId: string | null;

  requestId: string | null;

  isRead: boolean;

  readAt: string | null;

  createdAt: string;

  /* ---------------------------------------------------------------------- */
  /* UI helper fields                                                       */
  /* ---------------------------------------------------------------------- */

  urgency: "high" | "medium" | "low";

  date: string;

  targetUrl: string;
}

/* -------------------------------------------------------------------------- */
/* API Types                                                                  */
/* -------------------------------------------------------------------------- */

type ApiNotification = {
  id: string;

  type: "RENEWAL" | "ADMIN_REQUEST" | "SYSTEM" | "SECURITY";

  priority: "HIGH" | "MEDIUM" | "LOW";

  status: "OVERDUE" | "DUE_SOON" | "NEW" | "INFO";

  title: string;

  message: string;

  adminId: string | null;

  renewalId: string | null;

  requestId: string | null;

  isRead: boolean;

  readAt: string | null;

  createdAt: string;
};

type NotificationsApiResponse = {
  success: boolean;

  data: ApiNotification[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  unreadCount: number;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_BADGE = 5;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getNotificationType(type: ApiNotification["type"]): NotificationType {
  switch (type) {
    case "RENEWAL":
      return "renewal";

    case "ADMIN_REQUEST":
      return "request";

    case "SYSTEM":
      return "system";

    case "SECURITY":
      return "security";
  }
}

/* -------------------------------------------------------------------------- */

function getUrgency(
  priority: ApiNotification["priority"],
): "high" | "medium" | "low" {
  switch (priority) {
    case "HIGH":
      return "high";

    case "LOW":
      return "low";

    case "MEDIUM":
    default:
      return "medium";
  }
}

/* -------------------------------------------------------------------------- */

function getTargetUrl(notification: ApiNotification): string {
  if (notification.requestId) {
    return `/admin-requests?requestId=${encodeURIComponent(
      notification.requestId,
    )}`;
  }

  if (notification.renewalId) {
    return `/renewal?renewalId=${encodeURIComponent(notification.renewalId)}`;
  }

  return "/notifications";
}

/* -------------------------------------------------------------------------- */

function mapNotification(notification: ApiNotification): Notification {
  return {
    id: notification.id,

    type: getNotificationType(notification.type),

    title: notification.title,

    message: notification.message,

    priority: notification.priority,

    status: notification.status,

    adminId: notification.adminId,

    renewalId: notification.renewalId,

    requestId: notification.requestId,

    isRead: notification.isRead,

    readAt: notification.readAt,

    createdAt: notification.createdAt,

    /* UI compatibility */
    urgency: getUrgency(notification.priority),

    date: notification.createdAt,

    targetUrl: getTargetUrl(notification),
  };
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [totalCount, setTotalCount] = useState(0);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Fetch Notifications                                                      */
  /* ------------------------------------------------------------------------ */

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/notifications?page=1&limit=100", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result: NotificationsApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Failed to fetch notifications");
      }

      const mapped = result.data.map(mapNotification);

      setNotifications(mapped);

      setTotalCount(result.pagination.total);

      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("FETCH_NOTIFICATIONS_ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications",
      );

      setNotifications([]);

      setTotalCount(0);

      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Initial Fetch                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ------------------------------------------------------------------------ */
  /* Mark One As Read                                                         */
  /* ------------------------------------------------------------------------ */

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isRead: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      console.error("MARK_NOTIFICATION_READ_ERROR:", error);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Mark All As Read                                                         */
  /* ------------------------------------------------------------------------ */

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Failed to mark all notifications as read");
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("MARK_ALL_NOTIFICATIONS_READ_ERROR:", error);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Return                                                                   */
  /* ------------------------------------------------------------------------ */

  const badgeLabel =
    unreadCount > MAX_BADGE
      ? `${MAX_BADGE}+`
      : unreadCount > 0
        ? `${unreadCount}`
        : "";

  const hasNotifications = notifications.length > 0;

  return {
    notifications,

    totalCount,

    unreadCount,

    badgeLabel,

    hasNotifications,

    loading,

    error,

    refresh: fetchNotifications,

    markAsRead,

    markAllAsRead,
  };
}

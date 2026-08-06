import { useMemo } from "react";
import {
  INITIAL_RENEWALS,
  INITIAL_PENDING_REQUESTS,
  type RenewalItem,
  type PendingRequest,
} from "@/types/superadmin";

export type NotificationType = "renewal" | "request";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  urgency: "high" | "medium" | "low";
  date: string;
  targetUrl: string;
}

const MAX_BADGE = 5;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getRenewalUrgency(item: RenewalItem): "high" | "medium" | "low" {
  if (item.status === "Overdue") return "high";
  const days = daysUntil(item.renewalDate);
  if (days <= 14) return "high";
  if (days <= 30) return "medium";
  return "low";
}

function getRequestUrgency(item: PendingRequest): "high" | "medium" | "low" {
  if (item.status === "Pending") return "medium";
  return "low";
}

export function useNotifications() {
  return useMemo(() => {
    // ── Renewal notifications (Due Soon + Overdue) ────────────────────────
    const renewalNotifs: Notification[] = INITIAL_RENEWALS.filter(
      (r) => r.status === "Due Soon" || r.status === "Overdue"
    )
      .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
      .map((r) => ({
        id: r.id,
        type: "renewal" as NotificationType,
        title:
          r.status === "Overdue"
            ? `Overdue — ${r.businessName}`
            : `Due Soon — ${r.businessName}`,
        subtitle: `${r.adminName} · Renewal on ${formatDate(r.renewalDate)} · ₹${r.amount.toLocaleString("en-IN")}`,
        urgency: getRenewalUrgency(r),
        date: r.renewalDate,
        targetUrl: `/renewal?search=${encodeURIComponent(r.businessName)}`,
      }));

    // ── Request notifications (Pending + In-progress) ─────────────────────
    const requestNotifs: Notification[] = INITIAL_PENDING_REQUESTS.filter(
      (p) => p.status === "Pending" || p.status === "In-progress"
    )
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .map((p) => ({
        id: p.id,
        type: "request" as NotificationType,
        title:
          p.status === "Pending"
            ? `New Request — ${p.name}`
            : `In Progress — ${p.name}`,
        subtitle: `${p.city} · ${p.desc.slice(0, 60)}${p.desc.length > 60 ? "…" : ""}`,
        urgency: getRequestUrgency(p),
        date: p.createdDate,
        targetUrl: `/pending-requests?search=${encodeURIComponent(p.name)}`,
      }));

    // Merge: renewals first (higher priority), then requests
    const all: Notification[] = [...renewalNotifs, ...requestNotifs];

    const totalCount = all.length;
    const badgeLabel = totalCount > MAX_BADGE ? `${MAX_BADGE}+` : totalCount > 0 ? `${totalCount}` : "";
    const hasNotifications = totalCount > 0;

    return { notifications: all, totalCount, badgeLabel, hasNotifications };
  }, []);
}

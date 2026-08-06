import type { Metadata } from "next";
import { META_CONSTANTS } from "@/lib/metaConstant";

export const metadata: Metadata = {
  title: META_CONSTANTS.notifications.title,
  description: META_CONSTANTS.notifications.description,
  keywords: META_CONSTANTS.notifications.keywords,
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

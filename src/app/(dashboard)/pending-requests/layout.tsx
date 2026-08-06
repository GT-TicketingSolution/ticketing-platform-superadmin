import type { Metadata } from "next";
import { META_CONSTANTS } from "@/lib/metaConstant";

export const metadata: Metadata = {
  title: META_CONSTANTS.pendingRequests.title,
  description: META_CONSTANTS.pendingRequests.description,
  keywords: META_CONSTANTS.pendingRequests.keywords,
};

export default function PendingRequestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { META_CONSTANTS } from "@/lib/metaConstant";

export const metadata: Metadata = {
  title: META_CONSTANTS.admin.title,
  description: META_CONSTANTS.admin.description,
  keywords: META_CONSTANTS.admin.keywords,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

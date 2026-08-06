import type { Metadata } from "next";
import { META_CONSTANTS } from "@/lib/metaConstant";

export const metadata: Metadata = {
  title: META_CONSTANTS.renewal.title,
  description: META_CONSTANTS.renewal.description,
  keywords: META_CONSTANTS.renewal.keywords,
};

export default function RenewalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { META_CONSTANTS } from "@/lib/metaConstant";

export const metadata: Metadata = {
  title: META_CONSTANTS.login.title,
  description: META_CONSTANTS.login.description,
  keywords: META_CONSTANTS.login.keywords,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

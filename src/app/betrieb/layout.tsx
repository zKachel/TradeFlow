import { CompanyShell } from "@/components/company-shell";

export default function CompanyLayout({ children }: LayoutProps<"/betrieb">) {
  return <CompanyShell>{children}</CompanyShell>;
}

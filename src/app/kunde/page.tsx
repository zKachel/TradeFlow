import type { Metadata } from "next";
import { CustomerRequestList } from "./request-list";

export const metadata: Metadata = { title: "Meine Anfragen" };

export default function CustomerDashboardPage() {
  return <CustomerRequestList />;
}

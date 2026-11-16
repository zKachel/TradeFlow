import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updateCompanyAction } from "../actions";
import { CompanyForm } from "@/components/company-form";
import { PageHeader } from "@/components/ui";
import { getMyCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Firmenprofil" };

export default async function CompanyProfilePage() {
  const company = await getMyCompany();
  if (!company || company.role !== "inhaber") redirect("/betrieb");
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("name, postal_code, city, service_radius_km, trade_ids")
    .eq("id", company.companyId)
    .single();
  if (!data) redirect("/betrieb");
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Firmenprofil"
        description="Gewerke und Einsatzgebiet bestimmen später, welche Anfragen Sie sehen."
      />
      <CompanyForm
        action={updateCompanyAction}
        submitLabel="Änderungen speichern"
        initial={{
          name: data.name,
          postalCode: data.postal_code,
          city: data.city,
          serviceRadiusKm: data.service_radius_km,
          tradeIds: data.trade_ids,
        }}
      />
    </div>
  );
}

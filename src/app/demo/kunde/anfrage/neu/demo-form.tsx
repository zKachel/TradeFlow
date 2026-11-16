"use client";

import { RequestForm } from "@/components/request-form";
import {
  addDemoRequest,
  findDemoRequestByClientId,
  incrementDemoPhotoCount,
  newDemoId,
} from "@/lib/demo-store";
import type { RequestSubmitAdapter } from "@/lib/request-submission";

/** Demo: speichert nur im Browser, gleiches Verhalten wie die echte Anbindung (inkl. Doppelschutz). */
const demoAdapter: RequestSubmitAdapter = {
  async submitRequest(p) {
    const existing = findDemoRequestByClientId(p.clientRequestId);
    if (existing) return { ok: true, requestId: existing.id };
    const id = newDemoId("anfrage");
    addDemoRequest({
      id,
      isDemo: true,
      clientRequestId: p.clientRequestId,
      categoryId: p.categoryId,
      title: p.title,
      description: p.description,
      postalCode: p.postalCode,
      city: p.city,
      urgency: p.urgency,
      budget: p.budget,
      details: p.details,
      photoCount: 0,
      status: "eingereicht",
      createdAt: new Date().toISOString().slice(0, 10),
      offerCount: 0,
    });
    return { ok: true, requestId: id };
  },
  async uploadPhoto(requestId) {
    incrementDemoPhotoCount(requestId);
    return { ok: true };
  },
};

export function DemoRequestForm() {
  return (
    <RequestForm
      mode="demo"
      listPath="/demo/kunde"
      adapter={demoAdapter}
      draftKey="tradeflow-demo-anfrage-entwurf"
    />
  );
}

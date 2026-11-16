import type { Metadata } from "next";
import { Suspense } from "react";
import { JobsView } from "./jobs-view";

export const metadata: Metadata = { title: "Eigene Aufträge" };

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="h-96 animate-pulse rounded-2xl bg-line/60"
        />
      }
    >
      <JobsView />
    </Suspense>
  );
}

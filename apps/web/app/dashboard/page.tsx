"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardUploadComposer } from "@/components/dashboard-upload-composer";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid gap-8 pb-10">
        <DashboardUploadComposer />
      </div>
    </AppShell>
  );
}

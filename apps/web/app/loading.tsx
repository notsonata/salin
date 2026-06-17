"use client";

import { CircleNotch } from "@phosphor-icons/react";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-muted" />
      <p className="text-sm text-muted">Loading...</p>
    </div>
  );
}

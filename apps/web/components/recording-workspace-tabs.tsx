import { cn } from "@/lib/utils";

type WorkspaceTab = "transcript" | "notes";

const tabCopy: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "transcript", label: "Transcript" },
  { id: "notes", label: "Notes" },
];

export function RecordingWorkspaceTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <div
      aria-label="Recording workspace sections"
      className="inline-flex w-fit rounded-lg border border-line bg-panel p-1"
      role="tablist"
    >
      {tabCopy.map((tab) => (
        <button
          aria-controls={`${tab.id}-panel`}
          aria-selected={activeTab === tab.id}
          className={cn(
            "rounded-md px-4 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors",
            activeTab === tab.id
              ? "bg-ink text-panel"
              : "text-muted hover:bg-[#f3ede2] hover:text-ink",
          )}
          id={`${tab.id}-tab`}
          key={tab.id}
          role="tab"
          type="button"
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

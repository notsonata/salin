import { FileText, NotebookPen } from "lucide-react";

import { cn } from "@/lib/utils";

type WorkspaceTab = "transcript" | "notes";

const tabCopy: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "notes", label: "Notes", icon: NotebookPen },
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
      className="inline-flex w-fit items-center self-start rounded-lg border border-line bg-panel p-1 shadow-panel"
      role="tablist"
    >
      {tabCopy.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            aria-controls={`${tab.id}-panel`}
            aria-selected={activeTab === tab.id}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-3 font-mono text-[12px] uppercase transition-colors sm:px-4",
              activeTab === tab.id
                ? tab.id === "transcript"
                  ? "bg-review text-panel"
                  : "bg-notes text-panel"
                : tab.id === "transcript"
                  ? "text-muted hover:bg-reviewFaint hover:text-review"
                  : "text-muted hover:bg-notesFaint hover:text-notes",
            )}
            id={`${tab.id}-tab`}
            key={tab.id}
            role="tab"
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

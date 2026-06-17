import { FileText, Notepad } from "@phosphor-icons/react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

type WorkspaceTab = "transcript" | "notes";

const tabCopy: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "notes", label: "Notes", icon: Notepad },
];

export function RecordingWorkspaceTabs() {
  return (
    <TabsList
      aria-label="Recording workspace sections"
      className="w-fit"
      data-testid="mobile-workspace-tabs"
    >
      {tabCopy.map((tab) => {
        const Icon = tab.icon;

        return (
          <TabsTrigger key={tab.id} value={tab.id}>
            <Icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

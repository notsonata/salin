import { RecordingWorkspace } from "@/components/recording-workspace";

export const dynamic = "force-dynamic";

export default async function RecordingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordingWorkspace initialData={null} recordingId={id} />;
}

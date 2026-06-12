# Dashboard + Recording Detail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the web app into an upload-first dashboard with recent recordings, a proper recording detail page with dashboard return navigation and tabs, and structured notes editing backed by API support.

**Architecture:** Extend the FastAPI surface with recordings list and structured notes update endpoints, regenerate the shared TypeScript contract, then rebuild the Next.js app around a dashboard route and a decomposed recording detail workspace. Keep transcript review dominant while moving notes into a dedicated editable tab with explicit dirty-state handling.

**Tech Stack:** Next.js App Router, React 19, TypeScript, FastAPI, SQLAlchemy, Playwright, generated OpenAPI types

---

## File Map

- Modify: `apps/api/salin_api/schemas/recordings.py`
  - Add recordings list and notes update request/response schemas.
- Modify: `apps/api/salin_api/repositories/recordings.py`
  - Add recent recordings query and notes persistence helpers.
- Modify: `apps/api/salin_api/api/routes.py`
  - Add `GET /recordings` and `PUT /recordings/{recording_id}/notes`.
- Modify: `apps/api/tests/test_recordings_api.py`
  - Cover recordings list and notes update behavior.
- Modify: `apps/api/openapi.json`
  - Regenerated API contract.
- Modify: `packages/shared/src/generated/api-types.ts`
  - Regenerated shared API types.
- Modify: `packages/shared/src/api-types.ts`
  - Export new request/response aliases if needed.
- Modify: `packages/shared/src/client.ts`
  - Add `listRecordings()` and `updateNotes()`.
- Modify: `apps/web/app/page.tsx`
  - Replace upload-only home route with dashboard page composition.
- Modify: `apps/web/app/recordings/[id]/page.tsx`
  - Mount the new detail workspace entry.
- Create: `apps/web/components/dashboard-upload-composer.tsx`
  - Dashboard upload surface and form submission UX.
- Create: `apps/web/components/recordings-table.tsx`
  - Compact recent recordings table.
- Create: `apps/web/components/recording-detail-header.tsx`
  - Dashboard return, title, status, retry, and metadata summary.
- Create: `apps/web/components/recording-workspace-tabs.tsx`
  - Transcript / Notes tab shell and local tab state.
- Create: `apps/web/components/transcript-workspace-tab.tsx`
  - Transcript-side composition of player, transcript panel, and pre-completion states.
- Create: `apps/web/components/notes-editor-tab.tsx`
  - Structured notes editing, generation, save, and dirty-state behavior.
- Modify: `apps/web/components/recording-workspace.tsx`
  - Reduce to orchestration or replace with smaller stateful container.
- Modify: `apps/web/components/upload-form.tsx`
  - Either retire or strip down if the dashboard composer replaces it.
- Modify: `apps/web/tests/e2e/upload.spec.ts`
  - Replace route and assertions for dashboard, detail tabs, and notes saving.
- Modify: `docs/architecture.md`
  - Reflect new API surface and page structure.
- Modify: `docs/testing.md`
  - Reflect new API/web validation scope.
- Modify: `docs/ui.md`
  - Reflect dashboard-first UX and tabbed detail behavior.
- Modify: `docs/tasks.md`
  - Mark redesign task done when implementation passes validation.

### Task 1: Expand the API for Dashboard History and Notes Editing

**Files:**
- Modify: `apps/api/salin_api/schemas/recordings.py`
- Modify: `apps/api/salin_api/repositories/recordings.py`
- Modify: `apps/api/salin_api/api/routes.py`
- Test: `apps/api/tests/test_recordings_api.py`

- [ ] **Step 1: Write failing API tests for recordings list and notes update**

```python
def test_list_recordings_returns_recent_rows(client, app) -> None:
    first_id = create_completed_recording(client, app)
    second_id = create_completed_recording(client, app)

    response = client.get("/recordings")

    assert response.status_code == 200
    payload = response.json()
    assert [row["recording"]["id"] for row in payload["recordings"]] == [second_id, first_id]
    assert payload["recordings"][0]["job"]["stage"] == "completed"
    assert payload["recordings"][0]["notes"]["status"] in {"idle", "completed", "failed", "queued", "generating"}


def test_update_notes_persists_structured_edits(client, app) -> None:
    recording_id = create_completed_recording(client, app)

    response = client.put(
        f"/recordings/{recording_id}/notes",
        json={
            "summary": "Updated summary",
            "key_points": ["Point A"],
            "decisions": ["Decision A"],
            "action_items": ["Action A"],
            "questions": ["Question A"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["notes"]["summary"] == "Updated summary"
    assert payload["notes"]["key_points"] == ["Point A"]
    assert payload["notes"]["decisions"] == ["Decision A"]
    assert payload["notes"]["action_items"] == ["Action A"]
    assert payload["notes"]["questions"] == ["Question A"]
```

- [ ] **Step 2: Run the targeted API tests to verify they fail**

Run: `uv run --package salin-api pytest apps/api/tests/test_recordings_api.py -k "list_recordings or update_notes" -v`

Expected: FAIL with missing route/schema behavior for `GET /recordings` and `PUT /recordings/{recording_id}/notes`.

- [ ] **Step 3: Add the API schemas and repository helpers**

```python
class RecordingListItemSummary(BaseModel):
    recording: RecordingSummary
    job: ProcessingJobSummary
    notes: GeneratedNotesSummary


class RecordingListResponse(BaseModel):
    recordings: list[RecordingListItemSummary]


class NotesUpdateRequest(BaseModel):
    summary: str | None
    key_points: list[str]
    decisions: list[str]
    action_items: list[str]
    questions: list[str]
```

```python
def list_recordings(self) -> list[tuple[Recording, ProcessingJob, GeneratedNotes | None]]:
    statement = (
        select(Recording, ProcessingJob, GeneratedNotes)
        .join(ProcessingJob, ProcessingJob.recording_id == Recording.id)
        .outerjoin(GeneratedNotes, GeneratedNotes.recording_id == Recording.id)
        .order_by(Recording.updated_at.desc())
    )
    return list(self.session.execute(statement).all())


def save_notes_edits(
    self,
    recording_id: str,
    *,
    summary: str | None,
    key_points: list[str],
    decisions: list[str],
    action_items: list[str],
    questions: list[str],
) -> GeneratedNotes:
    notes = self._ensure_generated_notes(recording_id)
    notes.status = "completed"
    notes.summary = summary
    notes.key_points_json = json.dumps(key_points)
    notes.decisions_json = json.dumps(decisions)
    notes.action_items_json = json.dumps(action_items)
    notes.questions_json = json.dumps(questions)
    notes.error_message = None
    self.session.commit()
    self.session.refresh(notes)
    return notes
```

- [ ] **Step 4: Add the new routes**

```python
@router.get("/recordings", response_model=RecordingListResponse)
def list_recordings(request: Request, session: Session = Depends(get_session)) -> RecordingListResponse:
    repository = RecordingRepository(session)
    rows = repository.list_recordings()
    return RecordingListResponse(
        recordings=[
            RecordingListItemSummary(
                recording=RecordingSummary.model_validate(recording),
                job=ProcessingJobSummary.model_validate(job),
                notes=build_notes_summary(notes),
            )
            for recording, job, notes in rows
        ]
    )


@router.put("/recordings/{recording_id}/notes", response_model=NotesGenerationResponse)
def update_notes(
    recording_id: str,
    payload: NotesUpdateRequest,
    session: Session = Depends(get_session),
) -> NotesGenerationResponse:
    repository = RecordingRepository(session)
    if repository.get_recording(recording_id) is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    saved_notes = repository.save_notes_edits(
        recording_id,
        summary=payload.summary,
        key_points=payload.key_points,
        decisions=payload.decisions,
        action_items=payload.action_items,
        questions=payload.questions,
    )
    return NotesGenerationResponse(recording_id=recording_id, notes=build_notes_summary(saved_notes))
```

- [ ] **Step 5: Run the targeted API tests to verify they pass**

Run: `uv run --package salin-api pytest apps/api/tests/test_recordings_api.py -k "list_recordings or update_notes" -v`

Expected: PASS with the new routes returning structured row and notes-save payloads.

- [ ] **Step 6: Commit the API contract expansion**

```bash
git add apps/api/salin_api/schemas/recordings.py apps/api/salin_api/repositories/recordings.py apps/api/salin_api/api/routes.py apps/api/tests/test_recordings_api.py
git commit -m "feat: add recordings list and notes update api"
```

### Task 2: Regenerate and Extend the Shared TypeScript API Contract

**Files:**
- Modify: `apps/api/openapi.json`
- Modify: `packages/shared/src/generated/api-types.ts`
- Modify: `packages/shared/src/api-types.ts`
- Modify: `packages/shared/src/client.ts`

- [ ] **Step 1: Export the updated OpenAPI schema**

Run: `python3 apps/api/scripts/export_openapi.py`

Expected: `apps/api/openapi.json` updated with `GET /recordings` and `PUT /recordings/{recording_id}/notes`.

- [ ] **Step 2: Regenerate shared API types**

Run: `pnpm --filter @salin/shared generate`

Expected: `packages/shared/src/generated/api-types.ts` now includes `RecordingListResponse`, `NotesUpdateRequest`, and the new path entries.

- [ ] **Step 3: Add shared client methods for dashboard data and notes saving**

```ts
import type {
  NotesGenerationResponse,
  NotesUpdateRequest,
  RecordingListResponse,
} from "./api-types";

export class SalinApiClient {
  async listRecordings(): Promise<RecordingListResponse> {
    const response = await fetch(`${this.baseUrl}/recordings`, {
      cache: "no-store",
    });

    return parseResponse<RecordingListResponse>(response);
  }

  async updateNotes(
    recordingId: string,
    payload: NotesUpdateRequest,
  ): Promise<NotesGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}/notes`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return parseResponse<NotesGenerationResponse>(response);
  }
}
```

- [ ] **Step 4: Typecheck the shared package**

Run: `pnpm --filter @salin/shared typecheck`

Expected: PASS with no unresolved generated-type changes.

- [ ] **Step 5: Commit the shared contract changes**

```bash
git add apps/api/openapi.json packages/shared/src/generated/api-types.ts packages/shared/src/api-types.ts packages/shared/src/client.ts
git commit -m "feat: extend shared api client for dashboard workflow"
```

### Task 3: Rebuild `/` into an Upload-First Dashboard

**Files:**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/components/dashboard-upload-composer.tsx`
- Create: `apps/web/components/recordings-table.tsx`
- Modify: `apps/web/lib/api.ts`
- Test: `apps/web/tests/e2e/upload.spec.ts`

- [ ] **Step 1: Write the failing E2E expectations for the dashboard home**

```ts
test("dashboard home shows upload composer and recent recordings", async ({ page }) => {
  await page.route("http://localhost:8000/recordings", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recordings: [
          {
            recording: {
              id: "rec_1",
              filename: "lecture.mp3",
              content_type: "audio/mpeg",
              file_size: 4000,
              language: "auto",
              processing_mode: "accurate",
              speaker_count: "auto",
              created_at: now(),
              updated_at: now(),
            },
            job: {
              id: "job_1",
              recording_id: "rec_1",
              stage: "completed",
              retryable: false,
              retry_count: 0,
              error_message: null,
              last_provider: "groq",
              created_at: now(),
              updated_at: now(),
              started_at: now(),
              completed_at: now(),
            },
            notes: idleNotes(),
          },
        ],
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "New recording" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent recordings" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "lecture.mp3" })).toBeVisible();
})
```

- [ ] **Step 2: Run the dashboard E2E to confirm the current home route fails**

Run: `pnpm --filter @salin/web test:e2e --grep "dashboard home"`

Expected: FAIL because `/` is still the upload-only landing page.

- [ ] **Step 3: Build the dashboard route with server-fetched rows and a dedicated upload composer**

```tsx
export default async function HomePage() {
  const api = createServerClient();
  const initialRows = await api.listRecordings().catch(() => ({ recordings: [] }));

  return (
    <main className="grid gap-8">
      <section className="grid gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Dashboard
        </h2>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-ink">
          Start a new recording, then reopen work from one home surface.
        </h1>
      </section>
      <DashboardUploadComposer />
      <RecordingsTable rows={initialRows.recordings} />
    </main>
  );
}
```

```tsx
export function RecordingsTable({ rows }: { rows: RecordingListItemSummary[] }) {
  if (!rows.length) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-ink">Recent recordings</h2>
        <p className="mt-2 text-sm text-muted">
          Completed, in-flight, and failed recordings will appear here after the first upload.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full border-collapse text-sm">
        {/* filename, status, language, updated, open */}
      </table>
    </Card>
  );
}
```

- [ ] **Step 4: Re-run the dashboard E2E to verify the home route now matches the new IA**

Run: `pnpm --filter @salin/web test:e2e --grep "dashboard home"`

Expected: PASS with the upload composer visible and recent recordings rendered below it.

- [ ] **Step 5: Commit the dashboard route rebuild**

```bash
git add apps/web/app/page.tsx apps/web/components/dashboard-upload-composer.tsx apps/web/components/recordings-table.tsx apps/web/lib/api.ts apps/web/tests/e2e/upload.spec.ts
git commit -m "feat: rebuild home route as upload dashboard"
```

### Task 4: Rebuild Recording Detail into Header + Tabs + Structured Notes Editor

**Files:**
- Modify: `apps/web/app/recordings/[id]/page.tsx`
- Create: `apps/web/components/recording-detail-header.tsx`
- Create: `apps/web/components/recording-workspace-tabs.tsx`
- Create: `apps/web/components/transcript-workspace-tab.tsx`
- Create: `apps/web/components/notes-editor-tab.tsx`
- Modify: `apps/web/components/recording-workspace.tsx`
- Modify: `apps/web/components/transcript-panel.tsx`
- Modify: `apps/web/components/transcript-player.tsx`
- Modify: `apps/web/components/notes-panel.tsx`
- Test: `apps/web/tests/e2e/upload.spec.ts`

- [ ] **Step 1: Add failing E2E coverage for dashboard return, tabs, and notes saving**

```ts
test("recording detail has dashboard return, tabs, and editable notes", async ({ page }) => {
  await page.goto("/recordings/rec_1");

  await expect(page.getByRole("link", { name: "Back to dashboard" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Transcript" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Notes" })).toBeVisible();

  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByLabel("Summary").fill("Updated summary");
  await page.getByRole("button", { name: "Save edits" }).click();
  await expect(page.getByText("Notes saved")).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted detail E2E to verify the current detail page fails**

Run: `pnpm --filter @salin/web test:e2e --grep "dashboard return, tabs, and editable notes"`

Expected: FAIL because the current detail page has no back-navigation, no tabs, and no notes-save behavior.

- [ ] **Step 3: Split the detail page into focused workspace components**

```tsx
export function RecordingWorkspace({ initialData, recordingId }: Props) {
  const [data, setData] = useState<RecordingDetailResponse | null>(initialData ?? null);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">("transcript");
  const [notesDraft, setNotesDraft] = useState<EditableNotesDraft | null>(null);
  const [notesDirty, setNotesDirty] = useState(false);

  return (
    <div className="grid gap-6">
      <RecordingDetailHeader data={data} onRetry={retryJob} />
      <RecordingWorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "transcript" ? (
        <TranscriptWorkspaceTab ... />
      ) : (
        <NotesEditorTab
          notes={data?.notes}
          draft={notesDraft}
          dirty={notesDirty}
          onDraftChange={handleDraftChange}
          onGenerate={generateNotes}
          onSave={saveNotes}
        />
      )}
    </div>
  );
}
```

```tsx
export function RecordingDetailHeader({ data, onRetry }: Props) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link className="inline-flex text-sm font-medium text-muted hover:text-ink" href="/">
          Back to dashboard
        </Link>
        {/* retry button when failed + retryable */}
      </div>
      {/* filename, stage badge, compact metadata */}
    </Card>
  );
}
```

- [ ] **Step 4: Add structured notes editing with dirty-state and save handling**

```tsx
async function saveNotes() {
  if (!notesDraft) return;

  setSavingNotes(true);
  try {
    const response = await apiClient.updateNotes(recordingId, notesDraft);
    setData((current) => (current ? { ...current, notes: response.notes } : current));
    setNotesDraft(toDraft(response.notes));
    setNotesDirty(false);
    setSaveState("saved");
  } finally {
    setSavingNotes(false);
  }
}
```

```tsx
export function NotesEditorTab({ draft, dirty, onDraftChange, onSave, ...props }: Props) {
  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Notes</h2>
          {dirty ? <Badge className="bg-accentSoft text-ink">Unsaved changes</Badge> : null}
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Summary</span>
          <textarea ... />
        </label>
        {/* repeat structured list editors for key_points, decisions, action_items, questions */}
        <Button disabled={!dirty} variant="accent" onClick={onSave}>Save edits</Button>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Re-run the detail E2E to verify the new navigation and notes workflow**

Run: `pnpm --filter @salin/web test:e2e --grep "dashboard return, tabs, and editable notes"`

Expected: PASS with back-navigation, tabbed workspace behavior, and notes save flow.

- [ ] **Step 6: Commit the detail workspace overhaul**

```bash
git add apps/web/app/recordings/[id]/page.tsx apps/web/components/recording-detail-header.tsx apps/web/components/recording-workspace-tabs.tsx apps/web/components/transcript-workspace-tab.tsx apps/web/components/notes-editor-tab.tsx apps/web/components/recording-workspace.tsx apps/web/components/transcript-panel.tsx apps/web/components/transcript-player.tsx apps/web/components/notes-panel.tsx apps/web/tests/e2e/upload.spec.ts
git commit -m "feat: rebuild recording detail workspace"
```

### Task 5: Update Documentation and Run Final Focused Validation

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/testing.md`
- Modify: `docs/ui.md`
- Modify: `docs/tasks.md`

- [ ] **Step 1: Update project docs to match the new workflow**

```md
- `/` is now the upload-first dashboard with recent recordings history.
- `/recordings/[id]` is a tabbed detail page with `Transcript` and `Notes`.
- The API now exposes `GET /recordings` and `PUT /recordings/{recording_id}/notes`.
```

- [ ] **Step 2: Run the focused API and web validation suite**

Run:

```bash
uv run --package salin-api pytest apps/api/tests/test_recordings_api.py
pnpm --filter @salin/shared typecheck
pnpm --filter @salin/web typecheck
pnpm --filter @salin/web lint
pnpm --filter @salin/web test:e2e
```

Expected: PASS across API tests, shared/web typecheck, lint, and Playwright.

- [ ] **Step 3: Mark the redesign task done**

```md
### [P0] Rebuild the web app into an upload-first dashboard and recording detail workspace
- **Status**: Done
```

- [ ] **Step 4: Commit the docs + validation pass**

```bash
git add docs/architecture.md docs/testing.md docs/ui.md docs/tasks.md
git commit -m "docs: record dashboard-detail workflow"
```

## Self-Review

- Spec coverage:
  - Dashboard home, recent recordings table, detail header, tabs, structured notes editing, API list/update endpoints, and targeted tests all map to Tasks 1-5.
- Placeholder scan:
  - No `TBD`, `TODO`, or deferred implementation markers remain in this plan.
- Type consistency:
  - `RecordingListResponse`, `NotesUpdateRequest`, `NotesGenerationResponse`, and the `updateNotes()` client method are named consistently across API, shared client, and web tasks.

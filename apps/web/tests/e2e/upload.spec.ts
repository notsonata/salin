import { expect, test } from "@playwright/test";
import type { GeneratedNotesSummary } from "@salin/shared";

const now = () => new Date().toISOString();

function idleNotes(): GeneratedNotesSummary {
  return {
    status: "idle",
    summary: null,
    key_points: [],
    decisions: [],
    action_items: [],
    questions: [],
    error_message: null,
    source_provider: null,
    generation_count: 0,
    started_at: null,
    completed_at: null,
    updated_at: null,
  };
}

function completedDetail(
  notes = idleNotes(),
  transcriptSegments = [
    {
      id: "seg_1",
      recording_id: "rec_1",
      index: 0,
      start_ms: 0,
      end_ms: 1200,
      text: "Kamusta sa transcript workspace.",
      speaker_label: "Speaker",
      speaker_estimated: true,
      source_provider: "groq",
    },
    {
      id: "seg_2",
      recording_id: "rec_1",
      index: 1,
      start_ms: 5300,
      end_ms: 8000,
      text: "Search and notes should stay useful.",
      speaker_label: "Speaker",
      speaker_estimated: true,
      source_provider: "groq",
    },
  ],
) {
  return {
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
    transcript_segments: transcriptSegments,
    artifact_urls: {
      original: "https://storage.invalid/recordings/rec_1/original/lecture.mp3",
      normalized:
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
    },
    notes,
  };
}

function recordingsListRow({
  id,
  filename,
  stage = "completed",
}: {
  id: string;
  filename: string;
  stage?: "uploaded" | "preprocessing" | "transcribing" | "completed" | "failed";
}) {
  return {
    recording: {
      id,
      filename,
      content_type: "audio/mpeg",
      file_size: 4000,
      language: "auto",
      processing_mode: "accurate",
      speaker_count: "auto",
      created_at: now(),
      updated_at: now(),
    },
    job: {
      id: `job_${id}`,
      recording_id: id,
      stage,
      retryable: false,
      retry_count: 0,
      error_message: null,
      last_provider: stage === "completed" ? "groq" : null,
      created_at: now(),
      updated_at: now(),
      started_at: now(),
      completed_at: stage === "completed" ? now() : null,
    },
    notes: idleNotes(),
  };
}

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
          recordingsListRow({ id: "rec_1", filename: "lecture.mp3" }),
          recordingsListRow({ id: "rec_2", filename: "client-call.mp3", stage: "transcribing" }),
        ],
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "New recording", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent recordings" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "lecture.mp3" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "client-call.mp3" })).toBeVisible();
});

test("supported upload transitions into the interactive transcript workspace", async ({
  page,
}) => {
  let pollCount = 0;

  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value() {
        return Promise.resolve();
      },
    });
  });

  await page.route("http://localhost:8000/recordings", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          recordings: [recordingsListRow({ id: "rec_existing", filename: "previous.mp3" })],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 201,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
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
          stage: "uploaded",
          retryable: false,
          retry_count: 0,
          error_message: null,
          last_provider: null,
          created_at: now(),
          updated_at: now(),
          started_at: null,
          completed_at: null,
        },
      }),
    });
  });

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    pollCount += 1;
    const body =
      pollCount > 1
        ? completedDetail()
        : {
            ...completedDetail(),
            job: {
              ...completedDetail().job,
              stage: "transcribing",
              last_provider: null,
              completed_at: null,
            },
            transcript_segments: [],
          };

    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "New recording", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent recordings" })).toBeVisible();
  await page.setInputFiles('input[type="file"]', {
    name: "lecture.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("fake-audio"),
  });
  await page.getByLabel("Language").selectOption("auto");
  await page.getByLabel("Processing mode").selectOption("accurate");
  await page.getByRole("button", { name: "Start processing" }).click();

  await page.waitForURL("**/recordings/rec_1", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Back to dashboard" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("tab", { name: "Transcript" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Notes" })).toBeVisible();
  await expect(page.getByText("Transcript ready").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "lecture.mp3" })).toBeVisible();
  await expect(page.getByText("Kamusta sa transcript workspace.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open original upload" })).toBeVisible();
  await expect(page.locator("audio")).toHaveAttribute(
    "src",
    /data:audio\/wav;base64/,
  );

  await page.getByPlaceholder("Search transcript").fill("search");
  await expect(page.getByText("Search and notes should stay useful.")).toBeVisible();
  await expect(page.getByText("Kamusta sa transcript workspace.")).toBeHidden();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export transcript TXT" }).click();
  const download = await downloadPromise;
  const contents = await download.path().then(async (filePath) => {
    if (!filePath) {
      return "";
    }
    const fs = await import("node:fs/promises");
    return fs.readFile(filePath, "utf8");
  });
  expect(contents).toContain("Kamusta sa transcript workspace.");
  expect(contents).toContain("Search and notes should stay useful.");

  await page.getByRole("button", { name: "00:05" }).click();
  await expect(page.getByRole("button", { name: "00:05" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const currentTimeValue = await page
    .locator("audio")
    .evaluate((node) => (node as HTMLAudioElement).currentTime);
  expect(currentTimeValue).toBeGreaterThanOrEqual(5);
});

test("speaker labels can be renamed and reassigned from the transcript", async ({
  page,
}) => {
  let detail = completedDetail();

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify(detail),
    });
  });

  await page.route(
    "http://localhost:8000/recordings/rec_1/speakers/rename",
    async (route) => {
      const updatedSegments = detail.transcript_segments.map((segment) => ({
        ...segment,
        speaker_label: "Teacher",
        speaker_estimated: false,
      }));
      detail = {
        ...detail,
        transcript_segments: updatedSegments,
      };
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          recording_id: "rec_1",
          transcript_segments: updatedSegments,
        }),
      });
    },
  );

  await page.route(
    "http://localhost:8000/recordings/rec_1/transcript-segments/seg_1/speaker",
    async (route) => {
      const updatedSegments = detail.transcript_segments.map((segment) =>
        segment.id === "seg_1"
          ? { ...segment, speaker_label: "Student", speaker_estimated: false }
          : segment,
      );
      detail = {
        ...detail,
        transcript_segments: updatedSegments,
      };
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          recording_id: "rec_1",
          transcript_segments: updatedSegments,
        }),
      });
    },
  );

  await page.goto("/recordings/rec_1");

  await expect(page.getByText("Estimated").first()).toBeVisible();
  await page.getByLabel("Corrected speaker name").fill("Teacher");
  await page.getByRole("button", { name: "Rename speaker" }).click();

  await expect(page.getByText("Speaker labels updated.")).toBeVisible();
  await expect(page.getByLabel("Speaker label for 00:00")).toHaveValue("Teacher");
  await expect(page.getByText("Edited").first()).toBeVisible();

  await page.getByLabel("Speaker label for 00:00").fill("Student");
  await page.getByRole("button", { name: "Apply speaker" }).first().click();

  await expect(page.getByText("Speaker label updated.")).toBeVisible();
  await expect(page.getByLabel("Speaker label for 00:00")).toHaveValue("Student");
});

test("manual notes generation renders the completed structured notes", async ({ page }) => {
  let detailCount = 0;

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    detailCount += 1;
    const detail =
      detailCount > 3
        ? completedDetail({
            status: "completed",
            summary: "Clear summary",
            key_points: ["Key point"],
            decisions: ["Decision"],
            action_items: ["Action item"],
            questions: ["Question"],
            error_message: null,
            source_provider: "openrouter:test-model",
            generation_count: 1,
            started_at: now(),
            completed_at: now(),
            updated_at: now(),
          })
        : completedDetail({
            status: detailCount === 1 ? "idle" : "generating",
            summary: null,
            key_points: [],
            decisions: [],
            action_items: [],
            questions: [],
            error_message: null,
            source_provider: null,
            generation_count: 0,
            started_at: detailCount === 1 ? null : now(),
            completed_at: null,
            updated_at: now(),
          });

    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify(detail),
    });
  });

  await page.route("http://localhost:8000/recordings/rec_1/notes/generate", async (route) => {
    await route.fulfill({
      status: 202,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recording_id: "rec_1",
        notes: {
          ...idleNotes(),
          status: "queued",
          updated_at: now(),
        },
      }),
    });
  });

  await page.goto("/recordings/rec_1");

  await page.getByRole("tab", { name: "Notes" }).click();
  await expect(page.getByRole("button", { name: "Generate notes" })).toBeVisible();
  await page.getByRole("button", { name: "Generate notes" }).click();

  await expect(page.getByLabel("Summary")).toHaveValue("Clear summary");
  await expect(page.getByLabel("Key points 1")).toHaveValue("Key point");
  await expect(page.getByLabel("Decisions 1")).toHaveValue("Decision");
  await expect(page.getByLabel("Action items 1")).toHaveValue("Action item");
  await expect(page.getByLabel("Questions 1")).toHaveValue("Question");
  await expect(page.getByRole("button", { name: "Regenerate notes" })).toBeVisible();
});

test("notes failure keeps the transcript visible and allows regeneration", async ({ page }) => {
  let detailCount = 0;

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    detailCount += 1;
    const detail =
      detailCount > 1
        ? completedDetail({
            ...idleNotes(),
            status: "failed",
            error_message: "OpenRouter failed",
            updated_at: now(),
          })
        : completedDetail();

    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify(detail),
    });
  });

  await page.route("http://localhost:8000/recordings/rec_1/notes/generate", async (route) => {
    await route.fulfill({
      status: 202,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recording_id: "rec_1",
        notes: {
          ...idleNotes(),
          status: "queued",
          updated_at: now(),
        },
      }),
    });
  });

  await page.goto("/recordings/rec_1");
  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByRole("button", { name: "Generate notes" }).click();

  await expect(page.getByText("OpenRouter failed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Regenerate notes" })).toBeVisible();
  await page.getByRole("tab", { name: "Transcript" }).click();
  await expect(page.getByText("Kamusta sa transcript workspace.")).toBeVisible();
});

test("notes edits save through the structured editor", async ({ page }) => {
  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify(
        completedDetail({
          status: "completed",
          summary: "Initial summary",
          key_points: ["Initial key point"],
          decisions: ["Initial decision"],
          action_items: ["Initial action item"],
          questions: ["Initial question"],
          error_message: null,
          source_provider: "openrouter:test-model",
          generation_count: 1,
          started_at: now(),
          completed_at: now(),
          updated_at: now(),
        }),
      ),
    });
  });

  await page.route("http://localhost:8000/recordings/rec_1/notes", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recording_id: "rec_1",
        notes: {
          status: "completed",
          summary: "Updated summary",
          key_points: ["Initial key point"],
          decisions: ["Initial decision"],
          action_items: ["Initial action item"],
          questions: ["Initial question"],
          error_message: null,
          source_provider: "openrouter:test-model",
          generation_count: 1,
          started_at: now(),
          completed_at: now(),
          updated_at: now(),
        },
      }),
    });
  });

  await page.goto("/recordings/rec_1");
  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByLabel("Summary").fill("Updated summary");
  await page.getByRole("button", { name: "Save edits" }).click();

  await expect(page.getByText("Notes saved.")).toBeVisible();
  await expect(page.getByLabel("Summary")).toHaveValue("Updated summary");
});

test("unsupported upload shows the API validation message", async ({ page }) => {
  await page.route("http://localhost:8000/recordings", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          recordings: [],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 400,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        detail:
          "Unsupported file type. Supported formats: .aac, .m4a, .mov, .mp3, .mp4, .wav, .webm.",
      }),
    });
  });

  await page.goto("/");
  await page.setInputFiles('input[type="file"]', {
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not-audio"),
  });
  await page.getByRole("button", { name: "Start processing" }).click();

  await expect(page.getByText("Unsupported file type.")).toBeVisible();
});

import { expect, test } from "@playwright/test";
import type { GeneratedNotesSummary } from "@salin/shared";

const now = () => new Date().toISOString();

function idleNotes(): GeneratedNotesSummary {
  return {
    status: "idle",
    content: null,
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
  stage?:
    | "uploaded"
    | "preprocessing"
    | "transcribing"
    | "diarizing"
    | "completed"
    | "failed";
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

test("home frames the product as a transcript review board", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Review across languages." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open dashboard" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByTestId("home-workspace-specimen")).toBeVisible();
  await expect(page.getByTestId("home-proof-panel")).toBeVisible();
  await expect(page.getByText("No dashboard noise.")).toBeVisible();
  await expect(page.getByText("Transcript specimen")).toBeVisible();
});

test("dashboard home shows the recording intake composer", async ({ page }) => {
  await page.route("http://localhost:8000/settings", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ diarization_enabled: false }),
    });
  });

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "New recording", exact: true })).toBeVisible();
  await expect(page.locator("#new-recording").getByText("Dashboard", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("dashboard-command-deck")).toBeVisible();
  await expect(page.getByRole("tab", { name: "File upload" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "YouTube URL" })).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Enable Diarization" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("library search filters recording rows", async ({ page }) => {
  await page.route("http://localhost:8000/recordings", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recordings: [
          recordingsListRow({ id: "rec_lecture", filename: "biology-lecture.mp3" }),
          recordingsListRow({
            id: "rec_interview",
            filename: "client-interview.m4a",
            stage: "transcribing",
          }),
        ],
      }),
    });
  });

  await page.goto("/library");
  await expect(page.getByText("biology-lecture.mp3")).toBeVisible();
  await expect(page.getByText("client-interview.m4a")).toBeVisible();

  await page.getByLabel("Search sessions").fill("interview");

  await expect(page.getByText("biology-lecture.mp3")).toBeHidden();
  await expect(page.getByText("client-interview.m4a")).toBeVisible();

  await page.getByLabel("Search sessions").fill("no match");

  await expect(page.getByText("client-interview.m4a")).toBeHidden();
  await expect(page.getByText("No recordings match your search.")).toBeVisible();
});

test("library recording rows can be deleted", async ({ page }) => {
  let rows = [recordingsListRow({ id: "rec_delete", filename: "delete-me.mp3" })];

  await page.route("http://localhost:8000/recordings", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({ recordings: rows }),
    });
  });

  await page.route("http://localhost:8000/recordings/rec_delete", async (route) => {
    expect(route.request().method()).toBe("DELETE");
    rows = [];
    await route.fulfill({
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
      },
      body: "",
    });
  });

  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Delete delete-me.mp3?");
    await dialog.accept();
  });

  await page.goto("/library");
  await expect(page.getByText("delete-me.mp3")).toBeVisible();
  await page.getByRole("button", { name: "Delete delete-me.mp3" }).click();

  await expect(page.getByText("delete-me.mp3")).toBeHidden();
  await expect(page.getByText("No recordings yet.")).toBeVisible();
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

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "New recording", exact: true })).toBeVisible();
  await page.setInputFiles('input[type="file"]', {
    name: "lecture.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("fake-audio"),
  });
  await page.getByRole("button", { name: "Start processing" }).click();

  await page.waitForURL("**/workspace/rec_1", { timeout: 15_000 });
  const desktopGrid = page.getByTestId("desktop-workspace-grid");
  await expect(page.getByRole("link", { name: "Back" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByTestId("workspace-top-strip")).toBeVisible();
  await expect(desktopGrid).toBeVisible();
  await expect(desktopGrid.getByTestId("notes-dock")).toBeVisible();
  await expect(desktopGrid.getByTestId("transcript-toolbar")).toBeVisible();
  await expect(page.getByTestId("mobile-workspace-tabs")).toBeHidden();
  await expect(page.getByText("Transcript ready").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "lecture.mp3", exact: true })).toBeVisible();
  await expect(desktopGrid.getByText("Kamusta sa transcript workspace.")).toBeVisible();
  await expect(
    page.getByText("Speaker labels are automatically estimated and can be edited."),
  ).toBeVisible();
  await expect(desktopGrid.locator("audio")).toHaveAttribute(
    "src",
    /data:audio\/wav;base64/,
  );
  const toolbarPosition = await page
    .getByTestId("desktop-workspace-grid")
    .getByTestId("transcript-toolbar")
    .evaluate((node) => window.getComputedStyle(node).position);
  expect(toolbarPosition).toBe("sticky");

  await desktopGrid.getByPlaceholder("Search transcript").focus();
  await expect(desktopGrid.getByPlaceholder("Search transcript")).toBeFocused();
  await desktopGrid.getByPlaceholder("Search transcript").fill("search");
  await expect(desktopGrid.getByText("Search and notes should stay useful.")).toBeVisible();
  await expect(desktopGrid.getByText("Kamusta sa transcript workspace.")).toBeHidden();

  await desktopGrid.getByRole("button", { name: "Export transcript" }).click();
  await expect(desktopGrid.getByRole("link", { name: "Export transcript TXT" })).toHaveAttribute(
    "href",
    "http://localhost:8000/recordings/rec_1/exports/transcript.txt",
  );
  await expect(desktopGrid.getByRole("link", { name: "Export transcript PDF" })).toHaveAttribute(
    "href",
    "http://localhost:8000/recordings/rec_1/exports/transcript.pdf",
  );

  await desktopGrid.getByRole("button", { name: "00:05", exact: true }).click();
  await expect(desktopGrid.getByRole("button", { name: "00:05", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const currentTimeValue = await page
    .getByTestId("desktop-workspace-grid")
    .locator("audio")
    .evaluate((node) => (node as HTMLAudioElement).currentTime);
  expect(currentTimeValue).toBeGreaterThanOrEqual(5);
});

test("youtube import transitions into the transcript workspace", async ({ page }) => {
  await page.route("**/recordings/imports/youtube", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
      return;
    }

    const body = JSON.stringify({
      recording: {
        id: "rec_youtube",
        filename: "YouTube import",
        content_type: "application/vnd.salin.youtube-import+json",
        file_size: 128,
        language: "auto",
        processing_mode: "accurate",
        speaker_count: "auto",
        created_at: now(),
        updated_at: now(),
      },
      job: {
        id: "job_youtube",
        recording_id: "rec_youtube",
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
    });
    await route.fulfill({
      status: 201,
      headers: {
        "access-control-allow-origin": "*",
        "content-length": String(Buffer.byteLength(body)),
        "content-type": "application/json",
      },
      body,
    });
  });

  await page.route("**/recordings/rec_youtube", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...completedDetail(),
        recording: {
          ...completedDetail().recording,
          id: "rec_youtube",
          filename: "Class-discussion.m4a",
          content_type: "audio/mp4",
        },
        job: {
          ...completedDetail().job,
          id: "job_youtube",
          recording_id: "rec_youtube",
        },
      }),
    });
  });

  await page.goto("/dashboard");
  await page.getByRole("tab", { name: "YouTube URL" }).click();
  await page
    .getByLabel("YouTube video link")
    .fill("https://www.youtube.com/watch?v=demo123");
  const importResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/recordings/imports/youtube")
      && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Import link" }).click();
  const importResponse = await importResponsePromise;
  expect(importResponse.ok()).toBe(true);

  await page.waitForURL("**/workspace/rec_youtube", {
    timeout: 15_000,
    waitUntil: "commit",
  });
  await expect(page.getByRole("heading", { name: "Class-discussion.m4a" })).toBeVisible();
});

test("mobile workspace falls back to transcript and notes tabs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify(completedDetail()),
    });
  });

  await page.goto("/workspace/rec_1");

  await expect(page.getByTestId("mobile-workspace-tabs")).toBeVisible();
  await expect(page.getByTestId("desktop-workspace-grid")).toBeHidden();
  await expect(page.getByRole("tab", { name: "Transcript" })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: /Transcript/i })).toBeVisible();
  await page.getByRole("tab", { name: "Notes" }).click();
  await expect(page.getByRole("tabpanel", { name: /Notes/i })).toBeVisible();
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
    "http://localhost:8000/recordings/rec_1/transcript-segments/seg_1",
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

  await page.goto("/workspace/rec_1");
  const desktopGrid = page.getByTestId("desktop-workspace-grid");

  await expect(desktopGrid.getByText("Estimated").first()).toBeVisible();
  await desktopGrid.getByRole("button", { name: "Rename speakers" }).click();
  await page.getByLabel("Corrected speaker name").fill("Teacher");
  await page.getByRole("button", { name: "Rename speaker", exact: true }).click();

  await expect(desktopGrid.getByText("Speaker labels updated.")).toBeVisible();
  await desktopGrid.getByRole("button", { name: "Edit speaker for 00:00" }).click();
  await expect(page.getByLabel("Speaker label for 00:00")).toHaveValue("Teacher");
  await expect(desktopGrid.getByText("Edited").first()).toBeVisible();

  await page.getByLabel("Speaker label for 00:00").fill("Student");
  await page.getByRole("button", { name: "Apply edits" }).first().click();

  await expect(desktopGrid.getByText("Segment updated.")).toBeVisible();
  await expect(page.getByLabel("Speaker label for 00:00")).toHaveValue("Student");
});

test("transcript stays available while speaker labels are estimated", async ({ page }) => {
  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...completedDetail(),
        job: {
          ...completedDetail().job,
          stage: "diarizing",
          error_message: "Groq transcription failed; using local backup.",
          last_provider: "faster-whisper",
          completed_at: null,
        },
      }),
    });
  });

  await page.goto("/workspace/rec_1");
  const desktopGrid = page.getByTestId("desktop-workspace-grid");

  await expect(
    desktopGrid.getByText("Transcript is ready while speaker estimation continues."),
  ).toBeVisible();
  await expect(page.getByText("Processing note:")).toBeVisible();
  await expect(desktopGrid.getByText("Kamusta sa transcript workspace.")).toBeVisible();
  await desktopGrid.getByRole("button", { name: "Export transcript" }).click();
  await expect(desktopGrid.getByRole("link", { name: "Export transcript TXT" })).toBeVisible();
  await expect(desktopGrid.getByRole("link", { name: "Export transcript PDF" })).toBeVisible();
});

test("manual notes generation renders the completed structured notes", async ({ page }) => {
  let detailCount = 0;

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    detailCount += 1;
    const detail =
      detailCount > 3
        ? completedDetail({
            status: "completed",
            content: (
              "# Summary\n\n"
              + "Clear summary\n\n"
              + "## Key Points\n\n"
              + "- Key point\n\n"
              + "## Decisions\n\n"
              + "- Decision\n\n"
              + "## Action Items\n\n"
              + "- [ ] Action item\n\n"
              + "## Questions\n\n"
              + "- Question"
            ),
            error_message: null,
            source_provider: "openrouter:test-model",
            generation_count: 1,
            started_at: now(),
            completed_at: now(),
            updated_at: now(),
          })
        : completedDetail({
            status: detailCount === 1 ? "idle" : "generating",
            content: null,
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

  await page.goto("/workspace/rec_1");
  const desktopGrid = page.getByTestId("desktop-workspace-grid");

  await expect(desktopGrid.getByRole("button", { name: "Generate notes" })).toBeVisible();
  await desktopGrid.getByRole("button", { name: "Generate notes" }).click();

  await expect(page.getByText("Clear summary")).toBeVisible();
  await expect(page.getByText("Key point")).toBeVisible();
  await expect(page.getByText("Decision")).toBeVisible();
  await expect(page.getByText("Action item")).toBeVisible();
  await expect(page.getByText("Question")).toBeVisible();
  await expect(desktopGrid.getByRole("button", { name: "Regenerate notes" })).toBeVisible();
  await desktopGrid.getByRole("button", { name: "Export notes" }).click();
  await expect(desktopGrid.getByRole("link", { name: "Export notes TXT" })).toHaveAttribute(
    "href",
    "http://localhost:8000/recordings/rec_1/exports/notes.txt",
  );
  await expect(desktopGrid.getByRole("link", { name: "Export notes PDF" })).toHaveAttribute(
    "href",
    "http://localhost:8000/recordings/rec_1/exports/notes.pdf",
  );
  await expect(desktopGrid.getByRole("link", { name: "Export combined TXT" })).toHaveAttribute(
    "href",
    "http://localhost:8000/recordings/rec_1/exports/combined.txt",
  );
  await expect(desktopGrid.getByRole("link", { name: "Export combined PDF" })).toHaveAttribute(
    "href",
    "http://localhost:8000/recordings/rec_1/exports/combined.pdf",
  );
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

  await page.goto("/workspace/rec_1");
  const desktopGrid = page.getByTestId("desktop-workspace-grid");
  await desktopGrid.getByRole("button", { name: "Generate notes" }).click();

  await expect(page.getByText("OpenRouter failed")).toBeVisible();
  await expect(desktopGrid.getByRole("button", { name: "Regenerate notes" })).toBeVisible();
  await expect(desktopGrid.getByText("Kamusta sa transcript workspace.")).toBeVisible();
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
          content: "# Summary\n\nInitial summary\n\n## Key Points\n\n- Initial key point",
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
          content: "# Summary\n\nUpdated summary\n\n## Key Points\n\n- Initial key point",
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

  await page.goto("/workspace/rec_1");
  const notesEditor = page.locator("[contenteditable='true']").first();
  await notesEditor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("# Summary\n\nUpdated summary\n\n## Key Points\n\n- Initial key point");
  await page.getByRole("button", { name: "Save edits" }).click();

  await expect(page.getByText("Notes saved.")).toBeVisible();
  await expect(page.getByText("Updated summary")).toBeVisible();
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

  await page.goto("/dashboard");
  await page.setInputFiles('input[type="file"]', {
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not-audio"),
  });
  await page.getByRole("button", { name: "Start processing" }).click();

  await expect(page.getByText("Unsupported file type.")).toBeVisible();
});

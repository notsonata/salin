import { expect, test } from "@playwright/test";

test("supported upload transitions into the transcript workspace", async ({ page }) => {
  let pollCount = 0;

  await page.route("http://localhost:8000/recordings", async (route) => {
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        job: {
          id: "job_1",
          recording_id: "rec_1",
          stage: "uploaded",
          retryable: false,
          retry_count: 0,
          error_message: null,
          last_provider: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
        },
      }),
    });
  });

  await page.route("http://localhost:8000/recordings/rec_1", async (route) => {
    pollCount += 1;
    const completed = pollCount > 1;
    await route.fulfill({
      status: 200,
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        job: {
          id: "job_1",
          recording_id: "rec_1",
          stage: completed ? "completed" : "transcribing",
          retryable: false,
          retry_count: 0,
          error_message: null,
          last_provider: completed ? "groq" : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : null,
        },
        transcript_segments: completed
          ? [
              {
                id: "seg_1",
                recording_id: "rec_1",
                index: 0,
                start_ms: 0,
                end_ms: 1200,
                text: "Kamusta sa transcript spine.",
                speaker_label: "Speaker",
                speaker_estimated: true,
                source_provider: "groq",
              },
            ]
          : [],
        artifact_urls: {
          original: "https://storage.invalid/recordings/rec_1/original/lecture.mp3",
        },
      }),
    });
  });

  await page.goto("/");
  await page.setInputFiles('input[type="file"]', {
    name: "lecture.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("fake-audio"),
  });
  await page.getByLabel("Language").selectOption("auto");
  await page.getByLabel("Processing mode").selectOption("accurate");
  await page.getByRole("button", { name: "Start processing" }).click();

  await expect(page).toHaveURL(/\/recordings\/rec_1$/);
  await expect(page.getByText("Transcript ready")).toBeVisible();
  await expect(page.getByText("Kamusta sa transcript spine.")).toBeVisible();
});

test("unsupported upload shows the API validation message", async ({ page }) => {
  await page.route("http://localhost:8000/recordings", async (route) => {
    await route.fulfill({
      status: 400,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        detail: "Unsupported file type. Supported formats: .aac, .m4a, .mov, .mp3, .mp4, .wav, .webm.",
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

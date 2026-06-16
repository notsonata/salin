import type { NextRequest } from "next/server";

import MarkdownIt from "markdown-it";
// @ts-expect-error — no bundled types for markdown-it-task-lists
import taskLists from "markdown-it-task-lists";
import sanitizeHtml from "sanitize-html";

export const runtime = "nodejs";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
}).use(taskLists, { enabled: true, label: true });

function renderMarkdownToHtml(markdown: string): string {
  const rawHtml = md.render(markdown) as string;

  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1",
      "h2",
      "h3",
      "img",
      "input",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      input: ["type", "checked", "disabled"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt"],
    },
  });
}

function makePdfHtml(body: string, title: string): string {
  const escapedTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapedTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 24mm 20mm;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      font-size: 11pt;
      line-height: 1.55;
    }

    h1 { font-size: 22pt; margin: 0 0 18px; line-height: 1.2; }
    h2 { font-size: 15pt; margin: 28px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 12.5pt; margin: 20px 0 8px; }

    p { margin: 0 0 10px; }

    ul, ol { margin: 8px 0 14px 22px; padding: 0; }
    li { margin: 4px 0; }

    /* Task list checkboxes */
    li.task-list-item { list-style: none; margin-left: -22px; }
    li.task-list-item input[type="checkbox"] { margin-right: 6px; }

    blockquote {
      margin: 14px 0;
      padding: 8px 14px;
      border-left: 4px solid #ccc;
      color: #444;
      background: #f7f7f7;
    }

    code {
      font-family: Menlo, Consolas, monospace;
      font-size: 9.5pt;
      background: #f3f3f3;
      padding: 2px 4px;
      border-radius: 4px;
    }

    pre {
      background: #f3f3f3;
      padding: 12px;
      border-radius: 6px;
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 10pt;
    }

    th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
    th { background: #f3f3f3; font-weight: 700; }

    hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }

    a { color: #2563eb; }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { markdown?: string; title?: string; filename?: string };

  const markdown = body.markdown;
  const title = body.title ?? "Salin Export";
  const filename = body.filename ?? "salin-export.pdf";

  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return Response.json({ error: "markdown is required" }, { status: 400 });
  }

  const { chromium } = await import("playwright");

  const renderedBody = renderMarkdownToHtml(markdown);
  const html = makePdfHtml(renderedBody, title);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24mm", right: "20mm", bottom: "24mm", left: "20mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `<div style="width:100%;font-size:8px;color:#666;padding:0 20mm;display:flex;justify-content:space-between;"><span>${escapeSafe(title)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}

function escapeSafe(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

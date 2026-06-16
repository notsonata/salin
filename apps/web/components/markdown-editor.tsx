"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./mdx-editor").then((mod) => mod.MDXEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full animate-pulse items-center justify-center bg-canvas">
      <p className="text-sm text-muted">Loading editor...</p>
    </div>
  ),
});

export function MarkdownEditor({
  markdown,
  onChange,
}: {
  markdown: string;
  onChange: (markdown: string) => void;
}) {
  return <Editor markdown={markdown} onChange={onChange} />;
}

from __future__ import annotations

import json
import textwrap
from collections.abc import Sequence
from dataclasses import dataclass

from salin_api.models import GeneratedNotes, Recording, TranscriptSegment


@dataclass(frozen=True, slots=True)
class TextExport:
    filename: str
    content: str


@dataclass(frozen=True, slots=True)
class BinaryExport:
    filename: str
    content: bytes
    media_type: str


def build_transcript_txt(
    *,
    recording: Recording,
    segments: Sequence[TranscriptSegment],
) -> TextExport:
    lines = [
        "Transcript",
        f"Recording: {recording.filename}",
        "",
        "Speaker labels are automatically estimated and can be edited.",
        "",
    ]
    lines.extend(_format_transcript_segments(segments))
    return TextExport(
        filename=_export_filename(recording, "transcript", "txt"),
        content=_join_lines(lines),
    )


def build_transcript_pdf(
    *,
    recording: Recording,
    segments: Sequence[TranscriptSegment],
) -> BinaryExport:
    text_export = build_transcript_txt(recording=recording, segments=segments)
    return _build_pdf_export(
        filename=_export_filename(recording, "transcript", "pdf"),
        title="Transcript",
        content=text_export.content,
    )


def build_notes_txt(*, recording: Recording, notes: GeneratedNotes) -> TextExport:
    return TextExport(
        filename=_export_filename(recording, "notes", "txt"),
        content=_join_lines(_format_notes(recording=recording, notes=notes, include_title=True)),
    )


def build_notes_pdf(*, recording: Recording, notes: GeneratedNotes) -> BinaryExport:
    text_export = build_notes_txt(recording=recording, notes=notes)
    return _build_pdf_export(
        filename=_export_filename(recording, "notes", "pdf"),
        title="Notes",
        content=text_export.content,
    )


def build_combined_txt(
    *,
    recording: Recording,
    segments: Sequence[TranscriptSegment],
    notes: GeneratedNotes,
) -> TextExport:
    lines = [
        "Salin Export",
        f"Recording: {recording.filename}",
        "",
        "Notes",
        "",
        *_format_notes(recording=recording, notes=notes, include_title=False),
        "",
        "Transcript",
        "",
        "Speaker labels are automatically estimated and can be edited.",
        "",
        *_format_transcript_segments(segments),
    ]
    return TextExport(
        filename=_export_filename(recording, "combined", "txt"),
        content=_join_lines(lines),
    )


def build_combined_pdf(
    *,
    recording: Recording,
    segments: Sequence[TranscriptSegment],
    notes: GeneratedNotes,
) -> BinaryExport:
    text_export = build_combined_txt(recording=recording, segments=segments, notes=notes)
    return _build_pdf_export(
        filename=_export_filename(recording, "combined", "pdf"),
        title="Salin Export",
        content=text_export.content,
    )


def notes_is_exportable(notes: GeneratedNotes | None) -> bool:
    return notes is not None and notes.status == "completed"


def _format_transcript_segments(segments: Sequence[TranscriptSegment]) -> list[str]:
    return [
        (
            f"[{_format_timestamp(segment.start_ms)} - {_format_timestamp(segment.end_ms)}] "
            f"{_format_speaker(segment)}: {segment.text}"
        )
        for segment in segments
    ]


def _format_notes(
    *,
    recording: Recording,
    notes: GeneratedNotes,
    include_title: bool,
) -> list[str]:
    lines: list[str] = []
    if include_title:
        lines.extend(["Notes", f"Recording: {recording.filename}", ""])

    summary = (notes.summary or "").strip()
    lines.extend(["Summary", summary or "No summary saved.", ""])
    lines.extend(_format_list_section("Key Points", _load_list(notes.key_points_json)))
    lines.append("")
    lines.extend(_format_list_section("Decisions", _load_list(notes.decisions_json)))
    lines.append("")
    lines.extend(_format_list_section("Action Items", _load_list(notes.action_items_json)))
    lines.append("")
    lines.extend(_format_list_section("Questions", _load_list(notes.questions_json)))
    return lines


def _format_list_section(title: str, items: list[str]) -> list[str]:
    if not items:
        return [title, "- None saved."]
    return [title, *[f"- {item}" for item in items]]


def _format_speaker(segment: TranscriptSegment) -> str:
    if segment.speaker_estimated:
        return f"{segment.speaker_label} (estimated)"
    return segment.speaker_label


def _format_timestamp(milliseconds: int) -> str:
    total_seconds, ms = divmod(max(0, milliseconds), 1000)
    minutes_total, seconds = divmod(total_seconds, 60)
    hours, minutes = divmod(minutes_total, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{ms:03d}"


def _load_list(payload: str) -> list[str]:
    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item).strip() for item in parsed if str(item).strip()]


def _export_filename(recording: Recording, export_name: str, extension: str) -> str:
    stem = recording.filename.rsplit(".", maxsplit=1)[0].strip() or "recording"
    safe_stem = "".join(
        character if character.isalnum() or character in {"-", "_"} else "-"
        for character in stem
    ).strip("-")
    if not safe_stem:
        safe_stem = "recording"
    return f"salin-{safe_stem}-{export_name}.{extension}"


def _join_lines(lines: Sequence[str]) -> str:
    return "\n".join(lines).rstrip() + "\n"


def _build_pdf_export(*, filename: str, title: str, content: str) -> BinaryExport:
    lines = _wrap_pdf_lines(content.splitlines())
    return BinaryExport(
        filename=filename,
        content=_render_pdf(title=title, lines=lines),
        media_type="application/pdf",
    )


def _wrap_pdf_lines(lines: Sequence[str]) -> list[str]:
    wrapped_lines: list[str] = []
    for line in lines:
        if not line:
            wrapped_lines.append("")
            continue
        wrapped = textwrap.wrap(
            line,
            width=92,
            replace_whitespace=False,
            drop_whitespace=False,
            break_long_words=True,
            break_on_hyphens=False,
        )
        wrapped_lines.extend(wrapped or [""])
    return wrapped_lines


def _render_pdf(*, title: str, lines: Sequence[str]) -> bytes:
    page_width = 612
    page_height = 792
    margin_x = 54
    margin_top = 54
    font_size = 10
    line_height = 14
    lines_per_page = max(1, int((page_height - (margin_top * 2)) / line_height))
    pages = [
        list(lines[index : index + lines_per_page])
        for index in range(0, len(lines), lines_per_page)
    ] or [[]]

    object_count = 3 + len(pages) * 2
    catalog_id = 1
    pages_id = 2
    font_id = 3
    objects: dict[int, bytes] = {}
    page_ids = [4 + page_index * 2 for page_index in range(len(pages))]

    objects[catalog_id] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objects[font_id] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    objects[pages_id] = (
        f"<< /Type /Pages /Kids {' '.join(f'{page_id} 0 R' for page_id in page_ids)} "
        f"/Count {len(page_ids)} >>"
    ).encode("ascii")

    for page_index, page_lines in enumerate(pages):
        page_id = page_ids[page_index]
        content_id = page_id + 1
        content_stream = _render_page_content(
            page_number=page_index + 1,
            page_count=len(pages),
            title=title,
            lines=page_lines,
            margin_x=margin_x,
            margin_top=margin_top,
            page_height=page_height,
            font_size=font_size,
            line_height=line_height,
        )
        objects[page_id] = (
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {page_width} {page_height}] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
        ).encode("ascii")
        objects[content_id] = (
            f"<< /Length {len(content_stream)} >>\nstream\n".encode("ascii")
            + content_stream
            + b"\nendstream"
        )

    return _assemble_pdf(objects=objects, object_count=object_count)


def _render_page_content(
    *,
    page_number: int,
    page_count: int,
    title: str,
    lines: Sequence[str],
    margin_x: int,
    margin_top: int,
    page_height: int,
    font_size: int,
    line_height: int,
) -> bytes:
    y_position = page_height - margin_top
    commands = [
        "BT",
        f"/F1 {font_size} Tf",
        f"1 0 0 1 {margin_x} {y_position} Tm",
        f"{_pdf_text_hex(title)} Tj",
        f"0 -{line_height * 2} Td",
    ]
    for line in lines:
        commands.append(f"{_pdf_text_hex(line)} Tj")
        commands.append(f"0 -{line_height} Td")
    commands.extend(
        [
            "ET",
            "BT",
            "/F1 8 Tf",
            f"1 0 0 1 {margin_x} 32 Tm",
            f"{_pdf_text_hex(f'Page {page_number} of {page_count}')} Tj",
            "ET",
        ]
    )
    return "\n".join(commands).encode("ascii")


def _pdf_text_hex(value: str) -> str:
    payload = b"\xfe\xff" + value.encode("utf-16-be", errors="replace")
    return f"<{payload.hex().upper()}>"


def _assemble_pdf(*, objects: dict[int, bytes], object_count: int) -> bytes:
    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for object_id in range(1, object_count + 1):
        offsets.append(len(output))
        output.extend(f"{object_id} 0 obj\n".encode("ascii"))
        output.extend(objects[object_id])
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {object_count + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        (
            f"trailer\n<< /Size {object_count + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(output)

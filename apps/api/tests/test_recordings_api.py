from __future__ import annotations

from datetime import datetime, timedelta, timezone

from salin_api.repositories.recordings import RecordingRepository, TranscriptSegmentInput


def test_recording_routes_allow_browser_origin(client) -> None:
    response = client.get(
        "/recordings/nonexistent",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.status_code == 404
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_supported_upload_persists_metadata_and_enqueues_job(client, app) -> None:
    response = client.post(
        "/recordings",
        data={
            "language": "auto",
            "processing_mode": "accurate",
            "speaker_count": "auto",
        },
        files={"file": ("lecture.mp3", b"fake-audio", "audio/mpeg")},
    )

    assert response.status_code == 201
    payload = response.json()
    recording_id = payload["recording"]["id"]
    job = payload["job"]
    storage = app.state.services.storage
    queue = app.state.services.job_queue

    assert payload["recording"]["filename"] == "lecture.mp3"
    assert payload["recording"]["language"] == "auto"
    assert job["recording_id"] == recording_id
    assert job["stage"] == "uploaded"
    assert queue.enqueued_recordings == [recording_id]
    assert storage.objects[f"recordings/{recording_id}/original/lecture.mp3"] == b"fake-audio"


def test_unsupported_upload_is_rejected(client) -> None:
    response = client.post(
        "/recordings",
        data={
            "language": "en",
            "processing_mode": "fast",
            "speaker_count": "2",
        },
        files={"file": ("notes.txt", b"not-audio", "text/plain")},
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def create_completed_recording(client, app, *, filename: str = "lecture.mp3") -> str:
    response = client.post(
        "/recordings",
        data={
            "language": "auto",
            "processing_mode": "accurate",
            "speaker_count": "auto",
        },
        files={"file": (filename, b"fake-audio", "audio/mpeg")},
    )
    assert response.status_code == 201
    recording_id = response.json()["recording"]["id"]

    session = app.state.session_factory()
    repository = RecordingRepository(session)
    repository.replace_segments(
        recording_id,
        [
            TranscriptSegmentInput(
                index=0,
                start_ms=0,
                end_ms=1200,
                text="Kamusta sa notes milestone.",
                speaker_label="Speaker",
                speaker_estimated=True,
                source_provider="groq",
            )
        ],
    )
    repository.update_job_stage(
        recording_id,
        stage="completed",
        retryable=False,
        error_message=None,
        last_provider="groq",
    )
    session.close()
    return recording_id


def set_recording_updated_at(app, recording_id: str, *, seconds_from_now: int) -> None:
    session = app.state.session_factory()
    repository = RecordingRepository(session)
    recording = repository.require_recording(recording_id)
    recording.updated_at = datetime.now(timezone.utc) + timedelta(seconds=seconds_from_now)
    session.commit()
    session.close()


def test_recording_detail_synthesizes_idle_notes_state(client, app) -> None:
    recording_id = create_completed_recording(client, app)

    response = client.get(f"/recordings/{recording_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["notes"] == {
        "status": "idle",
        "summary": None,
        "key_points": [],
        "decisions": [],
        "action_items": [],
        "questions": [],
        "error_message": None,
        "source_provider": None,
        "generation_count": 0,
        "started_at": None,
        "completed_at": None,
        "updated_at": None,
    }


def test_generate_notes_queues_completed_transcript(client, app) -> None:
    recording_id = create_completed_recording(client, app)

    response = client.post(f"/recordings/{recording_id}/notes/generate")

    assert response.status_code == 202
    payload = response.json()
    assert payload["recording_id"] == recording_id
    assert payload["notes"]["status"] == "queued"
    assert payload["notes"]["generation_count"] == 0
    assert app.state.services.job_queue.enqueued_notes == [recording_id]


def test_generate_notes_rejects_incomplete_transcript(client) -> None:
    response = client.post(
        "/recordings",
        data={
            "language": "auto",
            "processing_mode": "accurate",
            "speaker_count": "auto",
        },
        files={"file": ("lecture.mp3", b"fake-audio", "audio/mpeg")},
    )
    recording_id = response.json()["recording"]["id"]

    generate_response = client.post(f"/recordings/{recording_id}/notes/generate")

    assert generate_response.status_code == 409
    assert "Transcription must be completed" in generate_response.json()["detail"]


def test_generate_notes_rejects_duplicate_in_flight_requests(client, app) -> None:
    recording_id = create_completed_recording(client, app)

    first_response = client.post(f"/recordings/{recording_id}/notes/generate")
    second_response = client.post(f"/recordings/{recording_id}/notes/generate")

    assert first_response.status_code == 202
    assert second_response.status_code == 409
    assert "already in progress" in second_response.json()["detail"]


def test_list_recordings_returns_recent_rows(client, app) -> None:
    first_id = create_completed_recording(client, app, filename="lecture-a.mp3")
    second_id = create_completed_recording(client, app, filename="lecture-b.mp3")
    set_recording_updated_at(app, first_id, seconds_from_now=-5)
    set_recording_updated_at(app, second_id, seconds_from_now=5)

    response = client.get("/recordings")

    assert response.status_code == 200
    payload = response.json()
    assert [row["recording"]["id"] for row in payload["recordings"]] == [
        second_id,
        first_id,
    ]
    assert [row["recording"]["filename"] for row in payload["recordings"]] == [
        "lecture-b.mp3",
        "lecture-a.mp3",
    ]
    assert payload["recordings"][0]["job"]["stage"] == "completed"
    assert payload["recordings"][0]["notes"]["status"] == "idle"


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
    assert payload["recording_id"] == recording_id
    assert payload["notes"]["status"] == "completed"
    assert payload["notes"]["summary"] == "Updated summary"
    assert payload["notes"]["key_points"] == ["Point A"]
    assert payload["notes"]["decisions"] == ["Decision A"]
    assert payload["notes"]["action_items"] == ["Action A"]
    assert payload["notes"]["questions"] == ["Question A"]


def test_update_notes_refreshes_dashboard_recency(client, app) -> None:
    first_id = create_completed_recording(client, app, filename="lecture-a.mp3")
    second_id = create_completed_recording(client, app, filename="lecture-b.mp3")
    set_recording_updated_at(app, second_id, seconds_from_now=-10)

    save_response = client.put(
        f"/recordings/{first_id}/notes",
        json={
            "summary": "Fresh edit",
            "key_points": [],
            "decisions": [],
            "action_items": [],
            "questions": [],
        },
    )

    assert save_response.status_code == 200

    list_response = client.get("/recordings")

    assert list_response.status_code == 200
    payload = list_response.json()
    assert [row["recording"]["id"] for row in payload["recordings"]] == [
        first_id,
        second_id,
    ]

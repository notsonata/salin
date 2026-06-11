from __future__ import annotations


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

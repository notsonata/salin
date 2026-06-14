from __future__ import annotations

from pathlib import Path

from salin_api.core.settings import Settings
from salin_worker.providers.pyannote_provider import PyannoteDiarizationProvider
from salin_worker.tasks import build_diarization_provider


class FakeTurn:
    def __init__(self, start: float, end: float) -> None:
        self.start = start
        self.end = end


class FakeAnnotation:
    def itertracks(self, *, yield_label: bool):
        assert yield_label is True
        yield FakeTurn(0.1, 1.6), None, "SPEAKER_00"
        yield FakeTurn(1.8, 3.1), None, "SPEAKER_01"
        yield FakeTurn(3.2, 4.0), None, "SPEAKER_00"


class FakeCommunityOutput:
    speaker_diarization = [
        (FakeTurn(0.2, 1.0), "speaker_a"),
        (FakeTurn(1.2, 2.0), "speaker_b"),
    ]


class FakePipeline:
    def __init__(self, output) -> None:
        self.output = output
        self.calls: list[tuple[dict, dict[str, int]]] = []

    def __call__(self, audio_input: dict, **options):
        self.calls.append((audio_input, options))
        return self.output


def fake_audio_loader(audio_path: Path) -> dict[str, str]:
    return {"loaded_path": str(audio_path)}


def test_pyannote_provider_normalizes_annotation_output() -> None:
    pipeline = FakePipeline(FakeAnnotation())
    provider = PyannoteDiarizationProvider(
        auth_token="",
        model_name="test-model",
        pipeline=pipeline,
        audio_loader=fake_audio_loader,
    )

    result = provider.diarize(audio_path=Path("audio.wav"), speaker_count="2")

    assert pipeline.calls == [({"loaded_path": "audio.wav"}, {"num_speakers": 2})]
    assert [segment.speaker_label for segment in result.segments] == [
        "Speaker 1",
        "Speaker 2",
        "Speaker 1",
    ]
    assert [segment.start_ms for segment in result.segments] == [100, 1800, 3200]
    assert result.raw_payload["provider"] == "pyannote"
    assert result.raw_payload["model"] == "test-model"
    assert result.raw_payload["segments"][0]["raw_speaker_label"] == "SPEAKER_00"


def test_pyannote_provider_supports_community_output_shape() -> None:
    pipeline = FakePipeline(FakeCommunityOutput())
    provider = PyannoteDiarizationProvider(
        auth_token="",
        model_name="test-model",
        pipeline=pipeline,
        audio_loader=fake_audio_loader,
    )

    result = provider.diarize(audio_path=Path("audio.wav"), speaker_count="auto")

    assert pipeline.calls == [({"loaded_path": "audio.wav"}, {})]
    assert [segment.speaker_label for segment in result.segments] == [
        "Speaker 1",
        "Speaker 2",
    ]


def test_build_diarization_provider_defaults_to_disabled() -> None:
    provider = build_diarization_provider(
        Settings(DIARIZATION_PROVIDER="none", PYANNOTE_AUTH_TOKEN=""),
    )

    assert provider is None


def test_build_diarization_provider_requires_pyannote_token() -> None:
    provider = build_diarization_provider(
        Settings(DIARIZATION_PROVIDER="pyannote", PYANNOTE_AUTH_TOKEN=""),
    )

    assert provider is None


def test_build_diarization_provider_instantiates_pyannote(monkeypatch) -> None:
    captured: dict[str, str] = {}

    class FakeProvider:
        def __init__(self, *, auth_token: str, model_name: str, device: str) -> None:
            captured["auth_token"] = auth_token
            captured["model_name"] = model_name
            captured["device"] = device

    monkeypatch.setattr("salin_worker.tasks.PyannoteDiarizationProvider", FakeProvider)

    provider = build_diarization_provider(
        Settings(
            DIARIZATION_PROVIDER="pyannote",
            PYANNOTE_AUTH_TOKEN="hf_token",
            PYANNOTE_MODEL="pyannote/model",
            PYANNOTE_DEVICE="cpu",
        ),
    )

    assert provider is not None
    assert captured == {
        "auth_token": "hf_token",
        "model_name": "pyannote/model",
        "device": "cpu",
    }

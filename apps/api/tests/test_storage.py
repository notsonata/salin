from __future__ import annotations

from salin_api.storage.r2 import S3ObjectStorage


class FakePaginator:
    def paginate(self, **kwargs):
        assert kwargs == {"Bucket": "salin-test", "Prefix": "recordings/rec_1/"}
        return [
            {
                "Contents": [
                    {"Key": "recordings/rec_1/original/audio.mp3"},
                    {"Key": "recordings/rec_1/normalized/audio.wav"},
                ]
            },
            {"Contents": [{"Key": "recordings/rec_1/artifacts/groq-raw.json"}]},
        ]


class FakeS3Client:
    def __init__(self) -> None:
        self.delete_calls: list[dict] = []

    def get_paginator(self, name: str) -> FakePaginator:
        assert name == "list_objects_v2"
        return FakePaginator()

    def delete_objects(self, **kwargs) -> None:
        self.delete_calls.append(kwargs)


def test_s3_storage_deletes_all_objects_under_prefix() -> None:
    client = FakeS3Client()
    storage = object.__new__(S3ObjectStorage)
    storage.bucket_name = "salin-test"
    storage.client = client

    storage.delete_prefix("recordings/rec_1/")

    assert client.delete_calls == [
        {
            "Bucket": "salin-test",
            "Delete": {
                "Objects": [
                    {"Key": "recordings/rec_1/original/audio.mp3"},
                    {"Key": "recordings/rec_1/normalized/audio.wav"},
                ],
                "Quiet": True,
            },
        },
        {
            "Bucket": "salin-test",
            "Delete": {
                "Objects": [{"Key": "recordings/rec_1/artifacts/groq-raw.json"}],
                "Quiet": True,
            },
        },
    ]

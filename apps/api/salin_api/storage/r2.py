from __future__ import annotations

from pathlib import Path
from typing import Protocol

import boto3


class ObjectStorage(Protocol):
    def upload_bytes(self, key: str, payload: bytes, content_type: str) -> None: ...

    def upload_file(self, key: str, source_path: Path, content_type: str) -> None: ...

    def download_bytes(self, key: str) -> bytes: ...

    def download_file(self, key: str, destination_path: Path) -> None: ...

    def presign_get(self, key: str) -> str: ...

    def delete_prefix(self, prefix: str) -> None: ...


class S3ObjectStorage:
    def __init__(
        self,
        *,
        bucket_name: str,
        endpoint_url: str,
        access_key_id: str,
        secret_access_key: str,
        region_name: str,
    ) -> None:
        self.bucket_name = bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url or None,
            aws_access_key_id=access_key_id or None,
            aws_secret_access_key=secret_access_key or None,
            region_name=region_name or None,
        )

    def upload_bytes(self, key: str, payload: bytes, content_type: str) -> None:
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=payload,
            ContentType=content_type,
        )

    def upload_file(self, key: str, source_path: Path, content_type: str) -> None:
        self.client.upload_file(
            Filename=str(source_path),
            Bucket=self.bucket_name,
            Key=key,
            ExtraArgs={"ContentType": content_type},
        )

    def download_file(self, key: str, destination_path: Path) -> None:
        self.client.download_file(
            Bucket=self.bucket_name,
            Key=key,
            Filename=str(destination_path),
        )

    def download_bytes(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket_name, Key=key)
        return response["Body"].read()

    def presign_get(self, key: str) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=3600,
        )

    def delete_prefix(self, prefix: str) -> None:
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
            objects = [{"Key": item["Key"]} for item in page.get("Contents", [])]
            for start in range(0, len(objects), 1000):
                chunk = objects[start : start + 1000]
                if chunk:
                    self.client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={"Objects": chunk, "Quiet": True},
                    )

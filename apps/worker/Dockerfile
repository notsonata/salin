FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /workspace/pyproject.toml
COPY apps/api/pyproject.toml /workspace/apps/api/pyproject.toml
COPY apps/worker/pyproject.toml /workspace/apps/worker/pyproject.toml

RUN pip install --no-cache-dir uv

COPY apps/api /workspace/apps/api
COPY apps/worker /workspace/apps/worker

RUN cd /workspace/apps/api && uv pip install --system . \
  && cd /workspace/apps/worker && uv pip install --system .

WORKDIR /workspace/apps/worker
ENV PYTHONPATH=/workspace/apps/api:/workspace/apps/worker

CMD ["rq", "worker", "salin-recordings", "--url", "redis://redis:6379/0"]

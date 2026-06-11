FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /workspace/pyproject.toml
COPY apps/api/pyproject.toml /workspace/apps/api/pyproject.toml
COPY apps/api /workspace/apps/api

RUN pip install --no-cache-dir uv \
  && cd /workspace/apps/api \
  && uv pip install --system .

WORKDIR /workspace/apps/api

CMD ["uvicorn", "salin_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

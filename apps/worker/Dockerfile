FROM python:3.12-slim

ARG DENO_VERSION=2.3.0
ARG TARGETARCH

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl unzip \
  && arch="${TARGETARCH:-$(dpkg --print-architecture)}" \
  && case "${arch}" in \
    amd64) deno_arch="x86_64-unknown-linux-gnu" ;; \
    arm64) deno_arch="aarch64-unknown-linux-gnu" ;; \
    *) echo "Unsupported TARGETARCH: ${arch}" >&2; exit 1 ;; \
  esac \
  && curl -fsSL "https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-${deno_arch}.zip" -o /tmp/deno.zip \
  && unzip /tmp/deno.zip -d /usr/local/bin \
  && chmod +x /usr/local/bin/deno \
  && rm -f /tmp/deno.zip \
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

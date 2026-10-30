FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen

COPY . .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "exec .venv/bin/uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

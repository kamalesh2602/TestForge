FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen

COPY . .

CMD [".venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
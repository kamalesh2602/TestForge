import pytest
from fastapi.testclient import TestClient
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

from main import app, rate_limit_handler

client = TestClient(app)


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "TestForge API is running"}


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_cors_headers_present():
    resp = client.options(
        "/execute",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


@pytest.mark.anyio
async def test_rate_limit_handler_response():
    from unittest.mock import MagicMock
    # Build a mock request and RateLimitExceeded exception
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/execute",
        "headers": [],
    }
    mock_request = Request(scope)
    mock_limit = MagicMock(error_message=None)
    exc = RateLimitExceeded(mock_limit)
    response = await rate_limit_handler(mock_request, exc)
    assert response.status_code == 429
    import json
    data = json.loads(response.body.decode())
    assert data["error"] == "Rate limit exceeded"
    assert "Too many requests" in data["message"]


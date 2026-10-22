import ipaddress
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.datastructures import Headers

from main import app, get_client_ip
from models.schemas import MAX_CODE_LENGTH, MAX_STDIN_LENGTH, MAX_DESCRIPTION_LENGTH

client = TestClient(app)


# ==============================================================================
# 1. Security Headers Tests
# ==============================================================================

def test_security_headers_on_success():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in resp.headers.get("Permissions-Policy", "")
    assert "default-src 'none'" in resp.headers.get("Content-Security-Policy", "")


def test_security_headers_and_no_cache_on_execution_routes():
    with patch("main.executor.execute", return_value={"status": "completed", "output": "ok"}):
        resp = client.post(
            "/execute",
            json={"code": "print(1)", "language": "python", "stdin": ""},
        )
        assert resp.status_code == 200
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert "no-store" in resp.headers.get("Cache-Control", "")
        assert resp.headers.get("Pragma") == "no-cache"


def test_security_headers_on_error_response():
    # 422 Validation Error
    resp = client.post("/execute", json={"code": "", "language": "python"})
    assert resp.status_code == 422
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


# ==============================================================================
# 2. CORS Hardening Tests
# ==============================================================================

def test_cors_allowed_origin():
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
    allowed_methods = resp.headers.get("access-control-allow-methods", "")
    assert "POST" in allowed_methods
    assert "GET" in allowed_methods


def test_cors_disallowed_origin_rejected():
    resp = client.options(
        "/execute",
        headers={
            "Origin": "https://malicious-website.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    # Origin is not allowed; Access-Control-Allow-Origin header must NOT be returned
    assert "access-control-allow-origin" not in resp.headers


def test_cors_disallowed_origin_on_post():
    with patch("main.executor.execute", return_value={"status": "completed", "output": "ok"}):
        resp = client.post(
            "/execute",
            headers={"Origin": "https://attacker.example.org"},
            json={"code": "print(1)", "language": "python"},
        )
        # Even if processed, browser will block access because ACAO is absent
        assert "access-control-allow-origin" not in resp.headers


# ==============================================================================
# 3. Client IP Determination Behind Proxy
# ==============================================================================

def test_get_client_ip_direct_connection():
    mock_request = MagicMock(spec=Request)
    mock_request.client.host = "192.168.1.50"
    mock_request.headers = Headers({})

    with patch.dict("os.environ", {"RENDER": "false", "TRUST_PROXY": "false"}):
        ip = get_client_ip(mock_request)
        assert ip == "192.168.1.50"


def test_get_client_ip_behind_render_proxy_valid_ip():
    mock_request = MagicMock(spec=Request)
    mock_request.client.host = "10.0.0.1"
    mock_request.headers = Headers({"x-forwarded-for": "203.0.113.195, 10.0.0.1"})

    with patch.dict("os.environ", {"RENDER": "true"}):
        ip = get_client_ip(mock_request)
        assert ip == "203.0.113.195"


def test_get_client_ip_behind_proxy_with_ipv6():
    mock_request = MagicMock(spec=Request)
    mock_request.client.host = "10.0.0.1"
    mock_request.headers = Headers({"x-forwarded-for": "2001:db8::1"})

    with patch.dict("os.environ", {"RENDER": "true"}):
        ip = get_client_ip(mock_request)
        assert ip == "2001:db8::1"


def test_get_client_ip_spoofed_or_malformed_header_ignored():
    mock_request = MagicMock(spec=Request)
    mock_request.client.host = "198.51.100.1"
    # Malformed non-IP header
    mock_request.headers = Headers({"x-forwarded-for": "spoofed_string_injection"})

    with patch.dict("os.environ", {"RENDER": "true"}):
        ip = get_client_ip(mock_request)
        # Falls back to actual socket host rather than accepting arbitrary string
        assert ip == "198.51.100.1"


def test_get_client_ip_missing_client_fallback():
    mock_request = MagicMock(spec=Request)
    mock_request.client = None
    mock_request.headers = Headers({})

    with patch.dict("os.environ", {"RENDER": "false"}):
        ip = get_client_ip(mock_request)
        assert ip == "127.0.0.1"


# ==============================================================================
# 4. Request Validation and Resource Limits
# ==============================================================================

def test_code_exceeding_max_length_rejected():
    oversized_code = "a" * (MAX_CODE_LENGTH + 1)
    resp = client.post("/execute", json={"code": oversized_code, "language": "python"})
    assert resp.status_code == 422


def test_stdin_exceeding_max_length_rejected():
    oversized_stdin = "b" * (MAX_STDIN_LENGTH + 1)
    resp = client.post(
        "/execute",
        json={"code": "x = input()", "language": "python", "stdin": oversized_stdin},
    )
    assert resp.status_code == 422


def test_test_generation_count_bounds():
    # count < 1 rejected
    resp_low = client.post(
        "/generate-tests",
        json={"code": "x = 1", "language": "python", "count": 0},
    )
    assert resp_low.status_code == 422

    # count > 20 rejected
    resp_high = client.post(
        "/generate-tests",
        json={"code": "x = 1", "language": "python", "count": 21},
    )
    assert resp_high.status_code == 422


def test_test_generation_description_length_limit():
    oversized_desc = "x" * (MAX_DESCRIPTION_LENGTH + 1)
    resp = client.post(
        "/generate-tests",
        json={
            "code": "def foo(): pass",
            "language": "python",
            "count": 5,
            "description": oversized_desc,
        },
    )
    assert resp.status_code == 422


def test_execute_tests_max_count_enforced():
    # 21 test items exceeds max_length=20
    too_many_tests = [{"input": f"test {i}"} for i in range(21)]
    resp = client.post(
        "/run-tests",
        json={
            "code": "x = input()",
            "language": "python",
            "tests": too_many_tests,
        },
    )
    assert resp.status_code == 422


def test_run_tests_malformed_test_case_rejected():
    # Function mode requires 'arguments' array
    code = "def add(a, b): return a + b"
    resp = client.post(
        "/run-tests",
        json={
            "code": code,
            "language": "python",
            "tests": [{"not_arguments": "missing"}],
        },
    )
    assert resp.status_code == 400
    assert "arguments" in resp.json()["detail"]["message"]


# ==============================================================================
# 5. Error Handling and Information Disclosure
# ==============================================================================

def test_unhandled_exception_returns_clean_500_without_stack_trace():
    safe_client = TestClient(app, raise_server_exceptions=False)
    with patch("main.executor.execute", side_effect=ZeroDivisionError("Internal division failure")):
        resp = safe_client.post(
            "/execute",
            json={"code": "print(1)", "language": "python", "stdin": ""},
        )
        assert resp.status_code == 500
        data = resp.json()
        assert data["error"] == "Internal server error"
        assert data["message"] == "An unexpected error occurred. Please try again later."
        # Crucial: No Python traceback or stack trace in the response
        assert "ZeroDivisionError" not in resp.text
        assert "Traceback" not in resp.text
        # Security headers must be present on 500 as well
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"


def test_ai_unavailable_returns_friendly_message_without_api_keys():
    with patch("services.test_generator.generate_with_gemini", side_effect=Exception("Secret AI key AIzaSyFakeKey123 is invalid")):
        with patch("services.test_generator.generate_with_openrouter", side_effect=Exception("Bearer sk-or-v1-secretToken invalid")):
            resp = client.post(
                "/generate-tests",
                json={"code": "def foo(): pass", "language": "python", "count": 3},
            )
            assert resp.status_code == 503
            data = resp.json()
            assert data["detail"]["error"] == "AI service unavailable"
            assert data["detail"]["message"] == "AI testing is currently unavailable. Please try again later."
            assert "AIzaSy" not in resp.text
            assert "sk-or-v1" not in resp.text


# ==============================================================================
# 6. Rate Limiting Tests
# ==============================================================================

def test_rate_limiting_exceeded_returns_429_with_retry_after():
    from slowapi.errors import RateLimitExceeded
    from starlette.requests import Request
    import pytest

    @pytest.mark.anyio
    async def run_check():
        from main import rate_limit_handler
        mock_req = Request({"type": "http", "method": "POST", "path": "/execute", "headers": []})
        mock_limit = MagicMock(error_message=None)
        exc = RateLimitExceeded(mock_limit)
        response = await rate_limit_handler(mock_req, exc)
        assert response.status_code == 429
        assert response.headers.get("Retry-After") == "60"
        import json
        payload = json.loads(response.body.decode())
        assert payload["error"] == "Rate limit exceeded"
        assert "Too many requests" in payload["message"]

    import asyncio
    asyncio.run(run_check())

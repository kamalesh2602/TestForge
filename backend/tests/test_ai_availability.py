import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_generate_tests_ai_unavailable(monkeypatch):
    # Ensure GEMINI_API_KEY is not set or mock generate_tests to fail
    with patch("services.test_generator.generate_with_gemini", side_effect=Exception("API key invalid or missing")):
        with patch("services.test_generator.generate_with_openrouter", side_effect=Exception("OpenRouter error")):
            response = client.post(
                "/generate-tests",
                json={
                    "code": "def add(a, b):\n    return a + b",
                    "language": "python",
                    "count": 3,
                },
            )

    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["error"] == "AI service unavailable"
    assert data["detail"]["message"] == "AI testing is currently unavailable. Please try again later."
    # Ensure raw API error message / stack trace / API key is not exposed to frontend
    assert "API key" not in data["detail"]["message"]
    assert "OpenRouter" not in data["detail"]["message"]


def test_generate_tests_validation_error_unaffected():
    # Syntax error in user code should return 400 validation error, not 503 AI unavailable error
    response = client.post(
        "/generate-tests",
        json={
            "code": "def invalid_syntax(",
            "language": "python",
            "count": 3,
        },
    )

    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["valid"] is False
    assert data["detail"]["error"] == "SyntaxError"

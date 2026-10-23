import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_run_tests_program_mode_passed_and_failed():
    code = "n = int(input())\nprint(n * 2)"
    # Mock executor.execute to return different results for different inputs
    def mock_execute(code, stdin=""):
        val = int(stdin) * 2
        return {"status": "completed", "output": f"{val}\n"}

    with patch("main.executor.execute", side_effect=mock_execute):
        resp = client.post(
            "/run-tests",
            json={
                "code": code,
                "language": "python",
                "tests": [
                    {"input": "2", "expected_output": "4", "description": "doubles 2"},
                    {"input": "3", "expected_output": "10", "description": "deliberate mismatch"},
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["passed"] == 1
        assert data["results"][0]["status"] == "passed"
        assert data["results"][1]["status"] == "failed"


def test_run_tests_program_mode_timeout_and_error():
    code = "while True: pass"
    def mock_execute(code, stdin=""):
        if stdin == "timeout":
            return {"status": "timeout", "output": "", "error": "Execution timed out"}
        return {"status": "error", "output": "", "error": "Runtime crash"}

    with patch("main.executor.execute", side_effect=mock_execute):
        resp = client.post(
            "/run-tests",
            json={
                "code": code,
                "language": "python",
                "tests": [
                    {"input": "timeout", "expected_output": "anything"},
                    {"input": "error", "expected_output": "anything"},
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["results"][0]["status"] == "timeout"
        assert data["results"][1]["status"] == "error"
        assert data["passed"] == 0


def test_run_tests_program_mode_no_expected_output_marked_completed():
    code = "print('hello')"
    with patch("main.executor.execute") as mock_exec:
        mock_exec.return_value = {"status": "completed", "output": "hello\n"}
        resp = client.post(
            "/run-tests",
            json={
                "code": code,
                "language": "python",
                "tests": [
                    {"input": ""},
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["results"][0]["status"] == "completed"


def test_run_tests_function_mode_python():
    code = "def add(a, b):\n    return a + b"
    with patch("main.executor.execute") as mock_exec:
        mock_exec.return_value = {"status": "completed", "output": "5\n"}
        resp = client.post(
            "/run-tests",
            json={
                "code": code,
                "language": "python",
                "tests": [
                    {"arguments": [2, 3], "expected_output": "5", "description": "2+3"},
                ],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["passed"] == 1
        assert data["results"][0]["status"] == "passed"


def test_run_tests_function_mode_javascript():
    code = "function multiply(a, b) {\n    return a * b;\n}"
    with patch("main.executor.validate_javascript", return_value={"valid": True, "stderr": ""}):
        with patch("main.executor.execute_javascript_function") as mock_exec:
            mock_exec.return_value = {"status": "completed", "output": "12\n"}
            resp = client.post(
                "/run-tests",
                json={
                    "code": code,
                    "language": "javascript",
                    "tests": [
                        {"arguments": [3, 4], "expected_output": "12"},
                    ],
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["passed"] == 1
            assert data["results"][0]["status"] == "passed"


def test_run_tests_syntax_error_rejected():
    resp = client.post(
        "/run-tests",
        json={
            "code": "def broken_func(",
            "language": "python",
            "tests": [{"input": "1"}],
        },
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["detail"]["valid"] is False

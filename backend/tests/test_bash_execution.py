import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import httpx

from main import app
from models.schemas import ExecuteRequest
from services.judge0_executor import Judge0Executor, get_judge0_bash_language_id

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    app.state.limiter.reset()
    yield
    app.state.limiter.reset()


def test_execute_request_schema_supports_bash():
    req = ExecuteRequest(code='echo "Hello from TestForge!"', language="bash")
    assert req.language == "bash"
    assert req.stdin == ""


def test_judge0_executor_bash_language_id():
    executor = Judge0Executor()
    assert hasattr(executor, "bash_language_id")
    assert executor.bash_language_id == 46


def test_judge0_executor_bash_language_id_env_override(monkeypatch):
    monkeypatch.setenv("JUDGE0_BASH_LANGUAGE_ID", "999")
    executor = Judge0Executor()
    assert executor.bash_language_id == 999


def test_judge0_get_supported_bash_language_id_success():
    mock_languages = [
        {"id": 45, "name": "Assembly (NASM 2.14.02)"},
        {"id": 46, "name": "Bash (5.0.0)"},
        {"id": 47, "name": "Basic (FBC 1.07.1)"},
    ]
    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_client
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_languages
        mock_client.get.return_value = mock_resp

        lang_id = get_judge0_bash_language_id("https://ce.judge0.com")
        assert lang_id == 46


def test_judge0_get_supported_bash_language_id_not_found():
    mock_languages = [
        {"id": 71, "name": "Python (3.8.1)"},
    ]
    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_client
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_languages
        mock_client.get.return_value = mock_resp

        lang_id = get_judge0_bash_language_id("https://ce.judge0.com")
        assert lang_id is None


def test_judge0_get_supported_bash_language_id_network_error():
    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_client
        mock_client.get.side_effect = httpx.ConnectError("Connection refused")

        lang_id = get_judge0_bash_language_id("https://unreachable.judge0.com")
        assert lang_id is None


def test_judge0_execute_bash_echo_script():
    executor = Judge0Executor()
    code = '#!/usr/bin/env bash\n\necho "Hello from TestForge!"'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello from TestForge!\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_bash(code)
        assert res["status"] == "completed"
        assert res["output"] == "Hello from TestForge!\n"
        assert res["exit_code"] == 0
        assert mock_submit.call_count == 1
        assert mock_submit.call_args[1]["language_id"] == executor.bash_language_id
        assert mock_submit.call_args[1]["source_code"] == code


def test_judge0_execute_bash_variables_and_arithmetic():
    executor = Judge0Executor()
    code = 'A=15\nB=27\nSUM=$((A + B))\necho "Sum: $SUM"'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Sum: 42\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_bash(code)
        assert res["status"] == "completed"
        assert res["output"] == "Sum: 42\n"
        assert res["exit_code"] == 0


def test_judge0_execute_bash_conditionals_and_loops():
    executor = Judge0Executor()
    code = 'for i in 1 2 3 4; do\n  if [ $i -gt 2 ]; then\n    echo "Val: $i"\n  fi\ndone'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Val: 3\nVal: 4\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_bash(code)
        assert res["status"] == "completed"
        assert res["output"] == "Val: 3\nVal: 4\n"
        assert res["exit_code"] == 0


def test_judge0_execute_bash_with_stdin():
    executor = Judge0Executor()
    code = 'read -r line\necho "Received: $line"'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Received: TestForge User\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_bash(code, stdin="TestForge User")
        assert res["status"] == "completed"
        assert res["output"] == "Received: TestForge User\n"
        assert mock_submit.call_args[1]["stdin"] == "TestForge User"


def test_judge0_execute_bash_non_zero_exit_status():
    executor = Judge0Executor()
    code = 'echo "Starting..."\nexit 2'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error (NZEC)"},
            "stdout": "Starting...\n",
            "stderr": "",
            "exit_code": 2,
        }
        res = executor.execute_bash(code)
        assert res["status"] == "error"
        assert res["output"] == "Starting...\n"
        assert res["exit_code"] == 2


def test_judge0_execute_bash_syntax_error():
    executor = Judge0Executor()
    code = 'if [ 1 -eq 1 ]; then echo missing fi'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error (NZEC)"},
            "stdout": "",
            "stderr": "syntax error: unexpected end of file\n",
            "exit_code": 2,
        }
        res = executor.execute_bash(code)
        assert res["status"] == "error"
        assert "syntax error" in res["error"]
        assert res["exit_code"] == 2


def test_judge0_execute_bash_timeout():
    executor = Judge0Executor()
    code = 'while true; do sleep 1; done'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 5, "description": "Time Limit Exceeded"},
            "stdout": "",
            "stderr": "Execution timed out",
        }
        res = executor.execute_bash(code)
        assert res["status"] == "timeout"
        assert res["error"] == "Execution timed out"


def test_execute_endpoint_bash_routing():
    with patch("main.executor.execute_bash") as mock_exec_bash:
        mock_exec_bash.return_value = {
            "status": "completed",
            "output": "Hello from API\n",
            "exit_code": 0,
        }
        resp = client.post(
            "/execute",
            json={
                "code": 'echo "Hello from API"',
                "stdin": "test_input",
                "language": "bash",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"
        assert data["output"] == "Hello from API\n"
        mock_exec_bash.assert_called_once_with(
            code='echo "Hello from API"',
            stdin="test_input",
        )


def test_execute_endpoint_bash_timeout_response():
    with patch("main.executor.execute_bash") as mock_exec_bash:
        mock_exec_bash.return_value = {
            "status": "timeout",
            "output": "",
            "error": "Execution timed out",
        }
        resp = client.post(
            "/execute",
            json={
                "code": 'sleep 100',
                "language": "bash",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "timeout"
        assert data["error"] == "Execution timed out"


def test_generate_tests_endpoint_rejects_bash():
    resp = client.post(
        "/generate-tests",
        json={
            "code": 'echo "hi"',
            "language": "bash",
            "count": 3,
        },
    )
    # Pydantic schema validation rejects bash (pattern: python|java|javascript)
    assert resp.status_code == 422


def test_run_tests_endpoint_rejects_bash():
    resp = client.post(
        "/run-tests",
        json={
            "code": 'echo "hi"',
            "language": "bash",
            "tests": [{"input": "test"}],
        },
    )
    assert resp.status_code == 422


def test_docker_executor_bash_graceful_error():
    from services.docker_executor import DockerExecutor
    docker_exec = DockerExecutor()
    res = docker_exec.execute_bash('echo "hello"')
    assert res["status"] == "error"
    assert "Bash execution is only supported via Judge0 executor" in res["error"]

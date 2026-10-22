import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from models.schemas import ExecuteRequest
from services.judge0_executor import Judge0Executor
from services.docker_executor import DockerExecutor

client = TestClient(app)


def test_execute_request_defaults_to_python():
    req = ExecuteRequest(code="print('hi')")
    assert req.language == "python"
    assert req.stdin == ""


def test_judge0_execute_python_hello_world():
    executor = Judge0Executor()
    code = 'print("Hello from TestForge Python!")'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello from TestForge Python!\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute(code)
        assert res["status"] == "completed"
        assert res["output"] == "Hello from TestForge Python!\n"
        assert res["exit_code"] == 0
        assert mock_submit.call_args[1]["language_id"] == 71


def test_judge0_execute_python_with_stdin():
    executor = Judge0Executor()
    code = 'name = input()\nprint(f"Hello, {name}!")'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello, Alice!\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute(code, stdin="Alice")
        assert res["status"] == "completed"
        assert res["output"] == "Hello, Alice!\n"
        assert mock_submit.call_args[1]["stdin"] == "Alice"


def test_judge0_execute_python_runtime_error():
    executor = Judge0Executor()
    code = 'print(1 / 0)'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error (NZEC)"},
            "stdout": "",
            "stderr": "ZeroDivisionError: division by zero\n",
            "exit_code": 1,
        }
        res = executor.execute(code)
        assert res["status"] == "error"
        assert "ZeroDivisionError" in res["error"]


def test_judge0_execute_python_timeout():
    executor = Judge0Executor()
    code = 'while True: pass'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 5, "description": "Time Limit Exceeded"},
            "stdout": "",
            "stderr": "Time limit exceeded",
        }
        res = executor.execute(code)
        assert res["status"] == "timeout"
        assert "Time limit exceeded" in res["error"]


def test_docker_executor_python_success():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Hello from Docker Python!\n"

        executor = DockerExecutor()
        res = executor.execute("print('Hello from Docker Python!')", stdin="test")

        assert res["status"] == "completed"
        assert res["output"] == "Hello from Docker Python!\n"
        assert res["exit_code"] == 0

        create_args = mock_client.containers.create.call_args
        assert create_args.kwargs["image"] == "python:3.12-slim"
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_executor_python_timeout():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.side_effect = Exception("Container wait timeout")

        executor = DockerExecutor()
        res = executor.execute("while True: pass")

        assert res["status"] == "timeout"
        assert "Execution timed out" in res["error"]
        mock_container.kill.assert_called_once()
        mock_container.remove.assert_called_once_with(force=True)


def test_api_execute_python_endpoint():
    with patch("main.executor.execute") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "42\n",
            "exit_code": 0,
        }
        resp = client.post(
            "/execute",
            json={
                "code": "print(42)",
                "language": "python",
                "stdin": "",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["output"] == "42\n"
        mock_exec.assert_called_once_with(code="print(42)", stdin="")

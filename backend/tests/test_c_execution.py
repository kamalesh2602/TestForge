import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app
from models.schemas import ExecuteRequest
from services.judge0_executor import Judge0Executor

client = TestClient(app)


def test_execute_request_schema_supports_c():
    req = ExecuteRequest(code='#include <stdio.h>\nint main() { return 0; }', language="c")
    assert req.language == "c"
    assert req.stdin == ""


def test_judge0_executor_c_language_id():
    executor = Judge0Executor()
    assert hasattr(executor, "c_language_id")
    assert executor.c_language_id in (103, 50, 48)


def test_judge0_execute_c_hello_world():
    executor = Judge0Executor()
    code = '#include <stdio.h>\nint main() { printf("Hello from TestForge!\\n"); return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello from TestForge!\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_c(code)
        assert res["status"] == "completed"
        assert res["output"] == "Hello from TestForge!\n"
        assert res["exit_code"] == 0
        assert mock_submit.call_count == 1
        assert mock_submit.call_args[1]["language_id"] == executor.c_language_id
        assert mock_submit.call_args[1]["source_code"] == code


def test_judge0_execute_c_arithmetic():
    executor = Judge0Executor()
    code = '#include <stdio.h>\nint main() { int a = 5, b = 7; printf("Sum: %d\\n", a + b); return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Sum: 12\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_c(code)
        assert res["status"] == "completed"
        assert res["output"] == "Sum: 12\n"


def test_judge0_execute_c_with_stdin():
    executor = Judge0Executor()
    code = '#include <stdio.h>\nint main() { int n; scanf("%d", &n); printf("Input: %d\\n", n * 2); return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Input: 42\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_c(code, stdin="21")
        assert res["status"] == "completed"
        assert res["output"] == "Input: 42\n"
        assert mock_submit.call_args[1]["stdin"] == "21"


def test_judge0_execute_c_compilation_error():
    executor = Judge0Executor()
    code = '#include <stdio.h>\nint main() { syntax error }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 6, "description": "Compilation Error"},
            "stdout": "",
            "stderr": "",
            "compile_output": "main.c:2:14: error: unknown type name 'syntax'\n",
            "exit_code": 1,
        }
        res = executor.execute_c(code)
        assert res["status"] == "error"
        assert "error: unknown type name 'syntax'" in res["error"]


def test_judge0_execute_c_runtime_error():
    executor = Judge0Executor()
    code = '#include <stdio.h>\nint main() { int *p = NULL; *p = 1; return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error (SIGSEGV)"},
            "stdout": "",
            "stderr": "Segmentation fault (core dumped)\n",
            "exit_code": 139,
        }
        res = executor.execute_c(code)
        assert res["status"] == "error"
        assert "Segmentation fault" in res["error"]


def test_judge0_execute_c_timeout():
    executor = Judge0Executor()
    code = '#include <stdio.h>\nint main() { while(1); return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 5, "description": "Time Limit Exceeded"},
            "stdout": "",
            "stderr": "Time limit exceeded",
        }
        res = executor.execute_c(code)
        assert res["status"] == "timeout"
        assert "Time limit exceeded" in res["error"]


def test_judge0_execute_c_multiple_functions():
    executor = Judge0Executor()
    code = """#include <stdio.h>
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }
int main() {
    printf("Add: %d, Mul: %d\\n", add(3, 4), mul(3, 4));
    return 0;
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Add: 7, Mul: 12\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_c(code)
        assert res["status"] == "completed"
        assert res["output"] == "Add: 7, Mul: 12\n"


def test_api_execute_c_endpoint():
    with patch("main.executor.execute_c") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "Hello from TestForge!\n",
            "exit_code": 0,
        }
        resp = client.post(
            "/execute",
            json={
                "code": '#include <stdio.h>\nint main() { printf("Hello from TestForge!\\n"); return 0; }',
                "language": "c",
                "stdin": "",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["output"] == "Hello from TestForge!\n"
        assert mock_exec.call_count == 1


def test_api_execute_c_empty_code_rejected():
    resp = client.post(
        "/execute",
        json={
            "code": "",
            "language": "c",
            "stdin": "",
        },
    )
    assert resp.status_code == 422


def test_api_execute_unsupported_language_rejected():
    resp = client.post(
        "/execute",
        json={
            "code": '#include <stdio.h>\nint main() { return 0; }',
            "language": "ruby",
            "stdin": "",
        },
    )
    assert resp.status_code == 422


def test_docker_executor_execute_c_success():
    from unittest.mock import MagicMock
    from services.docker_executor import DockerExecutor
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Hello from Docker C!\n"

        executor = DockerExecutor()
        res = executor.execute_c('#include <stdio.h>\nint main() { printf("Hello\\n"); return 0; }', stdin="123")

        assert res["status"] == "completed"
        assert res["output"] == "Hello from Docker C!\n"
        assert res["exit_code"] == 0

        # Verify container configuration
        create_args = mock_client.containers.create.call_args
        assert create_args.kwargs["image"] == "gcc:latest"
        assert "gcc -O2 /app/main.c -o /app/main" in create_args.kwargs["command"][2]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_executor_execute_c_timeout():
    from unittest.mock import MagicMock
    from services.docker_executor import DockerExecutor
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.side_effect = Exception("Timed out")

        executor = DockerExecutor()
        res = executor.execute_c('#include <stdio.h>\nint main() { while(1); }')

        assert res["status"] == "timeout"
        assert "Execution timed out" in res["error"]
        mock_container.kill.assert_called_once()
        mock_container.remove.assert_called_once_with(force=True)


def test_judge0_polling_termination_immediate_on_success():
    from unittest.mock import MagicMock
    executor = Judge0Executor()
    with patch("httpx.Client") as mock_client_cls:
        mock_http = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_http
        # Submission response
        post_resp = MagicMock()
        post_resp.json.return_value = {"token": "test-c-token"}
        mock_http.post.return_value = post_resp

        # Poll response: Accepted immediately on first poll
        get_resp = MagicMock()
        get_resp.json.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Success\n",
            "stderr": "",
            "exit_code": 0,
        }
        mock_http.get.return_value = get_resp

        with patch("time.sleep") as mock_sleep:
            res = executor.execute_c("int main() { return 0; }")

            assert res["status"] == "completed"
            assert res["output"] == "Success\n"
            # Crucial: verify polling terminated immediately after 1 iteration, not 30
            assert mock_http.get.call_count == 1
            assert mock_sleep.call_count == 1


def test_judge0_polling_termination_on_compilation_error():
    from unittest.mock import MagicMock
    executor = Judge0Executor()
    with patch("httpx.Client") as mock_client_cls:
        mock_http = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_http
        post_resp = MagicMock()
        post_resp.json.return_value = {"token": "test-c-err-token"}
        mock_http.post.return_value = post_resp

        get_resp = MagicMock()
        get_resp.json.return_value = {
            "status": {"id": 6, "description": "Compilation Error"},
            "stdout": "",
            "stderr": "",
            "compile_output": "error: expected ';'\n",
            "exit_code": 1,
        }
        mock_http.get.return_value = get_resp

        with patch("time.sleep"):
            res = executor.execute_c("bad code")
            assert res["status"] == "error"
            assert "expected ';'" in res["error"]
            assert mock_http.get.call_count == 1


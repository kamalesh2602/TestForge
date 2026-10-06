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

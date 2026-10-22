import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app
from models.schemas import ExecuteRequest
from services.judge0_executor import Judge0Executor

client = TestClient(app)


def test_execute_request_schema_supports_cpp():
    req1 = ExecuteRequest(code='#include <iostream>\nint main() { return 0; }', language="cpp")
    assert req1.language == "cpp"
    assert req1.stdin == ""

    req2 = ExecuteRequest(code='#include <iostream>\nint main() { return 0; }', language="c++")
    assert req2.language == "c++"
    assert req2.stdin == ""


def test_judge0_executor_cpp_language_id():
    executor = Judge0Executor()
    assert hasattr(executor, "cpp_language_id")
    assert executor.cpp_language_id in (105, 54, 53, 52)


def test_judge0_execute_cpp_hello_world():
    executor = Judge0Executor()
    code = '#include <iostream>\nint main() { std::cout << "Hello from TestForge!" << std::endl; return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello from TestForge!\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "completed"
        assert res["output"] == "Hello from TestForge!\n"
        assert res["exit_code"] == 0
        assert mock_submit.call_count == 1
        assert mock_submit.call_args[1]["language_id"] == executor.cpp_language_id
        assert mock_submit.call_args[1]["source_code"] == code


def test_judge0_execute_cpp_arithmetic():
    executor = Judge0Executor()
    code = '#include <iostream>\nint main() { int a = 15, b = 27; std::cout << "Sum: " << (a + b) << std::endl; return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Sum: 42\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "completed"
        assert res["output"] == "Sum: 42\n"


def test_judge0_execute_cpp_with_stdin():
    executor = Judge0Executor()
    code = '#include <iostream>\nint main() { int n; std::cin >> n; std::cout << "Input: " << (n * 3) << std::endl; return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Input: 30\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_cpp(code, stdin="10")
        assert res["status"] == "completed"
        assert res["output"] == "Input: 30\n"
        assert mock_submit.call_args[1]["stdin"] == "10"


def test_judge0_execute_cpp_compilation_error():
    executor = Judge0Executor()
    code = '#include <iostream>\nint main() { invalid_cpp_code; return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 6, "description": "Compilation Error"},
            "stdout": "",
            "stderr": "",
            "compile_output": "main.cpp:2:14: error: 'invalid_cpp_code' was not declared in this scope\n",
            "exit_code": 1,
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "error"
        assert "error: 'invalid_cpp_code' was not declared in this scope" in res["error"]


def test_judge0_execute_cpp_runtime_error():
    executor = Judge0Executor()
    code = '#include <iostream>\nint main() { int *p = nullptr; *p = 42; return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error (SIGSEGV)"},
            "stdout": "",
            "stderr": "Segmentation fault (core dumped)\n",
            "exit_code": 139,
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "error"
        assert "Segmentation fault" in res["error"]


def test_judge0_execute_cpp_timeout():
    executor = Judge0Executor()
    code = '#include <iostream>\nint main() { while(true); return 0; }'
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 5, "description": "Time Limit Exceeded"},
            "stdout": "",
            "stderr": "Time limit exceeded",
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "timeout"
        assert "Time limit exceeded" in res["error"]


def test_judge0_execute_cpp_vector_algorithm():
    executor = Judge0Executor()
    code = """#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {5, 2, 8, 1};
    std::sort(nums.begin(), nums.end());
    for (int n : nums) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    return 0;
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "1 2 5 8 \n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "completed"
        assert res["output"] == "1 2 5 8 \n"


def test_judge0_execute_cpp_classes():
    executor = Judge0Executor()
    code = """#include <iostream>

class Calculator {
public:
    int multiply(int a, int b) { return a * b; }
};

int main() {
    Calculator calc;
    std::cout << "Product: " << calc.multiply(6, 7) << std::endl;
    return 0;
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Product: 42\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_cpp(code)
        assert res["status"] == "completed"
        assert res["output"] == "Product: 42\n"


def test_api_execute_cpp_endpoint():
    with patch("main.executor.execute_cpp") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "Hello from C++!\n",
            "exit_code": 0,
        }
        resp = client.post(
            "/execute",
            json={
                "code": '#include <iostream>\nint main() { std::cout << "Hello from C++!\\n"; return 0; }',
                "language": "cpp",
                "stdin": "",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["output"] == "Hello from C++!\n"
        assert mock_exec.call_count == 1


def test_api_execute_cpp_alias_endpoint():
    with patch("main.executor.execute_cpp") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "Hello from C++ alias!\n",
            "exit_code": 0,
        }
        resp = client.post(
            "/execute",
            json={
                "code": '#include <iostream>\nint main() { std::cout << "Hello from C++ alias!\\n"; return 0; }',
                "language": "c++",
                "stdin": "",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["output"] == "Hello from C++ alias!\n"
        assert mock_exec.call_count == 1


def test_api_execute_cpp_empty_code_rejected():
    resp = client.post(
        "/execute",
        json={
            "code": "",
            "language": "cpp",
            "stdin": "",
        },
    )
    assert resp.status_code == 422


def test_docker_executor_execute_cpp_success():
    from unittest.mock import MagicMock
    from services.docker_executor import DockerExecutor
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Hello from Docker C++!\n"

        executor = DockerExecutor()
        res = executor.execute_cpp('#include <iostream>\nint main() { std::cout << "Hello" << std::endl; return 0; }', stdin="456")

        assert res["status"] == "completed"
        assert res["output"] == "Hello from Docker C++!\n"
        assert res["exit_code"] == 0

        # Verify container configuration
        create_args = mock_client.containers.create.call_args
        assert create_args.kwargs["image"] == "gcc:latest"
        assert "g++ -O2 /app/main.cpp -o /app/main" in create_args.kwargs["command"][2]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_executor_execute_cpp_timeout():
    from unittest.mock import MagicMock
    from services.docker_executor import DockerExecutor
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.side_effect = Exception("Timed out")

        executor = DockerExecutor()
        res = executor.execute_cpp('#include <iostream>\nint main() { while(true); }')

        assert res["status"] == "timeout"
        assert "Execution timed out" in res["error"]
        mock_container.kill.assert_called_once()
        mock_container.remove.assert_called_once_with(force=True)


def test_judge0_polling_cpp_termination_immediate_on_success():
    from unittest.mock import MagicMock
    executor = Judge0Executor()
    with patch("httpx.Client") as mock_client_cls:
        mock_http = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_http
        post_resp = MagicMock()
        post_resp.json.return_value = {"token": "test-cpp-token"}
        mock_http.post.return_value = post_resp

        get_resp = MagicMock()
        get_resp.json.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Cpp Success\n",
            "stderr": "",
            "exit_code": 0,
        }
        mock_http.get.return_value = get_resp

        with patch("time.sleep") as mock_sleep:
            res = executor.execute_cpp("int main() { return 0; }")

            assert res["status"] == "completed"
            assert res["output"] == "Cpp Success\n"
            assert mock_http.get.call_count == 1
            assert mock_sleep.call_count == 1


def test_judge0_polling_cpp_termination_on_runtime_error():
    from unittest.mock import MagicMock
    executor = Judge0Executor()
    with patch("httpx.Client") as mock_client_cls:
        mock_http = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_http
        post_resp = MagicMock()
        post_resp.json.return_value = {"token": "test-cpp-rt-token"}
        mock_http.post.return_value = post_resp

        get_resp = MagicMock()
        get_resp.json.return_value = {
            "status": {"id": 11, "description": "Runtime Error"},
            "stdout": "",
            "stderr": "SIGSEGV\n",
            "exit_code": 139,
        }
        mock_http.get.return_value = get_resp

        with patch("time.sleep"):
            res = executor.execute_cpp("crash code")
            assert res["status"] == "error"
            assert "SIGSEGV" in res["error"]
            assert mock_http.get.call_count == 1


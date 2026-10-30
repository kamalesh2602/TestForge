import httpx
import pytest
from unittest.mock import MagicMock, patch

from services.judge0_executor import Judge0Executor, JAVASCRIPT_INPUT_HELPER


def test_judge0_executor_init_defaults(monkeypatch):
    monkeypatch.delenv("JUDGE0_API_URL", raising=False)
    monkeypatch.delenv("JUDGE0_JAVASCRIPT_LANGUAGE_ID", raising=False)
    monkeypatch.delenv("JUDGE0_C_LANGUAGE_ID", raising=False)
    monkeypatch.delenv("JUDGE0_CPP_LANGUAGE_ID", raising=False)

    executor = Judge0Executor()
    assert executor.api_url == "https://ce.judge0.com"
    assert executor.javascript_language_id == 102
    assert executor.c_language_id == 103
    assert executor.cpp_language_id == 105


def test_judge0_executor_init_custom_and_fallback(monkeypatch):
    monkeypatch.setenv("JUDGE0_API_URL", "https://custom.judge0.org///")
    monkeypatch.setenv("JUDGE0_JAVASCRIPT_LANGUAGE_ID", "63")
    monkeypatch.setenv("JUDGE0_C_LANGUAGE_ID", "50")
    monkeypatch.setenv("JUDGE0_CPP_LANGUAGE_ID", "54")

    executor = Judge0Executor()
    assert executor.api_url == "https://custom.judge0.org"
    assert executor.javascript_language_id == 63
    assert executor.c_language_id == 50
    assert executor.cpp_language_id == 54

    monkeypatch.setenv("JUDGE0_API_URL", "your_judge0_url")
    executor_fallback = Judge0Executor()
    assert executor_fallback.api_url == "https://ce.judge0.com"


def test_judge0_submit_success():
    executor = Judge0Executor()

    mock_client = MagicMock()
    mock_post_resp = MagicMock()
    mock_post_resp.json.return_value = {"token": "test-token-123"}
    mock_client.post.return_value = mock_post_resp

    mock_get_resp = MagicMock()
    mock_get_resp.json.return_value = {
        "status": {"id": 3, "description": "Accepted"},
        "stdout": "Success output\n",
        "stderr": "",
        "exit_code": 0,
    }
    mock_client.get.return_value = mock_get_resp

    with patch("httpx.Client") as mock_httpx, patch("time.sleep"):
        mock_httpx.return_value.__enter__.return_value = mock_client

        res = executor._submit("print('test')", 71, stdin="input_data", timeout=5)

        assert res["status"]["id"] == 3
        assert res["stdout"] == "Success output\n"
        mock_client.post.assert_called_once()
        call_json = mock_client.post.call_args[1]["json"]
        assert call_json["language_id"] == 71
        assert call_json["stdin"] == "input_data"
        assert call_json["cpu_time_limit"] == 5


def test_judge0_submit_polling_timeout():
    executor = Judge0Executor()

    mock_client = MagicMock()
    mock_post_resp = MagicMock()
    mock_post_resp.json.return_value = {"token": "timeout-token"}
    mock_client.post.return_value = mock_post_resp

    # Simulates in-queue status 1 continuously
    mock_get_resp = MagicMock()
    mock_get_resp.json.return_value = {
        "status": {"id": 1, "description": "In Queue"},
        "stdout": None,
        "stderr": None,
    }
    mock_client.get.return_value = mock_get_resp

    with patch("httpx.Client") as mock_httpx, patch("time.sleep"):
        mock_httpx.return_value.__enter__.return_value = mock_client

        res = executor._submit("while True: pass", 71)

        assert res["status"]["id"] == 5
        assert res["status"]["description"] == "Time Limit Exceeded"
        assert "Execution timed out" in res["stderr"]
        assert mock_client.get.call_count == 30


def test_judge0_submit_http_error():
    executor = Judge0Executor()

    mock_client = MagicMock()
    mock_post_resp = MagicMock()
    mock_post_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "500 Internal Server Error",
        request=MagicMock(),
        response=MagicMock(status_code=500),
    )
    mock_client.post.return_value = mock_post_resp

    with patch("httpx.Client") as mock_httpx:
        mock_httpx.return_value.__enter__.return_value = mock_client

        with pytest.raises(httpx.HTTPStatusError):
            executor._submit("print(1)", 71)


def test_judge0_format_result_cases():
    executor = Judge0Executor()

    # Timeout case (status 5)
    timeout_res = executor._format_result({
        "status": {"id": 5},
        "stdout": "",
        "stderr": "Time limit exceeded",
    })
    assert timeout_res == {
        "status": "timeout",
        "output": "",
        "error": "Time limit exceeded",
    }

    # Error case with compile output precedence
    error_res = executor._format_result({
        "status": {"id": 6},
        "stdout": "",
        "stderr": "",
        "compile_output": "error: cannot find symbol",
        "exit_code": 1,
    })
    assert error_res == {
        "status": "error",
        "output": "",
        "error": "error: cannot find symbol",
        "exit_code": 1,
    }

    # Completed case
    completed_res = executor._format_result({
        "status": {"id": 3},
        "stdout": "All tests passed\n",
        "stderr": "",
        "exit_code": 0,
    })
    assert completed_res == {
        "status": "completed",
        "output": "All tests passed\n",
        "exit_code": 0,
    }


def test_judge0_execute_python():
    executor = Judge0Executor()
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "Hello Python\n",
            "exit_code": 0,
        }
        res = executor.execute("print('Hello Python')")
        assert res["status"] == "completed"
        assert res["output"] == "Hello Python\n"
        assert mock_submit.call_args[1]["language_id"] == 71


def test_judge0_execute_java_with_main_class():
    executor = Judge0Executor()
    code = "public class Main { public static void main(String[] args) { System.out.println(\"Hi\"); } }"
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "Hi\n",
            "exit_code": 0,
        }
        res = executor.execute_java(code)
        assert res["status"] == "completed"
        submitted_code = mock_submit.call_args[1]["source_code"]
        assert "public class Main" in submitted_code


def test_judge0_execute_java_with_custom_class():
    executor = Judge0Executor()
    code = "public class Solution { public static void main(String[] args) { System.out.println(\"Solved\"); } }"
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "Solved\n",
            "exit_code": 0,
        }
        res = executor.execute_java(code)
        assert res["status"] == "completed"
        submitted_code = mock_submit.call_args[1]["source_code"]
        assert "class Solution" in submitted_code
        assert "class Main" in submitted_code
        assert "Solution.main(args);" in submitted_code


def test_judge0_execute_java_no_main_method():
    executor = Judge0Executor()
    code = "public class Solution { int x = 10; }"
    res = executor.execute_java(code)
    assert res["status"] == "error"
    assert "No executable main method found" in res["error"]
    assert res["exit_code"] == 1


def test_judge0_execute_java_function():
    executor = Judge0Executor()
    with patch.object(executor, "execute_java") as mock_exec:
        mock_exec.return_value = {"status": "completed", "output": "15\n"}
        res = executor.execute_java_function("class A {}", timeout=7)
        assert res["status"] == "completed"
        mock_exec.assert_called_once_with(code="class A {}", timeout=7)


def test_judge0_execute_javascript():
    executor = Judge0Executor()
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "JS output\n",
            "exit_code": 0,
        }
        res = executor.execute_javascript("console.log('JS output');")
        assert res["status"] == "completed"
        submitted_code = mock_submit.call_args[1]["source_code"]
        assert JAVASCRIPT_INPUT_HELPER in submitted_code
        assert "console.log('JS output');" in submitted_code
        assert mock_submit.call_args[1]["language_id"] == executor.javascript_language_id


def test_judge0_execute_javascript_function():
    executor = Judge0Executor()
    with patch.object(executor, "execute_javascript") as mock_exec:
        mock_exec.return_value = {"status": "completed", "output": "Function output"}
        res = executor.execute_javascript_function("function test() {}", timeout=8)
        assert res["status"] == "completed"
        mock_exec.assert_called_once_with(code="function test() {}", timeout=8)


def test_judge0_execute_c():
    executor = Judge0Executor()
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "C output\n",
            "exit_code": 0,
        }
        res = executor.execute_c('#include <stdio.h>\nint main() { printf("C output\\n"); }')
        assert res["status"] == "completed"
        assert mock_submit.call_args[1]["language_id"] == executor.c_language_id


def test_judge0_execute_cpp():
    executor = Judge0Executor()
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "CPP output\n",
            "exit_code": 0,
        }
        res = executor.execute_cpp('#include <iostream>\nint main() { std::cout << "CPP output\\n"; }')
        assert res["status"] == "completed"
        assert mock_submit.call_args[1]["language_id"] == executor.cpp_language_id


def test_judge0_validate_java():
    executor = Judge0Executor()
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "",
            "stderr": "",
            "exit_code": 0,
        }
        valid_res = executor.validate_java("class Solution {}")
        assert valid_res["valid"] is True

        mock_submit.return_value = {
            "status": {"id": 6},
            "stdout": "",
            "compile_output": "Syntax error",
            "exit_code": 1,
        }
        invalid_res = executor.validate_java("class Solution { invalid")
        assert invalid_res["valid"] is False
        assert invalid_res["stderr"] == "Syntax error"


def test_judge0_validate_javascript():
    executor = Judge0Executor()
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3},
            "stdout": "",
            "stderr": "",
            "exit_code": 0,
        }
        valid_res = executor.validate_javascript("const x = 10;")
        assert valid_res["valid"] is True

        mock_submit.return_value = {
            "status": {"id": 11},
            "stdout": "",
            "stderr": "SyntaxError: Unexpected identifier",
            "exit_code": 1,
        }
        invalid_res = executor.validate_javascript("const const")
        assert invalid_res["valid"] is False
        assert "SyntaxError" in invalid_res["stderr"]


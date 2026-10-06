import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from services.judge0_executor import Judge0Executor, JAVASCRIPT_INPUT_HELPER
from services.harness_generator import create_function_harness

client = TestClient(app)


def test_judge0_executor_uses_modern_javascript_language_id():
    executor = Judge0Executor()
    assert executor.javascript_language_id == 102
    assert executor.javascript_language_id != 63


def test_judge0_execute_javascript_obj_property():
    executor = Judge0Executor()
    code = """
const user = { profile: { name: "Kamalesh" } };
console.log(user?.profile?.name);
"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Kamalesh\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript(code)
        assert res["status"] == "completed"
        assert res["output"] == "Kamalesh\n"
        assert mock_submit.call_count == 1
        call_kwargs = mock_submit.call_args[1]
        assert call_kwargs["language_id"] == 102
        assert "console.log(user?.profile?.name);" in call_kwargs["source_code"]


def test_judge0_execute_javascript_nested_optional_chaining():
    executor = Judge0Executor()
    code = """
const company = { dept: { team: { lead: { name: "Kamalesh" } } } };
console.log(company?.dept?.team?.lead?.name);
console.log(company?.dept?.nonExistent?.lead?.name);
"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Kamalesh\nundefined\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript(code)
        assert res["status"] == "completed"
        assert "Kamalesh" in res["output"]
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_execute_javascript_optional_method_call():
    executor = Judge0Executor()
    code = """
const service = {
    calculate: (x) => x * 2
};
console.log(service?.calculate?.(21));
console.log(service?.nonExistent?.());
"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "42\nundefined\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript(code)
        assert res["status"] == "completed"
        assert res["output"] == "42\nundefined\n"
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_execute_javascript_optional_array_access():
    executor = Judge0Executor()
    code = """
const items = [{ id: 101 }, { id: 202 }];
console.log(items?.[0]?.id);
console.log(items?.[5]?.id);
"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "101\nundefined\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript(code)
        assert res["status"] == "completed"
        assert res["output"] == "101\nundefined\n"
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_execute_javascript_null_undefined_safe():
    executor = Judge0Executor()
    code = """
const a = null;
const b = undefined;
console.log(a?.name);
console.log(b?.[0]);
console.log(a?.method?.());
console.log(b?.nested?.property);
"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "undefined\nundefined\nundefined\nundefined\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript(code)
        assert res["status"] == "completed"
        assert res["output"] == "undefined\nundefined\nundefined\nundefined\n"
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_execute_javascript_regular_syntax_preserved():
    executor = Judge0Executor()
    code = """
function add(a, b) {
    return a + b;
}
console.log(add(10, 20));
"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "30\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript(code)
        assert res["status"] == "completed"
        assert res["output"] == "30\n"
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_execute_javascript_function_harness():
    executor = Judge0Executor()
    fn_code = """
function getUserCity(user) {
    return user?.address?.city;
}
"""
    harness = create_function_harness(
        fn_code,
        "getUserCity",
        [{"address": {"city": "Chennai"}}],
        language="javascript",
    )
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Chennai\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_javascript_function(harness)
        assert res["status"] == "completed"
        assert res["output"] == "Chennai\n"
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_validate_javascript_optional_chaining():
    executor = Judge0Executor()
    code = "const user = null; console.log(user?.name);"
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.validate_javascript(code)
        assert res["valid"] is True
        assert mock_submit.call_args[1]["language_id"] == 102


def test_judge0_validate_javascript_syntax_error():
    executor = Judge0Executor()
    code = "function ( {"
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error (NZEC)"},
            "stdout": "",
            "stderr": "SyntaxError: Unexpected token",
            "exit_code": 1,
        }
        res = executor.validate_javascript(code)
        assert res["valid"] is False
        assert "SyntaxError" in res["stderr"]


def test_execute_endpoint_javascript_optional_chaining():
    code = """
const user = { profile: { name: "Kamalesh" } };
console.log(user.profile?.name);
"""
    with patch("main.executor.execute_javascript") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "Kamalesh\n",
            "exit_code": 0,
        }
        response = client.post(
            "/execute",
            json={
                "code": code,
                "language": "javascript",
                "stdin": "",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["output"] == "Kamalesh\n"
        mock_exec.assert_called_once_with(code=code, stdin="")

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# --------------------------------------------------------------------------
# /analyze Endpoint Tests
# --------------------------------------------------------------------------

def test_analyze_python_function():
    response = client.post(
        "/analyze",
        json={
            "code": "def multiply(x, y):\n    return x * y",
            "language": "python",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["code_type"] == "function"
    assert any(f["name"] == "multiply" for f in data["functions"])


def test_analyze_python_program():
    response = client.post(
        "/analyze",
        json={
            "code": "a = int(input())\nprint(a * 2)",
            "language": "python",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["code_type"] == "program"


def test_analyze_python_syntax_error():
    response = client.post(
        "/analyze",
        json={
            "code": "def broken_func(:",
            "language": "python",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["error"] == "SyntaxError"


def test_analyze_java_valid():
    with patch("main.executor.validate_java") as mock_validate:
        mock_validate.return_value = {"valid": True, "stdout": "", "stderr": ""}
        response = client.post(
            "/analyze",
            json={
                "code": "public class Main { public static void main(String[] args) {} }",
                "language": "java",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True


def test_analyze_javascript_valid():
    with patch("main.executor.validate_javascript") as mock_validate:
        mock_validate.return_value = {"valid": True, "stdout": "", "stderr": ""}
        response = client.post(
            "/analyze",
            json={
                "code": "function add(a, b) { return a + b; }",
                "language": "javascript",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True


def test_analyze_invalid_language_returns_422():
    response = client.post(
        "/analyze",
        json={
            "code": "echo 'Hello'",
            "language": "bash",
        },
    )
    assert response.status_code == 422


def test_analyze_empty_code_returns_422():
    response = client.post(
        "/analyze",
        json={
            "code": "",
            "language": "python",
        },
    )
    assert response.status_code == 422


# --------------------------------------------------------------------------
# /execute Endpoint Tests
# --------------------------------------------------------------------------

def test_execute_python_success():
    with patch("main.executor.execute") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "42\n",
            "exit_code": 0,
        }
        response = client.post(
            "/execute",
            json={
                "code": "print(42)",
                "language": "python",
                "stdin": "",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["output"] == "42\n"
        mock_exec.assert_called_once_with(code="print(42)", stdin="")


def test_execute_java_success():
    with patch("main.executor.execute_java") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "Java Hi\n",
            "exit_code": 0,
        }
        response = client.post(
            "/execute",
            json={
                "code": "public class Main { public static void main(String[] args) {} }",
                "language": "java",
                "stdin": "data",
            },
        )
        assert response.status_code == 200
        assert response.json()["output"] == "Java Hi\n"
        mock_exec.assert_called_once()


def test_execute_javascript_success():
    with patch("main.executor.execute_javascript") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "JS Hi\n",
            "exit_code": 0,
        }
        response = client.post(
            "/execute",
            json={
                "code": "console.log('JS Hi');",
                "language": "javascript",
            },
        )
        assert response.status_code == 200
        assert response.json()["output"] == "JS Hi\n"
        mock_exec.assert_called_once()


def test_execute_c_success():
    with patch("main.executor.execute_c") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "C Hi\n",
            "exit_code": 0,
        }
        response = client.post(
            "/execute",
            json={
                "code": 'int main() { printf("C Hi\\n"); }',
                "language": "c",
            },
        )
        assert response.status_code == 200
        assert response.json()["output"] == "C Hi\n"
        mock_exec.assert_called_once()


def test_execute_cpp_success():
    with patch("main.executor.execute_cpp") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "CPP Hi\n",
            "exit_code": 0,
        }
        response = client.post(
            "/execute",
            json={
                "code": 'int main() { std::cout << "CPP Hi\\n"; }',
                "language": "cpp",
            },
        )
        assert response.status_code == 200
        assert response.json()["output"] == "CPP Hi\n"
        mock_exec.assert_called_once()


def test_execute_invalid_language_returns_422():
    response = client.post(
        "/execute",
        json={
            "code": "echo hi",
            "language": "bash",
        },
    )
    assert response.status_code == 422


def test_execute_empty_code_returns_422():
    response = client.post(
        "/execute",
        json={
            "code": "",
            "language": "python",
        },
    )
    assert response.status_code == 422


# --------------------------------------------------------------------------
# /generate-tests Endpoint Tests
# --------------------------------------------------------------------------

def test_generate_tests_function_success():
    mock_tests = [
        {"arguments": [2, 3], "expected_output": "5", "description": "Addition"}
    ]
    with patch("main.generate_tests", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_tests
        response = client.post(
            "/generate-tests",
            json={
                "code": "def add(a, b): return a + b",
                "language": "python",
                "count": 1,
                "description": "Basic arithmetic",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code_type"] == "function"
        assert len(data["tests"]) == 1
        assert data["tests"][0]["expected_output"] == "5"


def test_generate_tests_program_success():
    mock_tests = [
        {"input": "Kamalesh", "expected_output": "Hello Kamalesh", "description": "Greeting"}
    ]
    with patch("main.generate_tests", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_tests
        response = client.post(
            "/generate-tests",
            json={
                "code": "name = input()\nprint(f'Hello {name}')",
                "language": "python",
                "count": 1,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code_type"] == "program"
        assert len(data["tests"]) == 1


def test_generate_tests_count_out_of_bounds_returns_422():
    response = client.post(
        "/generate-tests",
        json={
            "code": "def f(): pass",
            "language": "python",
            "count": 25,  # Max is 20
        },
    )
    assert response.status_code == 422

    response_low = client.post(
        "/generate-tests",
        json={
            "code": "def f(): pass",
            "language": "python",
            "count": 0,  # Min is 1
        },
    )
    assert response_low.status_code == 422

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from services.judge0_executor import Judge0Executor
from services.docker_executor import DockerExecutor

client = TestClient(app)


def test_judge0_execute_java_main_class():
    executor = Judge0Executor()
    code = """public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Main");
    }
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello from Main\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_java(code)
        assert res["status"] == "completed"
        assert res["output"] == "Hello from Main\n"
        assert mock_submit.call_args[1]["language_id"] == 62


def test_judge0_execute_java_arbitrary_class_rewriting():
    executor = Judge0Executor()
    code = """public class MyCustomSolution {
    public static void main(String[] args) {
        System.out.println("Hello from Custom Solution");
    }
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "Hello from Custom Solution\n",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.execute_java(code)
        assert res["status"] == "completed"
        assert res["output"] == "Hello from Custom Solution\n"
        submitted_code = mock_submit.call_args[1]["source_code"]
        # Public class was converted to package-private class
        assert "class MyCustomSolution" in submitted_code
        # Main class wrapper was appended to dispatch to MyCustomSolution.main
        assert "class Main {" in submitted_code
        assert "MyCustomSolution.main(args);" in submitted_code


def test_judge0_execute_java_no_main_method():
    executor = Judge0Executor()
    code = """public class Helper {
    public int calculate(int x) {
        return x * 2;
    }
}"""
    res = executor.execute_java(code)
    assert res["status"] == "error"
    assert "No executable main method found" in res["error"]
    assert res["exit_code"] == 1


def test_judge0_execute_java_compilation_error():
    executor = Judge0Executor()
    code = """public class Main {
    public static void main(String[] args) {
        invalid java code;
    }
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 6, "description": "Compilation Error"},
            "stdout": "",
            "stderr": "",
            "compile_output": "Main.java:3: error: not a statement\n",
            "exit_code": 1,
        }
        res = executor.execute_java(code)
        assert res["status"] == "error"
        assert "not a statement" in res["error"]


def test_judge0_execute_java_runtime_error():
    executor = Judge0Executor()
    code = """public class Main {
    public static void main(String[] args) {
        throw new RuntimeException("Custom Java Exception");
    }
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 11, "description": "Runtime Error"},
            "stdout": "",
            "stderr": "Exception in thread \"main\" java.lang.RuntimeException: Custom Java Exception\n",
            "exit_code": 1,
        }
        res = executor.execute_java(code)
        assert res["status"] == "error"
        assert "Custom Java Exception" in res["error"]


def test_judge0_validate_java_success():
    executor = Judge0Executor()
    code = """public class Solution {
    public static int add(int a, int b) { return a + b; }
}"""
    with patch.object(executor, "_submit") as mock_submit:
        mock_submit.return_value = {
            "status": {"id": 3, "description": "Accepted"},
            "stdout": "",
            "stderr": "",
            "exit_code": 0,
        }
        res = executor.validate_java(code)
        assert res["valid"] is True


def test_docker_executor_java_success():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container

        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Hello from Docker Java!\n"

        executor = DockerExecutor()
        code = """public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Docker Java!");
    }
}"""
        res = executor.execute_java(code, stdin="input")
        assert res["status"] == "completed"
        assert res["output"] == "Hello from Docker Java!\n"

        create_args = mock_client.containers.create.call_args
        assert create_args.kwargs["image"] == "eclipse-temurin:21-jdk"
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_executor_java_no_main_method():
    with patch("docker.from_env"):
        executor = DockerExecutor()
        res = executor.execute_java("public class Empty {}")
        assert res["status"] == "error"
        assert "No executable main method found" in res["error"]


def test_api_execute_java_endpoint():
    with patch("main.executor.execute_java") as mock_exec:
        mock_exec.return_value = {
            "status": "completed",
            "output": "Java executed successfully\n",
            "exit_code": 0,
        }
        resp = client.post(
            "/execute",
            json={
                "code": "public class Main { public static void main(String[] args) {} }",
                "language": "java",
                "stdin": "123",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["output"] == "Java executed successfully\n"
        mock_exec.assert_called_once()

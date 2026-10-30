import io
import tarfile
from unittest.mock import MagicMock, patch

from services.docker_executor import DockerExecutor


def test_docker_create_container_resource_limits():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        executor = DockerExecutor()

        executor._create_container(
            image="test-image:latest",
            command=["sh", "-c", "echo 1"],
        )

        mock_client.containers.create.assert_called_once_with(
            image="test-image:latest",
            command=["sh", "-c", "echo 1"],
            detach=True,
            mem_limit="128m",
            nano_cpus=500_000_000,
            network_disabled=True,
            working_dir="/app",
        )


def test_docker_create_archive():
    files = {
        "main.py": b"print('hello')",
        "input.txt": b"test input\n",
    }
    tar_stream = DockerExecutor._create_archive(files)
    assert isinstance(tar_stream, io.BytesIO)
    tar_stream.seek(0)

    with tarfile.open(fileobj=tar_stream, mode="r") as tar:
        names = tar.getnames()
        assert "main.py" in names
        assert "input.txt" in names
        f1 = tar.extractfile("main.py")
        assert f1.read() == b"print('hello')"
        f2 = tar.extractfile("input.txt")
        assert f2.read() == b"test input\n"


def test_docker_wait_for_result_success():
    mock_container = MagicMock()
    mock_container.wait.return_value = {"StatusCode": 0}
    mock_container.logs.return_value = b"All tests passed\n"

    result = DockerExecutor._wait_for_result(mock_container, timeout=5)
    assert result == {
        "status": "completed",
        "output": "All tests passed\n",
        "exit_code": 0,
    }
    mock_container.wait.assert_called_once_with(timeout=5)


def test_docker_wait_for_result_nonzero_exit():
    mock_container = MagicMock()
    mock_container.wait.return_value = {"StatusCode": 1}
    mock_container.logs.return_value = b"Runtime error: division by zero\n"

    result = DockerExecutor._wait_for_result(mock_container, timeout=5)
    assert result == {
        "status": "error",
        "output": "Runtime error: division by zero\n",
        "exit_code": 1,
    }


def test_docker_wait_for_result_timeout():
    mock_container = MagicMock()
    mock_container.wait.side_effect = Exception("Timed out")

    result = DockerExecutor._wait_for_result(mock_container, timeout=5)
    assert result == {
        "status": "timeout",
        "output": "",
        "error": "Execution timed out",
    }
    mock_container.kill.assert_called_once()


def test_docker_execute_python_lifecycle():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Python Output\n"

        executor = DockerExecutor()
        res = executor.execute("print('Python Output')", stdin="42")

        assert res["status"] == "completed"
        assert res["output"] == "Python Output\n"
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "python:3.12-slim"
        assert "< /app/input.txt" in create_args["command"][2]
        mock_container.start.assert_called_once()
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_execute_c_lifecycle():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"C Output\n"

        executor = DockerExecutor()
        res = executor.execute_c('#include <stdio.h>\nint main() { printf("C Output\\n"); }')

        assert res["status"] == "completed"
        assert res["output"] == "C Output\n"
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "gcc:latest"
        assert "gcc -O2 /app/main.c -o /app/main" in create_args["command"][2]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_execute_cpp_lifecycle():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"CPP Output\n"

        executor = DockerExecutor()
        res = executor.execute_cpp('#include <iostream>\nint main() { std::cout << "CPP Output\\n"; }')

        assert res["status"] == "completed"
        assert res["output"] == "CPP Output\n"
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "gcc:latest"
        assert "g++ -O2 /app/main.cpp -o /app/main" in create_args["command"][2]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_execute_javascript_lifecycle():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"JS Output\n"

        executor = DockerExecutor()
        res = executor.execute_javascript("console.log('JS Output');")

        assert res["status"] == "completed"
        assert res["output"] == "JS Output\n"
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "node:20-slim"
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_execute_javascript_function():
    with patch("docker.from_env"):
        executor = DockerExecutor()
        with patch.object(executor, "execute_javascript") as mock_exec:
            mock_exec.return_value = {"status": "completed", "output": "100\n"}
            res = executor.execute_javascript_function("function foo() { return 100; }")
            assert res["status"] == "completed"
            mock_exec.assert_called_once()


def test_docker_execute_java_with_custom_class():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Custom Java Output\n"

        executor = DockerExecutor()
        code = "public class Solution { public static void main(String[] args) { System.out.println(\"Custom Java Output\"); } }"
        res = executor.execute_java(code)

        assert res["status"] == "completed"
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "eclipse-temurin:21-jdk"
        assert "javac /app/Solution.java" in create_args["command"][2]
        assert "java -cp /app Solution" in create_args["command"][2]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_execute_java_no_main():
    with patch("docker.from_env") as mock_docker:
        executor = DockerExecutor()
        res = executor.execute_java("public class NoMain { int a = 5; }")
        assert res["status"] == "error"
        assert "No executable main method found" in res["error"]
        assert res["exit_code"] == 1
        mock_docker.return_value.containers.create.assert_not_called()


def test_docker_execute_java_function():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b"Java function output\n"

        executor = DockerExecutor()
        res = executor.execute_java_function("public class Solution { public int add(int a, int b) { return a+b; } }")
        assert res["status"] == "completed"
        assert res["output"] == "Java function output\n"
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "eclipse-temurin:21-jdk"
        assert "TestForgeRunner" in create_args["command"][2]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_validate_java():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b""

        executor = DockerExecutor()
        res = executor.validate_java("public class Main { public static void main(String[] args) {} }")
        assert res["valid"] is True
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_validate_javascript():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b""

        executor = DockerExecutor()
        res = executor.validate_javascript("const a = 1;")
        assert res["valid"] is True
        create_args = mock_client.containers.create.call_args.kwargs
        assert create_args["image"] == "node:20-slim"
        assert create_args["command"] == ["node", "--check", "/app/main.js"]
        mock_container.remove.assert_called_once_with(force=True)


def test_docker_cleanup_on_start_failure():
    with patch("docker.from_env") as mock_docker:
        mock_client = mock_docker.return_value
        mock_container = MagicMock()
        mock_client.containers.create.return_value = mock_container
        mock_container.start.side_effect = RuntimeError("Failed to start container")

        executor = DockerExecutor()
        try:
            executor.execute("print('fail')")
        except RuntimeError:
            pass

        mock_container.remove.assert_called_once_with(force=True)

import pytest
from unittest.mock import patch

from services.executor_factory import get_executor
from services.docker_executor import DockerExecutor
from services.judge0_executor import Judge0Executor


def test_get_executor_default(monkeypatch):
    monkeypatch.delenv("EXECUTOR", raising=False)
    with patch("docker.from_env"):
        executor = get_executor()
        assert isinstance(executor, DockerExecutor)


def test_get_executor_docker(monkeypatch):
    monkeypatch.setenv("EXECUTOR", "docker")
    with patch("docker.from_env"):
        executor = get_executor()
        assert isinstance(executor, DockerExecutor)


def test_get_executor_judge0(monkeypatch):
    monkeypatch.setenv("EXECUTOR", "judge0")
    executor = get_executor()
    assert isinstance(executor, Judge0Executor)


def test_get_executor_unsupported(monkeypatch):
    monkeypatch.setenv("EXECUTOR", "unsupported_runtime")
    with pytest.raises(ValueError, match="Unsupported executor: unsupported_runtime"):
        get_executor()


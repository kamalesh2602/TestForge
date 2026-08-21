import os

from services.docker_executor import DockerExecutor
from services.judge0_executor import Judge0Executor


def get_executor():
    executor_type = os.getenv(
        "EXECUTOR",
        "docker",
    )

    if executor_type == "docker":
        return DockerExecutor()

    if executor_type == "judge0":
        return Judge0Executor()

    raise ValueError(
        f"Unsupported executor: {executor_type}"
    )
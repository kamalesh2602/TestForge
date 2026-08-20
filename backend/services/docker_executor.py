import io
import tarfile

import docker

from services.executor import Executor


class DockerExecutor(Executor):

    def __init__(self):
        self.client = docker.from_env()

    def _create_container(
        self,
        image: str,
        command: list[str],
    ):
        return self.client.containers.create(
            image=image,
            command=command,
            detach=True,
            mem_limit="128m",
            nano_cpus=500_000_000,
            network_disabled=True,
            working_dir="/app",
        )

    def execute(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        container = None

        try:
            container = self._create_container(
                image="python:3.12-slim",
                command=[
                    "sh",
                    "-c",
                    "python /app/main.py < /app/input.txt",
                ],
            )

            tar_stream = self._create_archive(
                {
                    "main.py": code.encode(),
                    "input.txt": stdin.encode(),
                }
            )

            container.put_archive(
                "/app",
                tar_stream,
            )

            container.start()

            return self._wait_for_result(
                container,
                timeout,
            )

        finally:
            if container:
                container.remove(force=True)

    def validate_java(
        self,
        code: str,
    ) -> dict:

        container = None

        try:
            container = self._create_container(
                image="eclipse-temurin:21-jdk",
                command=[
                    "javac",
                    "/app/Main.java",
                ],
            )

            tar_stream = self._create_archive(
                {
                    "Main.java": code.encode(),
                }
            )

            container.put_archive(
                "/app",
                tar_stream,
            )

            container.start()

            result = container.wait(
                timeout=10,
            )

            stdout = container.logs(
                stdout=True,
                stderr=False,
            ).decode(
                "utf-8",
                errors="replace",
            )

            stderr = container.logs(
                stdout=False,
                stderr=True,
            ).decode(
                "utf-8",
                errors="replace",
            )

            return {
                "valid": result["StatusCode"] == 0,
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": result["StatusCode"],
            }

        except Exception as e:
            return {
                "valid": False,
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
            }

        finally:
            if container:
                container.remove(force=True)

    def execute_java(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        container = None

        try:
            container = self._create_container(
                image="eclipse-temurin:21-jdk",
                command=[
                    "sh",
                    "-c",
                    (
                        "javac /app/Main.java && "
                        "java -cp /app Main "
                        "< /app/input.txt"
                    ),
                ],
            )

            tar_stream = self._create_archive(
                {
                    "Main.java": code.encode(),
                    "input.txt": stdin.encode(),
                }
            )

            container.put_archive(
                "/app",
                tar_stream,
            )

            container.start()

            return self._wait_for_result(
                container,
                timeout,
            )

        finally:
            if container:
                container.remove(force=True)

    def execute_java_function(
        self,
        code: str,
        timeout: int = 5,
    ) -> dict:

        container = None

        try:
            container = self._create_container(
                image="eclipse-temurin:21-jdk",
                command=[
                    "sh",
                    "-c",
                    (
                        "javac /app/Main.java && "
                        "java -cp /app TestForgeRunner"
                    ),
                ],
            )

            tar_stream = self._create_archive(
                {
                    "Main.java": code.encode(),
                }
            )

            container.put_archive(
                "/app",
                tar_stream,
            )

            container.start()

            return self._wait_for_result(
                container,
                timeout,
            )

        finally:
            if container:
                container.remove(force=True)

    @staticmethod
    def _create_archive(
        files: dict[str, bytes],
    ) -> io.BytesIO:

        tar_stream = io.BytesIO()

        with tarfile.open(
            fileobj=tar_stream,
            mode="w",
        ) as tar:

            for filename, data in files.items():

                info = tarfile.TarInfo(filename)
                info.size = len(data)

                tar.addfile(
                    info,
                    io.BytesIO(data),
                )

        tar_stream.seek(0)

        return tar_stream

    @staticmethod
    def _wait_for_result(
        container,
        timeout: int,
    ) -> dict:

        try:
            result = container.wait(
                timeout=timeout,
            )

        except Exception:
            container.kill()

            return {
                "status": "timeout",
                "output": "",
                "error": "Execution timed out",
            }

        output = container.logs().decode(
            "utf-8",
            errors="replace",
        )

        return {
            "status": (
                "completed"
                if result["StatusCode"] == 0
                else "error"
            ),
            "output": output,
            "exit_code": result["StatusCode"],
        }
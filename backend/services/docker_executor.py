import io
import tarfile

import docker

from services.executor import Executor


class DockerExecutor(Executor):

    def __init__(self):
        self.client = docker.from_env()

    def execute(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        container = None

        try:
            container = self.client.containers.create(
                image="python:3.12-slim",
                command=[
                    "sh",
                    "-c",
                    "python /app/main.py < /app/input.txt",
                ],
                detach=True,
                mem_limit="128m",
                nano_cpus=500_000_000,
                network_disabled=True,
                working_dir="/app",
            )

            code_data = code.encode()
            input_data = stdin.encode()

            tar_stream = io.BytesIO()

            with tarfile.open(
                fileobj=tar_stream,
                mode="w",
            ) as tar:

                code_info = tarfile.TarInfo("main.py")
                code_info.size = len(code_data)
                tar.addfile(
                    code_info,
                    io.BytesIO(code_data),
                )

                input_info = tarfile.TarInfo("input.txt")
                input_info.size = len(input_data)
                tar.addfile(
                    input_info,
                    io.BytesIO(input_data),
                )

            tar_stream.seek(0)

            container.put_archive(
                "/app",
                tar_stream,
            )

            container.start()

            try:
                result = container.wait(timeout=timeout)

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

        finally:
            if container:
                container.remove(force=True)
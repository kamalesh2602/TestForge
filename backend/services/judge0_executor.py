import os
import time

import httpx

from services.executor import Executor


class Judge0Executor(Executor):

    def __init__(self):
        self.api_url = os.getenv(
            "JUDGE0_API_URL",
            "https://ce.judge0.com",
        )

    def _submit(
        self,
        source_code: str,
        language_id: int,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        payload = {
            "source_code": source_code,
            "language_id": language_id,
            "stdin": stdin,
            "cpu_time_limit": timeout,
        }

        with httpx.Client(timeout=15) as client:

            response = client.post(
                f"{self.api_url}/submissions",
                params={
                    "base64_encoded": "false",
                    "wait": "false",
                },
                json=payload,
            )

            response.raise_for_status()

            token = response.json()["token"]

            for _ in range(30):

                time.sleep(1)

                result = client.get(
                    f"{self.api_url}/submissions/{token}",
                    params={
                        "base64_encoded": "false",
                    },
                )

                result.raise_for_status()

                data = result.json()

                status_id = data["status"]["id"]

                # 1 = In Queue
                # 2 = Processing
                if status_id not in (1, 2):
                    return data

        return {
            "status": {
                "id": 5,
                "description": "Time Limit Exceeded",
            },
            "stdout": "",
            "stderr": "Execution timed out",
        }

    def _format_result(self, result: dict) -> dict:

        status_id = result["status"]["id"]

        output = result.get("stdout") or ""
        error = result.get("stderr") or result.get("compile_output") or ""

        if status_id == 5:
            return {
                "status": "timeout",
                "output": output,
                "error": error,
            }

        if status_id != 3:
            return {
                "status": "error",
                "output": output,
                "error": error,
                "exit_code": result.get("exit_code"),
            }

        return {
            "status": "completed",
            "output": output,
            "exit_code": result.get("exit_code", 0),
        }

    def execute(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        result = self._submit(
            source_code=code,
            language_id=71,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    def execute_java(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        result = self._submit(
            source_code=code,
            language_id=62,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    def execute_java_function(
        self,
        code: str,
        timeout: int = 5,
    ) -> dict:

        return self.execute_java(
            code=code,
            timeout=timeout,
        )

    def validate_java(
        self,
        code: str,
    ) -> dict:

        result = self._submit(
            source_code=code,
            language_id=62,
            timeout=10,
        )

        status_id = result["status"]["id"]

        return {
            "valid": status_id == 3,
            "stdout": result.get("stdout") or "",
            "stderr": (
                result.get("stderr")
                or result.get("compile_output")
                or ""
            ),
            "exit_code": result.get("exit_code"),
        }
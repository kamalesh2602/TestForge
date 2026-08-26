import os
import time

import httpx

from services.executor import Executor
from services.java_utils import find_java_main_class, find_java_primary_class
import re


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

        main_class = find_java_main_class(code)
        if not main_class:
            return {
                "status": "error",
                "output": "",
                "error": "No executable main method found. Add public static void main(String[] args) to run this Java program.",
                "exit_code": 1,
            }

        source_code = code
        # Convert any 'public class Name' (where Name != Main) to 'class Name'
        # so javac Main.java in Judge0 compiles without filename mismatch errors.
        source_code = re.sub(
            r'\bpublic\s+class\s+([A-Za-z_]\w*)',
            lambda m: m.group(0) if m.group(1) == "Main" else f'class {m.group(1)}',
            source_code,
        )

        if main_class != "Main":
            source_code += f"\n\nclass Main {{\n    public static void main(String[] args) {{\n        {main_class}.main(args);\n    }}\n}}\n"

        result = self._submit(
            source_code=source_code,
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

        main_class = find_java_main_class(code) or find_java_primary_class(code)
        source_code = code
        if main_class != "Main":
            source_code = re.sub(
                rf'\bpublic\s+class\s+{re.escape(main_class)}\b',
                f'class {main_class}',
                source_code,
            )
            if find_java_main_class(code):
                source_code += f"\n\nclass Main {{\n    public static void main(String[] args) {{\n        {main_class}.main(args);\n    }}\n}}\n"

        result = self._submit(
            source_code=source_code,
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
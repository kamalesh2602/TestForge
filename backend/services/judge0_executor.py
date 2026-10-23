import base64
import json
import os
import time

import httpx

from services.executor import Executor
from services.java_utils import find_java_main_class, find_java_primary_class
import re


JAVASCRIPT_INPUT_HELPER = """
let __testforgeInputLines = [];
let __testforgeInputIndex = 0;
try {
    const raw = require('fs').readFileSync(0, 'utf8');
    __testforgeInputLines = raw.split(/\\r?\\n/);
} catch (e) {}
function input() {
    if (__testforgeInputIndex < __testforgeInputLines.length) {
        return __testforgeInputLines[__testforgeInputIndex++];
    }
    return '';
}
"""



def get_judge0_bash_language_id(api_url: str | None = None) -> int | None:
    """
    Queries the Judge0 /languages endpoint to verify and discover
    the Bash language ID available on the configured instance.
    """
    url = (api_url or os.getenv("JUDGE0_API_URL", "https://ce.judge0.com")).rstrip("/")
    if not url or url == "your_judge0_url":
        url = "https://ce.judge0.com"
    try:
        with httpx.Client(timeout=5) as client:
            resp = client.get(f"{url}/languages")
            if resp.status_code == 200:
                languages = resp.json()
                for item in languages:
                    name = item.get("name", "").lower()
                    if "bash" in name:
                        return item.get("id")
    except Exception:
        pass
    return None


def get_judge0_go_language_id(api_url: str | None = None) -> int | None:
    """
    Queries the Judge0 /languages endpoint to verify and discover
    the Go language ID available on the configured instance.
    """
    url = (api_url or os.getenv("JUDGE0_API_URL", "https://ce.judge0.com")).rstrip("/")
    if not url or url == "your_judge0_url":
        url = "https://ce.judge0.com"
    try:
        with httpx.Client(timeout=5) as client:
            resp = client.get(f"{url}/languages")
            if resp.status_code == 200:
                languages = resp.json()
                for item in languages:
                    name = item.get("name", "").strip()
                    if re.match(r"^(go|golang)\b", name, re.IGNORECASE):
                        return item.get("id")
    except Exception:
        pass
    return None


class Judge0Executor(Executor):

    def __init__(self):
        api_url = os.getenv(
            "JUDGE0_API_URL",
            "https://ce.judge0.com",
        )
        if not api_url or api_url == "your_judge0_url":
            api_url = "https://ce.judge0.com"
        self.api_url = api_url.rstrip("/")
        self.javascript_language_id = int(
            os.getenv("JUDGE0_JAVASCRIPT_LANGUAGE_ID", "102")
        )
        self.c_language_id = int(
            os.getenv("JUDGE0_C_LANGUAGE_ID", "103")
        )
        self.cpp_language_id = int(
            os.getenv("JUDGE0_CPP_LANGUAGE_ID", "105")
        )
        self._bash_language_id = (
            int(os.getenv("JUDGE0_BASH_LANGUAGE_ID"))
            if os.getenv("JUDGE0_BASH_LANGUAGE_ID")
            else (46 if self.api_url == "https://ce.judge0.com" else None)
        )
        self._go_language_id = (
            int(os.getenv("JUDGE0_GO_LANGUAGE_ID"))
            if os.getenv("JUDGE0_GO_LANGUAGE_ID")
            else (60 if self.api_url == "https://ce.judge0.com" else None)
        )

    @staticmethod
    def _safe_b64_decode(val: str | None) -> str:
        if not val:
            return ""
        try:
            raw = base64.b64decode(val.encode("ascii"), validate=True)
            return raw.decode("utf-8")
        except Exception:
            return val

    def _submit(
        self,
        source_code: str,
        language_id: int,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        payload = {
            "source_code": base64.b64encode(source_code.encode("utf-8")).decode("ascii"),
            "language_id": language_id,
            "stdin": base64.b64encode(stdin.encode("utf-8")).decode("ascii") if stdin else "",
            "cpu_time_limit": timeout,
        }

        with httpx.Client(timeout=15) as client:

            response = client.post(
                f"{self.api_url}/submissions",
                params={
                    "base64_encoded": "true",
                    "wait": "false",
                },
                json=payload,
            )

            response.raise_for_status()

            token = response.json()["token"]

            poll_delays = [0.25, 0.5, 0.75] + [1.0] * 27
            for delay in poll_delays:

                time.sleep(delay)

                result = client.get(
                    f"{self.api_url}/submissions/{token}",
                    params={
                        "base64_encoded": "true",
                    },
                )

                result.raise_for_status()

                data = result.json()

                status_id = data["status"]["id"]

                # 1 = In Queue
                # 2 = Processing
                if status_id not in (1, 2):
                    for field in ("stdout", "stderr", "compile_output", "message"):
                        if field in data and data[field]:
                            data[field] = self._safe_b64_decode(data[field])
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

    def execute_javascript(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        result = self._submit(
            source_code=JAVASCRIPT_INPUT_HELPER + code,
            language_id=self.javascript_language_id,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    def execute_javascript_function(
        self,
        code: str,
        timeout: int = 5,
    ) -> dict:
        return self.execute_javascript(code=code, timeout=timeout)

    def execute_c(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        result = self._submit(
            source_code=code,
            language_id=self.c_language_id,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    def execute_cpp(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        result = self._submit(
            source_code=code,
            language_id=self.cpp_language_id,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    @property
    def bash_language_id(self) -> int | None:
        env_id = os.getenv("JUDGE0_BASH_LANGUAGE_ID")
        if env_id:
            try:
                return int(env_id)
            except ValueError:
                pass
        if self._bash_language_id is None:
            if self.api_url == "https://ce.judge0.com":
                self._bash_language_id = 46
            else:
                self._bash_language_id = get_judge0_bash_language_id(self.api_url)
        return self._bash_language_id

    @bash_language_id.setter
    def bash_language_id(self, value: int | None):
        self._bash_language_id = value

    def execute_bash(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        lang_id = self.bash_language_id
        if not lang_id:
            return {
                "status": "error",
                "output": "",
                "error": "The configured Judge0 instance does not provide a suitable Bash runtime.",
                "exit_code": 1,
            }

        result = self._submit(
            source_code=code,
            language_id=lang_id,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    @classmethod
    def get_supported_bash_language_id(cls, api_url: str | None = None) -> int | None:
        return get_judge0_bash_language_id(api_url)

    @property
    def go_language_id(self) -> int | None:
        env_id = os.getenv("JUDGE0_GO_LANGUAGE_ID")
        if env_id:
            try:
                return int(env_id)
            except ValueError:
                pass
        if self._go_language_id is None:
            if self.api_url == "https://ce.judge0.com":
                self._go_language_id = 60
            else:
                self._go_language_id = get_judge0_go_language_id(self.api_url)
        return self._go_language_id

    @go_language_id.setter
    def go_language_id(self, value: int | None):
        self._go_language_id = value

    def execute_go(
        self,
        code: str,
        stdin: str = "",
        timeout: int = 5,
    ) -> dict:

        lang_id = self.go_language_id
        if not lang_id:
            return {
                "status": "error",
                "output": "",
                "error": "Go is not supported on the configured Judge0 instance.",
                "exit_code": 1,
            }

        result = self._submit(
            source_code=code,
            language_id=lang_id,
            stdin=stdin,
            timeout=timeout,
        )

        return self._format_result(result)

    @classmethod
    def get_supported_go_language_id(cls, api_url: str | None = None) -> int | None:
        return get_judge0_go_language_id(api_url)

    def validate_java(
        self,
        code: str,
    ) -> dict:

        main_class = find_java_main_class(code) or find_java_primary_class(code)
        has_main = find_java_main_class(code) is not None
        source_code = code

        if main_class != "Main":
            source_code = re.sub(
                rf'\bpublic\s+class\s+{re.escape(main_class)}\b',
                f'class {main_class}',
                source_code,
            )

        if has_main:
            if main_class != "Main":
                source_code += f"\n\nclass Main {{\n    public static void main(String[] args) {{\n        {main_class}.main(args);\n    }}\n}}\n"
        else:
            source_code += "\n\nclass Main {\n    public static void main(String[] args) {}\n}\n"

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

    def validate_javascript(
        self,
        code: str,
    ) -> dict:

        result = self._submit(
            source_code=f"new Function({json.dumps(code)});",
            language_id=self.javascript_language_id,
            timeout=10,
        )
        status_id = result["status"]["id"]

        return {
            "valid": status_id == 3,
            "stdout": result.get("stdout") or "",
            "stderr": result.get("stderr") or result.get("compile_output") or "",
            "exit_code": result.get("exit_code"),
        }

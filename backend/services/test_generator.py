import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """
You are an expert software testing engineer.

Generate useful test cases for the provided code.

Focus on:
- normal cases
- edge cases
- boundary cases
- unusual inputs
- cases likely to expose bugs

For PROGRAM code:
Generate stdin-based tests.

For FUNCTION code:
Generate function arguments and expected return values.

Return ONLY valid JSON.
"""


async def generate_tests(
    code: str,
    count: int,
    description: str | None = None,
    code_type: str = "program",
    functions: list | None = None,
    language: str = "python",
):

    api_key = os.getenv("OPENROUTER_API_KEY")

    if code_type == "function":
        test_format = """
{
  "tests": [
    {
      "arguments": [2, 3],
      "expected_output": "5",
      "description": "Normal case"
    }
  ]
}
"""
    else:
        test_format = """
{
  "tests": [
    {
      "input": "2\\n3",
      "expected_output": "5",
      "description": "Normal case"
    }
  ]
}
"""

    prompt = f"""
Language:
{language}

Code type:
{code_type}

Code:

```{language}
{code}
Functions:
{json.dumps(functions or [])}

Generate exactly {count} test cases.

Additional requirements:
{description or "None"}

IMPORTANT:
Return ONLY a JSON object.
The top-level object MUST contain a key named "tests".
"tests" MUST be an array containing exactly {count} test cases.
Do not return a number, string, array, markdown, or explanation.
Keep all numeric test values reasonable.
Do not generate extremely large integers.
Use practical values such as -1000000 to 1000000 unless the code specifically requires larger values.

Required format:

{test_format}
"""
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "qwen/qwen3-30b-a3b",
                "messages": [
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                "response_format": {
                    "type": "json_object",
                },
            },
        )

    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]

    try:
        data = json.loads(
            content,
            parse_int=lambda value: (
                int(value)
                if len(value) <= 100
                else value
            ),
        )
    except (json.JSONDecodeError, ValueError) as e:
        raise ValueError(
            f"AI returned invalid JSON: {e}"
        )

    if not isinstance(data, dict):
        raise ValueError(
            "AI returned an invalid test case format."
        )

    tests = data.get("tests")

    if not isinstance(tests, list):
        raise ValueError(
            "AI response does not contain a valid 'tests' list."
        )

    if len(tests) != count:
        raise ValueError(
            f"AI generated {len(tests)} tests instead of {count}."
        )

    return tests
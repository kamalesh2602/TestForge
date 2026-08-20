import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """
You are an expert software testing engineer.

Generate useful test cases for Python code.

For PROGRAM code:
Generate stdin-based tests.

For FUNCTION code:
Generate function arguments and expected return values.

Focus on:
- normal cases
- edge cases
- boundary cases
- unusual inputs
- cases likely to expose bugs

Return ONLY valid JSON.
"""


async def generate_tests(
    code: str,
    count: int,
    description: str | None = None,
    code_type: str = "program",
    functions: list | None = None,
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
Code:

```python
{code}
Code type:
{code_type}

Functions:
{json.dumps(functions or [])}

Generate exactly {count} test cases.

Additional requirements:
{description or "None"}

Return using this format:

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
                "response_format": {"type": "json_object"},
            },
        )

    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]

    data = json.loads(content)

    return data["tests"]

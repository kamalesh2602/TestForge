import json
import os

import httpx
from dotenv import load_dotenv
from google import genai

load_dotenv()


SYSTEM_PROMPT = """
You are an expert software testing engineer.

Generate useful test cases for Python, Java, and JavaScript code.

For PROGRAM code:
Generate stdin-based tests.

For FUNCTION code:
Generate function arguments and expected return values.

For JavaScript function code, generate JSON-compatible arguments that can be
passed to the function with the spread operator.

Focus on:
- normal cases
- edge cases
- boundary cases
- unusual inputs
- cases likely to expose bugs

Return ONLY valid JSON.

Keep numeric values reasonable.
Do not generate extremely large integers.
Use practical values unless the code specifically requires larger values.
"""


def build_prompt(
    code: str,
    count: int,
    description: str | None,
    code_type: str,
    functions: list | None,
    language: str,
) -> str:

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

    return f"""
Language:
{language}

Code type:
{code_type}

Functions:
{json.dumps(functions or [])}

Code:

```{language}
{code}
```

Generate exactly {count} test cases.

Additional requirements:
{description or "None"}

Return using this format:

{test_format}

IMPORTANT:
- Return ONLY JSON.
- Do not use markdown.
- The top-level object MUST contain "tests".
- "tests" MUST contain exactly {count} items.
- Do not generate extremely large integers.
- Keep numeric test values reasonable.
"""


async def generate_with_gemini(
    prompt: str,
) -> str:

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=api_key
    )

    response = await client.aio.models.generate_content(
        model="gemini-3.6-flash",
        contents=(
            SYSTEM_PROMPT
            + "\n\n"
            + prompt
        ),
        config={
            "response_mime_type": "application/json",
        },
    )

    if not response.text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return response.text


async def generate_with_openrouter(
    prompt: str,
) -> str:

    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured."
        )

    async with httpx.AsyncClient(
        timeout=60
    ) as client:

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
                    "type": "json_object"
                },
            },
        )

        response.raise_for_status()

        data = response.json()

        content = (
            data["choices"][0]
            ["message"]["content"]
        )

        if not content:
            raise RuntimeError(
                "OpenRouter returned an empty response."
            )

        return content


def parse_response(
    content: str,
    count: int,
) -> list:

    try:
        data = json.loads(
            content,
            parse_int=lambda value: (
                int(value)
                if len(value) <= 100
                else value
            ),
        )

    except (
        json.JSONDecodeError,
        ValueError,
    ) as e:

        raise RuntimeError(
            f"AI returned invalid JSON: {e}"
        )

    if not isinstance(data, dict):
        raise RuntimeError(
            "AI returned an invalid response."
        )

    tests = data.get("tests")

    if not isinstance(tests, list):
        raise RuntimeError(
            "AI response does not contain a valid 'tests' list."
        )

    if len(tests) != count:
        raise RuntimeError(
            f"AI generated {len(tests)} tests "
            f"instead of {count}."
        )

    return tests


async def generate_tests(
    code: str,
    count: int,
    description: str | None = None,
    code_type: str = "program",
    functions: list | None = None,
    language: str = "python",
) -> list:

    prompt = build_prompt(
        code=code,
        count=count,
        description=description,
        code_type=code_type,
        functions=functions,
        language=language,
    )

    provider = os.getenv(
        "LLM_PROVIDER",
        "gemini",
    ).lower()

    errors = []

    if provider == "gemini":

        try:
            content = await generate_with_gemini(
                prompt
            )

            return parse_response(
                content,
                count,
            )

        except Exception as e:
            errors.append(
                f"Gemini: {str(e)}"
            )

    elif provider == "openrouter":

        try:
            content = await generate_with_openrouter(
                prompt
            )

            return parse_response(
                content,
                count,
            )

        except Exception as e:
            errors.append(
                f"OpenRouter: {str(e)}"
            )

    else:

        errors.append(
            f"Unknown LLM provider: {provider}"
        )

    if provider == "gemini":

        try:
            content = await generate_with_openrouter(
                prompt
            )

            return parse_response(
                content,
                count,
            )

        except Exception as e:
            errors.append(
                f"OpenRouter fallback: {str(e)}"
            )

    elif provider == "openrouter":

        try:
            content = await generate_with_gemini(
                prompt
            )

            return parse_response(
                content,
                count,
            )

        except Exception as e:
            errors.append(
                f"Gemini fallback: {str(e)}"
            )

    raise RuntimeError(
        "All LLM providers failed.\n"
        + "\n".join(errors)
    )

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from services.test_generator import (
    build_prompt,
    generate_with_gemini,
    generate_with_openrouter,
    parse_response,
    generate_tests,
)


def test_build_prompt_function():
    prompt = build_prompt(
        code="def add(a, b): return a + b",
        count=3,
        description="Focus on negative numbers",
        code_type="function",
        functions=["add"],
        language="python",
    )
    assert "Language:\npython" in prompt
    assert "Code type:\nfunction" in prompt
    assert '["add"]' in prompt
    assert "def add(a, b): return a + b" in prompt
    assert "Generate exactly 3 test cases." in prompt
    assert "Focus on negative numbers" in prompt
    assert '"arguments": [2, 3]' in prompt


def test_build_prompt_program_defaults():
    prompt = build_prompt(
        code="name = input(); print(name)",
        count=2,
        description=None,
        code_type="program",
        functions=None,
        language="javascript",
    )
    assert "Language:\njavascript" in prompt
    assert "Code type:\nprogram" in prompt
    assert "Functions:\n[]" in prompt
    assert "Additional requirements:\nNone" in prompt
    assert '"input": "2\\n3"' in prompt


@pytest.mark.anyio
async def test_generate_with_gemini_missing_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY is not configured."):
        await generate_with_gemini("test prompt")


@pytest.mark.anyio
async def test_generate_with_gemini_success(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    with patch("services.test_generator.genai.Client") as mock_genai_client:
        mock_client = mock_genai_client.return_value
        mock_response = MagicMock()
        mock_response.text = '{"tests": []}'
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        result = await generate_with_gemini("test prompt")
        assert result == '{"tests": []}'
        mock_client.aio.models.generate_content.assert_awaited_once()


@pytest.mark.anyio
async def test_generate_with_gemini_empty_response(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    with patch("services.test_generator.genai.Client") as mock_genai_client:
        mock_client = mock_genai_client.return_value
        mock_response = MagicMock()
        mock_response.text = ""
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        with pytest.raises(RuntimeError, match="Gemini returned an empty response."):
            await generate_with_gemini("test prompt")


@pytest.mark.anyio
async def test_generate_with_openrouter_missing_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY is not configured."):
        await generate_with_openrouter("test prompt")


@pytest.mark.anyio
async def test_generate_with_openrouter_success(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    with patch("httpx.AsyncClient") as mock_async_client:
        mock_client_instance = MagicMock()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "choices": [
                {"message": {"content": '{"tests": [{"input": "1"}]}'}}
            ]
        }
        mock_client_instance.post = AsyncMock(return_value=mock_resp)
        mock_async_client.return_value.__aenter__.return_value = mock_client_instance

        result = await generate_with_openrouter("test prompt")
        assert result == '{"tests": [{"input": "1"}]}'


@pytest.mark.anyio
async def test_generate_with_openrouter_empty_content(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    with patch("httpx.AsyncClient") as mock_async_client:
        mock_client_instance = MagicMock()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "choices": [
                {"message": {"content": ""}}
            ]
        }
        mock_client_instance.post = AsyncMock(return_value=mock_resp)
        mock_async_client.return_value.__aenter__.return_value = mock_client_instance

        with pytest.raises(RuntimeError, match="OpenRouter returned an empty response."):
            await generate_with_openrouter("test prompt")


def test_parse_response_valid():
    content = json.dumps({
        "tests": [
            {"arguments": [1, 2], "expected_output": "3"},
            {"arguments": [-1, 1], "expected_output": "0"},
        ]
    })
    tests = parse_response(content, 2)
    assert len(tests) == 2
    assert tests[0]["arguments"] == [1, 2]


def test_parse_response_large_int():
    large_num_str = "9" * 150
    content = f'{{"tests": [{{"val": {large_num_str}}}]}}'
    tests = parse_response(content, 1)
    # Length > 100 is kept as string to prevent overflow issues
    assert tests[0]["val"] == large_num_str


def test_parse_response_invalid_json():
    with pytest.raises(RuntimeError, match="AI returned invalid JSON:"):
        parse_response("This is not JSON", 1)


def test_parse_response_not_dict():
    with pytest.raises(RuntimeError, match="AI returned an invalid response."):
        parse_response("[1, 2, 3]", 3)


def test_parse_response_missing_tests_key():
    with pytest.raises(RuntimeError, match="AI response does not contain a valid 'tests' list."):
        parse_response('{"data": []}', 1)


def test_parse_response_count_mismatch():
    content = json.dumps({"tests": [{"input": "1"}]})
    with pytest.raises(RuntimeError, match="AI generated 1 tests instead of 3."):
        parse_response(content, 3)


@pytest.mark.anyio
async def test_generate_tests_gemini_success(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    with patch("services.test_generator.generate_with_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = json.dumps({
            "tests": [{"input": "5", "expected_output": "25"}]
        })
        tests = await generate_tests(code="x = int(input()); print(x*x)", count=1)
        assert len(tests) == 1
        assert tests[0]["input"] == "5"
        mock_gemini.assert_awaited_once()


@pytest.mark.anyio
async def test_generate_tests_gemini_fallback_to_openrouter(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    with patch("services.test_generator.generate_with_gemini", new_callable=AsyncMock) as mock_gemini, \
         patch("services.test_generator.generate_with_openrouter", new_callable=AsyncMock) as mock_openrouter:

        mock_gemini.side_effect = Exception("Gemini quota exceeded")
        mock_openrouter.return_value = json.dumps({
            "tests": [{"arguments": [4], "expected_output": "16"}]
        })

        tests = await generate_tests(code="def square(x): return x*x", count=1, code_type="function")
        assert len(tests) == 1
        assert tests[0]["arguments"] == [4]
        mock_gemini.assert_awaited_once()
        mock_openrouter.assert_awaited_once()


@pytest.mark.anyio
async def test_generate_tests_all_providers_fail(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    with patch("services.test_generator.generate_with_gemini", new_callable=AsyncMock) as mock_gemini, \
         patch("services.test_generator.generate_with_openrouter", new_callable=AsyncMock) as mock_openrouter:

        mock_gemini.side_effect = Exception("Gemini down")
        mock_openrouter.side_effect = Exception("OpenRouter down")

        with pytest.raises(RuntimeError, match="All LLM providers failed"):
            await generate_tests(code="print(1)", count=1)


@pytest.mark.anyio
async def test_generate_tests_openrouter_primary_success(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openrouter")
    with patch("services.test_generator.generate_with_openrouter", new_callable=AsyncMock) as mock_openrouter:
        mock_openrouter.return_value = json.dumps({
            "tests": [{"input": "hi", "expected_output": "hi"}]
        })
        tests = await generate_tests(code="print(input())", count=1)
        assert len(tests) == 1
        assert tests[0]["input"] == "hi"
        mock_openrouter.assert_awaited_once()


@pytest.mark.anyio
async def test_generate_tests_openrouter_fallback_to_gemini(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openrouter")
    with patch("services.test_generator.generate_with_openrouter", new_callable=AsyncMock) as mock_openrouter, \
         patch("services.test_generator.generate_with_gemini", new_callable=AsyncMock) as mock_gemini:

        mock_openrouter.side_effect = Exception("OpenRouter timeout")
        mock_gemini.return_value = json.dumps({
            "tests": [{"input": "ok", "expected_output": "ok"}]
        })

        tests = await generate_tests(code="print(input())", count=1)
        assert len(tests) == 1
        mock_openrouter.assert_awaited_once()
        mock_gemini.assert_awaited_once()


@pytest.mark.anyio
async def test_generate_tests_unknown_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "custom_local_llm")
    with pytest.raises(RuntimeError, match="All LLM providers failed"):
        await generate_tests(code="print(1)", count=1)


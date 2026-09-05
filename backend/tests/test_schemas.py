import pytest
from pydantic import ValidationError
from models.schemas import CodeRequest, ExecuteRequest, TestGenerationRequest, ExecuteTestsRequest


def test_code_request_valid():
    for lang in ["python", "java", "javascript"]:
        req = CodeRequest(code="print(1)", language=lang)
        assert req.language == lang


def test_code_request_invalid_language():
    with pytest.raises(ValidationError):
        CodeRequest(code="print(1)", language="c++")


def test_execute_request_defaults():
    req = ExecuteRequest(code="x = 1")
    assert req.language == "python"
    assert req.stdin == ""


def test_test_generation_request_valid():
    req = TestGenerationRequest(code="def foo(): pass", language="javascript", count=3)
    assert req.count == 3


def test_execute_tests_request_valid():
    req = ExecuteTestsRequest(
        code="function foo() {}",
        language="javascript",
        tests=[{"arguments": [1]}],
    )
    assert len(req.tests) == 1

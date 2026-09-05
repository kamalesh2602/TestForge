import pytest
from services.harness_generator import create_function_harness, java_literal


def test_create_python_harness():
    code = "def add(a, b):\n    return a + b"
    harness = create_function_harness(code, "add", [2, 3], language="python")
    assert "result = add(2, 3)" in harness
    assert "print(result)" in harness


def test_create_java_harness():
    code = "public class Solution { public static int add(int a, int b) { return a + b; } }"
    harness = create_function_harness(code, "add", [5, 10], language="java")
    assert "Solution.add(5, 10)" in harness
    assert "class TestForgeRunner" in harness


def test_create_javascript_harness():
    code = "function add(a, b) { return a + b; }"
    harness = create_function_harness(code, "add", [1, 2], language="javascript")
    assert "const result = add(...[1, 2]);" in harness
    assert "JSON.stringify(result)" in harness


def test_unsupported_language_harness():
    with pytest.raises(ValueError, match="Unsupported language"):
        create_function_harness("code", "fn", [], language="c++")


def test_java_literal():
    assert java_literal(True) == "true"
    assert java_literal(False) == "false"
    assert java_literal("hello \"world\"") == '"hello \\"world\\""'
    assert java_literal(None) == "null"
    assert java_literal(123) == "123"

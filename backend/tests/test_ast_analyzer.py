import pytest
from unittest.mock import MagicMock

from services.ast_analyzer import analyze_code, analyze_python, analyze_javascript, analyze_java


def test_analyze_python_function():
    code = """def add(a, b):\n    return a + b\n"""
    result = analyze_python(code)
    assert result["valid"] is True
    assert result["code_type"] == "function"
    assert len(result["functions"]) == 1
    assert result["functions"][0]["name"] == "add"
    assert result["functions"][0]["parameters"] == ["a", "b"]


def test_analyze_python_program():
    code = """x = input()\nprint(x)\n"""
    result = analyze_python(code)
    assert result["valid"] is True
    assert result["code_type"] == "program"
    assert result["has_input"] is True


def test_analyze_python_syntax_error():
    code = "def invalid_syntax("
    result = analyze_python(code)
    assert result["valid"] is False
    assert result["error"] == "SyntaxError"


def test_analyze_javascript_function():
    mock_executor = MagicMock()
    mock_executor.validate_javascript.return_value = {"valid": True, "stderr": ""}

    code = """
function add(a, b = 10) {
    return a + b;
}
"""
    result = analyze_javascript(code, mock_executor)
    assert result["valid"] is True
    assert result["code_type"] == "function"
    assert len(result["functions"]) == 1
    assert result["functions"][0]["name"] == "add"
    assert result["functions"][0]["parameters"] == ["a", "b"]


def test_analyze_javascript_arrow_function():
    mock_executor = MagicMock()
    mock_executor.validate_javascript.return_value = {"valid": True, "stderr": ""}

    code = """const multiply = (x, y) => {
    return x * y;
};"""
    result = analyze_javascript(code, mock_executor)
    assert result["valid"] is True
    assert result["code_type"] == "function"
    assert len(result["functions"]) == 1
    assert result["functions"][0]["name"] == "multiply"
    assert result["functions"][0]["parameters"] == ["x", "y"]


def test_analyze_javascript_syntax_error():
    mock_executor = MagicMock()
    mock_executor.validate_javascript.return_value = {
        "valid": False,
        "stderr": "SyntaxError: Unexpected token",
    }

    result = analyze_javascript("function ( {", mock_executor)
    assert result["valid"] is False
    assert result["error"] == "JavaScriptSyntaxError"


def test_analyze_code_unsupported_language():
    result = analyze_code("code", "rust")
    assert result["valid"] is False
    assert result["error"] == "Unsupported language"

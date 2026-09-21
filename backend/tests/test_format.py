from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_format_python_success():
    unformatted = "def foo( a,  b ):\n  return a+b\n"
    response = client.post("/format", json={"code": unformatted, "language": "python"})
    assert response.status_code == 200
    data = response.json()
    assert "formatted_code" in data
    assert "def foo(a, b):" in data["formatted_code"]


def test_format_python_syntax_error():
    broken_code = "def foo("
    response = client.post("/format", json={"code": broken_code, "language": "python"})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data

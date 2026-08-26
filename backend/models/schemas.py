from pydantic import BaseModel, Field


class CodeRequest(BaseModel):
    code: str = Field(min_length=1)
    language: str = Field(pattern="^(python|java)$")


class TestCase(BaseModel):
    input: str
    expected_output: str | None = None
    description: str | None = None


class TestGenerationRequest(BaseModel):
    code: str = Field(min_length=1)
    language: str = Field(pattern="^(python|java)$")
    count: int = Field(ge=1, le=20)
    description: str | None = None


class TestGenerationResponse(BaseModel):
    code_type: str
    tests: list


class ExecuteTestsRequest(BaseModel):
    code: str = Field(min_length=1)
    language: str = Field(pattern="^(python|java)$")
    tests: list[dict] = Field(
        min_length=1,
        max_length=20,
    )


class TestResult(BaseModel):
    input: str
    expected_output: str | None
    actual_output: str
    status: str
    description: str | None = None


class ExecuteRequest(BaseModel):
    code: str = Field(min_length=1)
    stdin: str = ""
    language: str = Field(
        default="python",
        pattern="^(python|java)$",
    )


class FunctionTestCase(BaseModel):
    arguments: list
    expected_output: str
    description: str | None = None

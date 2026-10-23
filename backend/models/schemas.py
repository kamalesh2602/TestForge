from pydantic import BaseModel, Field

# Resource limit constants
MAX_CODE_LENGTH = 65_536
MAX_STDIN_LENGTH = 65_536
MAX_DESCRIPTION_LENGTH = 2_000
MAX_TEST_CASE_COUNT = 20


class CodeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=MAX_CODE_LENGTH)
    language: str = Field(pattern="^(python|java|javascript)$")


class CodeFormatResponse(BaseModel):
    formatted_code: str


class TestCase(BaseModel):
    input: str = Field(default="", max_length=MAX_STDIN_LENGTH)
    expected_output: str | None = Field(default=None, max_length=MAX_STDIN_LENGTH)
    description: str | None = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)


class TestGenerationRequest(BaseModel):
    code: str = Field(min_length=1, max_length=MAX_CODE_LENGTH)
    language: str = Field(pattern="^(python|java|javascript)$")
    count: int = Field(ge=1, le=MAX_TEST_CASE_COUNT)
    description: str | None = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)


class TestGenerationResponse(BaseModel):
    code_type: str
    tests: list


class ExecuteTestsRequest(BaseModel):
    code: str = Field(min_length=1, max_length=MAX_CODE_LENGTH)
    language: str = Field(pattern="^(python|java|javascript)$")
    tests: list[dict] = Field(
        min_length=1,
        max_length=MAX_TEST_CASE_COUNT,
    )


class TestResult(BaseModel):
    input: str
    expected_output: str | None
    actual_output: str
    status: str
    description: str | None = None


class ExecuteRequest(BaseModel):
    code: str = Field(min_length=1, max_length=MAX_CODE_LENGTH)
    stdin: str = Field(default="", max_length=MAX_STDIN_LENGTH)
    language: str = Field(
        default="python",
        pattern="^(python|java|javascript|c|cpp|c\\+\\+|bash)$",
    )


class FunctionTestCase(BaseModel):
    arguments: list
    expected_output: str = Field(max_length=MAX_STDIN_LENGTH)
    description: str | None = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)


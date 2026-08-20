from fastapi import FastAPI, HTTPException

from fastapi import FastAPI, HTTPException

from models.schemas import (
    CodeRequest,
    ExecuteRequest,
    ExecuteTestsRequest,
    TestGenerationRequest,
    TestGenerationResponse,
)

from services.ast_analyzer import analyze_code
from services.docker_executor import DockerExecutor
from services.harness_generator import create_function_harness
from services.test_generator import generate_tests

from models.schemas import (
    CodeRequest,
    ExecuteRequest,
    TestGenerationRequest,
    TestGenerationResponse,
)
from services.ast_analyzer import analyze_code
from services.test_generator import generate_tests

app = FastAPI(title="TestForge")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "TestForge API is running"}


@app.post("/analyze")
def analyze(request: CodeRequest):
    return analyze_code(request.code)


from services.docker_executor import DockerExecutor


executor = DockerExecutor()

@app.post("/execute")
def execute(request: ExecuteRequest):
    return executor.execute(
        code=request.code,
        stdin=request.stdin,
    )

from models.schemas import ExecuteTestsRequest

@app.post(
    "/generate-tests",
    response_model=TestGenerationResponse,
)
async def generate(request: TestGenerationRequest):

    analysis = analyze_code(request.code)

    if not analysis["valid"]:
        raise HTTPException(
            status_code=400,
            detail=analysis,
        )

    tests = await generate_tests(
        code=request.code,
        count=request.count,
        description=request.description,
        code_type=analysis["code_type"],
        functions=analysis["functions"],
    )

    return {
        "code_type": analysis["code_type"],
        "tests": tests,
    }

from services.harness_generator import create_function_harness
@app.post("/run-tests")
def run_tests(request: ExecuteTestsRequest):

    analysis = analyze_code(request.code)

    if not analysis["valid"]:
        raise HTTPException(
            status_code=400,
            detail=analysis,
        )

    results = []

    for test in request.tests:

        if analysis["code_type"] == "function":

            function_name = analysis["functions"][0]["name"]

            executable_code = create_function_harness(
                request.code,
                function_name,
                test["arguments"],
            )

            result = executor.execute(
                code=executable_code,
            )

            input_value = test["arguments"]

        else:

            result = executor.execute(
                code=request.code,
                stdin=test["input"],
            )

            input_value = test["input"]

        actual_output = result.get("output", "").strip()

        expected_output = test.get(
            "expected_output"
        )

        if expected_output is not None:
            expected_output = expected_output.strip()

        if result["status"] == "timeout":
            status = "timeout"

        elif result["status"] == "error":
            status = "error"

        elif expected_output is not None:
            status = (
                "passed"
                if actual_output == expected_output
                else "failed"
            )

        else:
            status = "completed"

        results.append({
            "input": input_value,
            "expected_output": expected_output,
            "actual_output": actual_output,
            "status": status,
            "description": test.get("description"),
        })

    return {
        "total": len(results),
        "passed": sum(
            r["status"] == "passed"
            for r in results
        ),
        "results": results,
    }
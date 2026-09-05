import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from models.schemas import (
    CodeRequest,
    ExecuteRequest,
    ExecuteTestsRequest,
    TestGenerationRequest,
    TestGenerationResponse,
)
from services.ast_analyzer import analyze_code
from services.executor_factory import get_executor
from services.harness_generator import create_function_harness
from services.test_generator import generate_tests


load_dotenv()


app = FastAPI(title="TestForge")


limiter = Limiter(
    key_func=get_remote_address,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(
    request: Request,
    exc: RateLimitExceeded,
):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
        },
    )


frontend_urls = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[url.strip() for url in frontend_urls],
    allow_methods=["*"],
    allow_headers=["*"],
)


executor = get_executor()

# --------------------------------------------------
# Root
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "TestForge API is running"
    }


# --------------------------------------------------
# Analyze
# --------------------------------------------------

@app.post("/analyze")
def analyze(
    request: CodeRequest,
):

    analysis = analyze_code(
        request.code,
        request.language,
        executor,
    )

    return analysis


# --------------------------------------------------
# Execute
# --------------------------------------------------

@app.post("/execute")
@limiter.limit("10/minute")
def execute(
    request: Request,
    code_request: ExecuteRequest,
):

    if code_request.language == "java":
        return executor.execute_java(
            code=code_request.code,
            stdin=code_request.stdin,
        )

    if code_request.language == "javascript":
        return executor.execute_javascript(
            code=code_request.code,
            stdin=code_request.stdin,
        )

    return executor.execute(
        code=code_request.code,
        stdin=code_request.stdin,
    )



# --------------------------------------------------
# Generate Tests
# --------------------------------------------------
@app.post(
    "/generate-tests",
    response_model=TestGenerationResponse,
)
@limiter.limit("5/minute")
async def generate(
    request: Request,
    code_request: TestGenerationRequest,
):

    analysis = analyze_code(
        code_request.code,
        code_request.language,
        executor,
    )

    if not analysis["valid"]:
        raise HTTPException(
            status_code=400,
            detail=analysis,
        )

    try:

        tests = await generate_tests(
            code=code_request.code,
            count=code_request.count,
            description=code_request.description,
            code_type=analysis["code_type"],
            functions=analysis["functions"],
            language=code_request.language,
        )

    except Exception as e:

        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI service unavailable",
                "message": str(e),
            },
        )

    return {
        "code_type": analysis["code_type"],
        "tests": tests,
    }

# --------------------------------------------------
# Run Tests
# --------------------------------------------------

@app.post("/run-tests")
@limiter.limit("10/minute")
def run_tests(
    request: Request,
    test_request: ExecuteTestsRequest,
):

    analysis = analyze_code(
        test_request.code,
        test_request.language,
        executor,
    )

    if not analysis["valid"]:
        raise HTTPException(
            status_code=400,
            detail=analysis,
        )

    results = []

    for test in test_request.tests:

        # ------------------------------------------
        # Function
        # ------------------------------------------

        if analysis["code_type"] == "function":

            function_name = (
                analysis["functions"][0]["name"]
            )

            executable_code = create_function_harness(
                test_request.code,
                function_name,
                test["arguments"],
                test_request.language,
            )

            if test_request.language == "java":

                result = executor.execute_java_function(
                    code=executable_code,
                )

            elif test_request.language == "javascript":

                result = executor.execute_javascript_function(
                    code=executable_code,
                )

            else:

                result = executor.execute(
                    code=executable_code,
                )

            input_value = test["arguments"]

        # ------------------------------------------
        # Program
        # ------------------------------------------

        else:

            if test_request.language == "java":

                result = executor.execute_java(
                    code=test_request.code,
                    stdin=test["input"],
                )

            elif test_request.language == "javascript":

                result = executor.execute_javascript(
                    code=test_request.code,
                    stdin=test["input"],
                )

            else:

                result = executor.execute(
                    code=test_request.code,
                    stdin=test["input"],
                )

            input_value = test["input"]

        # ------------------------------------------
        # Compare Output
        # ------------------------------------------

        actual_output = result.get(
            "output",
            "",
        ).strip()

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

        results.append(
            {
                "input": input_value,
                "expected_output": expected_output,
                "actual_output": actual_output,
                "status": status,
                "description": test.get(
                    "description"
                ),
            }
        )

    return {
        "total": len(results),
        "passed": sum(
            result["status"] == "passed"
            for result in results
        ),
        "results": results,
    }

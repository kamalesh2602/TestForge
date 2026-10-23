import ipaddress
import logging
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
    CodeFormatResponse,
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

logger = logging.getLogger("testforge")


def get_client_ip(request: Request) -> str:
    """
    Safely resolves the client IP address for rate limiting.
    When running behind a trusted reverse proxy (Render sets RENDER=true,
    or TRUST_PROXY=true in configuration), we extract and validate the
    client IP from the X-Forwarded-For header.
    Otherwise, we use the direct connection socket IP, falling back to 127.0.0.1.
    """
    is_behind_proxy = (
        os.getenv("RENDER", "").lower() == "true"
        or os.getenv("TRUST_PROXY", "false").lower() in ("true", "1")
    )

    if is_behind_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            first_ip = forwarded.split(",")[0].strip()
            try:
                validated_ip = ipaddress.ip_address(first_ip)
                return str(validated_ip)
            except ValueError:
                # Malformed or spoofed IP in header; ignore and fallback
                pass

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


app = FastAPI(title="TestForge")


limiter = Limiter(
    key_func=get_client_ip,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(
            f"Unhandled server error on {request.method} {request.url.path}: {exc}",
            exc_info=True,
        )
        response = JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred. Please try again later.",
            },
        )

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=(), usb=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none';"

    if request.url.path in ("/execute", "/generate-tests", "/run-tests", "/analyze", "/format"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"

    return response


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(
    request: Request,
    exc: RateLimitExceeded,
):
    return JSONResponse(
        status_code=429,
        headers={"Retry-After": "60"},
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
        },
    )



raw_frontend_urls = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

allowed_origins = [
    url.strip()
    for url in raw_frontend_urls.split(",")
    if url.strip()
]

if not allowed_origins:
    allowed_origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=600,
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
# Health
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok"
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
# Format Code
# --------------------------------------------------

@app.post("/format", response_model=CodeFormatResponse)
def format_code(
    request: CodeRequest,
):
    if request.language == "python":
        import black
        try:
            formatted = black.format_str(request.code, mode=black.Mode())
            return {"formatted_code": formatted}
        except black.InvalidInput as e:
            raise HTTPException(
                status_code=400,
                detail={"message": f"Syntax error in Python code: {str(e)}"},
            )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail={"message": f"Failed to format Python code: {str(e)}"},
            )

    raise HTTPException(
        status_code=400,
        detail={"message": f"Formatting for language '{request.language}' is not supported on backend."},
    )


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

    if code_request.language == "c":
        return executor.execute_c(
            code=code_request.code,
            stdin=code_request.stdin,
        )

    if code_request.language in ("cpp", "c++"):
        return executor.execute_cpp(
            code=code_request.code,
            stdin=code_request.stdin,
        )

    if code_request.language == "bash":
        return executor.execute_bash(
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
        logger.error(f"AI service error during test generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI service unavailable",
                "message": "AI testing is currently unavailable. Please try again later.",
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
        if not isinstance(test, dict):
            raise HTTPException(
                status_code=400,
                detail={"message": "Each test case must be a JSON object."},
            )

        # ------------------------------------------
        # Function
        # ------------------------------------------

        if analysis["code_type"] == "function":
            if "arguments" not in test or not isinstance(test.get("arguments"), list):
                raise HTTPException(
                    status_code=400,
                    detail={"message": "Function test case must include an 'arguments' array."},
                )

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
            raw_input = test.get("input", "")
            stdin_val = str(raw_input) if raw_input is not None else ""
            if len(stdin_val) > 65_536:
                raise HTTPException(
                    status_code=400,
                    detail={"message": "Test input exceeds maximum allowed length (65536 characters)."},
                )

            if test_request.language == "java":

                result = executor.execute_java(
                    code=test_request.code,
                    stdin=stdin_val,
                )

            elif test_request.language == "javascript":

                result = executor.execute_javascript(
                    code=test_request.code,
                    stdin=stdin_val,
                )

            else:

                result = executor.execute(
                    code=test_request.code,
                    stdin=stdin_val,
                )

            input_value = stdin_val

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

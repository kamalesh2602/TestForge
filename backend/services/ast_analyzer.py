import ast
import re


JAVA_METHOD_PATTERN = re.compile(
    r"(public|private|protected)?\s*"
    r"(static\s+)?"
    r"([\w<>\[\]]+)\s+"
    r"(\w+)\s*"
    r"\(([^)]*)\)"
)

JAVASCRIPT_FUNCTION_PATTERN = re.compile(
    r"(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)"
    r"|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>)"
)


def analyze_python(code: str):
    try:
        tree = ast.parse(code)

        functions = []
        classes = []

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                functions.append({
                    "name": node.name,
                    "parameters": [
                        arg.arg for arg in node.args.args
                    ],
                })

            elif isinstance(node, ast.ClassDef):
                classes.append(node.name)

        has_input = any(
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "input"
            for node in ast.walk(tree)
        )

        top_level_functions = [
            node for node in tree.body
            if isinstance(node, ast.FunctionDef)
        ]

        has_top_level_executable_code = any(
            not isinstance(
                node,
                (
                    ast.FunctionDef,
                    ast.AsyncFunctionDef,
                    ast.ClassDef,
                ),
            )
            for node in tree.body
        )

        if top_level_functions and not has_top_level_executable_code:
            code_type = "function"

        elif top_level_functions:
            code_type = "mixed"

        else:
            code_type = "program"

        return {
            "valid": True,
            "functions": functions,
            "classes": classes,
            "has_input": has_input,
            "code_type": code_type,
        }

    except SyntaxError as e:
        return {
            "valid": False,
            "error": "SyntaxError",
            "line": e.lineno,
            "column": e.offset,
            "message": e.msg,
        }


def analyze_code(code: str, language: str, executor=None):

    if language == "python":
        return analyze_python(code)

    if language == "java":
        return analyze_java(code, executor)

    if language == "javascript":
        return analyze_javascript(code, executor)

    return {
        "valid": False,
        "error": "Unsupported language",
    }


import re


def analyze_java(code: str, executor):

    from services.java_utils import find_java_primary_class, find_java_main_class

    result = executor.validate_java(code)

    if not result["valid"]:
        return {
            "valid": False,
            "error": "JavaSyntaxError",
            "message": result["stderr"],
        }

    functions = []

    for match in JAVA_METHOD_PATTERN.finditer(code):

        name = match.group(4)

        if name == "main":
            continue

        parameters = match.group(5).strip()

        if parameters:
            params = [
                param.strip().split()[-1]
                for param in parameters.split(",")
            ]
        else:
            params = []

        functions.append({
            "name": name,
            "parameters": params,
        })

    primary_class = find_java_primary_class(code)
    has_main = find_java_main_class(code) is not None

    code_type = (
        "function"
        if (functions and not has_main)
        else "program"
    )

    return {
        "valid": True,
        "functions": functions,
        "classes": [primary_class],
        "code_type": code_type,
    }


def analyze_javascript(code: str, executor):
    result = executor.validate_javascript(code)

    if not result["valid"]:
        return {
            "valid": False,
            "error": "JavaScriptSyntaxError",
            "message": result["stderr"],
        }

    functions = []
    function_intervals = []

    for match in JAVASCRIPT_FUNCTION_PATTERN.finditer(code):
        if match.group(1) is not None:
            func_name = match.group(1)
            raw_params = match.group(2)
        else:
            func_name = match.group(3)
            raw_params = match.group(4) if match.group(4) is not None else match.group(5)

        parameters = []
        if raw_params:
            for p in raw_params.split(","):
                clean = p.strip().split("=")[0].strip()
                clean = clean.lstrip(".")
                if clean:
                    parameters.append(clean)

        functions.append({
            "name": func_name,
            "parameters": parameters,
        })

        body_start = code.find("{", match.end())
        if body_start != -1:
            body_end = _find_javascript_block_end(code, body_start)
            if body_end is not None:
                function_intervals.append((match.start(), body_end + 1))

    # Reconstruct remaining code outside function definitions
    sorted_intervals = sorted(function_intervals, key=lambda x: x[0])
    parts = []
    last_idx = 0
    for start, end in sorted_intervals:
        if start > last_idx:
            parts.append(code[last_idx:start])
        last_idx = max(last_idx, end)
    if last_idx < len(code):
        parts.append(code[last_idx:])
    remaining_code = "".join(parts)

    code_type = (
        "function"
        if functions and not _has_javascript_executable_code(remaining_code)
        else "program"
    )

    return {
        "valid": True,
        "functions": functions,
        "classes": [],
        "code_type": code_type,
    }



def _find_javascript_block_end(code: str, start: int):
    depth = 0
    quote = None
    escaped = False

    for index in range(start, len(code)):
        character = code[index]

        if quote:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == quote:
                quote = None
            continue

        if character in ("'", '"', "`"):
            quote = character
        elif character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
            if depth == 0:
                return index

    return None


def _has_javascript_executable_code(code: str):
    code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", code)
    return bool(code.strip().strip(";"))

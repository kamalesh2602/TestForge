import ast
import re


JAVA_METHOD_PATTERN = re.compile(
    r"(public|private|protected)?\s*"
    r"(static\s+)?"
    r"([\w<>\[\]]+)\s+"
    r"(\w+)\s*"
    r"\(([^)]*)\)"
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
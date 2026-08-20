import ast


def analyze_code(code: str):
    try:
        tree = ast.parse(code)

        functions = []
        classes = []

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                functions.append(
                    {
                        "name": node.name,
                        "parameters": [arg.arg for arg in node.args.args],
                    }
                )

            elif isinstance(node, ast.ClassDef):
                classes.append(node.name)

        has_input = any(
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "input"
            for node in ast.walk(tree)
        )

        top_level_functions = [
            node for node in tree.body if isinstance(node, ast.FunctionDef)
        ]

        has_top_level_executable_code = any(
            not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
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

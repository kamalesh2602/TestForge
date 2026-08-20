def create_function_harness(
    code: str,
    function_name: str,
    arguments: list,
    language: str = "python",
) -> str:

    if language == "python":
        args = ", ".join(
            repr(arg)
            for arg in arguments
        )

        return f"""
{code}

result = {function_name}({args})
print(result)
"""

    if language == "java":
        args = ", ".join(
            java_literal(arg)
            for arg in arguments
        )

        return f"""
{code}

class TestForgeRunner {{
    public static void main(String[] args) {{
        System.out.println(
            Main.{function_name}({args})
        );
    }}
}}
"""

    raise ValueError(
        f"Unsupported language: {language}"
    )


def java_literal(value):
    if isinstance(value, bool):
        return "true" if value else "false"

    if isinstance(value, str):
        escaped = (
            value
            .replace("\\", "\\\\")
            .replace('"', '\\"')
        )
        return f'"{escaped}"'

    if value is None:
        return "null"

    return str(value)
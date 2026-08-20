def create_function_harness(
    code: str,
    function_name: str,
    arguments: list,
) -> str:

    args = ", ".join(repr(arg) for arg in arguments)

    return f"""
{code}

result = {function_name}({args})
print(result)
"""

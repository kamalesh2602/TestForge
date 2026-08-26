import re


def strip_java_comments_and_strings(code: str) -> str:
    """
    Strips single-line comments, multi-line comments, text blocks, string literals,
    and character literals from Java code, replacing them with spaces while keeping
    newlines intact.
    """
    pattern = re.compile(
        r'//.*?$'                             # Single-line comment
        r'|/\*.*?\*/'                         # Multi-line comment
        r'|"""[\s\S]*?"""'                    # Text block
        r'|"(?:\\.|[^\\"])*"'                 # Double-quoted string literal
        r"|'(?:\\.|[^\\'])*'",                # Single-quoted char literal
        re.DOTALL | re.MULTILINE
    )

    def replacer(match):
        s = match.group(0)
        return ''.join('\n' if c == '\n' else ' ' for c in s)

    return pattern.sub(replacer, code)


def find_java_main_class(code: str) -> str | None:
    """
    Finds the name of the Java class that contains the executable main method:
    public static void main(String[] args) (or variations in modifiers/spacing/array syntax).
    Returns None if no executable main method is found.
    """
    stripped = strip_java_comments_and_strings(code)

    # Regex for main method signature in Java
    main_method_pattern = re.compile(
        r'(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String\s*(?:\[\s*\]|\.\.\.)?\s+\w+\s*(?:\[\s*\])?\s*\)'
    )

    main_match = main_method_pattern.search(stripped)
    if not main_match:
        return None

    main_index = main_match.start()

    # Find all class declarations in stripped code
    class_decl_pattern = re.compile(
        r'\b(?:public\s+|protected\s+|private\s+|static\s+|final\s+|abstract\s+)*class\s+([A-Za-z_]\w*)'
    )

    class_decls = list(class_decl_pattern.finditer(stripped))
    if not class_decls:
        return None

    events = []
    for match in class_decls:
        events.append((match.start(), 'CLASS', match.group(1)))

    for i, ch in enumerate(stripped):
        if ch == '{':
            events.append((i, 'LBRACE', '{'))
        elif ch == '}':
            events.append((i, 'RBRACE', '}'))

    events.append((main_index, 'MAIN', 'main'))
    events.sort(key=lambda x: x[0])

    stack = []
    depth = 0
    pending_class = None

    for pos, event_type, val in events:
        if event_type == 'CLASS':
            pending_class = val
        elif event_type == 'LBRACE':
            depth += 1
            if pending_class:
                stack.append((pending_class, depth))
                pending_class = None
        elif event_type == 'RBRACE':
            if stack and stack[-1][1] == depth:
                stack.pop()
            depth -= 1
        elif event_type == 'MAIN':
            if stack:
                return stack[-1][0]

    return None


def find_java_primary_class(code: str) -> str:
    """
    Finds the public class name if present, or the first declared class name,
    or defaults to 'Main'.
    """
    stripped = strip_java_comments_and_strings(code)

    public_match = re.search(
        r'\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)',
        stripped
    )
    if public_match:
        return public_match.group(1)

    class_match = re.search(
        r'\bclass\s+([A-Za-z_]\w*)',
        stripped
    )
    if class_match:
        return class_match.group(1)

    return "Main"

# TestForge

TestForge is a modern developer workbench that combines sandboxed multi-language code execution with AI-powered automated test generation. It allows developers to write, format, and execute code in Python, Java, and JavaScript, as well as automatically generate, customize, and run test harnesses against their programs and functions.

## Live Demo

Try the live application: [https://test-forge-ebon.vercel.app/](https://test-forge-ebon.vercel.app/)

## Overview

Writing unit test cases manually can be tedious and repetitive. TestForge solves this problem by automating the test creation workflow while maintaining strict execution safety:

1. **Static Code Analysis**: Inspects Python AST, Java structure, or JavaScript syntax to determine if code is a standalone program or a function.
2. **AI Test Generation**: Leverages LLMs (Google Gemini / OpenRouter fallback) to generate structured test cases (inputs, arguments, expected outputs, descriptions).
3. **Editable & Selectable Tests**: Developers review, edit, or select generated tests in an intuitive workbench UI.
4. **Deterministic Sandboxed Execution**: Executes test harnesses inside isolated sandboxes (Docker / Judge0) and compares actual vs. expected results deterministically.

## Features

- **Multi-language code execution & preview**: Run Python, Java, and JavaScript execution or render HTML web previews directly in the browser workbench.
- **HTML Web Preview with Internal CSS**: Sandboxed, real-time HTML document rendering with support for embedded `<style>` sheets.
- **AI-powered test generation**: Generate structured test cases tailored to functions or stdin-based programs.
- **Editable and selectable test cases**: Modify inputs, expected outputs, arguments, or select specific test cases to run.
- **Code formatting**: Auto-format Python code (via Black) and HTML/JavaScript/Java code (via Prettier).
- **IntelliSense / code suggestions**: In-editor autocompletion for language keywords, standard libraries, and built-in functions.
- **Persistent editor state**: Automatically saves draft code and language selection locally across page reloads.
- **Dynamic STDIN input**: Pass custom standard input data for program executions in IDE Mode.
- **Save and upload code**: Download source code files locally or upload existing source files directly into the editor.
- **Keyboard shortcuts**: Execute code or trigger test runs with `Ctrl+Enter` / `Cmd+Enter`.

## Supported Languages

- **Python** (Python 3.11+)
- **Java** (OpenJDK 17+)
- **JavaScript** (Node.js)
- **HTML** (Browser-based DOM & internal CSS preview)

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Monaco Editor (`@monaco-editor/react`), Prettier
- **Backend**: Python 3.11+, FastAPI, SlowAPI (rate limiting), Pydantic v2, `uv` package manager
- **Execution & Sandboxing**: Docker Containers, Judge0 API
- **AI / LLM Integration**: Google Gemini (`google-genai`), OpenRouter (fallback API)
- **CI / CD**: GitHub Actions (`.github/workflows/ci.yml`)
- **Deployment**: Vercel (Frontend), Render (Backend)

## Project Structure

```text
TestForge/
├── frontend/             # React + Vite application
│   ├── src/              # Workbench components, services & editor utilities
│   └── package.json
├── backend/              # FastAPI application
│   ├── main.py           # API routes & server initialization
│   ├── models/           # Pydantic data schemas
│   ├── services/         # AST analysis, code execution, harness & AI generation
│   └── tests/            # Backend unit & integration tests
├── .github/workflows/    # GitHub Actions CI workflow
├── README.md             # Project introduction & overview
└── Documentation.md      # Comprehensive technical reference manual
```

## Documentation

For complete technical documentation, local setup guides, architecture breakdown, API reference, and deployment details, see [Documentation.md](Documentation.md).

## Repository

GitHub Repository: [https://github.com/kamalesh2602/TestForge](https://github.com/kamalesh2602/TestForge)

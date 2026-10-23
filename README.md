# TestForge

TestForge is a modern developer workbench that combines sandboxed multi-language code execution with AI-powered automated test generation. It allows developers to write, format, and execute code in Python, Java, JavaScript, C, C++, Bash, and Go, alongside browser-based HTML previews. Developers can also generate, customize, and run test harnesses against supported programs and functions.

## Live Demo

Try the live application: [TestForge](https://test-forge-ebon.vercel.app/)

## Overview

Writing unit test cases manually can be tedious and repetitive. TestForge streamlines the test creation workflow while maintaining isolated code execution:

1. **Static Code Analysis**: Inspects Python AST, Java structure, or JavaScript syntax to determine whether code is a standalone program or a function.
2. **AI Test Generation**: Uses LLMs (Google Gemini with OpenRouter fallback) to generate structured test cases containing inputs, arguments, expected outputs, and descriptions.
3. **Editable & Selectable Tests**: Developers can review, edit, and select generated tests in the workbench UI.
4. **Sandboxed Execution**: Executes code and test harnesses using the configured execution environments, including Judge0 and Docker where applicable, and compares actual versus expected results.

## Features

- **Multi-language Code Execution**: Execute Python, Java, JavaScript, C, C++, Bash, and Go through the supported execution environments.
- **HTML Web Preview**: Render HTML with internal CSS in a sandboxed browser preview, with preview maximization, standalone tab support, and automatic HTML tag completion.
- **AI-powered Test Generation**: Generate structured test cases for supported functions and stdin-based programs.
- **Editable and Selectable Test Cases**: Modify inputs, expected outputs, and arguments, or select specific test cases to run.
- **Code Formatting**: Format supported languages using the configured language-specific formatters.
- **IntelliSense and Code Suggestions**: In-editor autocompletion for supported languages.
- **Persistent Editor State**: Automatically preserve draft code and language selection locally across page reloads, subject to the configured persistence period.
- **Dynamic STDIN Input**: Provide custom standard input for program execution.
- **Save and Upload Code**: Download source files locally or upload existing source files into the editor.
- **Keyboard Shortcuts**: Run code using `Ctrl + Enter` or `Cmd + Enter`.

## Supported Languages

- **Python** — Python execution environment
- **Java** — Java execution environment
- **JavaScript** — Node.js execution environment
- **C** — GCC-based execution through Judge0
- **C++** — G++-based execution through Judge0
- **Bash** — Bash script execution through Judge0
- **Go** — Go program execution through Judge0
- **HTML** — Browser-based rendering with DOM and internal CSS support

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Monaco Editor (`@monaco-editor/react`), Prettier
- **Backend**: Python 3.11+, FastAPI, SlowAPI, Pydantic v2, `uv` package manager
- **Execution and Sandboxing**: Judge0 API and Docker-based execution environments where applicable
- **AI / LLM Integration**: Google Gemini (`google-genai`), OpenRouter fallback API
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)
- **Deployment**: Vercel (frontend), Render (backend)

## Project Structure

```text
TestForge/
├── frontend/              # React + Vite application
│   ├── src/               # Workbench components, services, and editor utilities
│   └── package.json
├── backend/               # FastAPI application
│   ├── main.py            # API routes and server initialization
│   ├── models/             # Pydantic data schemas
│   ├── services/           # Analysis, execution, harness, and AI services
│   └── tests/              # Backend automated tests
├── .github/workflows/      # GitHub Actions CI workflow
├── README.md               # Project introduction and overview
└── Documentation.md        # Comprehensive technical reference
```

## Documentation

For detailed technical documentation, local setup instructions, architecture, API reference, and deployment details, see [Documentation.md](Documentation.md).

## Repository

[GitHub Repository](https://github.com/kamalesh2602/TestForge)

# TestForge

<p align="center">
  <a href="https://github.com/kamalesh2602/TestForge/actions/workflows/ci.yml">
    <img src="https://github.com/kamalesh2602/TestForge/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://github.com/kamalesh2602/TestForge/issues">
    <img src="https://img.shields.io/github/issues/kamalesh2602/TestForge" alt="GitHub Issues" />
  </a>
  <a href="https://github.com/kamalesh2602/TestForge/pulls">
    <img src="https://img.shields.io/github/issues-pr/kamalesh2602/TestForge" alt="Pull Requests" />
  </a>
  <a href="https://github.com/kamalesh2602/TestForge/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/kamalesh2602/TestForge" alt="License" />
  </a>
  <a href="https://test-forge-ebon.vercel.app/">
    <img src="https://img.shields.io/badge/Live-Demo-brightgreen?style=flat&logo=vercel" alt="Live Demo" />
  </a>
</p>

TestForge is a modern developer workbench that combines sandboxed multi-language code execution with AI-powered automated test generation. It allows developers to write, format, and execute code in Python, Java, JavaScript, C, C++, Bash, and Go, alongside browser-based HTML previews. Developers can also generate, customize, and run test harnesses against supported programs and functions.

## Live

Try the live application: [TestForge](https://test-forge-ebon.vercel.app/)

## Overview

Writing unit test cases manually can be tedious and repetitive. TestForge streamlines the test creation workflow while maintaining isolated code execution:

1. **Static Code Analysis**: Inspects Python AST, Java structure, or JavaScript syntax to determine whether code is a standalone program or a function.
2. **AI Test Generation**: Uses LLMs (Google Gemini with OpenRouter fallback) to generate structured test cases containing inputs, arguments, expected outputs, and descriptions.
3. **Editable & Selectable Tests**: Developers can review, edit, and select generated tests in the workbench UI.
4. **Sandboxed Execution**: Executes code and test harnesses using the configured execution environments, including Judge0 and Docker where applicable, and compares actual versus expected results.

## Features

- **Multi-language code execution & preview**: Run Python, Java, C, C++, JavaScript, Bash, and Go execution or render HTML web previews directly in the browser workbench.
- **HTML Web Preview with Internal CSS**: Sandboxed HTML document rendering with embedded `<style>` support, workspace maximization, standalone tab popouts, and automatic tag completion (`<h1>` → `<h1>|</h1>`).
- **AI-powered test generation**: Generate structured test cases tailored to functions or stdin-based programs.
- **Editable and selectable test cases**: Modify inputs, expected outputs, arguments, or select specific test cases to run.
- **Code formatting**: Auto-format Go (via `gofmt` WebAssembly), C/C++ (via Clang-Format), Python (via Black), and HTML/JavaScript/Java (via Prettier).
- **IntelliSense / code suggestions**: In-editor autocompletion for language keywords, standard libraries, and built-in functions.
- **Interactive branding & navigation**: Clickable TestForge application logo enabling quick redirection to the starter workbench page.
- **Persistent editor state**: Automatically saves draft code and language selection locally across page reloads.
- **Dynamic STDIN input**: Pass custom standard input data for program executions in IDE Mode.
- **Save and upload code**: Download source code files locally or upload existing source files directly into the editor.
- **Keyboard shortcuts**: Execute code or trigger test runs with `Ctrl+Enter` / `Cmd+Enter`.

## Supported Languages

- **Python** (Python 3.11+)
- **Java** (OpenJDK 17+)
- **C** (GCC / Clang)
- **C++** (G++ / Clang)
- **JavaScript** (Node.js)
- **Go** (Go 1.20+ / `gofmt` formatting)
- **Bash** (Bash 5+)
- **HTML** (Browser-based DOM & internal CSS preview)

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Monaco Editor (`@monaco-editor/react`), Prettier, `@wasm-fmt/clang-format`, `@wasm-fmt/gofmt`
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
│   ├── main.py             # API routes and server initialization
│   ├── models/             # Pydantic data schemas
│   ├── services/           # Analysis, execution, harness, and AI services
│   └── tests/              # Backend automated tests
├── .github/workflows/     # GitHub Actions CI workflow
├── README.md              # Project introduction and overview
└── Documentation.md       # Comprehensive technical reference
```

## Documentation

For detailed technical documentation, local setup instructions, architecture, API reference, and deployment details, see [Documentation.md](Documentation.md).

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

## Repository

[GitHub Repository](https://github.com/kamalesh2602/TestForge)


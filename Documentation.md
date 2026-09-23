# TestForge Documentation

Comprehensive technical reference, architecture guide, and developer manual for **TestForge**.

---

## 1. Overview

**TestForge** is an open-source automated testing platform and web-based code execution environment. It bridges the gap between AI developer assistance and deterministic software verification.

### Core Problem Solved
Writing test cases manually is repetitive and prone to missing edge cases. While Large Language Models (LLMs) excel at generating creative test inputs, trusting an LLM to self-report test execution results is inherently unreliable due to hallucinations.

TestForge solves this by dividing responsibilities:
- **LLM / AI Layer**: Analyzes code context and generates structured test case proposals (inputs, arguments, descriptions, and expected outputs).
- **Deterministic Engine**: Statically analyzes the code, builds dynamic test harnesses, executes untrusted code inside isolated sandboxes (Docker / Judge0), and deterministically verifies outputs.

---

## 2. How TestForge Works

The end-to-end flow from user code to test scorecard proceeds through the following steps:

```text
 User Code Input
       │
       ▼
 Static Code Analysis (AST / Javac / Node syntax check)
       │
       ├──────────────────────────┐
       ▼                          ▼
 IDE Mode (Direct Run)     AI Testing Mode (Generate Tests)
       │                          │
       │                          ▼
       │                   LLM API (Gemini / OpenRouter)
       │                          │
       │                          ▼
       │                   Structured Test Proposals
       │                          │
       │                          ▼
       │                   User Review & Selection
       │                          │
       └──────────────────────────┼──────────────────────────┐
                                  ▼                          ▼
                           Program STDIN Harness      Function Argument Harness
                                  │                          │
                                  └────────────┬─────────────┘
                                               ▼
                                      Sandboxed Execution
                                     (Docker / Judge0 API)
                                               │
                                               ▼
                                      Deterministic Verification
                                   (Expected vs. Actual Output)
                                               │
                                               ▼
                                      Harness Scorecard UI
```

1. **Static Analysis**: Identifies code type (`function` vs. `program`), function names, parameters, and syntax validity.
2. **AI Generation**: Sends source code and structural metadata to Gemini (or OpenRouter fallback) requesting JSON-formatted test cases.
3. **Harness Generation**: If testing a function, TestForge wraps the source code with an executable entry point that invokes the function with generated arguments and prints return values.
4. **Execution & Comparison**: Executes the test cases in an isolated environment with resource restrictions and compares `actual_output` against `expected_output`.

---

## 3. Architecture

TestForge is structured as a decoupled client-server web application.

```text
                     React Frontend (Vercel)
                                │
                                │ REST / JSON
                                ▼
                     FastAPI Backend (Render)
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
      AST Analyzer          AI Service           Executor
    (Python/Java/JS)   (Gemini/OpenRouter)    (Factory Pattern)
                                                    │
                                         ┌──────────┴──────────┐
                                         ▼                     ▼
                                  Docker Executor       Judge0 Executor
                                (Isolated Container)    (Remote REST API)
```

### Frontend
- Built with **React 19** and **Vite**, styled with **Tailwind CSS v4**.
- Uses **Monaco Editor** (`@monaco-editor/react`) for full-featured code editing.
- Implements custom autocompletion (`completionProvider.js`), formatting triggers (`formatter.js`), and local state persistence (`localStorage`).

### Backend
- Built with **FastAPI** (Python 3.11+) for high-performance asynchronous API endpoints.
- Managed using **`uv`** for dependency resolution and virtual environments.
- Enforces request rate limits using **SlowAPI** to protect against abuse.
- Uses **Pydantic v2** schemas for strict request/response data validation.

### Code Execution
- Implements an **Executor Factory Pattern** (`services/executor_factory.py`).
- Supports **Docker Sandboxing** (`docker_executor.py`) with memory, CPU, network, and timeout constraints.
- Supports **Judge0 API** (`judge0_executor.py`) as an external cloud execution option.

### AI Testing Pipeline
- Primary Provider: **Google Gemini API** (`google-genai` SDK using `gemini-3.6-flash`).
- Fallback Provider: **OpenRouter API** (`httpx` AsyncClient calling Qwen/OpenAI models).
- Implements strict error handling to log raw provider errors server-side while returning a gentle, non-technical message (`"AI testing is currently unavailable. Please try again later."`) to the frontend.

---

## 4. Features

### Normal Code Execution (IDE Mode)
- Executes arbitrary user code (Python, Java, JavaScript) directly.
- Displays stdout, stderr, execution status (`completed`, `error`, `timeout`), and execution duration.

### AI Testing Mode
- Generates up to 20 structured test cases in a single request.
- Displays test case cards with editable inputs, arguments, expected outputs, and descriptions.
- Allows users to select individual test cases and run selected harnesses batch-wise.
- Displays a **Harness Scorecard** with pass/fail ratios and detailed output comparison.

### Code Formatting
- Supports instant code formatting.
- **Python**: Formatted on the backend using `black`.
- **JavaScript & Java**: Formatted on the frontend using `prettier` and `prettier-plugin-java`.

### IntelliSense
- In-editor completion items for Python, Java, and JavaScript keywords, standard library methods, and common code patterns.

### Persistent Editor State
- Auto-saves draft code and language selections to `localStorage` (`testforge.editor-state`).
- Restores state on page reloads if saved within 30 minutes.

### Standard Input (STDIN)
- Dedicated STDIN panel for passing multi-line input data to interactive programs.

### Save and Upload
- **Upload File**: Load local code files (`.py`, `.java`, `.js`, `.txt`) into the Monaco editor.
- **Save File**: Download the current editor contents with appropriate file extensions.

### Keyboard Shortcuts
- Press `Ctrl + Enter` (or `Cmd + Enter`) to trigger **Run Code** in IDE Mode or **Run Selected Tests** in AI Testing Mode.

---

## 5. Supported Languages

| Language | Version / Engine | Analysis Strategy | Execution Harness |
|---|---|---|---|
| **Python** | Python 3.11+ | Native `ast` module parsing | AST node inspection & wrapper script |
| **Java** | OpenJDK 17+ | `javac` compilation check & regex method extraction | Generated `Main` class wrapper |
| **JavaScript** | Node.js | Syntax check with `node --check` & regex function detection | Node spread operator (`...args`) harness |
| **HTML** | Browser DOM | Native Monaco HTML syntax & autocompletion | Sandboxed `<iframe>` rendering with internal CSS support |

---

## 6. Project Structure

```text
TestForge/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow
├── backend/
│   ├── main.py                # FastAPI routes, CORS, rate limiting, warm-up
│   ├── pyproject.toml         # Python dependencies & pytest configuration
│   ├── uv.lock                # Locked dependency graph
│   ├── models/
│   │   └── schemas.py         # Pydantic request/response models
│   ├── services/
│   │   ├── ast_analyzer.py    # Multi-language static code analysis
│   │   ├── docker_executor.py # Docker sandbox runner
│   │   ├── executor.py        # Base executor interface
│   │   ├── executor_factory.py# Factory for switching Docker / Judge0
│   │   ├── harness_generator.py# Code wrapper generation for functions
│   │   ├── java_utils.py      # Java parsing & helper utilities
│   │   ├── judge0_executor.py# Judge0 execution runner
│   │   └── test_generator.py  # Gemini & OpenRouter LLM integration
│   └── tests/                 # Backend test suite (pytest)
├── frontend/
│   ├── index.html             # HTML entry point
│   ├── package.json           # Frontend dependencies & scripts
│   ├── vite.config.js         # Vite build configuration
│   └── src/
│       ├── App.jsx            # Main workbench component & state
│       ├── main.jsx           # React DOM root
│       ├── components/        # UI components (CodeEditor, TestControls, etc.)
│       └── services/          # API services, formatter, completion provider
├── .env.example               # Root reference environment template
├── README.md                  # Project introduction
└── Documentation.md           # Developer documentation & technical manual
```

---

## 7. Local Development

### Prerequisites
- **Node.js**: v18 or v20+
- **Python**: 3.11 or higher
- **`uv`**: Fast Python package installer (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh`)
- **Docker Desktop** (Required if using `EXECUTOR=docker`)

### Clone the Repository
```bash
git clone https://github.com/kamalesh2602/TestForge.git
cd TestForge
```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies with `uv`:
   ```bash
   uv sync
   ```
3. Create a `.env` file in `backend/`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   LLM_PROVIDER=gemini
   EXECUTOR=docker
   FRONTEND_URL=http://localhost:5173
   ```
4. Run backend unit tests:
   - **Linux / macOS**:
     ```bash
     PYTHONPATH=. uv run pytest
     ```
   - **Windows (PowerShell)**:
     ```powershell
     $env:PYTHONPATH="."; uv run pytest
     ```
5. Start the FastAPI development server:
   ```bash
   uv run uvicorn main:app --reload
   ```
   *Alternative if `uv` binary path is not directly executable in your terminal:*
   ```bash
   python -m uvicorn main:app --reload
   ```
   The backend API will be running at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `frontend/` (optional for defaults):
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at `http://localhost:5173`.

---

## 8. Environment Variables

### Backend Variables (`backend/.env`)

| Variable | Required? | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Required* | None | API Key for Google Gemini (*Required when `LLM_PROVIDER=gemini`). |
| `OPENROUTER_API_KEY` | Optional | None | API Key for OpenRouter fallback. |
| `LLM_PROVIDER` | Optional | `gemini` | Primary AI provider (`gemini` or `openrouter`). |
| `GEMINI_MODEL` | Optional | `gemini-3.6-flash` | Gemini model name identifier. |
| `EXECUTOR` | Optional | `docker` | Code execution strategy (`docker` or `judge0`). |
| `JUDGE0_API_URL` | Optional | None | URL of Judge0 service if `EXECUTOR=judge0`. |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | Comma-separated CORS allowed origin URLs. |

### Frontend Variables (`frontend/.env`)

| Variable | Required? | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Optional | `http://localhost:8000` | Backend API base URL endpoint. |

---

## 9. API Endpoints

### `GET /health`
- **Purpose**: Lightweight health check and backend warm-up mechanism. Performs zero expensive database or external API operations.
- **Request**: `GET /health`
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

### `POST /execute`
- **Purpose**: Executes arbitrary Python, Java, or JavaScript code.
- **Rate Limit**: 10 requests / minute / client.
- **Request Body**:
  ```json
  {
    "code": "print('Hello World')",
    "stdin": "",
    "language": "python"
  }
  ```
- **Response**:
  ```json
  {
    "output": "Hello World\n",
    "status": "completed",
    "execution_time": 0.12
  }
  ```

### `POST /generate-tests`
- **Purpose**: Generates AI test cases for a given source snippet.
- **Rate Limit**: 5 requests / minute / client. Max test count: 20.
- **Request Body**:
  ```json
  {
    "code": "def add(a, b):\n    return a + b",
    "language": "python",
    "count": 3,
    "description": "Include negative numbers"
  }
  ```
- **Response**:
  ```json
  {
    "code_type": "function",
    "tests": [
      {
        "arguments": [2, 3],
        "expected_output": "5",
        "description": "Positive integer addition"
      },
      {
        "arguments": [-1, 1],
        "expected_output": "0",
        "description": "Negative integer addition"
      }
    ]
  }
  ```

### `POST /run-tests`
- **Purpose**: Runs generated/custom test cases against the code inside the execution sandbox.
- **Rate Limit**: 10 requests / minute / client. Max test cases: 20 per request.
- **Request Body**:
  ```json
  {
    "code": "def add(a, b):\n    return a + b",
    "language": "python",
    "tests": [
      {
        "arguments": [2, 3],
        "expected_output": "5",
        "description": "Positive addition"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "total": 1,
    "passed": 1,
    "results": [
      {
        "input": [2, 3],
        "expected_output": "5",
        "actual_output": "5",
        "status": "passed",
        "description": "Positive addition"
      }
    ]
  }
  ```

---

## 10. Testing

### Backend Tests
The backend uses `pytest` for unit and integration testing:
```bash
cd backend
PYTHONPATH=. uv run pytest
```
Test suite coverage includes:
- AST analysis logic (`test_ast_analyzer.py`)
- Schema validation (`test_schemas.py`)
- Function harness generation (`test_harness_generator.py`)
- Java parsing utilities (`test_java_utils.py`)
- Code formatting endpoints (`test_format.py`)
- Health / warm-up endpoint (`test_health.py`)
- AI availability & error handling (`test_ai_availability.py`)

### Frontend Build
Verify that the frontend builds without compilation or bundling errors:
```bash
cd frontend
npm run build
```

---

## 11. CI/CD

Continuous Integration is powered by **GitHub Actions** (`.github/workflows/ci.yml`).

On every push or pull request to the `main` branch, the CI pipeline automatically runs two parallel jobs:

1. **Backend Tests Job** (`ubuntu-latest`):
   - Sets up Python 3.11.
   - Installs `uv` via `astral-sh/setup-uv`.
   - Runs `uv sync --frozen`.
   - Executes `uv run pytest` with `PYTHONPATH=.`.

2. **Frontend Build Job** (`ubuntu-latest`):
   - Sets up Node.js 20.
   - Runs `npm ci` in `frontend/`.
   - Executes `npm run build` to ensure production bundle integrity.

*Note: Deployment is managed separately via direct Git integration with Vercel and Render.*

---

## 12. Deployment

### Frontend Deployment (Vercel)
- Deployed on **Vercel**: [https://test-forge-ebon.vercel.app/](https://test-forge-ebon.vercel.app/)
- Automatically builds and deploys upon commits pushed to `main`.
- Configured with environment variable `VITE_API_URL` pointing to the Render backend service URL.

### Backend Deployment (Render)
- Deployed on **Render** Web Services.
- Runs `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **Render Free Tier Warm-up**: Render Free web services automatically spin down after 15 minutes of inactivity. TestForge includes an automatic warm-up mechanism: upon initial frontend load, a non-blocking background `GET /health` request is sent to wake up the backend before the user executes their first test.

---

## 13. Limitations and Considerations

- **Free Tier Cold Starts**: Render Free backend instances may take up to 50 seconds to wake up if dormant. The `/health` warm-up mechanism mitigates this delay upon opening the app.
- **LLM Rate Limits & Quotas**: AI test generation relies on external API quotas. If quota or token limits are exceeded, TestForge catches the failure, logs errors server-side, and displays a friendly user notification (`"AI testing is currently unavailable. Please try again later."`).
- **Sandboxed Scope**: Execution containers strictly isolate network access, restrict memory to 128MB, limit CPU usage to 0.5 cores, and enforce execution timeouts to prevent abuse.
- **Stateless Workbench**: TestForge does not enforce persistent user logins or database storage; editor drafts are stored locally in the browser's `localStorage`.

---

## 14. Future Improvements

- Add support for C, C++, and Go execution harnesses.
- Provide custom timeout configuration controls in IDE Mode.
- Support multi-file project analysis and test generation.
- Implement user accounts and persistent test suite execution history.

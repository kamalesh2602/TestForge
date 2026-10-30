# Contributing to TestForge

Thank you for your interest in contributing to TestForge! Contributions of all kinds are welcome, including bug fixes, feature improvements, code quality enhancements, and documentation updates.

Please follow the guidelines below to make the contribution process smooth and consistent.

## 1. Getting Started

### Prerequisites

Make sure you have the following installed:

- Git
- Node.js 20+
- npm
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- Docker Desktop (required when using the Docker execution engine)

### Fork and Clone

1. Fork the [TestForge repository](https://github.com/kamalesh2602/TestForge).
2. Clone your fork:

   ```bash
   git clone https://github.com/<your-username>/TestForge.git
   cd TestForge
   ```

3. Add the original repository as an upstream remote:

   ```bash
   git remote add upstream https://github.com/kamalesh2602/TestForge.git
   ```

## 2. Local Development Setup

TestForge supports both Docker Compose and manual development setups.

### Option A: Docker Compose

1. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Configure the required environment variables in `.env`.

3. Start the application:

   ```bash
   docker compose up --build
   ```

4. Access the application:

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API documentation: http://localhost:8000/docs

To stop the containers:

```bash
docker compose down
```

### Option B: Manual Setup

**Backend**

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   uv sync
   ```

3. Create a `.env` file using the provided `backend/.env.example` as a reference.

4. Start the development server:

   ```bash
   uv run uvicorn main:app --reload
   ```

The backend will be available at http://localhost:8000.

**Frontend**

Open a separate terminal:

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file using `frontend/.env.example` as a reference.

4. Start the development server:

   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173.

## 3. Environment Configuration

- Use the existing `.env.example` files as references.
- Never commit actual API keys, credentials, or environment files.
- Keep sensitive configuration in environment variables.
- AI test generation requires a configured Gemini or OpenRouter API key.
- Code execution can use the configured Judge0 or Docker execution engine.

If you introduce a new environment variable, document its purpose and provide a safe example value in the appropriate example file.

## 4. Contribution Workflow

Before starting development:

1. Check existing issues and pull requests to avoid duplicate work.
2. For significant changes, open an issue first to discuss the proposed approach.
3. Keep contributions focused on a single feature or fix.

Create a descriptive branch from the latest `main` branch:

```bash
git checkout main
git pull upstream main
git checkout -b <branch-name>
```

Suggested branch naming conventions:

| Prefix | Purpose |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `perf/` | Performance improvements |
| `security/` | Security enhancements |
| `test/` | Test-related changes |
| `docs/` | Documentation updates |

Examples:

```bash
git checkout -b feat/add-language-support
git checkout -b fix/editor-persistence
git checkout -b refactor/execution-service
```

## 5. Coding Guidelines

### General

- Follow the existing project structure and coding patterns.
- Keep changes focused and avoid unrelated modifications.
- Prefer readable, maintainable code over unnecessary complexity.
- Avoid introducing additional dependencies unless they are justified.
- Handle errors explicitly and provide meaningful error messages.
- Do not commit generated files, build artifacts, or local environment files.

### Frontend

- Use the existing React and Vite setup.
- Prefer reusable components where appropriate.
- Follow the existing Tailwind CSS conventions.
- Keep API interactions within the existing service layer where practical.
- Avoid unnecessary UI changes outside the scope of your contribution.

### Backend

- Follow the existing FastAPI service and routing structure.
- Use Pydantic schemas for request and response validation.
- Keep execution, analysis, and AI-related logic within their appropriate service modules.
- Handle external API failures and execution errors safely.
- Preserve existing API contracts unless a change is intentional and documented.

### Code Execution and Security

TestForge executes user-submitted code. Changes involving execution or sandboxing require particular care.

- Never execute untrusted code directly inside the API process.
- Do not expose environment variables, API keys, or host filesystem contents to executed programs.
- Preserve existing execution timeouts and resource restrictions.
- Do not weaken Docker isolation or security configurations.
- Validate user input and enforce appropriate size limits.
- Avoid logging sensitive user data or credentials.

Security vulnerabilities should be reported privately rather than disclosed through public issues.

## 6. Testing and Validation

Run the relevant checks before submitting a pull request.

### Backend Tests

From the `backend/` directory:

```bash
uv run pytest
```

On Linux/macOS, if the project root is not already on the Python import path:

```bash
PYTHONPATH=. uv run pytest
```

On Windows PowerShell:

```powershell
$env:PYTHONPATH="."
uv run pytest
```

### Frontend Tests

From the `frontend/` directory:

```bash
npm test
```

### Frontend Linting

```bash
npm run lint
```

### Frontend Production Build

```bash
npm run build
```

Please add or update relevant tests when introducing new functionality or fixing bugs.

The GitHub Actions workflow also runs backend tests and checks the frontend production build for pull requests targeting `main`.

## 7. Commit Guidelines

Use clear, descriptive commit messages. The following conventional commit prefixes are recommended:

| Prefix | Purpose |
|---|---|
| `feat:` | New functionality |
| `fix:` | Bug fixes |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvements |
| `test:` | Test additions or updates |
| `docs:` | Documentation changes |
| `chore:` | Maintenance tasks |
| `security:` | Security improvements |

Examples:

```bash
git commit -m "feat: add support for a new language"
git commit -m "fix: handle execution timeout correctly"
git commit -m "test: add coverage for code execution"
git commit -m "docs: update contribution guidelines"
```

Keep commits focused and avoid combining unrelated changes.

## 8. Submitting a Pull Request

1. Push your branch to your fork:

   ```bash
   git push origin <branch-name>
   ```

2. Open a pull request against the original repository's `main` branch.

3. Provide a clear description containing:

   - **Summary:** What does this change introduce?
   - **Motivation:** Why is this change needed?
   - **Implementation:** What was changed?
   - **Testing:** What checks were performed?
   - **Screenshots:** Include them when UI changes are involved.

4. Link related issues using GitHub keywords such as `Closes #12` where applicable.

5. Address review feedback and update your pull request when necessary.

Please keep pull requests focused, reviewable, and limited to the intended scope.

## 9. Reporting Issues

When reporting a bug, include:

- A clear description of the problem.
- Steps to reproduce it.
- Expected and actual behavior.
- Relevant error messages or logs.
- Browser, operating system, and environment details where applicable.

For feature requests, explain the problem the feature would solve and provide a proposed solution when possible.

## 10. License

By contributing to TestForge, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

---

Thank you for helping improve TestForge! Every meaningful contribution is appreciated.

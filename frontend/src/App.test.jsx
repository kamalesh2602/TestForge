import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, language }) => (
    <div data-testid="mock-monaco" data-language={language}>
      <pre>{value}</pre>
    </div>
  ),
}));

vi.mock("./services/api", () => ({
  warmUpBackend: vi.fn(),
  generateTests: vi.fn(),
  runTests: vi.fn(),
  executeCode: vi.fn(),
}));

describe("App Root Component (frontend/src/App.jsx)", () => {
  it("renders header brand, view navigation switcher, and workbench panels", () => {
    const html = renderToString(<App />);

    expect(html).toContain("Forge");
    expect(html).toContain("Workbench");
    expect(html).toContain("Resources");
    expect(html).toContain("Source Code");
    expect(html).toContain("Execution Console");
  });

  it("renders starter Python code by default", () => {
    const html = renderToString(<App />);

    expect(html).toContain("Welcome to Python");
    expect(html).toContain("print(&quot;Hello world&quot;)");
  });
});

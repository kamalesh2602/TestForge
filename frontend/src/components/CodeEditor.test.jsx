import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import CodeEditor from "./CodeEditor.jsx";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, language }) => (
    <div data-testid="mock-monaco" data-language={language}>
      <pre>{value}</pre>
    </div>
  ),
}));

describe("CodeEditor Component", () => {
  const defaultProps = {
    code: "print('Hello TestForge')",
    setCode: vi.fn(),
    language: "python",
    setLanguage: vi.fn(),
    starterCode: { python: "print('start')" },
    setResults: vi.fn(),
    setError: vi.fn(),
    clearTestCases: vi.fn(),
    onReset: vi.fn(),
    onRun: vi.fn(),
    webCode: { html: "<h1>Hi</h1>", css: "body{}", js: "console.log(1)" },
    setWebCode: vi.fn(),
  };

  it("renders editor controls and language selector with supported languages", () => {
    const html = renderToString(<CodeEditor {...defaultProps} />);

    expect(html).toContain("Python");
    expect(html).toContain("Java");
    expect(html).toContain("JavaScript");
    expect(html).toContain("C");
    expect(html).toContain("C++");
    expect(html).toContain("HTML");
    expect(html).toContain("Web");
    expect(html).toContain("Format");
    expect(html).toContain("Save");
  });

  it("renders single Monaco editor container in standard language mode", () => {
    const html = renderToString(<CodeEditor {...defaultProps} language="python" />);
    expect(html).toContain("data-testid=\"mock-monaco\"");
    expect(html).toContain("print(&#x27;Hello TestForge&#x27;)");
  });

  it("renders multi-tab switcher for HTML, CSS, and JS in web application mode", () => {
    const html = renderToString(<CodeEditor {...defaultProps} language="web" />);

    expect(html).toContain("index.html");
    expect(html).toContain("style.css");
    expect(html).toContain("script.js");
  });
});

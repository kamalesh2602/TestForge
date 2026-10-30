import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import NormalExecutionControls from "./NormalExecutionControls.jsx";

describe("NormalExecutionControls Component", () => {
  it("renders Standard Input header for general programming languages", () => {
    const html = renderToString(
      <NormalExecutionControls
        stdin=""
        setStdin={() => {}}
        onExecute={() => {}}
        loading={false}
        code="print('hi')"
        language="python"
      />
    );

    expect(html).toContain("Standard Input (stdin)");
    expect(html).toContain("Optional");
    expect(html).toContain("Run Code");
    expect(html).toContain("Program input...");
  });

  it("renders HTML Web Preview header when language is html or web", () => {
    const htmlHtml = renderToString(
      <NormalExecutionControls
        stdin=""
        setStdin={() => {}}
        onExecute={() => {}}
        loading={false}
        code="<h1>Test</h1>"
        language="html"
      />
    );
    expect(htmlHtml).toContain("HTML Web Preview");

    const htmlWeb = renderToString(
      <NormalExecutionControls
        stdin=""
        setStdin={() => {}}
        onExecute={() => {}}
        loading={false}
        code="<h1>Web</h1>"
        language="web"
      />
    );
    expect(htmlWeb).toContain("Web Browser Preview");
  });

  it("disables Run Code button when code is empty or whitespace", () => {
    const html = renderToString(
      <NormalExecutionControls
        stdin=""
        setStdin={() => {}}
        onExecute={() => {}}
        loading={false}
        code="   "
        language="python"
      />
    );

    expect(html).toContain("disabled");
  });

  it("renders spinner and 'Running...' when loading is true", () => {
    const html = renderToString(
      <NormalExecutionControls
        stdin=""
        setStdin={() => {}}
        onExecute={() => {}}
        loading={true}
        code="print(1)"
        language="python"
      />
    );

    expect(html).toContain("Running...");
    expect(html).toContain("animate-spin");
  });
});

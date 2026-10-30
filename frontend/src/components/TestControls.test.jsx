import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import TestControls from "./TestControls.jsx";

describe("TestControls Component", () => {
  it("renders setup header and inputs with current count and description", () => {
    const html = renderToString(
      <TestControls
        count={5}
        setCount={() => {}}
        description="Check edge cases"
        setDescription={() => {}}
        onGenerate={() => {}}
        loading={false}
        code="def f(): pass"
      />
    );

    expect(html).toContain("Test Synthesis Setup");
    expect(html).toContain("Count");
    expect(html).toContain('value="5"');
    expect(html).toContain("Goal / Instructions");
    expect(html).toContain('value="Check edge cases"');
    expect(html).toContain("Generate Test Cases");
  });

  it("disables generate button when code is empty", () => {
    const html = renderToString(
      <TestControls
        count={5}
        setCount={() => {}}
        description=""
        setDescription={() => {}}
        onGenerate={() => {}}
        loading={false}
        code="   "
      />
    );

    expect(html).toContain("disabled");
  });

  it("renders 'Synthesizing Tests...' when loading is true", () => {
    const html = renderToString(
      <TestControls
        count={3}
        setCount={() => {}}
        description=""
        setDescription={() => {}}
        onGenerate={() => {}}
        loading={true}
        code="def add(a, b): return a + b"
      />
    );

    expect(html).toContain("Synthesizing Tests...");
    expect(html).toContain("disabled");
  });
});

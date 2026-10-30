import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import NormalExecutionResults from "./NormalExecutionResults.jsx";

describe("NormalExecutionResults Component", () => {
  it("renders idle empty state when neither loading nor results are present", () => {
    const html = renderToString(
      <NormalExecutionResults result={null} loading={false} error={null} />
    );

    expect(html).toContain("Execution Console");
    expect(html).toContain("Console is idle. Click &quot;Run Code&quot; to execute.");
  });

  it("renders loading state with spinner while executing", () => {
    const html = renderToString(
      <NormalExecutionResults result={null} loading={true} error={null} />
    );

    expect(html).toContain("Executing program...");
    expect(html).toContain("animate-spin");
  });

  it("renders execution error block when error prop is passed", () => {
    const html = renderToString(
      <NormalExecutionResults
        result={null}
        loading={false}
        error="Memory limit exceeded"
      />
    );

    expect(html).toContain("Execution Error");
    expect(html).toContain("Memory limit exceeded");
  });

  it("renders completed stdout and exit code when execution succeeds", () => {
    const result = {
      status: "completed",
      exit_code: 0,
      output: "Hello TestForge!\n",
    };

    const html = renderToString(
      <NormalExecutionResults result={result} loading={false} error={null} />
    );

    expect(html).toContain("completed");
    expect(html).toMatch(/Exit:.*0/);
    expect(html).toContain("Standard Output (stdout)");
    expect(html).toContain("Hello TestForge!\n");
  });

  it("renders 'No output produced.' when output is empty string", () => {
    const result = {
      status: "completed",
      exit_code: 0,
      output: "",
    };

    const html = renderToString(
      <NormalExecutionResults result={result} loading={false} error={null} />
    );

    expect(html).toContain("No output produced.");
  });

  it("renders Standard Error block when result contains error output", () => {
    const result = {
      status: "error",
      exit_code: 1,
      output: "",
      error: "ZeroDivisionError: division by zero",
    };

    const html = renderToString(
      <NormalExecutionResults result={result} loading={false} error={null} />
    );

    expect(html).toContain("Standard Error (stderr)");
    expect(html).toContain("ZeroDivisionError: division by zero");
  });
});

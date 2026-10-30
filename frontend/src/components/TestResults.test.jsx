import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import TestResults from "./TestResults.jsx";
import TestResultCard from "./TestResultCard.jsx";

describe("TestResults and TestResultCard Components", () => {
  it("renders loading message when loading is true", () => {
    const html = renderToString(
      <TestResults results={null} loading={true} error={null} />
    );
    expect(html).toContain("Executing test harness...");
  });

  it("renders error message when error is passed", () => {
    const html = renderToString(
      <TestResults results={null} loading={false} error="Compilation failed" />
    );
    expect(html).toContain("Compilation failed");
  });

  it("returns null when results is null and not loading", () => {
    const html = renderToString(
      <TestResults results={null} loading={false} error={null} />
    );
    expect(html).toBe("");
  });

  it("renders scorecard with 100% Passed when all tests pass", () => {
    const results = {
      passed: 2,
      total: 2,
      results: [
        {
          input: [1, 2],
          expected_output: "3",
          actual_output: "3",
          status: "passed",
        },
        {
          input: [0, 0],
          expected_output: "0",
          actual_output: "0",
          status: "passed",
        },
      ],
    };

    const html = renderToString(
      <TestResults results={results} loading={false} error={null} />
    );

    expect(html).toContain("Harness Scorecard");
    expect(html).toMatch(/2.*\/.*2/);
    expect(html).toContain("100% Passed");
    expect(html).toMatch(/Test #.*1/);
    expect(html).toMatch(/Test #.*2/);
  });

  it("renders scorecard with Failures badge when some tests fail", () => {
    const results = {
      passed: 1,
      total: 2,
      results: [
        {
          input: "5",
          expected_output: "25",
          actual_output: "25",
          status: "passed",
        },
        {
          input: "-1",
          expected_output: "1",
          actual_output: "-1",
          status: "failed",
        },
      ],
    };

    const html = renderToString(
      <TestResults results={results} loading={false} error={null} />
    );

    expect(html).toMatch(/1.*\/.*2/);
    expect(html).toContain("Failures");
    expect(html).toContain("failed");
  });

  it("TestResultCard renders input, expected, and actual outputs with styling", () => {
    const result = {
      input: [10, 20],
      expected_output: "30",
      actual_output: "30",
      status: "passed",
    };

    const html = renderToString(<TestResultCard result={result} index={0} />);

    expect(html).toMatch(/Test #.*1/);
    expect(html).toContain("passed");
    expect(html).toContain("[10,20]");
    expect(html).toContain("30");
  });
});

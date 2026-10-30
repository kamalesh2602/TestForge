import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import TestCaseList from "./TestCaseList.jsx";

describe("TestCaseList Component", () => {
  it("returns null when codeType is not provided", () => {
    const html = renderToString(
      <TestCaseList
        testCases={[]}
        setTestCases={() => {}}
        codeType={null}
        onRunSelected={() => {}}
        loading={false}
      />
    );
    expect(html).toBe("");
  });

  it("renders function mode with arguments fields and selection count", () => {
    const testCases = [
      {
        id: "1",
        selected: true,
        arguments: "[2, 3]",
        expectedOutput: "5",
        description: "Test 1",
      },
      {
        id: "2",
        selected: false,
        arguments: "[-1, 1]",
        expectedOutput: "0",
        description: "Test 2",
      },
    ];

    const html = renderToString(
      <TestCaseList
        testCases={testCases}
        setTestCases={() => {}}
        codeType="function"
        onRunSelected={() => {}}
        loading={false}
      />
    );

    expect(html).toContain("Generated Suite");
    expect(html).toMatch(/1.*of.*2.*selected/);
    expect(html).toContain("Select All");
    expect(html).toContain("Deselect");
    expect(html).toContain("Arguments (JSON Array)");
    expect(html).toContain("[2, 3]");
    expect(html).toContain("[-1, 1]");
    expect(html).toContain("Expected Output");
    expect(html).toContain("Run Selected (1)");
    expect(html).toContain("+ Add Test");
  });

  it("renders program mode with Input textarea instead of Arguments", () => {
    const testCases = [
      {
        id: "1",
        selected: true,
        input: "42\n",
        expectedOutput: "84",
        description: "Input doubling",
      },
    ];

    const html = renderToString(
      <TestCaseList
        testCases={testCases}
        setTestCases={() => {}}
        codeType="program"
        onRunSelected={() => {}}
        loading={false}
      />
    );

    expect(html).toContain("Input");
    expect(html).not.toContain("Arguments (JSON Array)");
    expect(html).toContain("42\n");
  });

  it("disables Run Selected when loading or when no tests are selected", () => {
    const testCases = [
      {
        id: "1",
        selected: false,
        input: "1",
        expectedOutput: "1",
      },
    ];

    const html = renderToString(
      <TestCaseList
        testCases={testCases}
        setTestCases={() => {}}
        codeType="program"
        onRunSelected={() => {}}
        loading={false}
      />
    );

    expect(html).toContain("Run Selected (0)");
    expect(html).toContain("disabled");
  });
});

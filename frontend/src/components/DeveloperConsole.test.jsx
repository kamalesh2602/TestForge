import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import DeveloperConsole from "./DeveloperConsole.jsx";

describe("DeveloperConsole Component", () => {
  it("renders empty state placeholder when logs list is empty", () => {
    const html = renderToString(
      <DeveloperConsole
        logs={[]}
        onClear={() => {}}
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    expect(html).toContain("Developer Console");
    expect(html).toContain("Console is empty.");
    expect(html).toContain("Output from console.log(), info, warn, error, and runtime errors will appear here.");
    expect(html).toContain("disabled"); // Clear button disabled
  });

  it("renders log count and error/warn badges correctly", () => {
    const logs = [
      { id: "1", level: "log", args: [{ type: "string", text: "Regular log" }] },
      { id: "2", level: "warn", args: [{ type: "string", text: "A warning" }] },
      { id: "3", level: "error", args: [{ type: "string", text: "First error" }] },
      { id: "4", level: "error", args: [{ type: "string", text: "Second error" }] },
    ];

    const html = renderToString(
      <DeveloperConsole
        logs={logs}
        onClear={() => {}}
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    expect(html).toContain(">4<"); // Total log count badge
    expect(html).toContain("errors"); // errors badge rendered
    expect(html).toContain("warn"); // warn badge rendered
    expect(html).toContain("Regular log");
    expect(html).toContain("A warning");
    expect(html).toContain("First error");
    expect(html).toContain("Second error");
  });

  it("renders multiple arguments with proper data types", () => {
    const logs = [
      {
        id: "1",
        level: "log",
        args: [
          { type: "string", text: "User:" },
          { type: "number", text: "42" },
          { type: "boolean", text: "true" },
          { type: "null", text: "null" },
          { type: "undefined", text: "undefined" },
          { type: "function", text: "ƒ myFunc()" },
          { type: "element", text: "<button#btn.primary>" },
        ],
      },
    ];

    const html = renderToString(
      <DeveloperConsole
        logs={logs}
        onClear={() => {}}
        isCollapsed={false}
      />
    );

    expect(html).toContain("User:");
    expect(html).toContain("42");
    expect(html).toContain("true");
    expect(html).toContain("null");
    expect(html).toContain("undefined");
    expect(html).toContain("ƒ myFunc()");
    expect(html).toContain("&lt;button#btn.primary&gt;");
  });

  it("renders multiline formatted object in <pre> tag", () => {
    const multilineJson = '{\n  "title": "TestForge",\n  "status": "ready"\n}';
    const logs = [
      {
        id: "1",
        level: "log",
        args: [{ type: "object", text: multilineJson }],
      },
    ];

    const html = renderToString(
      <DeveloperConsole
        logs={logs}
        onClear={() => {}}
        isCollapsed={false}
      />
    );

    expect(html).toContain("<pre");
    expect(html).toContain("&quot;title&quot;: &quot;TestForge&quot;");
  });

  it("hides log messages container when isCollapsed is true", () => {
    const logs = [
      { id: "1", level: "log", args: [{ type: "string", text: "Hidden message" }] },
    ];

    const html = renderToString(
      <DeveloperConsole
        logs={logs}
        onClear={() => {}}
        isCollapsed={true}
        onToggleCollapse={() => {}}
      />
    );

    expect(html).toContain("Developer Console");
    expect(html).toContain("Expand console");
    expect(html).not.toContain("Hidden message");
  });

  it("renders timestamps when present in log entry", () => {
    const timestamp = 1700000000000;
    const logs = [
      {
        id: "1",
        level: "info",
        args: [{ type: "string", text: "With timestamp" }],
        timestamp,
      },
    ];

    const html = renderToString(
      <DeveloperConsole
        logs={logs}
        onClear={() => {}}
        isCollapsed={false}
      />
    );

    expect(html).toContain("With timestamp");
    // Verify timestamp span is rendered
    expect(html).toContain("shrink-0 pl-2 font-mono text-[10px]");
  });
});

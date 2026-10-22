import { describe, it, expect, vi } from "vitest";
import { buildPreviewHtml, generateInterceptorScript } from "./htmlConsoleInterceptor.js";

describe("HTML Console Interceptor", () => {
  describe("buildPreviewHtml script injection", () => {
    const previewId = "test_preview_123";

    it("injects interceptor script immediately after opening <head> tag", () => {
      const html = `<!DOCTYPE html>
<html>
<head class="meta">
  <title>App</title>
</head>
<body><h1>Hello</h1></body>
</html>`;
      const output = buildPreviewHtml(html, previewId);

      expect(output).toContain('<head class="meta">\n<script id="__testforge_console__">');
      expect(output).toContain(JSON.stringify(previewId));
      expect(output.indexOf('<script id="__testforge_console__">')).toBeGreaterThan(output.indexOf("<head"));
      expect(output.indexOf('<script id="__testforge_console__">')).toBeLessThan(output.indexOf("<title>"));
    });

    it("injects interceptor script immediately after opening <html> tag if <head> is missing", () => {
      const html = `<html lang="en">
<body><h1>No Head Tag</h1></body>
</html>`;
      const output = buildPreviewHtml(html, previewId);

      expect(output).toContain('<html lang="en">\n<script id="__testforge_console__">');
      expect(output.indexOf('<script id="__testforge_console__">')).toBeGreaterThan(output.indexOf("<html"));
      expect(output.indexOf('<script id="__testforge_console__">')).toBeLessThan(output.indexOf("<body"));
    });

    it("injects interceptor script immediately after <!DOCTYPE> tag if html and head are missing", () => {
      const html = `<!DOCTYPE html>
<div>Just a div with doctype</div>`;
      const output = buildPreviewHtml(html, previewId);

      expect(output).toContain('<!DOCTYPE html>\n<script id="__testforge_console__">');
      expect(output.indexOf('<script id="__testforge_console__">')).toBeGreaterThan(output.indexOf("<!DOCTYPE"));
    });

    it("prepends interceptor script when no doctype, html, or head tags exist", () => {
      const html = "<div>Bare HTML Fragment</div>";
      const output = buildPreviewHtml(html, previewId);

      expect(output.startsWith('<script id="__testforge_console__">')).toBe(true);
      expect(output).toContain("Bare HTML Fragment");
    });

    it("handles null or undefined html gracefully", () => {
      const output = buildPreviewHtml(null, previewId);
      expect(output).toContain('<script id="__testforge_console__">');
    });
  });

  describe("generateInterceptorScript structure and behavior", () => {
    it("generates an IIFE containing previewId and console overrides", () => {
      const script = generateInterceptorScript("p_456");

      expect(script).toContain("window.__tf_console_installed__");
      expect(script).toContain('"p_456"');
      expect(script).toContain("MAX_LOGS = 250");
      expect(script).toContain("console.log = function()");
      expect(script).toContain("console.info = function()");
      expect(script).toContain("console.warn = function()");
      expect(script).toContain("console.error = function()");
      expect(script).toContain("window.onerror = function");
      expect(script).toContain("unhandledrejection");
    });

    it("prevents double installation using window.__tf_console_installed__ guard", () => {
      const script = generateInterceptorScript("p_789");
      expect(script).toContain("if (window.__tf_console_installed__) return;");
    });
  });

  describe("Simulated Interceptor execution in sandbox environment", () => {
    function createMockSandbox(previewId) {
      const messages = [];
      const windowMock = {
        parent: {
          postMessage: (msg, targetOrigin) => {
            messages.push({ msg, targetOrigin });
          },
        },
        addEventListener: (event, handler) => {
          windowMock[`on_${event}`] = handler;
        },
      };

      const consoleMock = {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      const script = generateInterceptorScript(previewId);
      const runner = new Function("window", "console", script);
      runner(windowMock, consoleMock);

      return { windowMock, consoleMock, messages };
    }

    it("intercepts console.log with primitive arguments", () => {
      const { consoleMock, messages } = createMockSandbox("preview_test_1");

      consoleMock.log("Hello", 42, true, null, undefined);

      expect(messages).toHaveLength(1);
      const payload = messages[0].msg;
      expect(payload.source).toBe("testforge-html-preview");
      expect(payload.previewId).toBe("preview_test_1");
      expect(payload.level).toBe("log");
      expect(payload.args).toEqual([
        { type: "string", text: "Hello" },
        { type: "number", text: "42" },
        { type: "boolean", text: "true" },
        { type: "null", text: "null" },
        { type: "undefined", text: "undefined" },
      ]);
    });

    it("intercepts console.warn and console.error with distinct levels", () => {
      const { consoleMock, messages } = createMockSandbox("preview_test_2");

      consoleMock.warn("Warning text");
      consoleMock.error("Error text");

      expect(messages).toHaveLength(2);
      expect(messages[0].msg.level).toBe("warn");
      expect(messages[0].msg.args[0]).toEqual({ type: "string", text: "Warning text" });
      expect(messages[1].msg.level).toBe("error");
      expect(messages[1].msg.args[0]).toEqual({ type: "string", text: "Error text" });
    });

    it("handles complex objects and arrays safely", () => {
      const { consoleMock, messages } = createMockSandbox("preview_test_3");

      consoleMock.log({ name: "TestForge", count: 5 });
      consoleMock.log([1, 2, 3]);

      expect(messages).toHaveLength(2);
      expect(messages[0].msg.args[0].type).toBe("object");
      expect(messages[0].msg.args[0].text).toContain('"name":"TestForge"');
      expect(messages[1].msg.args[0].type).toBe("array");
      expect(messages[1].msg.args[0].text).toContain("[1,2,3]");
    });

    it("safely handles circular references without throwing or hanging", () => {
      const { consoleMock, messages } = createMockSandbox("preview_test_4");

      const circularObj = { name: "cycle" };
      circularObj.self = circularObj;

      expect(() => {
        consoleMock.log(circularObj);
      }).not.toThrow();

      expect(messages).toHaveLength(1);
      expect(messages[0].msg.args[0].text).toContain("[Circular]");
    });

    it("safely handles functions, BigInt, and Symbol", () => {
      const { consoleMock, messages } = createMockSandbox("preview_test_5");

      function testFn(a, b) { return a + b; }
      consoleMock.log(testFn, BigInt(12345), Symbol("demo"));

      expect(messages).toHaveLength(1);
      const args = messages[0].msg.args;
      expect(args[0]).toEqual({ type: "function", text: "ƒ testFn()" });
      expect(args[1]).toEqual({ type: "bigint", text: "12345n" });
      expect(args[2]).toEqual({ type: "symbol", text: "Symbol(demo)" });
    });

    it("captures runtime errors via window.onerror", () => {
      const { windowMock, messages } = createMockSandbox("preview_test_err");

      const fakeError = new Error("Uncaught reference error");
      fakeError.name = "ReferenceError";

      windowMock.onerror("ReferenceError: x is not defined", "main.js", 42, 10, fakeError);

      expect(messages).toHaveLength(1);
      const payload = messages[0].msg;
      expect(payload.level).toBe("error");
      expect(payload.args[0].text).toContain("ReferenceError: x is not defined (line 42:10)");
    });

    it("captures unhandled promise rejections", () => {
      const { windowMock, messages } = createMockSandbox("preview_test_rej");

      const fakeRejection = {
        reason: new Error("Network request failed"),
      };

      windowMock.on_unhandledrejection(fakeRejection);

      expect(messages).toHaveLength(1);
      const payload = messages[0].msg;
      expect(payload.level).toBe("error");
      expect(payload.args[0].text).toContain("Uncaught (in promise) Error: Network request failed");
    });

    it("enforces MAX_LOGS = 250 message limit and emits warning on threshold", () => {
      const { consoleMock, messages } = createMockSandbox("preview_test_limit");

      // Emit 260 logs
      for (let i = 0; i < 260; i++) {
        consoleMock.log(`Log message #${i}`);
      }

      // Exactly 250 standard logs + 1 limit truncation warning = 251 messages sent
      expect(messages).toHaveLength(251);

      const warningMessage = messages[250].msg;
      expect(warningMessage.level).toBe("warn");
      expect(warningMessage.args[0].text).toContain("Console message limit (250) reached. Additional logs truncated.");
    });
  });
});

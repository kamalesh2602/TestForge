import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  warmUpBackend,
  generateTests,
  runTests,
  executeCode,
  formatCodeAPI,
} from "./api.js";

describe("API Service (frontend/src/services/api.js)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("warmUpBackend", () => {
    it("calls /health endpoint and ignores failures gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network down"));
      await expect(warmUpBackend()).resolves.toBeUndefined();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/health"),
        { method: "GET" }
      );
    });

    it("does not send duplicate health requests once warmed up", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
      await warmUpBackend();
      expect(globalThis.fetch).not.toHaveBeenCalled(); // isWarmedUp is true from previous call
    });
  });

  describe("generateTests", () => {
    it("constructs correct request and returns json on success", async () => {
      const mockResult = {
        code_type: "function",
        tests: [{ arguments: [1, 2], expected_output: "3" }],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const res = await generateTests("def add(a, b): return a+b", "3", "test note", "python");

      expect(res).toEqual(mockResult);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate-tests"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "def add(a, b): return a+b",
            language: "python",
            count: 3,
            description: "test note",
          }),
        }
      );
    });

    it("throws detailed error message on API failure", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          detail: { message: "AI quota exceeded" },
        }),
      });

      await expect(
        generateTests("print(1)", 1, "", "python")
      ).rejects.toThrow("AI quota exceeded");
    });

    it("falls back to default message if detail.message is missing", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        generateTests("print(1)", 1, "", "python")
      ).rejects.toThrow("Failed to generate tests");
    });
  });

  describe("runTests", () => {
    it("sends tests payload and returns parsed scorecard", async () => {
      const mockResult = {
        total: 1,
        passed: 1,
        results: [{ status: "passed", actual_output: "42" }],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const tests = [{ arguments: [42], expected_output: "42" }];
      const res = await runTests("def f(x): return x", tests, "python");

      expect(res).toEqual(mockResult);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/run-tests"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "def f(x): return x",
            language: "python",
            tests,
          }),
        }
      );
    });

    it("throws formatted error on run-tests failure", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          detail: { message: "Execution sandbox unavailable" },
        }),
      });

      await expect(runTests("code", [], "python")).rejects.toThrow(
        "Execution sandbox unavailable"
      );
    });
  });

  describe("executeCode", () => {
    it("executes code with custom stdin and language", async () => {
      const mockResult = { status: "completed", output: "Hello Alice\n", exit_code: 0 };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const res = await executeCode("name = input(); print(f'Hello {name}')", "Alice", "python");
      expect(res).toEqual(mockResult);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/execute"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "name = input(); print(f'Hello {name}')",
            stdin: "Alice",
            language: "python",
          }),
        }
      );
    });

    it("applies default arguments when stdin and language are omitted", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "completed" }),
      });

      await executeCode("print('default')");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/execute"),
        expect.objectContaining({
          body: JSON.stringify({
            code: "print('default')",
            stdin: "",
            language: "python",
          }),
        })
      );
    });

    it("handles execution API errors with fallback message", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Rate limit exceeded" }),
      });

      await expect(executeCode("print(1)")).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("formatCodeAPI", () => {
    it("calls /format and returns formatted code", async () => {
      const mockResult = { formatted_code: "def add(a, b):\n    return a + b\n" };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const res = await formatCodeAPI("def add(a,b):return a+b", "python");
      expect(res).toEqual(mockResult);
    });

    it("throws error when format fails", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: { message: "Syntax error in python code" } }),
      });

      await expect(formatCodeAPI("def broken(", "python")).rejects.toThrow(
        "Syntax error in python code"
      );
    });
  });
});


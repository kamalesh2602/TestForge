import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSavedEditorState,
  STARTER_CODE,
  EDITOR_STORAGE_KEY,
  EDITOR_STATE_MAX_AGE,
} from "../App.jsx";

describe("Editor State and Persistence", () => {
  let storage = {};

  beforeEach(() => {
    storage = {};
    globalThis.localStorage = {
      getItem: vi.fn((key) => storage[key] ?? null),
      setItem: vi.fn((key, value) => {
        storage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial load when storage is empty", () => {
    it("returns default Python state and starter webCode when localStorage has no data", () => {
      const state = getSavedEditorState();

      expect(state.language).toBe("python");
      expect(state.code).toBe(STARTER_CODE.python);
      expect(state.webCode).toEqual(STARTER_CODE.web);
      expect(localStorage.getItem).toHaveBeenCalledWith(EDITOR_STORAGE_KEY);
    });
  });

  describe("Restoring standard language states within 30 minutes", () => {
    it("restores Python state", () => {
      const pythonState = {
        code: "def custom_func():\n    return 42",
        language: "python",
        timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(pythonState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("python");
      expect(restored.code).toBe("def custom_func():\n    return 42");
    });

    it("restores Java state", () => {
      const javaState = {
        code: "public class Solution { public static void main(String[] args) {} }",
        language: "java",
        timestamp: Date.now() - 10 * 60 * 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(javaState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("java");
      expect(restored.code).toContain("public class Solution");
    });

    it("restores JavaScript state", () => {
      const jsState = {
        code: "console.log(user?.profile?.name);",
        language: "javascript",
        timestamp: Date.now() - 1 * 60 * 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(jsState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("javascript");
      expect(restored.code).toBe("console.log(user?.profile?.name);");
    });

    it("restores C state", () => {
      const cState = {
        code: "#include <stdio.h>\nint main() { printf(\"Test\"); return 0; }",
        language: "c",
        timestamp: Date.now() - 15 * 60 * 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(cState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("c");
      expect(restored.code).toContain("#include <stdio.h>");
    });

    it("restores C++ state", () => {
      const cppState = {
        code: "#include <iostream>\nint main() { std::cout << 42; return 0; }",
        language: "cpp",
        timestamp: Date.now() - 20 * 60 * 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(cppState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("cpp");
      expect(restored.code).toContain("#include <iostream>");
    });

    it("restores standalone HTML state", () => {
      const htmlState = {
        code: "<!DOCTYPE html><html><body><h1>Custom HTML</h1></body></html>",
        language: "html",
        timestamp: Date.now() - 2 * 60 * 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(htmlState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("html");
      expect(restored.code).toContain("<h1>Custom HTML</h1>");
    });
  });

  describe("Restoring combined Web mode with independent editor contents", () => {
    it("restores all three editor tabs (html, css, javascript) and web language", () => {
      const webState = {
        language: "web",
        code: "<h1>Web Title</h1>",
        webCode: {
          html: "<h1>Web Title</h1>",
          css: "h1 { color: #8ce4ff; }",
          javascript: "console.log('web ready');",
        },
        timestamp: Date.now() - 5 * 60 * 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(webState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("web");
      expect(restored.code).toBe("<h1>Web Title</h1>");
      expect(restored.webCode.html).toBe("<h1>Web Title</h1>");
      expect(restored.webCode.css).toBe("h1 { color: #8ce4ff; }");
      expect(restored.webCode.javascript).toBe("console.log('web ready');");
    });

    it("restores legacy web format with htmlCode, cssCode, jsCode properties", () => {
      const legacyWebState = {
        language: "web",
        htmlCode: "<main>Legacy</main>",
        cssCode: "main { padding: 10px; }",
        jsCode: "alert('legacy');",
        timestamp: Date.now() - 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(legacyWebState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("web");
      expect(restored.code).toBe("<main>Legacy</main>");
      expect(restored.webCode.html).toBe("<main>Legacy</main>");
      expect(restored.webCode.css).toBe("main { padding: 10px; }");
      expect(restored.webCode.javascript).toBe("alert('legacy');");
    });
  });

  describe("30-minute expiration period", () => {
    it("discards expired state (> 30 min) and cleans up localStorage", () => {
      const expiredState = {
        code: "x = 100",
        language: "python",
        timestamp: Date.now() - (EDITOR_STATE_MAX_AGE + 1000), // 30 min + 1 sec
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(expiredState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("python");
      expect(restored.code).toBe(STARTER_CODE.python);
      // Key should be removed from storage
      expect(localStorage.removeItem).toHaveBeenCalledWith(EDITOR_STORAGE_KEY);
      expect(storage[EDITOR_STORAGE_KEY]).toBeUndefined();
    });

    it("discards state if timestamp is in the future (negative age)", () => {
      const futureState = {
        code: "x = 200",
        language: "python",
        timestamp: Date.now() + 60 * 1000, // 1 min in the future
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(futureState);

      const restored = getSavedEditorState();
      expect(restored.code).toBe(STARTER_CODE.python);
      expect(localStorage.removeItem).toHaveBeenCalledWith(EDITOR_STORAGE_KEY);
    });

    it("discards state if timestamp is non-finite or missing", () => {
      const invalidTimestampState = {
        code: "x = 300",
        language: "python",
        timestamp: "not-a-number",
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(invalidTimestampState);

      const restored = getSavedEditorState();
      expect(restored.code).toBe(STARTER_CODE.python);
      expect(localStorage.removeItem).toHaveBeenCalledWith(EDITOR_STORAGE_KEY);
    });
  });

  describe("Invalid, malformed, or unsupported data handling", () => {
    it("handles non-JSON data without crashing", () => {
      storage[EDITOR_STORAGE_KEY] = "{malformed json syntax...";

      const restored = getSavedEditorState();
      expect(restored.language).toBe("python");
      expect(restored.code).toBe(STARTER_CODE.python);
    });

    it("handles unsupported language by discarding and falling back to default", () => {
      const unsupportedState = {
        code: "fn main() {}",
        language: "rust",
        timestamp: Date.now() - 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(unsupportedState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("python");
      expect(restored.code).toBe(STARTER_CODE.python);
      expect(localStorage.removeItem).toHaveBeenCalledWith(EDITOR_STORAGE_KEY);
    });

    it("handles non-string code field", () => {
      const badCodeState = {
        code: 12345,
        language: "python",
        timestamp: Date.now() - 1000,
      };
      storage[EDITOR_STORAGE_KEY] = JSON.stringify(badCodeState);

      const restored = getSavedEditorState();
      expect(restored.language).toBe("python");
      expect(restored.code).toBe(STARTER_CODE.python);
    });
  });

  describe("Language preservation across additions", () => {
    it("ensures adding C, C++, and Web does not invalidate previously saved Python, Java, or JS states", () => {
      const languagesToTest = ["python", "java", "javascript", "c", "cpp", "html"];

      for (const lang of languagesToTest) {
        const saved = {
          code: `code for ${lang}`,
          language: lang,
          timestamp: Date.now() - 5000,
        };
        storage[EDITOR_STORAGE_KEY] = JSON.stringify(saved);

        const restored = getSavedEditorState();
        expect(restored.language).toBe(lang);
        expect(restored.code).toBe(`code for ${lang}`);
      }
    });
  });
});

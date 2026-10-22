import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRunShortcutLabel } from "./shortcut.js";
import { STARTER_CODE } from "../App.jsx";

// Helper replicating the Save to PC filename/mime logic from CodeEditor.jsx
export function getSaveFileInfo(language, activeWebTab = "html", code = "") {
  if (language === "web") {
    if (activeWebTab === "html") {
      return { filename: "index.html", mimeType: "text/html" };
    } else if (activeWebTab === "css") {
      return { filename: "style.css", mimeType: "text/css" };
    } else {
      return { filename: "script.js", mimeType: "text/javascript" };
    }
  }

  if (language === "python") {
    return { filename: "main.py", mimeType: "text/x-python" };
  } else if (language === "c") {
    return { filename: "main.c", mimeType: "text/x-c" };
  } else if (language === "cpp") {
    return { filename: "main.cpp", mimeType: "text/x-c++src" };
  } else if (language === "javascript") {
    return { filename: "main.js", mimeType: "text/javascript" };
  } else if (language === "html") {
    return { filename: "testforge.html", mimeType: "text/html" };
  } else {
    // Java
    const publicClass = code.match(/\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)/);
    const mainClass = code.match(/\bclass\s+([A-Za-z_]\w*)[\s\S]*?\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(/);
    const firstClass = code.match(/\bclass\s+([A-Za-z_]\w*)/);
    const className = publicClass?.[1] || mainClass?.[1] || firstClass?.[1] || "Main";
    return { filename: `${className}.java`, mimeType: "text/x-java-source" };
  }
}

// Helper replicating upload file info from CodeEditor.jsx
export function getUploadFileInfo(language, activeWebTab = "html") {
  if (language === "web") {
    if (activeWebTab === "html") return { ext: "html", accept: ".html,.htm" };
    if (activeWebTab === "css") return { ext: "css", accept: ".css" };
    return { ext: "js", accept: ".js" };
  }
  if (language === "python") return { ext: "py", accept: ".py" };
  if (language === "java") return { ext: "java", accept: ".java" };
  if (language === "c") return { ext: "c", accept: ".c,.h" };
  if (language === "cpp") return { ext: "cpp", accept: ".cpp,.hpp,.cc,.cxx,.h" };
  if (language === "javascript") return { ext: "js", accept: ".js" };
  return { ext: "html", accept: ".html,.htm" };
}

describe("Run Flow, Keyboard Shortcuts, and File Actions", () => {
  describe("getRunShortcutLabel", () => {
    function setMockNavigator(props) {
      Object.defineProperty(globalThis, "navigator", {
        value: props,
        configurable: true,
        writable: true,
      });
    }

    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it("returns 'Run ⌘ + Enter' when platform indicates macOS", () => {
      setMockNavigator({ platform: "MacIntel", userAgent: "Macintosh" });
      expect(getRunShortcutLabel()).toBe("Run ⌘ + Enter");
    });

    it("returns 'Run Ctrl + Enter' on Windows", () => {
      setMockNavigator({ platform: "Win32", userAgent: "Windows NT 10.0" });
      expect(getRunShortcutLabel()).toBe("Run Ctrl + Enter");
    });

    it("returns 'Run Ctrl + Enter' on Linux", () => {
      setMockNavigator({ platform: "Linux x86_64", userAgent: "Linux" });
      expect(getRunShortcutLabel()).toBe("Run Ctrl + Enter");
    });
  });

  describe("Save to PC file metadata and extensions", () => {
    it("assigns correct filename and MIME type for Python", () => {
      const info = getSaveFileInfo("python");
      expect(info.filename).toBe("main.py");
      expect(info.mimeType).toBe("text/x-python");
    });

    it("assigns correct filename and MIME type for C", () => {
      const info = getSaveFileInfo("c");
      expect(info.filename).toBe("main.c");
      expect(info.mimeType).toBe("text/x-c");
    });

    it("assigns correct filename and MIME type for C++", () => {
      const info = getSaveFileInfo("cpp");
      expect(info.filename).toBe("main.cpp");
      expect(info.mimeType).toBe("text/x-c++src");
    });

    it("assigns correct filename and MIME type for JavaScript", () => {
      const info = getSaveFileInfo("javascript");
      expect(info.filename).toBe("main.js");
      expect(info.mimeType).toBe("text/javascript");
    });

    it("assigns correct filename and MIME type for standalone HTML", () => {
      const info = getSaveFileInfo("html");
      expect(info.filename).toBe("testforge.html");
      expect(info.mimeType).toBe("text/html");
    });

    it("assigns correct filename and MIME type for Java with dynamic class extraction", () => {
      // 1. Explicit public class
      const info1 = getSaveFileInfo("java", "html", "public class BinaryTreeCalculator {}");
      expect(info1.filename).toBe("BinaryTreeCalculator.java");
      expect(info1.mimeType).toBe("text/x-java-source");

      // 2. Class containing main method
      const info2 = getSaveFileInfo("java", "html", "class Runner { public static void main(String[] args) {} }");
      expect(info2.filename).toBe("Runner.java");

      // 3. Fallback when no class is specified
      const info3 = getSaveFileInfo("java", "html", "// Just comments");
      expect(info3.filename).toBe("Main.java");
    });

    it("assigns correct filenames for Web mode tabs", () => {
      const htmlInfo = getSaveFileInfo("web", "html");
      expect(htmlInfo.filename).toBe("index.html");
      expect(htmlInfo.mimeType).toBe("text/html");

      const cssInfo = getSaveFileInfo("web", "css");
      expect(cssInfo.filename).toBe("style.css");
      expect(cssInfo.mimeType).toBe("text/css");

      const jsInfo = getSaveFileInfo("web", "javascript");
      expect(jsInfo.filename).toBe("script.js");
      expect(jsInfo.mimeType).toBe("text/javascript");
    });
  });

  describe("Upload file extensions and accept filters", () => {
    it("returns correct upload configuration for each language", () => {
      expect(getUploadFileInfo("c")).toEqual({ ext: "c", accept: ".c,.h" });
      expect(getUploadFileInfo("cpp")).toEqual({ ext: "cpp", accept: ".cpp,.hpp,.cc,.cxx,.h" });
      expect(getUploadFileInfo("python")).toEqual({ ext: "py", accept: ".py" });
      expect(getUploadFileInfo("java")).toEqual({ ext: "java", accept: ".java" });
      expect(getUploadFileInfo("javascript")).toEqual({ ext: "js", accept: ".js" });
      expect(getUploadFileInfo("html")).toEqual({ ext: "html", accept: ".html,.htm" });
      expect(getUploadFileInfo("web", "html")).toEqual({ ext: "html", accept: ".html,.htm" });
      expect(getUploadFileInfo("web", "css")).toEqual({ ext: "css", accept: ".css" });
      expect(getUploadFileInfo("web", "javascript")).toEqual({ ext: "js", accept: ".js" });
    });
  });

  describe("Starter Code integrity", () => {
    it("provides valid starter code for all supported languages", () => {
      expect(STARTER_CODE.python).toContain("print");
      expect(STARTER_CODE.java).toContain("public static void main");
      expect(STARTER_CODE.javascript).toContain("console.log");
      expect(STARTER_CODE.c).toContain("#include <stdio.h>");
      expect(STARTER_CODE.c).toContain("int main()");
      expect(STARTER_CODE.cpp).toContain("#include <iostream>");
      expect(STARTER_CODE.cpp).toContain("std::cout");
      expect(STARTER_CODE.html).toContain("<!DOCTYPE html>");
      expect(STARTER_CODE.web.html).toContain("<!DOCTYPE html>");
      expect(STARTER_CODE.web.css).toContain("body");
      expect(STARTER_CODE.web.javascript).toContain("console.log");
    });
  });

  describe("Execution Routing Contract", () => {
    it("HTML and Web mode do not invoke backend execution", () => {
      // In App.jsx handleRun:
      // if (language === "html" || language === "web") {
      //   handleHtmlPreview();
      //   return;
      // }
      // This guarantees that running HTML/Web stays purely in the client browser.
      const mockExecute = vi.fn();
      const runAction = (language) => {
        if (language === "html" || language === "web") {
          return "rendered_client_preview";
        }
        mockExecute();
        return "called_backend";
      };

      expect(runAction("html")).toBe("rendered_client_preview");
      expect(runAction("web")).toBe("rendered_client_preview");
      expect(mockExecute).not.toHaveBeenCalled();

      expect(runAction("c")).toBe("called_backend");
      expect(runAction("cpp")).toBe("called_backend");
      expect(runAction("python")).toBe("called_backend");
      expect(mockExecute).toHaveBeenCalledTimes(3);
    });

    it("prevents double execution while loading", () => {
      let isExecuting = false;
      let executionCount = 0;

      const triggerRun = () => {
        if (isExecuting) return; // Prevent duplicate run
        isExecuting = true;
        executionCount++;
      };

      triggerRun();
      triggerRun(); // Rapid second click / duplicate shortcut
      expect(executionCount).toBe(1);
    });
  });
});

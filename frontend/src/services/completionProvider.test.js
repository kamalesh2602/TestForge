import { describe, it, expect, vi } from "vitest";
import { registerCompletionProviders } from "./completionProvider.js";

describe("Monaco Completion Provider (frontend/src/services/completionProvider.js)", () => {
  it("registers Python and Java completion providers with Monaco", () => {
    const providers = {};

    const mockMonaco = {
      languages: {
        registerCompletionItemProvider: vi.fn((lang, provider) => {
          providers[lang] = provider;
        }),
        CompletionItemKind: {
          Keyword: 1,
          Function: 2,
          Class: 3,
          Variable: 4,
          Method: 5,
          Snippet: 6,
        },
        CompletionItemInsertTextRule: {
          InsertAsSnippet: 4,
        },
      },
    };

    registerCompletionProviders(mockMonaco);

    // Verify registrations
    expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      "python",
      expect.objectContaining({
        triggerCharacters: [".", " "],
        provideCompletionItems: expect.any(Function),
      })
    );

    expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      "java",
      expect.objectContaining({
        triggerCharacters: [".", " "],
        provideCompletionItems: expect.any(Function),
      })
    );

    // Test Python provider general keywords and variables
    const pythonProvider = providers["python"];
    const mockPyModel = {
      getWordUntilPosition: () => ({ startColumn: 1, endColumn: 4 }),
      getValueInRange: () => "pri",
      getValue: () => "class Solution:\n    val = 10\n",
    };
    const pyPosition = { lineNumber: 1, column: 4 };

    const pyResult = pythonProvider.provideCompletionItems(mockPyModel, pyPosition);
    expect(pyResult.suggestions).toBeDefined();
    expect(pyResult.suggestions.length).toBeGreaterThan(0);

    const labels = pyResult.suggestions.map((s) => s.label);
    expect(labels).toContain("def");
    expect(labels).toContain("class");
    expect(labels).toContain("print");
    expect(labels).toContain("Solution"); // Document user class
    expect(labels).toContain("val"); // Document user variable

    // Test Python dot completion
    const mockPyDotModel = {
      getWordUntilPosition: () => ({ startColumn: 5, endColumn: 5 }),
      getValueInRange: () => "math.",
      getValue: () => "import math\nmath.",
    };
    const pyDotResult = pythonProvider.provideCompletionItems(mockPyDotModel, { lineNumber: 2, column: 6 });
    const pyDotLabels = pyDotResult.suggestions.map((s) => s.label);
    expect(pyDotLabels).toContain("sqrt");
    expect(pyDotLabels).toContain("pi");

    // Test Java provider keywords and methods
    const javaProvider = providers["java"];
    const mockJavaModel = {
      getWordUntilPosition: () => ({ startColumn: 1, endColumn: 4 }),
      getValueInRange: () => "pub",
      getValue: () => "public class MyClass {\n    public void computeSum() {}\n}\n",
    };
    const javaPosition = { lineNumber: 1, column: 4 };

    const javaResult = javaProvider.provideCompletionItems(mockJavaModel, javaPosition);
    expect(javaResult.suggestions).toBeDefined();
    const javaLabels = javaResult.suggestions.map((s) => s.label);
    expect(javaLabels).toContain("public");
    expect(javaLabels).toContain("class");
    expect(javaLabels).toContain("MyClass"); // Document user class
    expect(javaLabels).toContain("computeSum"); // Document user method

    // Test Java dot completion
    const mockJavaDotModel = {
      getWordUntilPosition: () => ({ startColumn: 7, endColumn: 7 }),
      getValueInRange: () => "System.",
      getValue: () => "System.",
    };
    const javaDotResult = javaProvider.provideCompletionItems(mockJavaDotModel, { lineNumber: 1, column: 8 });
    const javaDotLabels = javaDotResult.suggestions.map((s) => s.label);
    expect(javaDotLabels).toContain("out");
    expect(javaDotLabels).toContain("err");
  });
});


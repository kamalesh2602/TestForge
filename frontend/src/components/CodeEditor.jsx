import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import Tooltip from "./Tooltip";
import { formatCode } from "../services/formatter";

function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  starterCode,
  setResults,
  setError,
  clearTestCases,
  onReset,
  onRun,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState("");
  const isSavingRef = useRef(false);
  const saveFrame = useRef(null);
  const onRunRef = useRef(onRun);
  const registeredProviders = useRef(false);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    return () => window.cancelAnimationFrame(saveFrame.current);
  }, []);

  useEffect(() => {
    if (!formatError) return undefined;
    const timer = window.setTimeout(() => {
      setFormatError("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [formatError]);

  const handleEditorMount = (editor, monaco) => {
    editor.addAction({
      id: "run-code-action",
      label: "Run Code",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter,
      ],
      run: () => {
        onRunRef.current?.();
      },
    });

    if (!registeredProviders.current) {
      registeredProviders.current = true;
      ["javascript", "java", "python"].forEach((langId) => {
        monaco.languages.registerDocumentFormattingEditProvider(langId, {
          async provideDocumentFormattingEdits(model) {
            try {
              const text = model.getValue();
              const formatted = await formatCode(text, langId);
              return [
                {
                  range: model.getFullModelRange(),
                  text: formatted,
                },
              ];
            } catch {
              return [];
            }
          },
        });
      });
    }
  };

  const handleFormat = async () => {
    if (isFormatting || !code || !code.trim()) return;

    setIsFormatting(true);
    setFormatError("");

    try {
      const formatted = await formatCode(code, language);
      if (formatted !== undefined && formatted !== null) {
        setCode(formatted);
      }
    } catch (err) {
      setFormatError(err.message || "Failed to format code");
    } finally {
      setIsFormatting(false);
    }
  };

  const getJavaFilename = () => {
    const publicClass = code.match(
      /\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)/
    );
    const mainClass = code.match(
      /\bclass\s+([A-Za-z_]\w*)[\s\S]*?\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(/
    );
    const firstClass = code.match(/\bclass\s+([A-Za-z_]\w*)/);
    const className = publicClass?.[1] || mainClass?.[1] || firstClass?.[1] || "Main";

    return `${className}.java`;
  };

  const handleSave = () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);

    saveFrame.current = window.requestAnimationFrame(() => {
      try {
        const filename =
          language === "python"
            ? "main.py"
            : language === "javascript"
              ? "main.js"
              : getJavaFilename();
        const blob = new Blob([code], {
          type:
            language === "python"
              ? "text/x-python"
              : language === "javascript"
                ? "text/javascript"
                : "text/x-java-source",
        });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f172a]">
      {/* Editor Top Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#1e293b] px-4 overflow-hidden">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF] shrink-0">
          Source Code
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset editor"
            className="flex h-7 w-7 items-center justify-center rounded border border-[#1e293b] bg-[#1e293b] text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => {
              const newLanguage = e.target.value;

              setLanguage(newLanguage);
              setCode(starterCode?.[newLanguage] ?? "");
              setFormatError("");

              // Clear previous results/errors/test cases
              setResults(null);
              setError("");
              clearTestCases();
            }}
            className="rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1 font-mono text-xs font-bold text-[#FEEE91] outline-none transition focus:border-[#8CE4FF] cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>

          {/* Upload File */}
          <label className="cursor-pointer rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF]">
            Upload .{language === "python" ? "py" : language === "java" ? "java" : "js"}

            <input
              type="file"
              accept={language === "python" ? ".py" : language === "java" ? ".java" : ".js"}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = (event) => {
                  setCode(event.target.result);
                  setResults(null);
                  setError("");
                  setFormatError("");
                  clearTestCases();
                };

                reader.readAsText(file);

                // Allow selecting the same file again
                e.target.value = "";
              }}
            />
          </label>

          {/* Format Code Button */}
          <Tooltip content="Format Code">
            <button
              type="button"
              onClick={handleFormat}
              disabled={isFormatting}
              className="rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isFormatting ? "Formatting..." : "Format"}
            </button>
          </Tooltip>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Monaco Editor Wrapper */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {formatError && (
          <div className="absolute top-3 right-3 z-30 flex items-center justify-between gap-3 rounded border border-red-500/40 bg-[#090d14]/95 px-3 py-1.5 text-xs text-red-400 shadow-lg backdrop-blur-sm max-w-md font-mono">
            <span className="truncate">{formatError}</span>
            <button
              type="button"
              onClick={() => setFormatError("")}
              className="text-red-400 hover:text-red-200 transition shrink-0 cursor-pointer font-sans text-sm leading-none"
              aria-label="Close message"
            >
              &times;
            </button>
          </div>
        )}

        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: {
              enabled: false,
            },
            fontSize: 14,
            padding: {
              top: 12,
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;

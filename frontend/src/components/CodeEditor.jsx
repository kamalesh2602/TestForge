import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  setResults,
  setError,
  clearTestCases,
}) {
  const [savedToPc, setSavedToPc] = useState(false);
  const savedMessageTimer = useRef(null);

  const javaStarterCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}`;

  useEffect(() => {
    return () => window.clearTimeout(savedMessageTimer.current);
  }, []);

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
    const filename = language === "python" ? "main.py" : getJavaFilename();
    const blob = new Blob([code], {
      type: language === "python" ? "text/x-python" : "text/x-java-source",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    setSavedToPc(true);
    window.clearTimeout(savedMessageTimer.current);
    savedMessageTimer.current = window.setTimeout(() => setSavedToPc(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-[#0f172a]">
      {/* Editor Top Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#1e293b] px-4">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF]">
          Source Code
        </span>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => {
              const newLanguage = e.target.value;

              setLanguage(newLanguage);

              // Set default code based on selected language
              if (newLanguage === "java") {
                setCode(javaStarterCode);
              } else {
                setCode("");
              }

              // Clear previous results/errors/test cases
              setResults(null);
              setError("");
              clearTestCases();
            }}
            className="rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1 font-mono text-xs font-bold text-[#FEEE91] outline-none transition focus:border-[#8CE4FF]"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          {/* Upload File */}
          <label className="cursor-pointer rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF]">
            Upload .{language === "python" ? "py" : "java"}

            <input
              type="file"
              accept={language === "python" ? ".py" : ".java"}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = (event) => {
                  setCode(event.target.result);
                  setResults(null);
                  setError("");
                  clearTestCases();
                };

                reader.readAsText(file);

                // Allow selecting the same file again
                e.target.value = "";
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF]"
          >
            Save
          </button>

          {savedToPc && (
            <span className="font-mono text-[10px] font-bold text-[#8CE4FF]" role="status">
              Saved to PC
            </span>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
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

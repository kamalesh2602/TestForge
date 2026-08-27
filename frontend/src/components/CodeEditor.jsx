import Editor from "@monaco-editor/react";

function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  setResults,
  setError,
  clearTestCases,
}) {
  const javaStarterCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}`;

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
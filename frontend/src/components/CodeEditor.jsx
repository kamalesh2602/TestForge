import Editor from "@monaco-editor/react";

function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  setResults,
  setError,
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <h2 className="font-semibold">
          Code Editor
        </h2>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setCode("");
              setResults(null);
              setError("");
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">
            Upload .{language === "python" ? "py" : "java"}

            <input
              type="file"
              accept={
                language === "python"
                  ? ".py"
                  : ".java"
              }
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = (event) => {
                  setCode(event.target.result);
                  setResults(null);
                  setError("");
                };

                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

      <Editor
        height="500px"
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
            top: 16,
          },
        }}
      />
    </section>
  );
}

export default CodeEditor;
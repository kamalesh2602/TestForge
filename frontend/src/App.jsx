import { useState } from "react";
import Editor from "@monaco-editor/react";
import { generateTests, runTests } from "./services/api";

function App() {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(5);
  const [description, setDescription] = useState("");

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateAndRun = async () => {
    try {
      setLoading(true);
      setError("");
      setResults(null);

      const generated = await generateTests(
        code,
        count,
        description
      );

      const execution = await runTests(
        code,
        generated.tests
      );

      setResults(execution);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400">
            TestForge
          </h1>

          <p className="mt-2 text-slate-400">
            AI-powered test case generation and execution.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Editor */}
          <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
              <h2 className="font-semibold">
                Python Code
              </h2>

              <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">
                Upload .py
                <input
                  type="file"
                  accept=".py"
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

            <Editor
              height="500px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
              }}
            />

            <div className="p-5">

              <div className="flex gap-4">

                <div>
                  <label className="mb-1 block text-sm text-slate-400">
                    Test cases
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </div>

                <div className="flex-1">
                  <label className="mb-1 block text-sm text-slate-400">
                    Description
                  </label>

                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Focus on edge cases"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </div>

              </div>

              <button
                onClick={handleGenerateAndRun}
                disabled={loading || !code.trim()}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Generating & Running..."
                  : "Generate & Run Tests"}
              </button>

              {error && (
                <div className="mt-4 rounded-lg bg-red-950 p-4 text-red-300">
                  {error}
                </div>
              )}

            </div>
          </section>

          {/* Results */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="mb-4 text-xl font-semibold">
              Test Results
            </h2>

            {!results && !loading && (
              <div className="flex h-[500px] items-center justify-center text-slate-500">
                Generate tests to see results
              </div>
            )}

            {loading && (
              <div className="flex h-[500px] items-center justify-center text-slate-400">
                Generating and running tests...
              </div>
            )}

            {results && (
              <div>

                <div className="mb-5 rounded-lg border border-slate-700 bg-slate-950 p-4">
                  <div className="text-2xl font-bold">
                    <span className="text-green-400">
                      {results.passed}
                    </span>{" "}
                    / {results.total}
                  </div>

                  <div className="text-sm text-slate-400">
                    Tests passed
                  </div>
                </div>

                <div className="max-h-[450px] space-y-3 overflow-y-auto">

                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                    >

                      <div className="flex justify-between">
                        <span className="font-semibold">
                          Test {index + 1}
                        </span>

                        <span
                          className={
                            result.status === "passed"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {result.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 font-mono text-sm text-slate-400">
                        <div>
                          Input:{" "}
                          <span className="text-slate-200">
                            {JSON.stringify(result.input)}
                          </span>
                        </div>

                        <div>
                          Expected:{" "}
                          <span className="text-slate-200">
                            {result.expected_output}
                          </span>
                        </div>

                        <div>
                          Actual:{" "}
                          <span className="text-slate-200">
                            {result.actual_output}
                          </span>
                        </div>
                      </div>

                      {result.description && (
                        <p className="mt-3 text-xs text-slate-500">
                          {result.description}
                        </p>
                      )}

                    </div>
                  ))}

                </div>
              </div>
            )}

          </section>

        </div>
      </div>
    </div>
  );
}

export default App;
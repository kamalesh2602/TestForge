import { useState } from "react";
import { generateTests, runTests } from "./services/api";

function App() {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(5);
  const [description, setDescription] = useState("");

  const [tests, setTests] = useState([]);
  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateAndRun = async () => {
    try {
      setLoading(true);
      setError("");
      setTests([]);
      setResults(null);

      const generated = await generateTests(
        code,
        count,
        description
      );

      setTests(generated.tests);

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
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400">
            TestForge
          </h1>

          <p className="mt-2 text-slate-400">
            AI-powered test case generation and execution.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Code Input */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="mb-4 text-xl font-semibold">
              Your Code
            </h2>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your Python code here..."
              className="h-80 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm outline-none focus:border-blue-500"
            />

            <div className="mt-4 flex gap-4">

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
                  className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <button
              onClick={handleGenerateAndRun}
              disabled={loading || !code.trim()}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Generating & Running..."
                : "Generate & Run Tests"}
            </button>

            {error && (
              <div className="mt-4 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

          </section>

          {/* Results */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="mb-4 text-xl font-semibold">
              Test Results
            </h2>

            {!results && !loading && (
              <div className="flex h-80 items-center justify-center text-slate-500">
                Generate tests to see results
              </div>
            )}

            {loading && (
              <div className="flex h-80 items-center justify-center text-slate-400">
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

                <div className="max-h-[500px] space-y-3 overflow-y-auto">

                  {results.results.map((result, index) => (

                    <div
                      key={index}
                      className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                    >

                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Test {index + 1}
                        </span>

                        <span
                          className={
                            result.status === "passed"
                              ? "font-semibold text-green-400"
                              : "font-semibold text-red-400"
                          }
                        >
                          {result.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 font-mono text-sm">

                        <div className="text-slate-400">
                          Input:{" "}
                          <span className="text-slate-200">
                            {JSON.stringify(result.input)}
                          </span>
                        </div>

                        <div className="text-slate-400">
                          Expected:{" "}
                          <span className="text-slate-200">
                            {result.expected_output}
                          </span>
                        </div>

                        <div className="text-slate-400">
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
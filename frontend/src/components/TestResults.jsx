function TestResults({
  results,
  loading,
  error,
}) {
  if (loading) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold">
          Test Results
        </h2>

        <div className="flex h-[500px] items-center justify-center text-slate-400">
          Generating and running tests...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-900 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold">
          Test Results
        </h2>

        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-400">
          {error}
        </div>
      </section>
    );
  }

  if (!results) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold">
          Test Results
        </h2>

        <div className="flex h-[500px] items-center justify-center text-slate-500">
          Generate tests to see results
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

      <h2 className="mb-4 text-xl font-semibold">
        Test Results
      </h2>

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
    </section>
  );
}

export default TestResults;
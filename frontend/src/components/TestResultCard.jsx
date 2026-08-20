function TestResultCard({ result, index }) {
  const passed = result.status === "passed";

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">

      <div className="flex justify-between">
        <span className="font-semibold">
          Test {index + 1}
        </span>

        <span
          className={
            passed
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
  );
}

export default TestResultCard;
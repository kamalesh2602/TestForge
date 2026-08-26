import TestResultCard from "./TestResultCard";

function TestResults({ results, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 text-center font-mono text-xs text-[#8CE4FF]">
        Executing test harness...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#FF5656]/50 bg-[#FF5656]/10 p-4 font-mono text-xs text-[#FF5656]">
        {error}
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between border-b border-[#1e293b] pb-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF]">
          Harness Scorecard
        </h2>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-[#8CE4FF]">
            {results.passed} / {results.total}
          </span>
          <span
            className="rounded px-2 py-0.5 text-[10px] font-black uppercase"
            style={{
              backgroundColor: results.passed === results.total ? "rgba(140, 228, 255, 0.15)" : "rgba(255, 86, 86, 0.15)",
              color: results.passed === results.total ? "#8CE4FF" : "#FF5656",
            }}
          >
            {results.passed === results.total ? "100% Passed" : "Failures"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
        {results.results.map((result, index) => (
          <TestResultCard key={index} result={result} index={index} />
        ))}
      </div>
    </div>
  );
}

export default TestResults;
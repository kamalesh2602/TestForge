function TestResultCard({ result, index }) {
  const passed = result.status === "passed";

  return (
    <div
      className="rounded-lg border bg-[#090d14] p-3 text-xs"
      style={{
        borderColor: passed ? "rgba(140, 228, 255, 0.3)" : "rgba(255, 86, 86, 0.3)",
        borderLeftWidth: "4px",
        borderLeftColor: passed ? "#8CE4FF" : "#FF5656",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-[#f0f6fc]">Test #{index + 1}</span>
        <span
          className="rounded px-2 py-0.5 font-mono text-[10px] font-black uppercase"
          style={{
            backgroundColor: passed ? "rgba(140, 228, 255, 0.15)" : "rgba(255, 86, 86, 0.15)",
            color: passed ? "#8CE4FF" : "#FF5656",
          }}
        >
          {result.status}
        </span>
      </div>

      <div className="mt-2 space-y-1 rounded bg-[#0f172a] p-2 font-mono text-[11px]">
        <div>
          <span className="text-[#8b949e]">Input: </span>
          <span className="text-[#FEEE91]">{JSON.stringify(result.input)}</span>
        </div>
        <div>
          <span className="text-[#8b949e]">Expected: </span>
          <span className="text-[#8CE4FF]">{result.expected_output}</span>
        </div>
        <div>
          <span className="text-[#8b949e]">Actual: </span>
          <span style={{ color: passed ? "#8CE4FF" : "#FF5656" }}>
            {result.actual_output}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TestResultCard;
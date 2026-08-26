function NormalExecutionResults({ result, loading, error }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between border-b border-[#1e293b] pb-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF]">
          Execution Console
        </h2>

        {result && (
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 font-mono text-xs font-bold uppercase"
              style={{
                backgroundColor: result.status === "completed" ? "rgba(140, 228, 255, 0.15)" : "rgba(255, 86, 86, 0.15)",
                color: result.status === "completed" ? "#8CE4FF" : "#FF5656",
              }}
            >
              {result.status}
            </span>
            {result.exit_code !== undefined && result.exit_code !== null && (
              <span className="rounded border border-[#1e293b] bg-[#090d14] px-2 py-0.5 font-mono text-xs text-[#8b949e]">
                Exit: {result.exit_code}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[#8b949e]">
            <svg className="h-7 w-7 animate-spin text-[#8CE4FF]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-mono text-xs">Executing program...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-[#FF5656]/50 bg-[#FF5656]/10 p-3 text-[#FF5656]">
            <p className="font-mono text-xs font-bold uppercase">Execution Error</p>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{error}</pre>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#475569]">
            <svg className="h-8 w-8 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-mono text-xs">Console is idle. Click "Run Code" to execute.</p>
          </div>
        )}

        {!loading && !error && result && (
          <div className="space-y-3">
            {result.output ? (
              <div className="rounded-lg border border-[#1e293b] bg-[#090d14] p-3 font-mono text-xs text-[#f0f6fc]">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">
                  Standard Output (stdout)
                </div>
                <pre className="whitespace-pre-wrap break-words">{result.output}</pre>
              </div>
            ) : (
              <div className="rounded-lg border border-[#1e293b]/50 bg-[#090d14] p-3 font-mono text-xs italic text-[#475569]">
                No output produced.
              </div>
            )}

            {result.error && (
              <div className="rounded-lg border border-[#FF5656]/40 bg-[#FF5656]/10 p-3 font-mono text-xs text-[#FF5656]">
                <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF5656]">
                  Standard Error (stderr)
                </div>
                <pre className="whitespace-pre-wrap break-words">{result.error}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NormalExecutionResults;
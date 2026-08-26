function NormalExecutionResults({ result, loading, error }) {
  if (loading) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Execution Output
        </h2>
        <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Executing program...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-900/50 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Execution Output
        </h2>
        <div className="rounded-lg border border-red-900/80 bg-red-950/40 p-4 text-red-400">
          <p className="font-semibold">Execution Error</p>
          <p className="mt-1 font-mono text-sm whitespace-pre-wrap">{error}</p>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Execution Output
        </h2>
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-slate-500">
          <svg className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Click "Run Code" to execute your program</p>
        </div>
      </section>
    );
  }

  const isSuccess = result.status === "completed" && (!result.exit_code || result.exit_code === 0);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          Execution Output
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              isSuccess
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : result.status === "timeout"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {result.status}
          </span>
          {result.exit_code !== undefined && result.exit_code !== null && (
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              Exit Code: {result.exit_code}
            </span>
          )}
        </div>
      </div>

      {result.output ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-slate-200">
          <div className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Standard Output (stdout)
          </div>
          <pre className="whitespace-pre-wrap break-words">{result.output}</pre>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800/60 bg-slate-950/50 p-4 font-mono text-sm text-slate-500 italic">
          No output produced.
        </div>
      )}

      {result.error && (
        <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 p-4 font-mono text-sm text-red-400">
          <div className="mb-1 text-xs font-medium text-red-400/80 uppercase tracking-wider">
            Error Details
          </div>
          <pre className="whitespace-pre-wrap break-words">{result.error}</pre>
        </div>
      )}
    </section>
  );
}

export default NormalExecutionResults;

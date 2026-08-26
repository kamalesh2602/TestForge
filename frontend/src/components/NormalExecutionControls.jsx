function NormalExecutionControls({
  stdin,
  setStdin,
  onExecute,
  loading,
  code,
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-xl font-semibold text-slate-100">
        Execution Controls
      </h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-400">
          Standard Input (stdin) - <span className="text-slate-500 font-normal">Optional</span>
        </label>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Provide program inputs here (if needed)..."
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onExecute}
        disabled={loading || !code.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Running Code...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Run Code</span>
          </>
        )}
      </button>
    </section>
  );
}

export default NormalExecutionControls;

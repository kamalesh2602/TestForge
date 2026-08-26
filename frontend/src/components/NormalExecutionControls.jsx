function NormalExecutionControls({
  stdin,
  setStdin,
  onExecute,
  loading,
  code,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
          Standard Input (stdin) - <span className="text-[#FEEE91] font-normal">Optional</span>
        </label>
      </div>

      <div className="flex gap-3">
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Program input..."
          rows={2}
          className="flex-1 resize-none rounded-lg border border-[#1e293b] bg-[#090d14] px-3 py-2 font-mono text-xs text-[#f0f6fc] placeholder-[#475569] outline-none transition focus:border-[#8CE4FF]"
        />

        <button
          type="button"
          onClick={onExecute}
          disabled={loading || !code.trim()}
          className="flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-[#FFA239] px-4 font-bold text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs">Running...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-xs uppercase tracking-wider">Run Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NormalExecutionControls;
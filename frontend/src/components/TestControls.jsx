function TestControls({
  count,
  setCount,
  description,
  setDescription,
  onGenerate,
  loading,
  code,
}) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-md">
      <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[#FFA239]">
        Test Synthesis Setup
      </h2>

      <div className="flex gap-3">
        <div className="w-24">
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">
            Count
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-lg border border-[#1e293b] bg-[#090d14] px-2.5 py-1.5 font-mono text-xs font-bold text-[#FEEE91] outline-none focus:border-[#FFA239]"
          />
        </div>

        <div className="flex-1">
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">
            Goal / Instructions
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Test boundary conditions and negative inputs"
            className="w-full rounded-lg border border-[#1e293b] bg-[#090d14] px-3 py-1.5 text-xs text-[#f0f6fc] placeholder-[#475569] outline-none focus:border-[#FFA239]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={loading || !code.trim()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFA239] py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Synthesizing Tests..." : "Generate Test Cases"}
      </button>
    </div>
  );
}

export default TestControls;
function TestConfig({
  count,
  setCount,
  description,
  setDescription,
  loading,
  code,
  onGenerate,
}) {
  return (
    <div className="mt-5">

      <div className="flex gap-4">

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
            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
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
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </div>

      </div>

      <button
        onClick={onGenerate}
        disabled={loading || !code.trim()}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Generating & Running..."
          : "Generate & Run Tests"}
      </button>

    </div>
  );
}

export default TestConfig;
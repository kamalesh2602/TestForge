function TestControls({
  count,
  setCount,
  description,
  setDescription,
  onGenerate,
  loading,
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

      <h2 className="mb-4 text-xl font-semibold">
        Test Configuration
      </h2>

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
            onChange={(e) =>
              setCount(Number(e.target.value))
            }
            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-sm text-slate-400">
            Description
          </label>

          <input
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="e.g. Focus on edge cases"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </div>

      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Generating and running..."
          : "Generate Test Cases"}
      </button>

    </section>
  );
}

export default TestControls;
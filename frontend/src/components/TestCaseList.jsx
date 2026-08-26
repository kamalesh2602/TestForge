function createTestCase() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    selected: true,
    input: "",
    arguments: "[]",
    expectedOutput: "",
    description: "",
  };
}

function TestCaseList({
  testCases,
  setTestCases,
  codeType,
  onRunSelected,
  loading,
}) {
  if (!codeType) return null;

  const selectedCount = testCases.filter((test) => test.selected).length;
  const updateTest = (id, changes) =>
    setTestCases((current) =>
      current.map((test) => (test.id === id ? { ...test, ...changes } : test))
    );

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-md">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#FEEE91]">
            Generated Suite
          </h2>
          <span className="text-[11px] text-[#8b949e]">
            {selectedCount} of {testCases.length} selected
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setTestCases((curr) => curr.map((t) => ({ ...t, selected: true })))}
            disabled={!testCases.length}
            className="rounded border border-[#1e293b] bg-[#090d14] px-2 py-1 text-[10px] font-bold uppercase text-[#f0f6fc] transition hover:border-[#8CE4FF]"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => setTestCases((curr) => curr.map((t) => ({ ...t, selected: false })))}
            disabled={!selectedCount}
            className="rounded border border-[#1e293b] bg-[#090d14] px-2 py-1 text-[10px] font-bold uppercase text-[#f0f6fc] transition hover:border-[#8CE4FF]"
          >
            Deselect
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {testCases.map((test, index) => (
          <div
            key={test.id}
            className="rounded-lg border border-[#1e293b] bg-[#090d14] p-3 transition-colors"
            style={{
              borderLeftWidth: "3px",
              borderLeftColor: test.selected ? "#FFA239" : "#1e293b",
            }}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-mono text-xs font-bold text-[#f0f6fc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={test.selected}
                  onChange={(e) => updateTest(test.id, { selected: e.target.checked })}
                  className="h-3.5 w-3.5 rounded accent-[#FFA239]"
                />
                Case #{index + 1}
              </label>
              <button
                type="button"
                onClick={() => setTestCases((curr) => curr.filter((t) => t.id !== test.id))}
                className="text-[11px] font-bold text-[#FF5656] hover:opacity-80"
              >
                Delete
              </button>
            </div>

            <div className="mt-2 space-y-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#8b949e]">
                  {codeType === "function" ? "Arguments (JSON Array)" : "Input"}
                </label>
                <textarea
                  rows={2}
                  className="mt-0.5 w-full rounded border border-[#1e293b] bg-[#0f172a] px-2 py-1 font-mono text-xs text-[#FEEE91] outline-none focus:border-[#8CE4FF]"
                  value={codeType === "function" ? test.arguments : test.input}
                  onChange={(e) =>
                    updateTest(test.id, codeType === "function" ? { arguments: e.target.value } : { input: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#8b949e]">
                  Expected Output
                </label>
                <input
                  className="mt-0.5 w-full rounded border border-[#1e293b] bg-[#0f172a] px-2 py-1 font-mono text-xs text-[#8CE4FF] outline-none focus:border-[#8CE4FF]"
                  value={test.expectedOutput}
                  onChange={(e) => updateTest(test.id, { expectedOutput: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setTestCases((curr) => [...curr, createTestCase()])}
          className="flex-1 rounded-lg border border-[#1e293b] bg-[#090d14] py-2 text-xs font-bold text-[#f0f6fc] transition hover:border-[#8CE4FF]"
        >
          + Add Test
        </button>

        <button
          type="button"
          onClick={onRunSelected}
          disabled={loading || !selectedCount}
          className="flex-1 rounded-lg bg-[#8CE4FF] py-2 text-xs font-bold uppercase tracking-wider text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Running..." : `Run Selected (${selectedCount})`}
        </button>
      </div>
    </div>
  );
}

export default TestCaseList;
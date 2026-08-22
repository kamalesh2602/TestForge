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

function TestCaseList({ testCases, setTestCases, codeType, onRunSelected, loading }) {
  if (!codeType) return null;

  const selectedCount = testCases.filter((test) => test.selected).length;
  const updateTest = (id, changes) => setTestCases((current) => current.map((test) => (
    test.id === id ? { ...test, ...changes } : test
  )));

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Test Cases</h2>
          <p className="text-sm text-slate-400">{selectedCount} of {testCases.length} selected</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => setTestCases((current) => current.map((test) => ({ ...test, selected: true })))} disabled={!testCases.length} className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Select All</button>
          <button type="button" onClick={() => setTestCases((current) => current.map((test) => ({ ...test, selected: false })))} disabled={!selectedCount} className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Deselect All</button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {testCases.map((test, index) => (
          <article key={test.id} className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={test.selected} onChange={(event) => updateTest(test.id, { selected: event.target.checked })} className="h-4 w-4 accent-blue-500" />
                Test {index + 1}
              </label>
              <button type="button" onClick={() => setTestCases((current) => current.filter((item) => item.id !== test.id))} className="text-sm text-red-400 hover:text-red-300">Delete</button>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="text-sm text-slate-400">
                {codeType === "function" ? "Arguments (JSON array)" : "Input"}
                <textarea value={codeType === "function" ? test.arguments : test.input} onChange={(event) => updateTest(test.id, codeType === "function" ? { arguments: event.target.value } : { input: event.target.value })} placeholder={codeType === "function" ? '["value", 2]' : "Program input"} rows="2" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100" />
              </label>
              <label className="text-sm text-slate-400">
                Expected output
                <input value={test.expectedOutput} onChange={(event) => updateTest(test.id, { expectedOutput: event.target.value })} placeholder="Optional expected output" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
              </label>
              <label className="text-sm text-slate-400">
                Description
                <input value={test.description} onChange={(event) => updateTest(test.id, { description: event.target.value })} placeholder="What this test checks" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
              </label>
            </div>
          </article>
        ))}
      </div>

      <button type="button" onClick={() => setTestCases((current) => [...current, createTestCase()])} className="mt-4 rounded-lg border border-slate-700 px-4 py-2 font-semibold hover:bg-slate-800">Add Test Case</button>
      <button type="button" onClick={onRunSelected} disabled={loading || !selectedCount} className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Running tests..." : `Run Selected Tests (${selectedCount})`}
      </button>
    </section>
  );
}

export default TestCaseList;

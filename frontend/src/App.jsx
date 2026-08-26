import { useState } from "react";
import CodeEditor from "./components/CodeEditor";
import TestControls from "./components/TestControls";
import TestCaseList from "./components/TestCaseList";
import TestResults from "./components/TestResults";
import NormalExecutionControls from "./components/NormalExecutionControls";
import NormalExecutionResults from "./components/NormalExecutionResults";
import { generateTests, runTests, executeCode } from "./services/api";

function App() {
  const [aiMode, setAiMode] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  // Normal IDE Mode state
  const [stdin, setStdin] = useState("");
  const [normalResult, setNormalResult] = useState(null);
  const [normalLoading, setNormalLoading] = useState(false);
  const [normalError, setNormalError] = useState("");

  // AI Testing Mode state
  const [count, setCount] = useState(5);
  const [description, setDescription] = useState("");
  const [results, setResults] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [codeType, setCodeType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNormalExecute = async () => {
    try {
      setNormalLoading(true);
      setNormalError("");
      setNormalResult(null);
      const res = await executeCode(code, stdin, language);
      setNormalResult(res);
    } catch (err) {
      setNormalError(err.message || "Failed to execute code");
    } finally {
      setNormalLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setResults(null);
      const generated = await generateTests(code, count, description, language);
      setCodeType(generated.code_type);
      setTestCases(
        generated.tests.map((test, index) => ({
          id: `${Date.now()}-${index}`,
          selected: true,
          input: test.input ?? "",
          arguments: JSON.stringify(test.arguments ?? []),
          expectedOutput: test.expected_output ?? "",
          description: test.description ?? "",
        }))
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSelected = async () => {
    const selected = testCases.filter((test) => test.selected);
    if (!selected.length) return;

    try {
      const tests = selected.map((test) => {
        const shared = {
          expected_output: test.expectedOutput.trim() || null,
          description: test.description.trim() || null,
        };

        if (codeType === "function") {
          let argumentsValue;
          try {
            argumentsValue = JSON.parse(test.arguments);
          } catch {
            throw new Error("Function arguments must be a valid JSON array.");
          }
          if (!Array.isArray(argumentsValue)) {
            throw new Error("Function arguments must be a JSON array.");
          }
          return { ...shared, arguments: argumentsValue };
        }

        return { ...shared, input: test.input };
      });

      setLoading(true);
      setError("");
      setResults(null);
      setResults(await runTests(code, tests, language));
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#090d14] text-[#f0f6fc]">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1e293b] bg-[#0f172a] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#FF5656] to-[#FFA239] font-black text-black text-sm shadow">
            TF
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Test<span className="text-[#8CE4FF]">Forge</span>
            </h1>
          </div>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#090d14] px-3 py-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
            Mode:
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={aiMode}
            onClick={() => setAiMode(!aiMode)}
            className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            style={{ backgroundColor: aiMode ? "#FFA239" : "#334155" }}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                aiMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className="w-16 text-xs font-black uppercase"
            style={{ color: aiMode ? "#FFA239" : "#8CE4FF" }}
          >
            {aiMode ? "AI Test" : "IDE"}
          </span>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* Left Workbench: Editor & Run Inputs */}
        <section className="flex flex-col border-b border-[#1e293b] overflow-hidden lg:col-span-7 lg:border-b-0 lg:border-r">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              setResults={(val) => {
                setResults(val);
                setNormalResult(val);
              }}
              setError={(val) => {
                setError(val);
                setNormalError(val);
              }}
              clearTestCases={() => {
                setTestCases([]);
                setCodeType(null);
              }}
            />
          </div>

          {/* Standard Input & Run Controls pinned to the bottom of the editor */}
          {!aiMode && (
            <div className="border-t border-[#1e293b] bg-[#0f172a] p-4">
              <NormalExecutionControls
                stdin={stdin}
                setStdin={setStdin}
                onExecute={handleNormalExecute}
                loading={normalLoading}
                code={code}
              />
            </div>
          )}
        </section>

        {/* Right Workbench: AI Config & Execution Output Console */}
        <section className="flex flex-col overflow-y-auto bg-[#090d14] p-4 lg:col-span-5">
          {aiMode ? (
            <div className="space-y-4">
              <TestControls
                count={count}
                setCount={setCount}
                description={description}
                setDescription={setDescription}
                onGenerate={handleGenerate}
                loading={loading}
                code={code}
              />

              <TestCaseList
                testCases={testCases}
                setTestCases={setTestCases}
                codeType={codeType}
                onRunSelected={handleRunSelected}
                loading={loading}
              />

              <TestResults results={results} loading={loading} error={error} />
            </div>
          ) : (
            <div className="h-full">
              <NormalExecutionResults
                result={normalResult}
                loading={normalLoading}
                error={normalError}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
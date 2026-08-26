import { useState } from "react";

import CodeEditor from "./components/CodeEditor";
import TestControls from "./components/TestControls";
import TestCaseList from "./components/TestCaseList";
import TestResults from "./components/TestResults";
import NormalExecutionControls from "./components/NormalExecutionControls";
import NormalExecutionResults from "./components/NormalExecutionResults";

import {
  generateTests,
  runTests,
  executeCode,
} from "./services/api";


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

      const generated = await generateTests(
        code,
        count,
        description,
        language,
      );

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
      setError(
        err.message ||
        "Something went wrong",
      );
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
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">

      <div className="mx-auto max-w-7xl">

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-400">
              TestForge
            </h1>

            <p className="mt-2 text-slate-400">
              {aiMode
                ? "AI-powered test case generation and execution."
                : "Online IDE for code execution and testing."}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium text-slate-300">
              AI Testing Mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={aiMode}
              onClick={() => setAiMode(!aiMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                aiMode ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  aiMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="w-8 text-xs font-semibold uppercase text-slate-400">
              {aiMode ? "ON" : "OFF"}
            </span>
          </div>
        </header>


        <div className="grid gap-6 lg:grid-cols-2">

          <div className="space-y-6">

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

            {aiMode ? (
              <>
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
              </>
            ) : (
              <NormalExecutionControls
                stdin={stdin}
                setStdin={setStdin}
                onExecute={handleNormalExecute}
                loading={normalLoading}
                code={code}
              />
            )}

          </div>


          <div>
            {aiMode ? (
              <TestResults
                results={results}
                loading={loading}
                error={error}
              />
            ) : (
              <NormalExecutionResults
                result={normalResult}
                loading={normalLoading}
                error={normalError}
              />
            )}
          </div>

        </div>

      </div>

    </div>
  );
}


export default App;

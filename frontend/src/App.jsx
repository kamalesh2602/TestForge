import { useState } from "react";

import CodeEditor from "./components/CodeEditor";
import TestControls from "./components/TestControls";
import TestCaseList from "./components/TestCaseList";
import TestResults from "./components/TestResults";

import {
  generateTests,
  runTests,
} from "./services/api";


function App() {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(5);
  const [description, setDescription] = useState("");

  const [language, setLanguage] = useState("python");

  const [results, setResults] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [codeType, setCodeType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


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
      setTestCases(generated.tests.map((test, index) => ({
        id: `${Date.now()}-${index}`,
        selected: true,
        input: test.input ?? "",
        arguments: JSON.stringify(test.arguments ?? []),
        expectedOutput: test.expected_output ?? "",
        description: test.description ?? "",
      })));

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

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400">
            TestForge
          </h1>

          <p className="mt-2 text-slate-400">
            AI-powered test case generation and execution.
          </p>
        </header>


        <div className="grid gap-6 lg:grid-cols-2">

          <div className="space-y-6">

            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              setResults={setResults}
              setError={setError}
              clearTestCases={() => {
                setTestCases([]);
                setCodeType(null);
              }}
            />

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

          </div>


          <TestResults
            results={results}
            loading={loading}
            error={error}
          />

        </div>

      </div>

    </div>
  );
}


export default App;

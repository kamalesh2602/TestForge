import { useState } from "react";

import CodeEditor from "./components/CodeEditor";
import TestControls from "./components/TestControls";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleGenerateAndRun = async () => {
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

      const execution = await runTests(
        code,
        generated.tests,
        language,
      );

      setResults(execution);

    } catch (err) {
      setError(
        err.message ||
        "Something went wrong",
      );

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
            />

            <TestControls
              count={count}
              setCount={setCount}
              description={description}
              setDescription={setDescription}
              onGenerate={handleGenerateAndRun}
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
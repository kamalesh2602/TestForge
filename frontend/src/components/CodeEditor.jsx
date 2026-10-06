import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { formatCode } from "../services/formatter";
import { registerCompletionProviders } from "../services/completionProvider";

function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  starterCode,
  setResults,
  setError,
  clearTestCases,
  onReset,
  onRun,
  webCode,
  setWebCode,
}) {
  const [activeWebTab, setActiveWebTab] = useState("html");
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState("");
  const isSavingRef = useRef(false);
  const saveFrame = useRef(null);
  const onRunRef = useRef(onRun);
  const registeredProviders = useRef(false);

  const htmlEditorRef = useRef(null);
  const cssEditorRef = useRef(null);
  const jsEditorRef = useRef(null);
  const defaultEditorRef = useRef(null);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    return () => window.cancelAnimationFrame(saveFrame.current);
  }, []);

  useEffect(() => {
    if (!formatError) return undefined;
    const timer = window.setTimeout(() => {
      setFormatError("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [formatError]);

  const handleEditorMount = (editor, monaco, tabId = "default") => {
    if (tabId === "html") htmlEditorRef.current = editor;
    else if (tabId === "css") cssEditorRef.current = editor;
    else if (tabId === "javascript") jsEditorRef.current = editor;
    else defaultEditorRef.current = editor;

    editor.addAction({
      id: "run-code-action",
      label: "Run Code",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter,
      ],
      run: () => {
        onRunRef.current?.();
      },
    });

    if (!registeredProviders.current) {
      registeredProviders.current = true;
      registerCompletionProviders(monaco);
      ["javascript", "java", "python", "html", "css"].forEach((langId) => {
        monaco.languages.registerDocumentFormattingEditProvider(langId, {
          async provideDocumentFormattingEdits(model) {
            try {
              const text = model.getValue();
              const formatted = await formatCode(text, langId);
              return [
                {
                  range: model.getFullModelRange(),
                  text: formatted,
                },
              ];
            } catch {
              return [];
            }
          },
        });
      });
    }
  };

  const switchWebTab = (tab) => {
    setActiveWebTab(tab);
    window.requestAnimationFrame(() => {
      if (tab === "html") {
        htmlEditorRef.current?.layout();
        htmlEditorRef.current?.focus();
      } else if (tab === "css") {
        cssEditorRef.current?.layout();
        cssEditorRef.current?.focus();
      } else if (tab === "javascript") {
        jsEditorRef.current?.layout();
        jsEditorRef.current?.focus();
      }
    });
  };

  const updateWebCodeTab = (tab, newContent) => {
    if (setWebCode) {
      setWebCode(tab, newContent);
    }
  };

  const handleFormat = async () => {
    const isWeb = language === "web";
    const targetLang = isWeb ? activeWebTab : language;
    const targetCode = isWeb ? (webCode?.[activeWebTab] || "") : code;

    if (isFormatting || !targetCode || !targetCode.trim()) return;

    setIsFormatting(true);
    setFormatError("");

    try {
      const formatted = await formatCode(targetCode, targetLang);
      if (formatted !== undefined && formatted !== null) {
        if (isWeb) {
          updateWebCodeTab(activeWebTab, formatted);
        } else {
          setCode(formatted);
        }
      }
    } catch (err) {
      setFormatError(err.message || "Failed to format code");
    } finally {
      setIsFormatting(false);
    }
  };

  const getJavaFilename = () => {
    const currentCode = code || "";
    const publicClass = currentCode.match(
      /\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)/
    );
    const mainClass = currentCode.match(
      /\bclass\s+([A-Za-z_]\w*)[\s\S]*?\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(/
    );
    const firstClass = currentCode.match(/\bclass\s+([A-Za-z_]\w*)/);
    const className = publicClass?.[1] || mainClass?.[1] || firstClass?.[1] || "Main";

    return `${className}.java`;
  };

  const handleSave = () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);

    saveFrame.current = window.requestAnimationFrame(() => {
      try {
        let filename;
        let mimeType;
        let contentToSave;

        if (language === "web") {
          if (activeWebTab === "html") {
            filename = "index.html";
            mimeType = "text/html";
            contentToSave = webCode?.html || "";
          } else if (activeWebTab === "css") {
            filename = "style.css";
            mimeType = "text/css";
            contentToSave = webCode?.css || "";
          } else {
            filename = "script.js";
            mimeType = "text/javascript";
            contentToSave = webCode?.javascript || "";
          }
        } else {
          contentToSave = code;
          if (language === "python") {
            filename = "main.py";
            mimeType = "text/x-python";
          } else if (language === "javascript") {
            filename = "main.js";
            mimeType = "text/javascript";
          } else if (language === "html") {
            filename = "testforge.html";
            mimeType = "text/html";
          } else {
            filename = getJavaFilename();
            mimeType = "text/x-java-source";
          }
        }

        const blob = new Blob([contentToSave], { type: mimeType });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    });
  };

  const getUploadInfo = () => {
    if (language === "web") {
      if (activeWebTab === "html") return { ext: "html", accept: ".html,.htm" };
      if (activeWebTab === "css") return { ext: "css", accept: ".css" };
      return { ext: "js", accept: ".js" };
    }
    if (language === "python") return { ext: "py", accept: ".py" };
    if (language === "java") return { ext: "java", accept: ".java" };
    if (language === "javascript") return { ext: "js", accept: ".js" };
    return { ext: "html", accept: ".html,.htm" };
  };

  const uploadInfo = getUploadInfo();

  const editorOptions = {
    minimap: {
      enabled: false,
    },
    fontSize: 14,
    padding: {
      top: 12,
    },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    autoClosingTags: true,
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    formatOnType: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    wordBasedSuggestions: "currentDocument",
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f172a]">
      {/* Editor Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:h-11 shrink-0 sm:items-center justify-between border-b border-[#1e293b] px-3 py-2 sm:px-4 sm:py-0 gap-2 sm:gap-0">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF] shrink-0">
            {language === "web" ? "Web Workspace" : "Source Code"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Reset Editor */}
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset editor"
            className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded border border-[#1e293b] bg-[#1e293b] text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => {
              const newLanguage = e.target.value;

              setLanguage(newLanguage);
              if (newLanguage !== "web") {
                setCode(starterCode?.[newLanguage] ?? "");
              }
              setFormatError("");

              // Clear previous results/errors/test cases
              setResults(null);
              setError("");
              clearTestCases();
            }}
            className="rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1.5 sm:py-1 font-mono text-xs font-bold text-[#FEEE91] outline-none transition focus:border-[#8CE4FF] cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="web">Web (HTML + CSS + JS)</option>
          </select>

          {/* Upload File */}
          <label className="cursor-pointer rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF]">
            Upload .{uploadInfo.ext}

            <input
              type="file"
              accept={uploadInfo.accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = (event) => {
                  const content = event.target.result;
                  if (language === "web") {
                    updateWebCodeTab(activeWebTab, content);
                  } else {
                    setCode(content);
                  }
                  setResults(null);
                  setError("");
                  setFormatError("");
                  clearTestCases();
                };

                reader.readAsText(file);

                // Allow selecting the same file again
                e.target.value = "";
              }}
            />
          </label>

          {/* Format Code Button */}
          <button
            type="button"
            onClick={handleFormat}
            disabled={isFormatting}
            className="rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isFormatting ? "Formatting..." : "Format"}
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded border border-[#1e293b] bg-[#1e293b] px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#f0f6fc] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Web Development Tabs (HTML, CSS, JavaScript) */}
      {language === "web" && (
        <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#090d14] px-2.5 sm:px-4 py-1.5 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* HTML Tab */}
            <button
              type="button"
              onClick={() => switchWebTab("html")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 font-mono text-xs font-bold transition cursor-pointer ${
                activeWebTab === "html"
                  ? "bg-[#1e293b] text-[#FF5656] shadow-sm border border-[#FF5656]/30"
                  : "text-[#8b949e] hover:bg-[#1e293b]/40 hover:text-[#f0f6fc] border border-transparent"
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-[#FF5656]" />
              <span>HTML</span>
              <span className="hidden sm:inline text-[10px] text-[#8b949e] font-normal">
                index.html
              </span>
            </button>

            {/* CSS Tab */}
            <button
              type="button"
              onClick={() => switchWebTab("css")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 font-mono text-xs font-bold transition cursor-pointer ${
                activeWebTab === "css"
                  ? "bg-[#1e293b] text-[#8CE4FF] shadow-sm border border-[#8CE4FF]/30"
                  : "text-[#8b949e] hover:bg-[#1e293b]/40 hover:text-[#f0f6fc] border border-transparent"
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-[#8CE4FF]" />
              <span>CSS</span>
              <span className="hidden sm:inline text-[10px] text-[#8b949e] font-normal">
                style.css
              </span>
            </button>

            {/* JavaScript Tab */}
            <button
              type="button"
              onClick={() => switchWebTab("javascript")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 font-mono text-xs font-bold transition cursor-pointer ${
                activeWebTab === "javascript"
                  ? "bg-[#1e293b] text-[#FEEE91] shadow-sm border border-[#FEEE91]/30"
                  : "text-[#8b949e] hover:bg-[#1e293b]/40 hover:text-[#f0f6fc] border border-transparent"
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-[#FEEE91]" />
              <span>JavaScript</span>
              <span className="hidden sm:inline text-[10px] text-[#8b949e] font-normal">
                script.js
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#8b949e]">
            <span>Split-screen Web Workspace</span>
          </div>
        </div>
      )}

      {/* Monaco Editor Wrapper */}
      {language === "web" ? (
        <div className="relative flex-1 min-h-[350px] sm:min-h-0 w-full overflow-hidden">
          {formatError && (
            <div className="absolute top-3 right-3 left-3 sm:left-auto z-30 flex items-center justify-between gap-3 rounded border border-red-500/40 bg-[#090d14]/95 px-3 py-1.5 text-xs text-red-400 shadow-lg backdrop-blur-sm max-w-md font-mono">
              <span className="truncate">{formatError}</span>
              <button
                type="button"
                onClick={() => setFormatError("")}
                className="text-red-400 hover:text-red-200 transition shrink-0 cursor-pointer font-sans text-sm leading-none p-1"
                aria-label="Close message"
              >
                &times;
              </button>
            </div>
          )}

          {/* HTML Editor Tab */}
          <div className={`h-full w-full ${activeWebTab === "html" ? "block" : "hidden"}`}>
            <Editor
              height="100%"
              language="html"
              value={webCode?.html ?? ""}
              onChange={(value) => updateWebCodeTab("html", value || "")}
              onMount={(editor, monaco) => handleEditorMount(editor, monaco, "html")}
              theme="vs-dark"
              options={editorOptions}
            />
          </div>

          {/* CSS Editor Tab */}
          <div className={`h-full w-full ${activeWebTab === "css" ? "block" : "hidden"}`}>
            <Editor
              height="100%"
              language="css"
              value={webCode?.css ?? ""}
              onChange={(value) => updateWebCodeTab("css", value || "")}
              onMount={(editor, monaco) => handleEditorMount(editor, monaco, "css")}
              theme="vs-dark"
              options={editorOptions}
            />
          </div>

          {/* JavaScript Editor Tab */}
          <div className={`h-full w-full ${activeWebTab === "javascript" ? "block" : "hidden"}`}>
            <Editor
              height="100%"
              language="javascript"
              value={webCode?.javascript ?? ""}
              onChange={(value) => updateWebCodeTab("javascript", value || "")}
              onMount={(editor, monaco) => handleEditorMount(editor, monaco, "javascript")}
              theme="vs-dark"
              options={editorOptions}
            />
          </div>
        </div>
      ) : (
        <div className="relative flex-1 min-h-[350px] sm:min-h-0 w-full overflow-hidden">
          {formatError && (
            <div className="absolute top-3 right-3 left-3 sm:left-auto z-30 flex items-center justify-between gap-3 rounded border border-red-500/40 bg-[#090d14]/95 px-3 py-1.5 text-xs text-red-400 shadow-lg backdrop-blur-sm max-w-md font-mono">
              <span className="truncate">{formatError}</span>
              <button
                type="button"
                onClick={() => setFormatError("")}
                className="text-red-400 hover:text-red-200 transition shrink-0 cursor-pointer font-sans text-sm leading-none p-1"
                aria-label="Close message"
              >
                &times;
              </button>
            </div>
          )}

          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || "")}
            onMount={(editor, monaco) => handleEditorMount(editor, monaco, language)}
            theme="vs-dark"
            options={editorOptions}
          />
        </div>
      )}
    </div>
  );
}

export default CodeEditor;

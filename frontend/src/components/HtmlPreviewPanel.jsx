import { useState } from "react";

function HtmlPreviewPanel({ htmlCode, onRun }) {
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    if (onRun) onRun();
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between border-b border-[#1e293b] pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF]">
            HTML Web Preview
          </h2>
          <span className="rounded bg-[#8CE4FF]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#8CE4FF] uppercase">
            Live DOM
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1 font-mono text-xs text-[#8b949e] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
          title="Refresh Preview"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex-1 min-h-[300px] min-h-0 w-full rounded-lg border border-[#1e293b] bg-white overflow-hidden">
        <iframe
          key={key}
          srcDoc={htmlCode || ""}
          title="HTML Preview"
          sandbox="allow-scripts allow-forms"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}

export default HtmlPreviewPanel;

import { useState } from "react";
import Tooltip from "./Tooltip";

function HtmlPreviewPanel({ htmlCode, onRun }) {
  const [key, setKey] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    if (onRun) onRun();
  };

  const handleOpenInNewTab = () => {
    try {
      const blob = new Blob([htmlCode || ""], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");

      if (!win || win.closed || typeof win.closed === "undefined") {
        const fallbackWin = window.open("", "_blank");
        if (fallbackWin) {
          fallbackWin.document.open();
          fallbackWin.document.write(htmlCode || "");
          fallbackWin.document.close();
        }
      } else {
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 10000);
      }
    } catch {
      // Graceful fallback if popups fail
    }
  };

  const containerClasses = isMaximized
    ? "fixed inset-4 z-50 flex flex-col rounded-xl border border-[#8CE4FF]/40 bg-[#0f172a] p-4 shadow-2xl backdrop-blur-md"
    : "flex h-full flex-col rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 shadow-md";

  return (
    <>
      {isMaximized && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs cursor-pointer"
          onClick={() => setIsMaximized(false)}
          title="Click to restore"
        />
      )}

      <div className={containerClasses}>
        <div className="mb-3 flex items-center justify-between border-b border-[#1e293b] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF]">
              HTML Web Preview
            </h2>
            <span className="rounded bg-[#8CE4FF]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#8CE4FF] uppercase">
              Live DOM
            </span>
            {isMaximized && (
              <span className="rounded bg-[#FFA239]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FFA239] uppercase">
                Maximized
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Open in New Tab Button */}
            <Tooltip content="Open preview in new tab" position="top-end">
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1.5 rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1 font-mono text-xs text-[#8b949e] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span className="hidden sm:inline">New Tab</span>
              </button>
            </Tooltip>

            {/* Refresh Button */}
            <Tooltip content="Refresh preview" position="top-end">
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1 font-mono text-xs text-[#8b949e] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </Tooltip>

            {/* Maximize / Restore Button */}
            <Tooltip content={isMaximized ? "Restore layout" : "Maximize preview"} position="top-end">
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="flex items-center gap-1.5 rounded border border-[#1e293b] bg-[#090d14] px-2.5 py-1 font-mono text-xs text-[#8b949e] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
              >
                {isMaximized ? (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                    <span>Maximize</span>
                  </>
                )}
              </button>
            </Tooltip>
          </div>
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
    </>
  );
}

export default HtmlPreviewPanel;

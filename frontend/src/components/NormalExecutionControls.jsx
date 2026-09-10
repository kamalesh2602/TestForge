import { useRef, useState, useLayoutEffect } from "react";
import Tooltip from "./Tooltip";
import { getRunShortcutLabel } from "../utils/shortcut";

function NormalExecutionControls({
  stdin,
  setStdin,
  onExecute,
  loading,
  code,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const textareaRef = useRef(null);
  const runShortcut = getRunShortcutLabel();

  useLayoutEffect(() => {
    if (isCollapsed) {
      window.dispatchEvent(new Event("resize"));
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    // Temporarily reset height to auto to calculate true scrollHeight (especially when deleting text)
    textarea.style.height = "auto";

    const MIN_HEIGHT = 52; // Preserves the 2-row initial height
    const MAX_HEIGHT = 160; // Max height before internal scrolling

    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > MAX_HEIGHT ? "auto" : "hidden";

    window.dispatchEvent(new Event("resize"));
  }, [stdin, isCollapsed]);

  const renderRunButton = (isHeader = false) => (
    <Tooltip content={runShortcut} className={isHeader ? "" : "h-[52px] self-start"}>
      <button
        type="button"
        onClick={onExecute}
        disabled={loading || !code.trim()}
        className={`flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-[#FFA239] px-4 font-bold text-black transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-sm shadow-black/20 ${
          isHeader ? "h-8 text-xs" : "h-full text-xs"
        }`}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Running...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-xs uppercase tracking-wider">Run Code</span>
          </>
        )}
      </button>
    </Tooltip>
  );

  return (
    <div className="flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
          Standard Input (stdin) - <span className="text-[#FEEE91] font-normal">Optional</span>
        </label>

        <div className="flex items-center gap-2">
          {/* Show Run Code button in header ONLY when STDIN is collapsed */}
          {isCollapsed && renderRunButton(true)}

          <Tooltip content={isCollapsed ? "Expand input" : "Collapse input"}>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label={isCollapsed ? "Expand input" : "Collapse input"}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#1e293b] bg-[#1e293b] text-[#8b949e] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] focus:outline-none cursor-pointer"
            >
              {isCollapsed ? (
                /* Chevron Up icon when collapsed */
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                /* Chevron Down icon when expanded */
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Collapsible STDIN Textarea Body */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
            : "grid-rows-[1fr] opacity-100 mt-2.5"
        }`}
      >
        <div className={isCollapsed ? "overflow-hidden" : "overflow-visible pt-1"}>
          <div className="flex items-start gap-3">
            <textarea
              ref={textareaRef}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Program input..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-[#1e293b] bg-[#090d14] px-3 py-2 font-mono text-xs text-[#f0f6fc] placeholder-[#475569] outline-none transition focus:border-[#8CE4FF]"
              style={{ minHeight: "52px", maxHeight: "160px" }}
            />

            {/* Run Code button side-by-side with textarea when expanded */}
            {!isCollapsed && renderRunButton(false)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NormalExecutionControls;
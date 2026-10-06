import { useEffect, useRef } from "react";

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour12: false });
  } catch {
    return "";
  }
}

function ArgumentItem({ arg, level }) {
  if (!arg) return null;

  if (arg.type === "error") {
    return (
      <span className="font-mono text-xs text-[#FF5656] whitespace-pre-wrap break-words">
        {arg.text}
      </span>
    );
  }

  if (arg.type === "number") {
    return <span className="font-mono text-xs text-[#8CE4FF]">{arg.text}</span>;
  }

  if (arg.type === "boolean") {
    return <span className="font-mono text-xs text-[#FFA239]">{arg.text}</span>;
  }

  if (arg.type === "null" || arg.type === "undefined") {
    return <span className="font-mono text-xs text-[#8b949e] italic">{arg.text}</span>;
  }

  if (arg.type === "function") {
    return <span className="font-mono text-xs text-[#FFA239] italic">{arg.text}</span>;
  }

  if (arg.type === "element") {
    return <span className="font-mono text-xs text-[#8CE4FF]">{arg.text}</span>;
  }

  if (arg.type === "object" || arg.type === "array") {
    if (arg.text && arg.text.includes("\n")) {
      return (
        <pre className="my-1 w-full rounded border border-[#1e293b] bg-[#090d14]/90 p-2 font-mono text-[11px] text-[#cbd5e1] whitespace-pre-wrap break-words">
          {arg.text}
        </pre>
      );
    }
    return <span className="font-mono text-xs text-[#cbd5e1]">{arg.text}</span>;
  }

  const textColor =
    level === "error"
      ? "text-[#FF5656]"
      : level === "warn"
        ? "text-[#FEEE91]"
        : level === "info"
          ? "text-[#8CE4FF]"
          : "text-[#f0f6fc]";

  return (
    <span className={`font-mono text-xs whitespace-pre-wrap break-words ${textColor}`}>
      {arg.text}
    </span>
  );
}

function LevelIcon({ level }) {
  if (level === "error") {
    return (
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5656]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (level === "warn") {
    return (
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFA239]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (level === "info") {
    return (
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8CE4FF]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-[#8b949e]">
      ›
    </span>
  );
}

function DeveloperConsole({ logs, onClear, isCollapsed, onToggleCollapse }) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;

  useEffect(() => {
    if (!isCollapsed && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isCollapsed]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1e293b] bg-[#090d14] overflow-hidden shadow-md">
      {/* Console Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#1e293b] bg-[#0f172a] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-[#8CE4FF]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#8CE4FF] truncate">
            Developer Console
          </span>

          {logs.length > 0 && (
            <span className="rounded bg-[#1e293b] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#8b949e]">
              {logs.length}
            </span>
          )}

          {errorCount > 0 && (
            <span className="rounded bg-[#FF5656]/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FF5656]">
              {errorCount} {errorCount === 1 ? "error" : "errors"}
            </span>
          )}

          {warnCount > 0 && (
            <span className="rounded bg-[#FFA239]/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FFA239]">
              {warnCount} {warnCount === 1 ? "warn" : "warns"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Clear Console Button */}
          <button
            type="button"
            onClick={onClear}
            disabled={logs.length === 0}
            className="flex items-center gap-1 rounded border border-[#1e293b] bg-[#090d14] px-2 py-1 font-mono text-[11px] text-[#8b949e] transition hover:border-[#FF5656] hover:text-[#FF5656] disabled:opacity-40 disabled:hover:border-[#1e293b] disabled:hover:text-[#8b949e] cursor-pointer disabled:cursor-not-allowed"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            <span>Clear</span>
          </button>

          {/* Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex items-center justify-center rounded border border-[#1e293b] bg-[#090d14] p-1 text-[#8b949e] transition hover:border-[#8CE4FF] hover:text-[#8CE4FF] cursor-pointer"
              aria-label={isCollapsed ? "Expand console" : "Collapse console"}
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Console Log Messages List */}
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden font-mono text-xs divide-y divide-[#1e293b]/40 select-text"
        >
          {logs.length === 0 ? (
            <div className="flex h-full min-h-[90px] flex-col items-center justify-center gap-1.5 p-4 text-[#475569]">
              <svg
                className="h-5 w-5 text-[#334155]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <polyline
                  points="4 17 10 11 4 5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="12"
                  y1="19"
                  x2="20"
                  y2="19"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="font-mono text-xs">Console is empty.</p>
              <p className="font-mono text-[10px] text-[#334155]">
                Output from console.log(), info, warn, error, and runtime errors will appear here.
              </p>
            </div>
          ) : (
            logs.map((entry) => {
              const rowBg =
                entry.level === "error"
                  ? "bg-[#FF5656]/10 border-l-2 border-[#FF5656]"
                  : entry.level === "warn"
                    ? "bg-[#FFA239]/10 border-l-2 border-[#FFA239]"
                    : entry.level === "info"
                      ? "bg-[#8CE4FF]/5 border-l-2 border-[#8CE4FF]"
                      : "border-l-2 border-transparent hover:bg-[#1e293b]/30";

              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 px-3 py-1.5 transition-colors ${rowBg}`}
                >
                  <LevelIcon level={entry.level} />

                  <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {entry.args.length === 0 ? (
                      <span className="font-mono text-xs text-[#8b949e] italic">
                        &lt;empty&gt;
                      </span>
                    ) : (
                      entry.args.map((arg, idx) => (
                        <ArgumentItem key={idx} arg={arg} level={entry.level} />
                      ))
                    )}
                  </div>

                  {entry.timestamp && (
                    <span className="shrink-0 pl-2 font-mono text-[10px] text-[#8b949e]/60 select-none pt-0.5">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export default DeveloperConsole;

function Tooltip({ content, children, position = "top", className = "" }) {
  if (!content) return children;

  const positionClasses = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    "top-start": "bottom-full left-0 mb-2",
    "top-end": "bottom-full right-0 mb-2",
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
    "bottom-start": "top-full left-0 mt-2",
    "bottom-end": "top-full right-0 mt-2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
  };

  return (
    <div className={`relative group inline-flex ${className}`}>
      {children}
      <div
        className={`pointer-events-none absolute ${
          positionClasses[position] || positionClasses.top
        } opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 z-50`}
      >
        <div className="rounded-md border border-[#334155]/60 bg-[#090d14]/95 px-2.5 py-1 text-[11px] font-medium text-[#f0f6fc] shadow-md shadow-black/60 backdrop-blur-sm whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
}

export default Tooltip;

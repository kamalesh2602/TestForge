function Tooltip({ content, children, className = "" }) {
  return (
    <div className={`relative group inline-flex ${className}`}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50">
        <div className="rounded-md border border-[#334155]/60 bg-[#090d14]/90 px-2.5 py-1 text-[11px] font-medium text-[#f0f6fc] shadow-md shadow-black/40 backdrop-blur-sm whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
}

export default Tooltip;

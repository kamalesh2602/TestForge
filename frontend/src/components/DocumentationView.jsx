import { documentationCategories } from "../data/documentation.js";

function getBadgeStyle(type) {
  switch (type?.toLowerCase()) {
    case "official":
      return "bg-[#8CE4FF]/10 text-[#8CE4FF] border-[#8CE4FF]/30";
    case "learning":
      return "bg-emerald-400/10 text-emerald-400 border-emerald-400/30";
    case "tutorial":
      return "bg-[#FFA239]/10 text-[#FFA239] border-[#FFA239]/30";
    default:
      return "bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/30";
  }
}

function DocumentationView() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#090d14] px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header Banner */}
        <header className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8CE4FF]/10 text-[#8CE4FF]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Developer Resources & Documentation
              </h1>
              <p className="mt-0.5 text-xs text-[#8b949e] sm:text-sm">
                Curated documentation, official guides, and reference resources for developers.
              </p>
            </div>
          </div>
        </header>

        {/* Categories Section */}
        <main className="space-y-8">
          {documentationCategories.map((category) => (
            <section key={category.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#8CE4FF]">
                  {category.category}
                </h2>
              </div>

              <div className="space-y-6">
                {category.technologies.map((tech) => (
                  <div key={tech.id} className="space-y-3">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#FEEE91]">
                      {tech.name}
                    </h3>

                    {tech.resources && tech.resources.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tech.resources.map((resource, index) => (
                          <div
                            key={index}
                            className="flex flex-col justify-between rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 transition-all duration-200 hover:border-[#8CE4FF]/50 hover:shadow-md"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-sans text-sm font-bold text-white line-clamp-2">
                                  {resource.title}
                                </h4>
                                {resource.type && (
                                  <span
                                    className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${getBadgeStyle(
                                      resource.type
                                    )}`}
                                  >
                                    {resource.type}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#1e293b]/60">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${resource.title} in a new tab`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-3 py-2 font-mono text-xs font-bold text-[#8CE4FF] transition hover:bg-[#8CE4FF] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#8CE4FF]"
                              >
                                <span>Open Resource</span>
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#1e293b]/60 bg-[#0f172a]/50 p-3 font-mono text-xs italic text-[#475569]">
                        No resources added yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

export default DocumentationView;

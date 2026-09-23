import { useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const categories = useMemo(() => {
    const cats = new Set(documentationCategories.map((c) => c.category));
    return ["All Categories", ...Array.from(cats)];
  }, []);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return documentationCategories
      .filter((cat) => {
        if (selectedCategory !== "All Categories" && cat.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .map((cat) => {
        const filteredTechs = cat.technologies
          .map((tech) => {
            const filteredResources = tech.resources?.filter((res) => {
              const matchTitle = res.title?.toLowerCase().includes(query);
              const matchType = res.type?.toLowerCase().includes(query);
              const matchTech = tech.name?.toLowerCase().includes(query);
              return !query || matchTitle || matchType || matchTech;
            });
            return { ...tech, resources: filteredResources };
          })
          .filter((tech) => tech.resources && tech.resources.length > 0);

        return { ...cat, technologies: filteredTechs };
      })
      .filter((cat) => cat.technologies.length > 0);
  }, [searchQuery, selectedCategory]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "All Categories";
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
  };

  const repoIssueUrl = "https://github.com/kamalesh2602/TestForge/issues/new";

  const getIssueUrl = (title, body) => {
    return `${repoIssueUrl}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  };

  const reportIssueUrl =
    "https://github.com/kamalesh2602/TestForge/issues/new?template=report-a-resource-issue.md";

  const suggestResourceUrl =
    "https://github.com/kamalesh2602/TestForge/issues/new?template=suggest-a-resource.md";

  const reportBrokenLinkUrl =
    "https://github.com/kamalesh2602/TestForge/issues/new?template=report-a-broken-link.md";

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

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-[#8b949e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-[#1e293b] bg-[#0f172a] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#8b949e] focus:border-[#8CE4FF] focus:outline-none focus:ring-1 focus:ring-[#8CE4FF]"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-lg border border-[#1e293b] bg-[#0f172a] py-2.5 pl-4 pr-10 text-sm text-white focus:border-[#8CE4FF] focus:outline-none focus:ring-1 focus:ring-[#8CE4FF] sm:w-auto appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-[#8b949e] hover:text-[#8CE4FF] shrink-0"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <main className="space-y-8">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#1e293b] bg-[#0f172a] p-12 text-center shadow-md">
              <svg className="mb-4 h-12 w-12 text-[#8b949e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 className="text-lg font-bold text-white">No resources found.</h3>
              <p className="mt-2 text-sm text-[#8b949e]">Try a different search term or category.</p>
            </div>
          ) : (
            filteredData.map((category) => (
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
            ))
          )}
        </main>

        {/* Feedback Section */}
        <footer className="mt-12 rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 shadow-md sm:p-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-white">Help Improve These Resources</h2>
            <p className="mt-2 text-sm text-[#8b949e]">
              Found something incorrect, outdated, or broken? Help keep these resources useful for everyone.
            </p>

            <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <a
                href={reportIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#1e293b] bg-[#090d14] p-4 text-[#8CE4FF] transition-all hover:border-[#8CE4FF]/50 hover:bg-[#1e293b]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="font-sans text-sm font-bold">Report an Issue</span>
              </a>

              <a
                href={suggestResourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#1e293b] bg-[#090d14] p-4 text-[#8CE4FF] transition-all hover:border-[#8CE4FF]/50 hover:bg-[#1e293b]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                <span className="font-sans text-sm font-bold">Suggest a Resource</span>
              </a>

              <a
                href={reportBrokenLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#1e293b] bg-[#090d14] p-4 text-[#8CE4FF] transition-all hover:border-[#8CE4FF]/50 hover:bg-[#1e293b]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span className="font-sans text-sm font-bold">Report Broken Link</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DocumentationView;

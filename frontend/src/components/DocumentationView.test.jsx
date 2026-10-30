import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import DocumentationView from "./DocumentationView.jsx";

describe("DocumentationView Component", () => {
  it("renders header, category options, and tech sections", () => {
    const html = renderToString(<DocumentationView />);

    expect(html).toContain("Developer Resources &amp; Documentation");
    expect(html).toContain("All Categories");
    expect(html).toContain("Languages");
    expect(html).toContain("Python");
    expect(html).toContain("JavaScript");
  });

  it("renders badge labels for documentation resources", () => {
    const html = renderToString(<DocumentationView />);

    expect(html).toContain("Official");
    expect(html).toContain("Learning");
  });
});

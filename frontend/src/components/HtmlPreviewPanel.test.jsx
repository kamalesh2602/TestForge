import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import HtmlPreviewPanel from "./HtmlPreviewPanel.jsx";

describe("HtmlPreviewPanel Component", () => {
  it("renders HTML Web Preview title in standalone HTML mode", () => {
    const html = renderToString(
      <HtmlPreviewPanel htmlCode="<h1>Hello TestForge</h1>" isWebMode={false} />
    );

    expect(html).toContain("HTML Web Preview");
    expect(html).toContain("Live DOM");
    expect(html).toContain("New Tab");
    expect(html).toContain("Refresh");
    expect(html).toContain("Maximize");
    expect(html).toContain("<iframe");
    expect(html).toContain("Developer Console");
  });

  it("renders Web Browser Preview title in multi-file web mode", () => {
    const html = renderToString(
      <HtmlPreviewPanel htmlCode="<div id='app'></div>" isWebMode={true} />
    );

    expect(html).toContain("Web Browser Preview");
    expect(html).toContain("Live DOM");
  });
});

import { describe, it, expect } from "vitest";
import { buildWebProjectHtml } from "./webProjectBuilder.js";

describe("Web Project Builder (buildWebProjectHtml)", () => {
  describe("Explicit link and script tag replacement", () => {
    it("replaces <link rel='stylesheet' href='style.css'> with inline <style> tag", () => {
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
  <link rel="stylesheet" href="style.css">
</head>
<body><h1>Hello</h1></body>
</html>`;
      const css = "h1 { color: red; font-size: 20px; }";
      const js = "console.log('hi');";

      const output = buildWebProjectHtml(html, css, js);

      expect(output).not.toContain('<link rel="stylesheet" href="style.css">');
      expect(output).toContain('<style data-source="style.css">\nh1 { color: red; font-size: 20px; }\n</style>');
    });

    it("replaces href='./style.css' and query string variants like 'style.css?v=1'", () => {
      const html1 = '<link rel="stylesheet" href="./style.css" />';
      const html2 = '<link href="style.css?v=123" rel="stylesheet">';
      const css = "body { margin: 0; }";

      const out1 = buildWebProjectHtml(html1, css, "");
      const out2 = buildWebProjectHtml(html2, css, "");

      expect(out1).toContain('<style data-source="style.css">\nbody { margin: 0; }\n</style>');
      expect(out2).toContain('<style data-source="style.css">\nbody { margin: 0; }\n</style>');
    });

    it("removes duplicate style.css links if multiple exist", () => {
      const html = `<html><head>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="style.css">
</head><body></body></html>`;
      const css = "p { color: blue; }";

      const output = buildWebProjectHtml(html, css, "");
      const matches = output.match(/data-source="style.css"/g);
      expect(matches).toHaveLength(1);
      expect(output).not.toContain('href="style.css"');
    });

    it("replaces <script src='script.js'></script> with inline <script> tag", () => {
      const html = `<!DOCTYPE html>
<html>
<body>
  <h1>App</h1>
  <script src="script.js"></script>
</body>
</html>`;
      const js = "document.title = 'Updated';";

      const output = buildWebProjectHtml(html, "", js);

      expect(output).not.toContain('<script src="script.js"></script>');
      expect(output).toContain('<script data-source="script.js">\ndocument.title = \'Updated\';\n</script>');
    });

    it("replaces src='./script.js' and handles self-closing or paired script tags", () => {
      const html = '<script src="./script.js?v=2"></script>';
      const js = "const x = 10;";

      const output = buildWebProjectHtml(html, "", js);
      expect(output).toContain('<script data-source="script.js">\nconst x = 10;\n</script>');
    });

    it("removes duplicate script.js tags if multiple exist", () => {
      const html = '<body><script src="script.js"></script><script src="script.js"></script></body>';
      const js = "console.log(1);";

      const output = buildWebProjectHtml(html, "", js);
      const matches = output.match(/data-source="script.js"/g);
      expect(matches).toHaveLength(1);
    });
  });

  describe("Fallback injection when explicit tags are absent", () => {
    it("injects style into <head> before </head> when no style.css link is present", () => {
      const html = "<html><head><title>No Link</title></head><body><h1>Content</h1></body></html>";
      const css = "h1 { color: green; }";

      const output = buildWebProjectHtml(html, css, "");
      expect(output).toContain('<style data-source="style.css">\nh1 { color: green; }\n</style>\n</head>');
    });

    it("injects style after <head> if no closing </head> tag exists", () => {
      const html = "<html><head><title>Unclosed Head";
      const css = "body { background: #000; }";

      const output = buildWebProjectHtml(html, css, "");
      expect(output).toContain('<head>\n<style data-source="style.css">');
    });

    it("injects style before <body> if no <head> tag exists", () => {
      const html = "<body><h1>No Head</h1></body>";
      const css = "h1 { margin: 0; }";

      const output = buildWebProjectHtml(html, css, "");
      expect(output).toContain('<style data-source="style.css">\nh1 { margin: 0; }\n</style>\n<body>');
    });

    it("prepends style tag if no head or body tags exist at all", () => {
      const html = "<h1>Plain Snippet</h1>";
      const css = "h1 { font-weight: bold; }";

      const output = buildWebProjectHtml(html, css, "");
      expect(output.startsWith('<style data-source="style.css">')).toBe(true);
    });

    it("injects script before </body> when no script.js tag is present", () => {
      const html = "<html><body><h1>Content</h1></body></html>";
      const js = "console.log('injected before body');";

      const output = buildWebProjectHtml(html, "", js);
      expect(output).toContain('<script data-source="script.js">\nconsole.log(\'injected before body\');\n</script>\n</body>');
    });

    it("injects script before </html> if no closing </body> tag exists", () => {
      const html = "<html><h1>No Body Tag</h1></html>";
      const js = "alert('test');";

      const output = buildWebProjectHtml(html, "", js);
      expect(output).toContain('<script data-source="script.js">\nalert(\'test\');\n</script>\n</html>');
    });

    it("appends script tag if no body or html closing tags exist", () => {
      const html = "<div>Just a div</div>";
      const js = "console.log('appended');";

      const output = buildWebProjectHtml(html, "", js);
      expect(output.endsWith('</script>')).toBe(true);
    });
  });

  describe("HTML parser safety and edge cases", () => {
    it("escapes closing script tags inside user JavaScript code", () => {
      const html = "<body><script src='script.js'></script></body>";
      const js = 'const htmlSnippet = "</script><script>alert(\'xss\')</script>";';

      const output = buildWebProjectHtml(html, "", js);
      expect(output).not.toContain('</script><script>alert');
      expect(output).toContain('<\\/script>');
    });

    it("handles null, undefined, or empty inputs gracefully", () => {
      const res1 = buildWebProjectHtml("", "", "");
      expect(res1).toContain('<style data-source="style.css">\n\n</style>');
      expect(res1).toContain('<script data-source="script.js">\n\n</script>');

      const res2 = buildWebProjectHtml(null, null, null);
      expect(typeof res2).toBe("string");
      expect(res2).toContain('<style data-source="style.css">');
    });

    it("preserves external third-party links, CDNs, and Google fonts", () => {
      const html = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="script.js"></script>
</head>
<body></body>
</html>`;
      const css = "body { color: #fff; }";
      const js = "console.log('ready');";

      const output = buildWebProjectHtml(html, css, js);

      // External CDN links and scripts remain untouched
      expect(output).toContain("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css");
      expect(output).toContain("https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js");

      // Local files replaced in-place
      expect(output).toContain('<style data-source="style.css">\nbody { color: #fff; }\n</style>');
      expect(output).toContain('<script data-source="script.js">\nconsole.log(\'ready\');\n</script>');
    });

    it("preserves internal <style> blocks in HTML while adding CSS", () => {
      const html = `<html><head>
  <style>h2 { color: orange; }</style>
  <link rel="stylesheet" href="style.css">
</head><body><h2>Sub</h2></body></html>`;
      const css = "h1 { color: red; }";

      const output = buildWebProjectHtml(html, css, "");
      expect(output).toContain("h2 { color: orange; }");
      expect(output).toContain("h1 { color: red; }");
    });
  });
});

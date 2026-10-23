/**
 * Bundles HTML, CSS, and JavaScript into a unified HTML document
 * suitable for rendering in the live sandboxed browser preview iframe.
 *
 * If the HTML contains explicit references to "style.css" or "script.js",
 * they are replaced in-place. If not, the CSS is inserted into <head>
 * (or prepended) and the JS is inserted before </body> (or appended).
 */

export function buildWebProjectHtml(htmlCode, cssCode, jsCode) {
  let result = htmlCode || "";
  const css = cssCode || "";
  const js = jsCode || "";

  // Escape any closing script tag inside JS to avoid breaking HTML parser
  const safeJs = js.replace(/<\/script>/gi, "<\\/script>");

  const styleTag = `<style data-source="style.css">\n${css}\n</style>`;
  const scriptTag = `<script data-source="script.js">\n${safeJs}\n</script>`;

  // 1. Link style.css
  const linkRegex = /<link\b[^>]*\bhref=["']\s*(?:\.\/)?style\.css(?:\?[^"']*)?\s*["'][^>]*\/?>/i;
  if (linkRegex.test(result)) {
    result = result.replace(linkRegex, styleTag);
    // If there were duplicate style.css links, remove them
    const remainingLinkRegex = /<link\b[^>]*\bhref=["']\s*(?:\.\/)?style\.css(?:\?[^"']*)?\s*["'][^>]*\/?>/gi;
    result = result.replace(remainingLinkRegex, "");
  } else if (/<\/head>/i.test(result)) {
    result = result.replace(/<\/head>/i, `${styleTag}\n</head>`);
  } else if (/<head\b[^>]*>/i.test(result)) {
    result = result.replace(/(<head\b[^>]*>)/i, `$1\n${styleTag}`);
  } else if (/<body\b[^>]*>/i.test(result)) {
    result = result.replace(/(<body\b[^>]*>)/i, `${styleTag}\n$1`);
  } else {
    result = `${styleTag}\n${result}`;
  }

  // 2. Link script.js
  const scriptRegex = /<script\b[^>]*\bsrc=["']\s*(?:\.\/)?script\.js(?:\?[^"']*)?\s*["'][^>]*>(?:\s*<\/script>)?/i;
  if (scriptRegex.test(result)) {
    result = result.replace(scriptRegex, scriptTag);
    // If there were duplicate script.js tags, remove them
    const remainingScriptRegex = /<script\b[^>]*\bsrc=["']\s*(?:\.\/)?script\.js(?:\?[^"']*)?\s*["'][^>]*>(?:\s*<\/script>)?/gi;
    result = result.replace(remainingScriptRegex, "");
  } else if (/<\/body>/i.test(result)) {
    result = result.replace(/<\/body>/i, `${scriptTag}\n</body>`);
  } else if (/<\/html>/i.test(result)) {
    result = result.replace(/<\/html>/i, `${scriptTag}\n</html>`);
  } else {
    result = `${result}\n${scriptTag}`;
  }

  return result;
}

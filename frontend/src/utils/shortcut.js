export function getRunShortcutLabel() {
  if (typeof navigator !== "undefined") {
    const platform =
      navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
    if (/mac/i.test(platform)) {
      return "Run ⌘ + Enter";
    }
  }
  return "Run Ctrl + Enter";
}

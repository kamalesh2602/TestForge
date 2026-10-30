import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getRunShortcutLabel } from "./shortcut.js";

describe("Keyboard Shortcut Utility (frontend/src/utils/shortcut.js)", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    // Reset global navigator before each test
    Object.defineProperty(globalThis, "navigator", {
      value: { ...originalNavigator },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("returns Mac shortcut when platform is macOS", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { platform: "MacIntel" },
      configurable: true,
    });
    expect(getRunShortcutLabel()).toBe("Run ⌘ + Enter");
  });

  it("returns Mac shortcut when userAgent contains Mac", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { platform: "", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      configurable: true,
    });
    expect(getRunShortcutLabel()).toBe("Run ⌘ + Enter");
  });

  it("returns Mac shortcut when userAgentData platform is macOS", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgentData: { platform: "macOS" } },
      configurable: true,
    });
    expect(getRunShortcutLabel()).toBe("Run ⌘ + Enter");
  });

  it("returns Ctrl shortcut on Windows platform", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { platform: "Win32", userAgent: "Windows NT 10.0" },
      configurable: true,
    });
    expect(getRunShortcutLabel()).toBe("Run Ctrl + Enter");
  });

  it("returns Ctrl shortcut on Linux platform", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { platform: "Linux x86_64", userAgent: "Ubuntu" },
      configurable: true,
    });
    expect(getRunShortcutLabel()).toBe("Run Ctrl + Enter");
  });

  it("returns default Ctrl shortcut when navigator is undefined", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
    });
    expect(getRunShortcutLabel()).toBe("Run Ctrl + Enter");
  });
});


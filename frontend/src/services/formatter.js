import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserHtml from "prettier/plugins/html";
import parserPostcss from "prettier/plugins/postcss";
import prettierPluginJava from "prettier-plugin-java";
import { formatCodeAPI } from "./api.js";
import initClangFormat, { format as clangFormat } from "@wasm-fmt/clang-format/vite";

let clangFormatInitialized = false;
let clangFormatInitPromise = null;

async function ensureClangFormat() {
  if (clangFormatInitialized) return;
  if (clangFormatInitPromise) return clangFormatInitPromise;

  clangFormatInitPromise = (async () => {
    try {
      if (
        typeof window === "undefined" &&
        typeof globalThis !== "undefined" &&
        Boolean(globalThis.process?.versions?.node)
      ) {
        const fsMod = "node:fs/promises";
        const { readFile } = await import(/* @vite-ignore */ fsMod);
        const wasmPath = new URL("../../node_modules/@wasm-fmt/clang-format/clang-format.wasm", import.meta.url);
        const bytes = await readFile(wasmPath);
        await initClangFormat(bytes);
      } else {
        await initClangFormat();
      }
      clangFormatInitialized = true;
    } catch (err) {
      clangFormatInitPromise = null;
      throw err;
    }
  })();

  return clangFormatInitPromise;
}

export async function formatCode(code, language) {
  if (!code || !code.trim()) {
    return code;
  }

  if (language === "css") {
    try {
      const formatted = await prettier.format(code, {
        parser: "css",
        plugins: [parserPostcss],
        tabWidth: 2,
      });
      return formatted;
    } catch (err) {
      const msg = err.message || "Failed to format CSS code";
      const cleanMsg = msg.split("\n")[0];
      throw new Error(`CSS formatting error: ${cleanMsg}`, { cause: err });
    }
  }

  if (language === "javascript") {
    try {
      const formatted = await prettier.format(code, {
        parser: "babel",
        plugins: [parserBabel, parserEstree],
        semi: true,
        singleQuote: false,
        tabWidth: 2,
      });
      return formatted;
    } catch (err) {
      const msg = err.message || "Failed to format JavaScript code";
      // Extract main syntax error message line if available
      const cleanMsg = msg.split("\n")[0];
      throw new Error(`JavaScript formatting error: ${cleanMsg}`, { cause: err });
    }
  }

  if (language === "java") {
    try {
      const formatted = await prettier.format(code, {
        parser: "java",
        plugins: [prettierPluginJava],
        tabWidth: 4,
      });
      return formatted;
    } catch (err) {
      const msg = err.message || "Failed to format Java code";
      const cleanMsg = msg.split("\n")[0];
      throw new Error(`Java formatting error: ${cleanMsg}`, { cause: err });
    }
  }

  if (language === "html") {
    try {
      const formatted = await prettier.format(code, {
        parser: "html",
        plugins: [parserHtml],
        tabWidth: 2,
      });
      return formatted;
    } catch (err) {
      const msg = err.message || "Failed to format HTML code";
      const cleanMsg = msg.split("\n")[0];
      throw new Error(`HTML formatting error: ${cleanMsg}`, { cause: err });
    }
  }

  if (language === "python") {
    try {
      const res = await formatCodeAPI(code, "python");
      if (res && res.formatted_code) {
        return res.formatted_code;
      }
      throw new Error("Invalid response from format service");
    } catch (err) {
      throw new Error(err.message || "Python formatting error", { cause: err });
    }
  }

  if (language === "c") {
    try {
      await ensureClangFormat();
      const formatted = clangFormat(code, "main.c", "LLVM");
      if (typeof formatted !== "string" || !formatted) {
        throw new Error("Formatting produced invalid output");
      }
      return formatted;
    } catch (err) {
      const msg = err.message || "Failed to format C code";
      const cleanMsg = msg.split("\n")[0];
      throw new Error(`C formatting error: ${cleanMsg}`, { cause: err });
    }
  }

  if (language === "cpp") {
    try {
      await ensureClangFormat();
      const formatted = clangFormat(code, "main.cpp", "LLVM");
      if (typeof formatted !== "string" || !formatted) {
        throw new Error("Formatting produced invalid output");
      }
      return formatted;
    } catch (err) {
      const msg = err.message || "Failed to format C++ code";
      const cleanMsg = msg.split("\n")[0];
      throw new Error(`C++ formatting error: ${cleanMsg}`, { cause: err });
    }
  }

  throw new Error(`Unsupported formatting language: ${language}`);
}

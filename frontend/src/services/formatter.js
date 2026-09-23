import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserHtml from "prettier/plugins/html";
import prettierPluginJava from "prettier-plugin-java";
import { formatCodeAPI } from "./api.js";

export async function formatCode(code, language) {
  if (!code || !code.trim()) {
    return code;
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
      throw new Error(`JavaScript formatting error: ${cleanMsg}`);
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
      throw new Error(`Java formatting error: ${cleanMsg}`);
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
      throw new Error(`HTML formatting error: ${cleanMsg}`);
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
      throw new Error(err.message || "Python formatting error");
    }
  }

  throw new Error(`Unsupported formatting language: ${language}`);
}

import { describe, it, expect, vi } from "vitest";
import { formatCode } from "./formatter.js";
import * as api from "./api.js";

describe("Code Formatter Service", () => {
  describe("Language mapping and unsupported languages", () => {
    it("throws an error for unsupported languages", async () => {
      await expect(formatCode("let x = 10;", "rust")).rejects.toThrow(
        "Unsupported formatting language: rust"
      );
    });

    it("returns unchanged code when input is empty or whitespace", async () => {
      expect(await formatCode("", "c")).toBe("");
      expect(await formatCode("   \n\t  ", "cpp")).toBe("   \n\t  ");
      expect(await formatCode(null, "c")).toBe(null);
    });
  });

  describe("C code formatting", () => {
    it("formats poorly formatted C code with includes, functions, loops, conditionals, and multiline expressions", async () => {
      const unformatted = `#include<stdio.h>
#include<stdlib.h>
int    compute(int a,int b){
if(a>b){
return a*b+10;
}else{
return a-b;
}
}
int main(int argc,char** argv){
int total=0;
for(int i=0;i<5;i++){
total+=compute(i,i+1);
printf("total=%d\\n",total);
}
return 0;
}`;

      const formatted = await formatCode(unformatted, "c");

      // Verify formatting quality: proper spacing and indentation
      expect(formatted).toContain("#include <stdio.h>");
      expect(formatted).toContain("#include <stdlib.h>");
      expect(formatted).toContain("int compute(int a, int b) {");
      expect(formatted).toContain("  if (a > b) {");
      expect(formatted).toContain("    return a * b + 10;");
      expect(formatted).toContain("  } else {");
      expect(formatted).toContain("int main(int argc, char **argv) {");
      expect(formatted).toContain("  for (int i = 0; i < 5; i++) {");
      expect(formatted).toContain('    printf("total=%d\\n", total);');

      // Check idempotency: formatting already-formatted code returns identical code
      const reformatted = await formatCode(formatted, "c");
      expect(reformatted).toBe(formatted);
    });
  });

  describe("C++ code formatting", () => {
    it("formats poorly formatted C++ code with classes, templates, namespaces, and standard containers", async () => {
      const unformatted = `#include<iostream>
#include<vector>
#include<string>
template<typename T>class Container{
public:
Container(T val):data_(val){}
T get()const{
return data_;
}
private:
T data_;
};
int main(){
std::vector<int> numbers={3,1,4,1,5};
Container<std::string> box("TestForge");
for(const auto& n:numbers){
std::cout<<box.get()<<": "<<n<<std::endl;
}
return 0;
}`;

      const formatted = await formatCode(unformatted, "cpp");

      // Verify formatting quality
      expect(formatted).toContain("#include <iostream>");
      expect(formatted).toContain("#include <vector>");
      expect(formatted).toContain("template <typename T> class Container {");
      expect(formatted).toContain("public:");
      expect(formatted).toContain("  Container(T val) : data_(val) {}");
      expect(formatted).toContain("  T get() const { return data_; }");
      expect(formatted).toContain("private:");
      expect(formatted).toContain("  T data_;");
      expect(formatted).toContain("int main() {");
      expect(formatted).toContain("  std::vector<int> numbers = {3, 1, 4, 1, 5};");
      expect(formatted).toContain('  Container<std::string> box("TestForge");');
      expect(formatted).toContain("  for (const auto &n : numbers) {");
      expect(formatted).toContain("std::cout << box.get() << \": \" << n << std::endl;");

      // Check idempotency
      const reformatted = await formatCode(formatted, "cpp");
      expect(reformatted).toBe(formatted);
    });
  });

  describe("Regression: Existing languages still work", () => {
    it("formats JavaScript code", async () => {
      const unformatted = "function  test( a, b ){ return a+b;}";
      const formatted = await formatCode(unformatted, "javascript");
      expect(formatted).toBe('function test(a, b) {\n  return a + b;\n}\n');
    });

    it("formats Java code", async () => {
      const unformatted = "public class Main{public static void main(String[] args){System.out.println( \"Hello\" );}}";
      const formatted = await formatCode(unformatted, "java");
      expect(formatted).toContain("public class Main {");
      expect(formatted).toContain('System.out.println("Hello");');
    });

    it("formats HTML code", async () => {
      const unformatted = "<div class=\"test\"><h1>Title</h1><p>Paragraph</p></div>";
      const formatted = await formatCode(unformatted, "html");
      expect(formatted).toContain('<div class="test">');
      expect(formatted).toContain("  <h1>Title</h1>");
    });

    it("formats CSS code", async () => {
      const unformatted = "body{margin:0;padding:10px;color:#fff;}";
      const formatted = await formatCode(unformatted, "css");
      expect(formatted).toContain("body {");
      expect(formatted).toContain("  margin: 0;");
      expect(formatted).toContain("  padding: 10px;");
    });

    it("formats Python code via backend API delegation", async () => {
      const spy = vi.spyOn(api, "formatCodeAPI").mockResolvedValueOnce({
        formatted_code: "def test(a, b):\n    return a + b\n",
      });

      const res = await formatCode("def test( a,b ):\n return a+b", "python");
      expect(res).toBe("def test(a, b):\n    return a + b\n");
      expect(spy).toHaveBeenCalledWith("def test( a,b ):\n return a+b", "python");
      spy.mockRestore();
    });

    it("handles Python format service error correctly", async () => {
      const spy = vi.spyOn(api, "formatCodeAPI").mockRejectedValueOnce(
        new Error("Syntax error in Python code")
      );

      await expect(formatCode("def broken(", "python")).rejects.toThrow(
        "Syntax error in Python code"
      );
      spy.mockRestore();
    });
  });

  describe("C and C++ Formatter failure handling", () => {
    it("handles failure in C formatting gracefully", async () => {
      const wasmMod = await import("@wasm-fmt/clang-format/vite");
      const spy = vi.spyOn(wasmMod, "format").mockImplementationOnce(() => {
        throw new Error("Internal parser exception");
      });

      await expect(formatCode("int main() {}", "c")).rejects.toThrow(
        "C formatting error: Internal parser exception"
      );
      spy.mockRestore();
    });

    it("handles failure in C++ formatting gracefully", async () => {
      const wasmMod = await import("@wasm-fmt/clang-format/vite");
      const spy = vi.spyOn(wasmMod, "format").mockImplementationOnce(() => {
        throw new Error("Failed to parse AST");
      });

      await expect(formatCode("int main() {}", "cpp")).rejects.toThrow(
        "C++ formatting error: Failed to parse AST"
      );
      spy.mockRestore();
    });

    it("handles invalid output from clang-format", async () => {
      const wasmMod = await import("@wasm-fmt/clang-format/vite");
      const spy = vi.spyOn(wasmMod, "format").mockReturnValueOnce("");

      await expect(formatCode("int main() {}", "c")).rejects.toThrow(
        "C formatting error: Formatting produced invalid output"
      );
      spy.mockRestore();
    });
  });
});

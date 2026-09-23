/**
 * Custom Monaco Editor completion providers for Python and Java.
 * JavaScript built-in IntelliSense is preserved intact.
 */

let isRegistered = false;

export function registerCompletionProviders(monaco) {
  if (isRegistered || !monaco) return;
  isRegistered = true;

  // ---------------------------------------------------------------------------
  // PYTHON COMPLETION PROVIDER
  // ---------------------------------------------------------------------------
  monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [".", " "],
    provideCompletionItems(model, position) {
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const lineUntilPos = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const suggestions = [];

      // Check for dot completions (e.g. math.sqrt, sys.argv, os.path, json.loads)
      const dotMatch = lineUntilPos.match(/([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\.$/);
      if (dotMatch) {
        const objectPath = dotMatch[1];
        const dotItems = getPythonDotCompletions(objectPath, range, monaco);
        return { suggestions: dotItems };
      }

      // Python Keywords
      const keywords = [
        "def", "class", "import", "from", "return", "if", "elif", "else",
        "for", "while", "try", "except", "finally", "with", "as", "yield",
        "lambda", "pass", "break", "continue", "raise", "assert", "async",
        "await", "global", "nonlocal", "in", "is", "not", "and", "or",
        "True", "False", "None"
      ];
      keywords.forEach((kw) => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        });
      });

      // Python Built-in Functions & Types
      const builtins = [
        { label: "print", detail: "print(value, ..., sep=' ', end='\\n')", insertText: "print(${1:value})", doc: "Prints values to a stream or to sys.stdout by default." },
        { label: "len", detail: "len(s)", insertText: "len(${1:s})", doc: "Return the number of items of a sequence or collection." },
        { label: "range", detail: "range(stop) or range(start, stop[, step])", insertText: "range(${1:stop})", doc: "Return an object that produces a sequence of integers." },
        { label: "str", detail: "str(object='')", insertText: "str(${1:object})", doc: "Create a new string object from the given object." },
        { label: "int", detail: "int(x=0)", insertText: "int(${1:x})", doc: "Convert a number or string to an integer." },
        { label: "float", detail: "float(x=0)", insertText: "float(${1:x})", doc: "Convert a string or number to a floating point number." },
        { label: "list", detail: "list([iterable])", insertText: "list(${1:iterable})", doc: "Built-in mutable sequence." },
        { label: "dict", detail: "dict(**kwargs)", insertText: "dict(${1:mapping})", doc: "Built-in associative dictionary." },
        { label: "set", detail: "set([iterable])", insertText: "set(${1:iterable})", doc: "Unordered collection of unique elements." },
        { label: "tuple", detail: "tuple([iterable])", insertText: "tuple(${1:iterable})", doc: "Built-in immutable sequence." },
        { label: "bool", detail: "bool([x])", insertText: "bool(${1:x})", doc: "Returns True when the argument x is true, False otherwise." },
        { label: "type", detail: "type(object)", insertText: "type(${1:object})", doc: "Returns the type of an object." },
        { label: "input", detail: "input([prompt])", insertText: "input(${1:prompt})", doc: "Read a string from standard input." },
        { label: "open", detail: "open(file, mode='r')", insertText: "open(\"${1:file.txt}\", \"${2:r}\")", doc: "Open file and return a stream." },
        { label: "sum", detail: "sum(iterable[, start])", insertText: "sum(${1:iterable})", doc: "Return the sum of a 'start' value plus an iterable of numbers." },
        { label: "min", detail: "min(iterable) or min(arg1, arg2)", insertText: "min(${1:arg1}, ${2:arg2})", doc: "Return the smallest item in an iterable or smallest of two arguments." },
        { label: "max", detail: "max(iterable) or max(arg1, arg2)", insertText: "max(${1:arg1}, ${2:arg2})", doc: "Return the largest item in an iterable or largest of two arguments." },
        { label: "abs", detail: "abs(x)", insertText: "abs(${1:x})", doc: "Return the absolute value of the argument." },
        { label: "round", detail: "round(number[, ndigits])", insertText: "round(${1:number})", doc: "Round a number to a given precision in decimal digits." },
        { label: "sorted", detail: "sorted(iterable, key=None, reverse=False)", insertText: "sorted(${1:iterable})", doc: "Return a new list containing all items from the iterable in ascending order." },
        { label: "enumerate", detail: "enumerate(iterable, start=0)", insertText: "enumerate(${1:iterable})", doc: "Return an enumerating object." },
        { label: "zip", detail: "zip(*iterables)", insertText: "zip(${1:iter1}, ${2:iter2})", doc: "Returns an iterator of tuples where the i-th tuple contains the i-th element from each of the argument sequences." },
        { label: "map", detail: "map(func, *iterables)", insertText: "map(${1:func}, ${2:iterable})", doc: "Make an iterator that computes the function using arguments from each of the iterables." },
        { label: "filter", detail: "filter(function, iterable)", insertText: "filter(${1:function}, ${2:iterable})", doc: "Return an iterator yielding those items of iterable for which function(item) is true." },
        { label: "isinstance", detail: "isinstance(object, classinfo)", insertText: "isinstance(${1:object}, ${2:classinfo})", doc: "Return whether an object is an instance of a class or of a subclass thereof." },
        { label: "hasattr", detail: "hasattr(object, name)", insertText: "hasattr(${1:object}, \"${2:name}\")", doc: "Returns whether the object has an attribute with the given name." },
        { label: "getattr", detail: "getattr(object, name[, default])", insertText: "getattr(${1:object}, \"${2:name}\")", doc: "Get a named attribute from an object." },
        { label: "setattr", detail: "setattr(object, name, value)", insertText: "setattr(${1:object}, \"${2:name}\", ${3:value})", doc: "Set a named attribute on an object." },
        { label: "super", detail: "super()", insertText: "super()", doc: "Return a proxy object that delegates method calls to a parent or sibling class." },
      ];

      builtins.forEach((b) => {
        suggestions.push({
          label: b.label,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: b.detail,
          documentation: b.doc,
          insertText: b.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      });

      // Python Standard Library Modules
      const modules = ["math", "sys", "os", "json", "random", "re", "datetime", "collections", "typing", "itertools", "functools"];
      modules.forEach((mod) => {
        suggestions.push({
          label: mod,
          kind: monaco.languages.CompletionItemKind.Module,
          detail: `Python module '${mod}'`,
          insertText: mod,
          range,
        });
      });

      // Python Snippets
      const snippets = [
        { label: "def function", detail: "Function definition", insertText: "def ${1:function_name}(${2:params}):\n\t${0:pass}", doc: "Snippet for defining a Python function" },
        { label: "class ClassName", detail: "Class definition", insertText: "class ${1:ClassName}:\n\tdef __init__(self, ${2:params}):\n\t\t${0:pass}", doc: "Snippet for defining a Python class" },
        { label: "for loop", detail: "for i in range(...)", insertText: "for ${1:i} in range(${2:10}):\n\t${0:pass}", doc: "Snippet for a standard for loop" },
        { label: "for item in list", detail: "for item in iterable", insertText: "for ${1:item} in ${2:iterable}:\n\t${0:pass}", doc: "Snippet for iterating over a collection" },
        { label: "if __name__ == '__main__'", detail: "Main entry point", insertText: "if __name__ == \"__main__\":\n\t${0:main()}", doc: "Snippet for main entry point block" },
        { label: "try / except", detail: "Exception handling block", insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${0:print(e)}", doc: "Snippet for try-except block" },
        { label: "with open", detail: "Context manager file open", insertText: "with open(\"${1:filename}\", \"${2:r}\") as ${3:f}:\n\t${0:content = f.read()}", doc: "Snippet for opening a file using context manager" },
      ];

      snippets.forEach((snip) => {
        suggestions.push({
          label: snip.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: snip.detail,
          documentation: snip.doc,
          insertText: snip.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      });

      // Dynamic document identifiers (functions/classes/variables declared in file)
      const docIdentifiers = extractPythonDocumentIdentifiers(model.getValue(), range, monaco);
      docIdentifiers.forEach((item) => suggestions.push(item));

      return { suggestions };
    },
  });

  // ---------------------------------------------------------------------------
  // JAVA COMPLETION PROVIDER
  // ---------------------------------------------------------------------------
  monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", " "],
    provideCompletionItems(model, position) {
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const lineUntilPos = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const suggestions = [];

      // Check for dot completions (e.g. System.out.println, Math.max, String.format)
      const dotMatch = lineUntilPos.match(/([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\.$/);
      if (dotMatch) {
        const objectPath = dotMatch[1];
        const dotItems = getJavaDotCompletions(objectPath, range, monaco);
        return { suggestions: dotItems };
      }

      // Java Keywords
      const javaKeywords = [
        "public", "private", "protected", "static", "final", "class",
        "interface", "extends", "implements", "void", "int", "double",
        "float", "boolean", "char", "long", "short", "byte", "return",
        "if", "else", "for", "while", "do", "switch", "case", "default",
        "break", "continue", "try", "catch", "finally", "throw", "throws",
        "new", "this", "super", "import", "package", "null", "true",
        "false", "instanceof"
      ];
      javaKeywords.forEach((kw) => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        });
      });

      // Java Core Standard Classes & Interfaces
      const coreClasses = [
        { label: "System", detail: "java.lang.System", doc: "Provides system utilities such as standard input/output streams." },
        { label: "String", detail: "java.lang.String", doc: "Represents character strings." },
        { label: "Math", detail: "java.lang.Math", doc: "Contains methods for performing basic numeric operations." },
        { label: "Integer", detail: "java.lang.Integer", doc: "Wraps a value of the primitive type int in an object." },
        { label: "Double", detail: "java.lang.Double", doc: "Wraps a value of the primitive type double in an object." },
        { label: "Boolean", detail: "java.lang.Boolean", doc: "Wraps a value of the primitive type boolean in an object." },
        { label: "Object", detail: "java.lang.Object", doc: "Class Object is the root of the class hierarchy." },
        { label: "ArrayList", detail: "java.util.ArrayList", doc: "Resizable-array implementation of the List interface." },
        { label: "LinkedList", detail: "java.util.LinkedList", doc: "Doubly-linked list implementation of the List and Deque interfaces." },
        { label: "HashMap", detail: "java.util.HashMap", doc: "Hash table based implementation of the Map interface." },
        { label: "HashSet", detail: "java.util.HashSet", doc: "Set implementation backed by a hash table." },
        { label: "List", detail: "java.util.List", doc: "An ordered collection (also known as a sequence)." },
        { label: "Map", detail: "java.util.Map", doc: "An object that maps keys to values." },
        { label: "Set", detail: "java.util.Set", doc: "A collection that contains no duplicate elements." },
        { label: "Scanner", detail: "java.util.Scanner", doc: "A simple text scanner which can parse primitive types and strings using regular expressions." },
        { label: "Arrays", detail: "java.util.Arrays", doc: "Contains various methods for manipulating arrays." },
        { label: "Collections", detail: "java.util.Collections", doc: "Consists exclusively of static methods that operate on or return collections." },
        { label: "StringBuilder", detail: "java.lang.StringBuilder", doc: "A mutable sequence of characters." },
        { label: "Exception", detail: "java.lang.Exception", doc: "Root exception class." },
      ];

      coreClasses.forEach((c) => {
        suggestions.push({
          label: c.label,
          kind: monaco.languages.CompletionItemKind.Class,
          detail: c.detail,
          documentation: c.doc,
          insertText: c.label,
          range,
        });
      });

      // Java Snippets
      const javaSnippets = [
        { label: "main method", detail: "public static void main(String[] args)", insertText: "public static void main(String[] args) {\n\t${0}\n}", doc: "Main entry point for Java applications" },
        { label: "println", detail: "System.out.println(...)", insertText: "System.out.println(${1:arg});", doc: "Prints argument to standard output with newline" },
        { label: "print", detail: "System.out.print(...)", insertText: "System.out.print(${1:arg});", doc: "Prints argument to standard output" },
        { label: "for loop", detail: "for (int i = 0; i < n; i++)", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}", doc: "Standard indexed for loop" },
        { label: "for-each loop", detail: "for (Type item : collection)", insertText: "for (${1:String} ${2:item} : ${3:list}) {\n\t${0}\n}", doc: "Enhanced for loop" },
        { label: "try / catch", detail: "try-catch block", insertText: "try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${3:e.printStackTrace();}\n}", doc: "Exception handling block" },
        { label: "new Scanner", detail: "Scanner scanner = new Scanner(System.in)", insertText: "Scanner ${1:scanner} = new Scanner(System.in);", doc: "Creates a new Scanner reading System.in" },
        { label: "new ArrayList", detail: "List<String> list = new ArrayList<>()", insertText: "List<${1:String}> ${2:list} = new ArrayList<>();", doc: "Creates a new ArrayList" },
        { label: "new HashMap", detail: "Map<String, Integer> map = new HashMap<>()", insertText: "Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();", doc: "Creates a new HashMap" },
      ];

      javaSnippets.forEach((snip) => {
        suggestions.push({
          label: snip.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: snip.detail,
          documentation: snip.doc,
          insertText: snip.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      });

      // Dynamic document identifiers (class names, methods, variables in current Java file)
      const docIdentifiers = extractJavaDocumentIdentifiers(model.getValue(), range, monaco);
      docIdentifiers.forEach((item) => suggestions.push(item));

      return { suggestions };
    },
  });

  // ---------------------------------------------------------------------------
  // HTML COMPLETION PROVIDER
  // ---------------------------------------------------------------------------
  monaco.languages.registerCompletionItemProvider("html", {
    triggerCharacters: ["<", " ", "/", ">", "a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "m", "n", "p", "s", "t", "u", "v", "w"],
    provideCompletionItems(model, position) {
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const lineUntilPos = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const htmlTags = [
        "h1", "h2", "h3", "h4", "h5", "h6", "div", "p", "section", "ul", "ol", "li",
        "span", "a", "button", "form", "input", "label", "select", "option", "textarea",
        "table", "tr", "td", "th", "header", "footer", "nav", "main", "article",
        "aside", "style", "script", "head", "body", "html", "meta", "title", "img", "link"
      ];

      const suggestions = [];
      const startsWithBracket = lineUntilPos.trim().endsWith("<") || /<[a-zA-Z0-9]*$/.test(lineUntilPos);

      htmlTags.forEach((tag) => {
        const isSelfClosing = ["img", "input", "meta", "link", "br", "hr"].includes(tag);

        let insertText;
        if (startsWithBracket) {
          insertText = isSelfClosing ? `${tag} />` : `${tag}>$0</${tag}>`;
        } else {
          insertText = isSelfClosing ? `<${tag} />` : `<${tag}>$0</${tag}>`;
        }

        suggestions.push({
          label: startsWithBracket ? tag : `<${tag}>`,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          insertText: insertText,
          detail: isSelfClosing ? `Self-closing <${tag}> tag` : `Paired <${tag}>...</${tag}> tag`,
          range: range,
        });
      });

      return { suggestions };
    },
  });
}

// -----------------------------------------------------------------------------
// Helper: Python Dot Completions
// -----------------------------------------------------------------------------
function getPythonDotCompletions(objectPath, range, monaco) {
  const suggestions = [];

  if (objectPath === "math") {
    const mathFuncs = [
      { label: "sqrt", detail: "math.sqrt(x)", insertText: "sqrt(${1:x})" },
      { label: "pow", detail: "math.pow(x, y)", insertText: "pow(${1:x}, ${2:y})" },
      { label: "ceil", detail: "math.ceil(x)", insertText: "ceil(${1:x})" },
      { label: "floor", detail: "math.floor(x)", insertText: "floor(${1:x})" },
      { label: "fabs", detail: "math.fabs(x)", insertText: "fabs(${1:x})" },
      { label: "sin", detail: "math.sin(x)", insertText: "sin(${1:x})" },
      { label: "cos", detail: "math.cos(x)", insertText: "cos(${1:x})" },
      { label: "tan", detail: "math.tan(x)", insertText: "tan(${1:x})" },
      { label: "log", detail: "math.log(x[, base])", insertText: "log(${1:x})" },
      { label: "pi", detail: "math.pi = 3.141592...", insertText: "pi", isConst: true },
      { label: "e", detail: "math.e = 2.718281...", insertText: "e", isConst: true },
    ];
    mathFuncs.forEach((f) => {
      suggestions.push({
        label: f.label,
        kind: f.isConst ? monaco.languages.CompletionItemKind.Constant : monaco.languages.CompletionItemKind.Function,
        detail: f.detail,
        insertText: f.insertText,
        insertTextRules: f.isConst ? undefined : monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "sys") {
    const sysItems = [
      { label: "argv", detail: "sys.argv", isVar: true },
      { label: "exit", detail: "sys.exit([status])", insertText: "exit(${1:0})" },
      { label: "stdin", detail: "sys.stdin", isVar: true },
      { label: "stdout", detail: "sys.stdout", isVar: true },
      { label: "stderr", detail: "sys.stderr", isVar: true },
      { label: "path", detail: "sys.path", isVar: true },
      { label: "version", detail: "sys.version", isVar: true },
    ];
    sysItems.forEach((f) => {
      suggestions.push({
        label: f.label,
        kind: f.isVar ? monaco.languages.CompletionItemKind.Variable : monaco.languages.CompletionItemKind.Function,
        detail: f.detail,
        insertText: f.insertText || f.label,
        insertTextRules: f.isVar ? undefined : monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "os") {
    const osItems = [
      { label: "path", detail: "os.path module", isMod: true },
      { label: "environ", detail: "os.environ", isVar: true },
      { label: "getcwd", detail: "os.getcwd()", insertText: "getcwd()" },
      { label: "listdir", detail: "os.listdir(path='.')", insertText: "listdir(${1:path})" },
      { label: "mkdir", detail: "os.mkdir(path)", insertText: "mkdir(${1:path})" },
      { label: "remove", detail: "os.remove(path)", insertText: "remove(${1:path})" },
    ];
    osItems.forEach((f) => {
      suggestions.push({
        label: f.label,
        kind: f.isMod ? monaco.languages.CompletionItemKind.Module : f.isVar ? monaco.languages.CompletionItemKind.Variable : monaco.languages.CompletionItemKind.Function,
        detail: f.detail,
        insertText: f.insertText || f.label,
        insertTextRules: (f.isMod || f.isVar) ? undefined : monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "os.path") {
    const pathItems = [
      { label: "join", detail: "os.path.join(path, *paths)", insertText: "join(${1:path}, ${2:*paths})" },
      { label: "exists", detail: "os.path.exists(path)", insertText: "exists(${1:path})" },
      { label: "isfile", detail: "os.path.isfile(path)", insertText: "isfile(${1:path})" },
      { label: "isdir", detail: "os.path.isdir(path)", insertText: "isdir(${1:path})" },
      { label: "basename", detail: "os.path.basename(path)", insertText: "basename(${1:path})" },
      { label: "dirname", detail: "os.path.dirname(path)", insertText: "dirname(${1:path})" },
      { label: "abspath", detail: "os.path.abspath(path)", insertText: "abspath(${1:path})" },
    ];
    pathItems.forEach((f) => {
      suggestions.push({
        label: f.label,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: f.detail,
        insertText: f.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "json") {
    const jsonItems = [
      { label: "loads", detail: "json.loads(s)", insertText: "loads(${1:s})" },
      { label: "dumps", detail: "json.dumps(obj)", insertText: "dumps(${1:obj})" },
      { label: "load", detail: "json.load(fp)", insertText: "load(${1:fp})" },
      { label: "dump", detail: "json.dump(obj, fp)", insertText: "dump(${1:obj}, ${2:fp})" },
    ];
    jsonItems.forEach((f) => {
      suggestions.push({
        label: f.label,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: f.detail,
        insertText: f.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "random") {
    const randItems = [
      { label: "randint", detail: "random.randint(a, b)", insertText: "randint(${1:a}, ${2:b})" },
      { label: "choice", detail: "random.choice(seq)", insertText: "choice(${1:seq})" },
      { label: "random", detail: "random.random()", insertText: "random()" },
      { label: "shuffle", detail: "random.shuffle(x)", insertText: "shuffle(${1:seq})" },
      { label: "sample", detail: "random.sample(population, k)", insertText: "sample(${1:pop}, ${2:k})" },
    ];
    randItems.forEach((f) => {
      suggestions.push({
        label: f.label,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: f.detail,
        insertText: f.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else {
    // General Python object method suggestions (lists, dicts, strings)
    const commonMethods = [
      { label: "append", detail: "list.append(x)", insertText: "append(${1:x})" },
      { label: "extend", detail: "list.extend(iterable)", insertText: "extend(${1:iterable})" },
      { label: "strip", detail: "str.strip([chars])", insertText: "strip()" },
      { label: "split", detail: "str.split(sep=None)", insertText: "split(${1:sep})" },
      { label: "join", detail: "str.join(iterable)", insertText: "join(${1:iterable})" },
      { label: "lower", detail: "str.lower()", insertText: "lower()" },
      { label: "upper", detail: "str.upper()", insertText: "upper()" },
      { label: "replace", detail: "str.replace(old, new)", insertText: "replace(${1:old}, ${2:new})" },
      { label: "startswith", detail: "str.startswith(prefix)", insertText: "startswith(${1:prefix})" },
      { label: "endswith", detail: "str.endswith(suffix)", insertText: "endswith(${1:suffix})" },
      { label: "get", detail: "dict.get(key[, default])", insertText: "get(${1:key})" },
      { label: "keys", detail: "dict.keys()", insertText: "keys()" },
      { label: "values", detail: "dict.values()", insertText: "values()" },
      { label: "items", detail: "dict.items()", insertText: "items()" },
      { label: "pop", detail: "pop(index/key)", insertText: "pop(${1:key})" },
    ];
    commonMethods.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  }

  return suggestions;
}

// -----------------------------------------------------------------------------
// Helper: Java Dot Completions
// -----------------------------------------------------------------------------
function getJavaDotCompletions(objectPath, range, monaco) {
  const suggestions = [];

  if (objectPath === "System") {
    suggestions.push({
      label: "out",
      kind: monaco.languages.CompletionItemKind.Field,
      detail: "PrintStream System.out",
      insertText: "out",
      range,
    });
    suggestions.push({
      label: "in",
      kind: monaco.languages.CompletionItemKind.Field,
      detail: "InputStream System.in",
      insertText: "in",
      range,
    });
    suggestions.push({
      label: "err",
      kind: monaco.languages.CompletionItemKind.Field,
      detail: "PrintStream System.err",
      insertText: "err",
      range,
    });
    suggestions.push({
      label: "currentTimeMillis",
      kind: monaco.languages.CompletionItemKind.Method,
      detail: "long System.currentTimeMillis()",
      insertText: "currentTimeMillis()",
      range,
    });
    suggestions.push({
      label: "nanoTime",
      kind: monaco.languages.CompletionItemKind.Method,
      detail: "long System.nanoTime()",
      insertText: "nanoTime()",
      range,
    });
    suggestions.push({
      label: "exit",
      kind: monaco.languages.CompletionItemKind.Method,
      detail: "void System.exit(int status)",
      insertText: "exit(${1:0})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
  } else if (objectPath === "System.out" || objectPath === "System.err") {
    const printMethods = [
      { label: "println", detail: "void println(String x)", insertText: "println(${1:arg})" },
      { label: "print", detail: "void print(String x)", insertText: "print(${1:arg})" },
      { label: "printf", detail: "PrintStream printf(String format, Object... args)", insertText: "printf(\"${1:%s}\\n\", ${2:args})" },
      { label: "format", detail: "PrintStream format(String format, Object... args)", insertText: "format(\"${1:%s}\\n\", ${2:args})" },
      { label: "flush", detail: "void flush()", insertText: "flush()" },
    ];
    printMethods.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "Math") {
    const mathMethods = [
      { label: "abs", detail: "int/double abs(x)", insertText: "abs(${1:x})" },
      { label: "max", detail: "int/double max(a, b)", insertText: "max(${1:a}, ${2:b})" },
      { label: "min", detail: "int/double min(a, b)", insertText: "min(${1:a}, ${2:b})" },
      { label: "pow", detail: "double pow(a, b)", insertText: "pow(${1:a}, ${2:b})" },
      { label: "sqrt", detail: "double sqrt(x)", insertText: "sqrt(${1:x})" },
      { label: "round", detail: "long round(double a)", insertText: "round(${1:a})" },
      { label: "floor", detail: "double floor(double a)", insertText: "floor(${1:a})" },
      { label: "ceil", detail: "double ceil(double a)", insertText: "ceil(${1:a})" },
      { label: "random", detail: "double random()", insertText: "random()" },
      { label: "PI", detail: "double Math.PI", insertText: "PI", isConst: true },
      { label: "E", detail: "double Math.E", insertText: "E", isConst: true },
    ];
    mathMethods.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: m.isConst ? monaco.languages.CompletionItemKind.Constant : monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: m.isConst ? undefined : monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "String") {
    const stringStatic = [
      { label: "valueOf", detail: "String.valueOf(data)", insertText: "valueOf(${1:val})" },
      { label: "format", detail: "String.format(format, args)", insertText: "format(\"${1:%s}\", ${2:args})" },
      { label: "join", detail: "String.join(delimiter, elements)", insertText: "join(\"${1:,}\", ${2:elements})" },
    ];
    stringStatic.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "Arrays") {
    const arraysMethods = [
      { label: "toString", detail: "String Arrays.toString(array)", insertText: "toString(${1:array})" },
      { label: "sort", detail: "void Arrays.sort(array)", insertText: "sort(${1:array})" },
      { label: "asList", detail: "List<T> Arrays.asList(T... a)", insertText: "asList(${1:elements})" },
      { label: "copyOf", detail: "T[] Arrays.copyOf(original, newLength)", insertText: "copyOf(${1:original}, ${2:newLength})" },
      { label: "binarySearch", detail: "int Arrays.binarySearch(array, key)", insertText: "binarySearch(${1:array}, ${2:key})" },
      { label: "equals", detail: "boolean Arrays.equals(a, b)", insertText: "equals(${1:a}, ${2:b})" },
    ];
    arraysMethods.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else if (objectPath === "Collections") {
    const colMethods = [
      { label: "sort", detail: "void Collections.sort(list)", insertText: "sort(${1:list})" },
      { label: "reverse", detail: "void Collections.reverse(list)", insertText: "reverse(${1:list})" },
      { label: "max", detail: "T Collections.max(coll)", insertText: "max(${1:coll})" },
      { label: "min", detail: "T Collections.min(coll)", insertText: "min(${1:coll})" },
      { label: "frequency", detail: "int Collections.frequency(c, o)", insertText: "frequency(${1:coll}, ${2:o})" },
    ];
    colMethods.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  } else {
    // General Java instance methods (String, List, Map, Scanner, Set)
    const commonJavaMethods = [
      { label: "length", detail: "int length()", insertText: "length()" },
      { label: "size", detail: "int size()", insertText: "size()" },
      { label: "get", detail: "Object get(int index / Object key)", insertText: "get(${1:key})" },
      { label: "put", detail: "V put(K key, V value)", insertText: "put(${1:key}, ${2:value})" },
      { label: "add", detail: "boolean add(E e)", insertText: "add(${1:item})" },
      { label: "remove", detail: "E remove(int index / Object key)", insertText: "remove(${1:key})" },
      { label: "contains", detail: "boolean contains(Object o)", insertText: "contains(${1:o})" },
      { label: "containsKey", detail: "boolean containsKey(Object key)", insertText: "containsKey(${1:key})" },
      { label: "isEmpty", detail: "boolean isEmpty()", insertText: "isEmpty()" },
      { label: "charAt", detail: "char charAt(int index)", insertText: "charAt(${1:index})" },
      { label: "substring", detail: "String substring(int beginIndex)", insertText: "substring(${1:beginIndex})" },
      { label: "indexOf", detail: "int indexOf(String str)", insertText: "indexOf(${1:str})" },
      { label: "equals", detail: "boolean equals(Object obj)", insertText: "equals(${1:obj})" },
      { label: "equalsIgnoreCase", detail: "boolean equalsIgnoreCase(String another)", insertText: "equalsIgnoreCase(${1:another})" },
      { label: "startsWith", detail: "boolean startsWith(String prefix)", insertText: "startsWith(${1:prefix})" },
      { label: "endsWith", detail: "boolean endsWith(String suffix)", insertText: "endsWith(${1:suffix})" },
      { label: "toLowerCase", detail: "String toLowerCase()", insertText: "toLowerCase()" },
      { label: "toUpperCase", detail: "String toUpperCase()", insertText: "toUpperCase()" },
      { label: "trim", detail: "String trim()", insertText: "trim()" },
      { label: "split", detail: "String[] split(String regex)", insertText: "split(\"${1:\\\\s+}\")" },
      { label: "nextLine", detail: "String nextLine()", insertText: "nextLine()" },
      { label: "nextInt", detail: "int nextInt()", insertText: "nextInt()" },
      { label: "nextDouble", detail: "double nextDouble()", insertText: "nextDouble()" },
      { label: "next", detail: "String next()", insertText: "next()" },
      { label: "hasNext", detail: "boolean hasNext()", insertText: "hasNext()" },
    ];
    commonJavaMethods.forEach((m) => {
      suggestions.push({
        label: m.label,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: m.detail,
        insertText: m.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });
  }

  return suggestions;
}

// -----------------------------------------------------------------------------
// Helper: Extract Document Identifiers (Python)
// -----------------------------------------------------------------------------
function extractPythonDocumentIdentifiers(code, range, monaco) {
  const items = [];
  const seen = new Set();

  // Find functions: def func_name
  const funcRegex = /\bdef\s+([a-zA-Z_]\w*)/g;
  let match;
  while ((match = funcRegex.exec(code)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      items.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: `User Function: def ${name}(...)`,
        insertText: name,
        range,
      });
    }
  }

  // Find classes: class ClassName
  const classRegex = /\bclass\s+([a-zA-Z_]\w*)/g;
  while ((match = classRegex.exec(code)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      items.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Class,
        detail: `User Class: class ${name}`,
        insertText: name,
        range,
      });
    }
  }

  // Find variable assignments: var_name = ...
  const varRegex = /\b([a-zA-Z_]\w*)\s*=/g;
  while ((match = varRegex.exec(code)) !== null) {
    const name = match[1];
    if (!seen.has(name) && !["def", "class", "if", "for", "while", "return", "import"].includes(name)) {
      seen.add(name);
      items.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: `User Variable: ${name}`,
        insertText: name,
        range,
      });
    }
  }

  return items;
}

// -----------------------------------------------------------------------------
// Helper: Extract Document Identifiers (Java)
// -----------------------------------------------------------------------------
function extractJavaDocumentIdentifiers(code, range, monaco) {
  const items = [];
  const seen = new Set();

  // Find classes: class ClassName
  const classRegex = /\bclass\s+([a-zA-Z_]\w*)/g;
  let match;
  while ((match = classRegex.exec(code)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      items.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Class,
        detail: `User Class: ${name}`,
        insertText: name,
        range,
      });
    }
  }

  // Find methods: ReturnType methodName(...)
  const methodRegex = /\b(?:public|private|protected|static|final|native|synchronized|\s)+[\w<>\[\]]+\s+([a-zA-Z_]\w*)\s*\(/g;
  while ((match = methodRegex.exec(code)) !== null) {
    const name = match[1];
    if (!seen.has(name) && !["if", "for", "while", "switch", "catch", "main"].includes(name)) {
      seen.add(name);
      items.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: `User Method: ${name}(...)`,
        insertText: `${name}(\${1})`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    }
  }

  return items;
}

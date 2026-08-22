(() => {
  "use strict";

  const keywords = new Set([
    "if", "elif", "else", "while", "for", "def", "return", "and", "or", "not",
    "import", "from", "as", "type", "const", "pure", "partial", "match", "try",
    "catch", "error", "break", "continue", "pass", "struct", "enum"
  ]);
  const constants = new Set(["True", "False", "None"]);
  const builtins = new Set([
    "print", "eprint", "pp_format", "pprint", "pprint_err", "range", "len", "str",
    "int", "float", "sqrt", "rand", "dict", "set", "append", "slice", "freeze",
    "thaw", "ord", "chr", "map", "filter", "reduce", "read_line", "read_all", "input",
    "run", "argv", "exit", "spawn", "join", "task_done", "task_stats", "task_yield",
    "sleep", "chan", "send", "recv", "chan_close", "chan_len", "zeros", "ones", "full",
    "arange", "tensor", "randn", "exp", "log", "tanh", "relu", "matmul", "reshape",
    "transpose", "permute", "expand", "sum", "mean", "max", "argmax", "tslice", "item",
    "shape", "ndim", "dtype", "astype", "gc_stats", "gc_collect", "file_exists",
    "write_file", "append_file", "write_out", "write_err", "flush", "seed_rand"
  ]);
  const types = new Set([
    "int", "float", "str", "bool", "int8", "int16", "int32", "int64", "uint8",
    "uint16", "uint32", "uint64", "f32", "f64", "char", "string", "list", "seq",
    "dict", "set", "option", "result", "error", "task", "chan"
  ]);

  const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const span = (scope, value) => `<span class="em-${scope}">${escapeHtml(value)}</span>`;

  function stringToken(source, start) {
    const interpolated = source[start] === "f" && (source[start + 1] === "\"" || source[start + 1] === "'");
    const quoteAt = start + (interpolated ? 1 : 0);
    const quote = source[quoteAt];
    if (quote !== "\"" && quote !== "'") return null;

    let end = quoteAt + 1;
    while (end < source.length) {
      if (source[end] === "\\") end += 2;
      else if (source[end++] === quote) break;
    }
    return source.slice(start, end);
  }

  function highlightString(value) {
    let html = "";
    let plain = "";
    const flush = () => { if (plain) { html += span("string", plain); plain = ""; } };
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === "\\" && i + 1 < value.length) {
        flush();
        html += span("escape", value.slice(i, i + 2));
        i += 1;
      } else if (value[0] === "f" && value[i] === "{") {
        const close = value.indexOf("}", i + 1);
        if (close !== -1) {
          flush();
          html += span("interpolation", value.slice(i, close + 1));
          i = close;
        } else plain += value[i];
      } else plain += value[i];
    }
    flush();
    return html;
  }

  function highlight(source) {
    let html = "";
    let i = 0;
    while (i < source.length) {
      const rest = source.slice(i);
      const string = stringToken(source, i);
      let match;

      if (source[i] === "#") {
        const end = source.indexOf("\n", i);
        const stop = end === -1 ? source.length : end;
        html += span("comment", source.slice(i, stop));
        i = stop;
      } else if (string) {
        html += highlightString(string);
        i += string.length;
      } else if ((match = rest.match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[0-7]+|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/))) {
        html += span("number", match[0]);
        i += match[0].length;
      } else if ((match = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/))) {
        const word = match[0];
        const scope = word === "dim" ? "dimension" : constants.has(word) ? "constant" :
          keywords.has(word) ? "keyword" : builtins.has(word) ? "builtin" : types.has(word) ? "type" : null;
        html += scope ? span(scope, word) : escapeHtml(word);
        i += word.length;
      } else if ((match = rest.match(/^(?:->|\|>|==|!=|<=|>=|[!+\-*/%^&|<>])/))) {
        html += span("operator", match[0]);
        i += match[0].length;
      } else if (/^[:,(){}[\]]/.test(rest)) {
        html += span("punctuation", source[i]);
        i += 1;
      } else {
        html += escapeHtml(source[i]);
        i += 1;
      }
    }
    return html;
  }

  document.querySelectorAll("code.language-emerald").forEach((code) => {
    code.innerHTML = highlight(code.textContent);
  });
})();

---
slug: "azul-lox-interpreter"
title: "Building azul: a Lox interpreter with a self-healing agent loop"
date: 2026-06-29
status: "note"
excerpt: "An interpreter that treats its own diagnostics as an interface: structured errors in, an LLM repair pass out, and a measurable loop in between."
tags: ["interpreters", "diagnostics", "agents", "lox"]
authors: ["Sagnik Chatterjee"]
---

Most language implementations stop at "the program runs". The repo this
post is about, `azul`, goes one step further: when a Lox program fails, azul
handles the diagnostics to a local LLM agent that reads the source, patches
it, and reruns the program. The interpreter itself is a faithful
implementation of Lox from Crafting Interpreters, split into a Part I
tree-walk interpreter and a Part II bytecode compiler with a stack VM. This
post walks through the architecture, the diagnostics pipeline that makes the
agent loop possible, and the design choices around keeping the project free
of third-party dependencies.

## What azul Is

Azul is a Python implementation of Lox, the scripting language designed for
Bob Nystrom's Crafting Interpreters book. It ships two execution paths behind
one CLI:

- A complete tree-walk interpreter: scanning, recursive-descent parsing,
  lexical resolution, closures, classes, inheritance, and runtime execution.
- A Part II bytecode compiler and VM, selectable with `--vm`.

The actual experiment in the repo is the feedback loop. When a program
errors, the CLI does not just print diagnostics and exit. It serializes the
errors into a structured payload, sends it to an LLM agent with two function
tools, and lets the agent fix the file in place. The file is then re-scanned
and re-run, retrying up to N times before giving up.

The project history is visible in the git log. It started as a Go
implementation, was refactored to Python in a commit that deleted the entire
`internal/` and `cmd/` tree, and most recently shifted from a hosted Groq
model to a local Ollama daemon running `qwen2.5-coder:7b`. Every Python
module carries a docstring noting which Go file it mirrors, which makes the
two implementations easy to compare.

## The Front End: Scanner and Parser

The scanner in `src/azul/scanner.py` is a single-pass lexer. It tracks both
line and column positions, which matters later because the diagnostic
printer renders source frames with caret alignment. Two structural details
stand out.

First, scanning is error tolerant in a deliberate way. The scanner does not
throw on a bad character. It records a `Diagnostic` with phase `SCAN` and
keeps going:

```python
else:
    self.add_diagnostic("unexpected character", c)
```

Second, the parser in `src/azul/parser.py` uses the classic Pratt-style
precedence climbing via a chain of methods, `assignment` down through `or`,
`and`, `equality`, `comparison`, `term`, `factor`, `unary`, and `call`.
Recursive descent here is strictly a statement-level concern. Parse errors
raise an internal `ParseError` sentinel, the `declaration` method catches it,
and `synchronize` discards tokens until the next statement boundary so one
mistake does not cascade into a wall of noise. The `for` statement is
desugared into nested `While` and `Block` nodes during parsing rather than
introducing a dedicated AST node.

AST nodes are plain dataclasses in `src/azul/ast.py`. The interpreter, the
resolver, the compiler, and the AST printer all dispatch on these types with
`isinstance`, which keeps the visitor machinery out of the data model.

## Two Execution Backends

### The Tree-Walk Interpreter

The interpreter in `src/azul/interpreter.py` is the standard Lox Part I
design. An `Environment` is a linked list of scopes, with `get_at` and
`assign_at` for lexical-distance lookups. Functions are `LoxFunction`
objects that close over their defining environment. `ReturnValue` is an
exception used for non-local control flow out of a function body, the
idiomatic Python translation of a return signal.

Before execution, a separate `Resolver` pass walks the AST once and records,
for every variable and `this` expression, the lexical distance to its
binding scope. The interpreter stores those distances in a dict keyed by the
expression's `id`, then uses `get_at` and `assign_at` to resolve variables
in the correct enclosing scope without threading environment objects through
call arguments. This is the canonical Lox approach to closures and it also
catches static errors: reading a variable in its own initializer, returning
from top-level code, `return` with a value from an initializer, and `super`
or `this` used outside a class.

Runtime errors do not bubble out of the interpreter. `interpret` catches
`LoxRuntimeError`, converts it into a `Diagnostic` with phase `RUNTIME`, and
returns a list. That single boundary, exceptions in, diagnostics out, is
what keeps the CLI and the agent loop uniform across all error phases.

### The Bytecode Compiler and VM

The `--vm` path is a different machine entirely. `src/azul/compiler.py`
turns the same AST into a `Function` holding a `Chunk`: a flat list of
bytes, a parallel list of source lines, and a constant table. Instructions
are plain integers defined in `vm.OpCode`. Operands are either one byte or
two bytes written big-endian via `write_uint16`, so the bytecode matches the
chunk format from the book.

The compiler handles the hard parts of Lox semantics:

- Local variables are resolved to stack slots during compilation. Globals
  are defined with `DEFINE_GLOBAL` and looked up with `GET_GLOBAL`, each
  referencing a constant table index holding the variable name.
- Closures are compiled with `CLOSURE`, followed by a list of upvalue
  descriptors. Each descriptor is one byte (`is_local`) plus a two-byte
  index into either the enclosing function's locals or its own upvalue
  list. `resolve_upvalue` walks the enclosing compiler chain to find where
  a captured variable lives, and marks that local as captured so the VM
  knows to close it.
- Classes emit `CLASS`, then `METHOD` per method with the method name as a
  constant. `super` is compiled by resolving `this` and `super` as ordinary
  variables and emitting `GET_SUPER`, which the VM handles by walking the
  superclass method table.

The VM in `src/azul/vm.py` is a stack machine with a call-frame stack capped
at `FRAMES_MAX = 64`. Upvalues are heap objects that start as a location
into the stack and become closed values when the stack slot goes out of
scope, which is what gives closures their correct shared-variable semantics.
A `CLOSE_UPVALUE` instruction is emitted at scope exit for any captured
local. Method lookup falls back to the superclass chain, and `BoundMethod`
objects pair a receiver instance with a closure so `this` binds correctly on
every access.

The chunk also ships a disassembler. `vm.disassemble_function` recursively
walks nested function constants and prints each instruction with its source
line, so `azul debug file.lox --bytecode` gives a readable view of what the
compiler produced.

## Diagnostics as a First-Class Interface

The reason both backends can feed the same agent loop is the `Diagnostic`
type in `src/azul/diagnostic`. Every error carries five fields:

- `line` and `column` for position.
- `message` for the human-readable explanation.
- `token` for the offending lexeme.
- `phase`, an enum spanning `SCAN`, `PARSE`, `RESOLVE`, `COMPILE`, and
  `RUNTIME`.

The CLI's `run_lox` and `run_lox_bytecode` functions share a shape. Each
returns a `LoxRun` dataclass holding whatever stage produced diagnostics,
and each stage short-circuits when the previous one fails. Whether the
failure came from the scanner, the resolver, or the VM, the caller gets the
same list of `Diagnostic` objects.

The diagnostic printer in `src/azul/diagnostic/printer.py` renders those
diagnostics in a compiler style: an `error <phase>` header, a
`--> file:line:column` location, the source line, and a caret underline
that accounts for multi-byte characters via a visual-column calculation.
Colors come from `styles.py`, a small truecolor ANSI helper that emits
24-bit RGB escapes directly. The Go implementation used lipgloss for this;
the Python port recreated the palette with zero dependencies.

## The Agent Fix Loop

The heart of the experiment is `src/azul/agent.py`. The loop, wired through
`azul run file.lox --fix`, works like this:

1. Run the program. If it produces no diagnostics, exit cleanly.
2. Print the diagnostics, then build an `ErrorPayload` containing the source
   path, the full source, and a JSON list of errors with line, column,
   message, token, and a normalized phase (`scan`, `parse`, or `runtime`).
3. Send the payload to the LLM with a system prompt and two function tools.

The tools are where the agent gets agency:

- `read_source` takes `from_line` and `to_line` and returns the numbered
  source range, so the model can inspect context before deciding on a fix.
- `apply_patch` takes the complete corrected source and an explanation. The
  client writes the corrected source back to the file and returns the
  explanation immediately.

The loop runs a bounded number of tool turns (`MAX_TOOL_TURNS = 16`). The
client appends each assistant message and each tool result to the message
history, so the model can read several ranges, reason, and then patch. When
`apply_patch` is called, the CLI rereads the file, reruns the program, and
either reports success or starts another retry up to `--max-retries`.

Two design decisions make this loop robust for a small project.

The first is the OpenAI-compatible client. `chat_completion` is built
directly on `urllib.request` with a JSON body and a `Bearer` token, so the
project keeps zero third-party runtime dependencies. There is no SDK to
version, and any OpenAI-compatible endpoint works.

The second is that the provider is local-first. `resolve_model` only
supports `ollama`. When the fix loop starts, `ensure_ollama` probes the
base URL, starts `ollama serve` as a detached subprocess if it is down,
waits up to 60 seconds for it to become ready, and pulls the configured
model if it is not already installed. The `config.yaml` in the repo points
at `http://localhost:11434/v1` with `qwen2.5-coder:7b`. The config parser in
`agent.py` is hand-rolled YAML-by-splitting, another deliberate rejection of
dependency-heavy parsing. It searches up the directory tree for the config
file, so the tool works from any subdirectory.

The prompts live in `src/azul/prompts/`. The system prompt is explicit about
behavior: call `read_source` before deciding, fix the root cause rather than
the symptom, do not add features, and if no safe fix exists, apply the patch
with the original source unchanged and explain why. The user prompt is a
template that interpolates the JSON payload.

The agent loop is exercised without touching the repo sample.
`task agent:check` copies `examples/broken.lox` to a temp file, runs the fix
loop against it with one retry, and lets the CLI re-scan the patched copy.
The deliberately broken sample exercises every phase: missing semicolons are
parse errors, and adding a string to a number is a runtime error.

## Testing and Tooling

The suite in `tests/` runs both backends over the same source strings.
`conftest.py` exposes `run_ast` and `run_bytecode`, which run a source
through scan, parse, resolve or compile, and interpret, returning output and
diagnostics. Tests cover the scanner, the interpreter, the compiler, and the
agent's `source_range` helper. The agent client itself is not unit tested
against a live model; the interaction is verified through the Taskfile's
`agent:check` task, which is the right boundary for a loop whose behavior
depends on a running daemon.

`Taskfile.yml` is the command hub. `task run` executes a file, `task debug`
prints tokens, AST, and bytecode, `task lox:sample` checks diagnostics
against the broken sample, and `task check` runs format, lint, and tests.
The whole package builds with `uv` into a virtualenv exposing an `azul`
console script.

## Why the Interpreter Matters Here

The agent loop is only as good as the signal it feeds on. Azul earns its
structured diagnostics by building the interpreter properly first: precise
positions from the scanner, a resolver that catches static errors before
execution, a uniform `Diagnostic` boundary at every phase, and a bytecode
compiler that surfaces its own compile-time errors in the same shape. The
LLM never has to parse unstructured terminal output. It receives a compact
JSON error report plus the full source, and it can pull any line range it
needs through a tool call.

The other deliberate constraint is dependency discipline. A language runtime
rewritten in Python that still uses plain `urllib` for its LLM client, a
hand-rolled config reader, and ANSI escapes for styling is a statement that
the interesting engineering is in the compiler and the loop, not in the
ecosystem glue.

If you want to poke at it yourself, the fastest path is:

```sh
PYTHONPATH=src python3 -m azul.cli run examples/complete.lox
PYTHONPATH=src python3 -m azul.cli run examples/complete.lox --vm
PYTHONPATH=src python3 -m azul.cli debug examples/complete.lox --tokens --ast --bytecode
```

And to see the feedback loop, install Ollama, set the provider in
`config.yaml`, and run `task agent:check` against a temporary copy of the
broken sample. The interpreter prints its errors, the local model reasons
over them with `read_source`, writes a corrected file with `apply_patch`, and
the whole pipeline starts over.

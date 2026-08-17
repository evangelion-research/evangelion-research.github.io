---
slug: "emerald"
title: "Emerald: a small typed language that compiles to C"
date: 2026-08-16
status: "note"
excerpt: "Emerald is what we are building right now: a Python-flavored language with structural typing, a precise two-generation GC, and a compiler written in C11 that emits native binaries. This note covers the design and how it connects to the research."
tags: ["emerald", "compilers", "type systems", "structural typing", "garbage collection"]
authors: ["Sagnik Chatterjee"]
---

Emerald is a Python-flavored language with a few deliberate differences. It uses braces
instead of indentation. It has TypeScript-style structural typing instead of classes: data is
records, and "inheritance" is having a superset of fields. It ships a two-generation
mark-and-sweep garbage collector and a compiler written in modern C11 that emits native
binaries through the system `cc`. The whole thing lives at
[github.com/evangelion-research/emerald](https://github.com/evangelion-research/emerald).

Most of this note is about the type system and the collector, because those are the parts
that connect to the research threads on this site. The short version: the type layer is
gradual and structural, the checker will prove exhaustive case analysis for you, and every
stage of the compiler is a separate, testable pass.

## The shape of the language

A program is a `.rald` file. The syntax stays close to Python, but scope is `{ }` and types
are annotations that the compiler erases before codegen, so unannotated code still runs.

```emerald
type Point = { x: int, y: int }
type Point3 = Point & { z: int } # structural "inheritance"

def mag2(p: Point) -> int {
    return p.x * p.x + p.y * p.y
}

p: Point3 = { x: 3, y: 4, z: 5 }
print(mag2(p)) # Point3 is-a Point by shape
```

Assignability is width subtyping. A record fits a record type if it has at least the target's
fields with assignable types, and extra fields are fine. `A & B` merges fields, which is the
language's stand-in for interface extension. There are no classes and no nominal hierarchy.

The pipeline is a plain chain, and every stage is exposed as a driver flag:

```text
foo.rald -> lexer -> parser -> type checker -> C codegen -> cc -> ./foo
```

`--emit-tokens`, `--emit-ast`, `--check`, `--emit-c`, and `--keep-c` each stop the compiler at
a stage, which is what lets every stage have its own golden test suite under
`tests/{lexer,parser,check,imports,e2e}`. The driver is `bin/emeraldc`; `task test` runs
every suite.

## Programs that span files

A `.rald` file is a module, and `import` names code in another one:

```emerald
import strings                # module object: strings.split(...)
import text.strings as ts     # dotted paths map to directories
from strings import split, join   # names lifted into this module
```

Module paths resolve against the importing file's directory, then the project's `src/` root,
then each `-I <dir>` in the order given; first hit wins. A leading underscore makes a
top-level name private; everything else is exported. The compiler loads the whole import
graph and links it into one program, mangling each imported module's top-level names to
`<module>__<name>` so two packages can both define `parse`. The entire contract with any
external driver is one line: `emeraldc [-I <dir>]... [--json] [-o OUT] <entry>.rald`.

## The type system

The checker implements literal types, unions, generics, flow narrowing, and `never`. None of
those are there for their own sake; they compose into one useful behaviour: a change to a data
type surfaces every site that must be updated, at compile time.

A union of literal types is a finite enumeration, the language's stand-in for enums and
refinements. Narrowing tracks a current type per variable and refines it branch by branch, so
a discriminant like `s.kind` stays sharp through an `if` chain. And `never` accepts no value,
which turns a binding into a proof obligation:

```emerald
type Circle = { kind: "circle", r: int }
type Square = { kind: "square", side: int }
type Shape = Circle | Square

def area(s: Shape) -> int {
    if s.kind == "circle" { return s.r * s.r * 3 }
    if s.kind == "square" { return s.side * s.side }
    impossible: never = s # typechecks only if the cases are exhaustive
    return 0
}
```

Add a third alternative to `Shape` and the checker fails on the `never` binding, naming the
case you forgot. That is the feature we care about: the checker does not just validate what
you wrote, it reopens every obligation that depended on a type you changed.

The checker is gradual by design. Unannotated parameters and returns are `any`; an annotated
variable is enforced forever; an inferred variable widens on conflict rather than erroring,
so Python code stays valid. The deliberate unsoundness is the same one TypeScript has:
`list[T]` is covariant, so `list[int]` is assignable to `list[int | None]`. The runtime's
tagged values keep that from ever being memory-unsafe, but the docs are honest that you
should not build a proof on the element type of a shared list.

## Proofs you can run

`docs/proofs.md` treats the checker as a proof checker for a small logic. The correspondence
is Curry-Howard: a type is a proposition, a value of that type is a proof, `P | Q` is
disjunction, a total function `(P) -> Q` is implication, and `never` is false. Because a type
variable is opaque inside a generic body, a generic signature is a universally quantified
claim, and the body of the function is the only witness the checker will accept:

```emerald
type Pair[A, B] = { first: A, second: B }

# Commutativity of conjunction: A & B -> B & A
def swap[A, B](p: Pair[A, B]) -> Pair[B, A] {
    return { first: p.second, second: p.first }
}
```

`return { first: 5, second: 5 }` would be rejected, because `5` is not an `A`. The one escape
is `any`, which satisfies every obligation vacuously, so the docs are blunt: a proof that
mentions `any` proves nothing.

The limits are stated as clearly as the claims. There is no termination checker, so a
deliberately diverging `while True` inhabits `never`, and the logic is not consistent the way
a proof assistant's is. There are no dependent types, so statements about list lengths are
not expressible, and induction is limited to what parametricity gives. `examples/proofs.rald`
is a runnable tour of what the system can do, which is exhaustive case analysis, finite
domains, partiality, and parametric claims, checked on every build.

This is the everyday version of what the proof-carrying interpretations thread argues for: a
claim ships with a certificate, and the certificate is cheap to check. Here the certificate
is just the file typechecking, and the check runs in milliseconds on every build.

## The collector

The runtime is a precise two-generation mark-and-sweep collector with rooting done by the
generated code itself, through a shadow stack. No conservative stack scanning, no reference
counting.

Values are 16-byte tagged structs passed by value; `None`, `bool`, `int`, and `float` never
touch the heap. Strings of seven bytes or fewer are stored inline in the value, so the most
common short strings never allocate at all. New objects are born in a nursery; a minor
collection sweeps only the nursery and promotes survivors to the tenured generation, while a
write barrier keeps tenured objects that reference nursery objects in a remembered set. A
major collection marks and sweeps both generations.

The constraint that makes the collector precise is that every intermediate value in generated
code sits in a rooted slot, so anything alive across an allocation is reachable from a root
frame. The stress example churns millions of short-lived objects and peaks around 1.6 MB of
RSS, which is the number we quote when people ask why we wrote our own collector instead of
linking one in.

## Diagnostics for machines

Errors come out as structured diagnostics: a stable machine-readable code, a precise
`file:line:column`, the offending line with a caret, and, for type mismatches, the expected
and actual types as separate fields. Pass `--json` to any mode and the same diagnostics come
out as JSON, one object per error. The interface is designed for a tool to consume: read the
errors, fix the program, re-run. That makes the compiler a natural target for an agent
loop.

## Where it stands

Phase 1 is done and tested: the compiler, the structural gradual type layer, and the
collector. Most of Phase 2 has landed too: narrowing, literal types, `never`, exhaustiveness
checking, generics, first-class closures, recursive type aliases, file and process I/O, and
the module system above. The `examples/` directory has grown past snippets: there is a small
ray tracer, including a typed port, exercised by the e2e suite, and `examples/proofs.rald` is
still the runnable tour of the proof features.

The roadmap in `docs/research-directions.md` is where the language is headed, and it is
deliberately aimed at the research threads on this site: shape types so a tensor carries its
dimensions, an effect system with `pure` so "this model is a function of its inputs" is
statable, interpretations as first-class typed objects carrying a commuting-square
obligation, approximate judgments discharged to a bound with a certificate, and typed hooks
so an interpretability operation is checked rather than string-keyed. Self-hosting,
exceptions, and a large stdlib are explicitly off the table: they buy the research nothing.

The open question we are actually interested in is how far the type layer can go before the
"proofs you can run" story stops being honest. The limits documented in `proofs.md` are the
interesting part, because they are the same limits that show up when you try to make any
interpretability claim precise: the formal system is strong exactly where the problem is
finite, and weak exactly where the problem gets interesting.

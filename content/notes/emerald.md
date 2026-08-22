---
title: "Emerald: a typed language for machine-checked interpretation"
date: 2026-08-16
lastmod: 2026-08-22
status: "note"
excerpt: "Emerald 1.0 is a Python-shaped, structurally typed language with proof mode, typed errors, tensors, and a C11 compiler — built to find out how much of a program's meaning a practical type system can hold."
tags: ["emerald", "programming languages", "type systems", "verification", "mechanistic interpretability"]
---

Our thesis is that a trained network is a program in an unusual object language, and that
interpretability is decompilation under uncertainty. If that is right, the vocabulary of
programming languages research should apply: semantics, types, abstract interpretation,
proofs. But there is a gap between saying that and doing it. A circuit claim in a notebook
has no truth value you can check; a type error has one you cannot avoid. The research threads
on this site state the programme; what they need is an object language in which
interpretations are typed objects the compiler validates. No existing language does that, so
we are building one. It is called **Emerald**.

## What exists today

Emerald reached **1.0.0 on 19 August 2026**. It is a Python-shaped language with braces
instead of indentation and TypeScript-style structural typing instead of classes. The
compiler is written in modern C11 and emits native binaries through your system `cc`. The
release includes 77 builtins, an eleven-module standard library written in Emerald, typed
errors, tensors, cooperative tasks, a REPL, and a stricter proof mode. It still has no class
or object system. What it has is the type system, and the type system is the point.

```emerald
type Circle = { kind: "circle", r: int }
type Square = { kind: "square", side: int }
type Shape  = Circle | Square

def area(s: Shape) -> int {
  if s.kind == "circle" { return s.r * s.r * 3 }
  if s.kind == "square" { return s.side * s.side }
  impossible: never = s   # typechecks only if the cases are exhaustive
  return 0
}
```

Literal types, unions and intersections, generics, flow narrowing, and `never` give the
checker enough to verify exhaustive case analysis, so extending a data type reopens every
site that must be updated. Types are erased at runtime — there is no vtable or nominal tag —
so structural subtyping costs nothing. Fallible functions return `Result[T, E]`: `try`
propagates a declared error and `catch` must exhaust the error union, without exceptions or
stack unwinding. Functions are values; closures, lambdas, pipelines, composition, and
tail-call optimization make up the functional core.

A program can span files: `import` resolves against the importing directory, a project
`src/`, explicit include paths, and then the standard library. Privacy is a leading
underscore, and the compiler links the whole import graph into one binary, mangling each
module's names so two packages can both define `parse`. At runtime, a precise two-generation
mark-and-sweep collector manages values, while cooperative tasks communicate through typed
channels whose closed state appears as `T | None`.

The pipeline is observable at every stage — `lexer → parser → modules → type checker → C
codegen → cc` — and each stage has a driver flag and golden regression coverage. The suite
also covers proof obligations, shapes, imports, the standard library, the REPL, warnings,
benchmarks, and end-to-end behaviour. Errors are structured diagnostics with stable codes, a
precise location, the offending line with a caret, and for type mismatches the expected and
actual types as separate fields. `--json` emits the same diagnostics as JSON. The design
intent is explicit: this output is meant to be fed back to a tool — or an LLM — that repairs
the program and re-runs. The language is being built to be *aimed at* by a model, not only
typed by a human.

{{< spec title="The scorecard, not the image" >}}
A program that typechecks is a claim checked by a machine. The question Emerald exists to
answer is how much of a real program's meaning a practical type system can hold — and the
honest answer is measured, not asserted.
{{< /spec >}}

## The experiment: a proof-carrying ray tracer

A language's type system deserves a stress test it did not design itself. We re-implemented
*Ray Tracing in One Weekend* — not to render an image, but to find out how much of a real
graphics program the type system can hold. It comes in two versions. `one_weekend.rald` is a
280-line transliteration that uses types as documentation and stresses the garbage collector.
`typed/` is the same program rewritten across 13 modules, where every implicit invariant in
the book was first written down as a proposition, then encoded if the type system could hold
it.

Sixteen propositions were written down in advance. The result:

| Result | Count | What it looks like |
|---|---|---|
| **Provable** | 6 | primitive dispatch is exhaustive (`never`); colour channels are exactly `r\|g\|b`; a miss can never be read as a hit (`Hit \| None` + narrowing); a failed scatter carries no fake data; points and directions cannot be confused — `padd(p: Pt, d: Dir)`, so `padd(p, p)` is a compile error |
| **Partial** | 1 | `reflect`/`refract` get unit-length input — the `Unit` brand is checked but forgeable by hand |
| **Out of reach** | 7 | ‖unit(v)‖ = 1; `lo ≤ hi` on intervals; colour ∈ [0, 1]; `ray_color` terminates; the render is a pure function of the seed; image indices in bounds; the scene list is not aliased |

The last row is the load-bearing one. Those seven were not guessed at; they were produced by
a real program that wanted them. They map one-to-one onto missing features — **opaque types,
scalar refinements, effects, termination checking, shape types** — which turns the failure
mode into a requirements list. That is the kind of honesty a proof-carrying research programme
needs: when the type system cannot hold a claim, the claim itself tells you what to build next.

The type system also earned its keep the ordinary way. It caught a rejection sampler that
never rebound its generator (the seeded render hung, then a determinism check flagged it) and
a defocus disk that was 20× too large, smearing the image. Same seed, same camera, same scene:
two runs produce byte-identical output, and the typed renderer costs roughly 10% runtime over
the untyped one for the brands and the threaded randomness. Determinism is not a side benefit
here; it is the precondition for every claim that a behaviour belongs to the program rather
than to the noise around it.

## From the scorecard to 1.0

The ray-tracer scorecard became an implementation plan. Several items that were out of reach
in the first version of this note are now real language features. `Tensor[dtype, shape]`,
dimension expressions, `Fin[n]`, and `Eq[a, b]` make shape obligations statable and let
propositional equality justify dimensions across function boundaries. A `pure` annotation is
part of function types and prevents I/O, randomness, and indirect calls to impure functions.
Functions are total by default: recursive calls must descend structurally, while code the
checker cannot prove terminating must declare itself `partial`.

The boundary is sharpest under `--proof`. Proof mode rejects `any`, `partial`, unsupported
recursion, and loops without an evident termination argument. It also makes mutable `list[T]`
invariant; immutable `seq[T]` remains soundly covariant, with `freeze` and `thaw` marking the
boundary. `--proof-report`, including JSON output, records totals, taint sites, vacuous
obligations, and covariance warnings. This is not full dependent type theory: scalar
refinements, opaque constructors, induction, approximate `(ε, δ)` judgments, and
interpretations as first-class certificate-producing objects remain research work. But the
old list of missing foundations is no longer the present tense.

The throughline is the same one that runs through every thread on this site:

> models as morphisms, interpretations as typed refinements between them, obligations
> discharged exactly where possible and statistically where not, with a machine-checkable
> certificate at the end.

Emerald is where those threads get systems. The gradual boundary the checker draws today is
the same boundary THR-02 draws for feature types. The exhaustiveness obligations the ray
tracer reopens when a type grows are THR-01's circuit claims in miniature. The certificates
the agenda wants to emit are THR-04's proof-carrying interpretations, made into build
artifacts. And the soundness condition THR-03 states for abstraction is exactly the `(ε, δ)`
judgment form the language is growing toward. The threads say what; Emerald is the attempt to
build how.

## Status

The 1.0 repository now contains the language, compiler, runtime, standard library,
diagnostics, proof and shape reports, REPL, examples, benchmark regressions, and the original
experiment. Building it and running the full suite is two commands:

{{< terminal title="shell" >}}task          # build bin/emeraldc
task test     # run the complete regression suite
bin/emeraldc --check --proof examples/proofs.rald
bin/emeraldc examples/ray_tracer/typed/main.rald -o /tmp/rt && /tmp/rt{{< /terminal >}}

The original experiment's result remains useful: six of sixteen propositions about a real
program were held by the initial practical type system, and the missing propositions said
what to build next. Version 1.0 is the first answer to that list, not the end of it. The
repository is at
[github.com/evangelion-research/emerald](https://github.com/evangelion-research/emerald); the
implemented release surface lives in
[`docs/RELEASE_V1.md`](https://github.com/evangelion-research/emerald/blob/main/docs/RELEASE_V1.md),
proof mode is documented in
[`docs/proofs.md`](https://github.com/evangelion-research/emerald/blob/main/docs/proofs.md), and
the original scorecard remains in
[`examples/ray_tracer/typed/README.md`](https://github.com/evangelion-research/emerald/blob/main/examples/ray_tracer/typed/README.md).

Read more about here : [Tour of Emerald](https://evangelion-research.github.io/tour-of-emerald/)

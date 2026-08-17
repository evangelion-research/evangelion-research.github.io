---
title: "Emerald: a typed language for machine-checked interpretation"
date: 2026-08-16
status: "note"
excerpt: "A Python-shaped, structurally typed language with a compiler written in C11 — built to find out how much of a program's meaning a practical type system can hold, and measured against a proof-carrying ray tracer."
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

Emerald is a Python-shaped language with braces instead of indentation and TypeScript-style
structural typing instead of classes. The compiler is written in modern C11 and emits native
binaries through your system `cc`. It is deliberately small: thirteen builtins, no standard
library yet, no object system. What it has is the type system, and the type system is the
point.

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

Literal types, unions, generics, flow narrowing, and `never` give the checker enough to
verify exhaustive case analysis, so extending a data type reopens every site that must be
updated. Types are erased at runtime — there is no vtable or nominal tag — so structural
subtyping costs nothing. Functions are values and closures capture enclosing locals by shared,
mutable cell. A program can span files: `import` resolves against directories, privacy is a
leading underscore, and the compiler links the whole import graph into one binary, mangling
each module's names so two packages can both define `parse`.

The pipeline is observable at every stage — `lexer → parser → modules → type checker → C
codegen → cc` — and each stage has a driver flag and its own golden test suite, 71 tests
across five suites. Errors are structured diagnostics with stable machine-readable codes, a
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

## What the scorecard buys

The gap analysis in the repo's research directions is written in the same register as the
scorecard. The blockers are stated plainly: no tensors, so you cannot yet write a neural
network; no dependent or indexed types, so a type cannot mention a shape, a length, or a
bound; no induction; no termination checking, so `never` is inhabited by divergence; `any` as
a universal solvent; unsound covariant lists; no effects or purity, so "this model is a pure
function of its inputs" is not statable; and no path to real models without a weight loader
and a graph importer.

The agenda that follows is ordered by how much of that each track unblocks. Shape types come
first — named axes, `Fin[n]` indexing, a small solver for size arithmetic — because shapes are
the practical dependent type and every interesting statement about a network mentions one.
Then effects and purity, because a commuting-square interpretation is meaningless if the model
is not a function. Then the part that makes Emerald a *research* language rather than a nicer
PyTorch: interpretations as first-class typed objects, with the compiler generating the
obligations — the syntactic map typechecks, the commuting square holds up to a stated error,
and description length is a computed number so competing interpretations are comparable.
Approximate judgments bolt the honest epistemology in: an obligation can be discharged
statically, checked dynamically, estimated statistically to an `(ε, δ)` bound, or consciously
assumed — with the boundary explicit and a machine-readable certificate as the artifact.

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

The language, the compiler, the modules, the diagnostics, the collector, and the experiment
are all in the repository, with the docs organized as one project told in three registers:
the language you can use today, the language as an instrument, and where it is going. Building
it and running the full suite is two commands:

{{< terminal title="shell" >}}task          # build bin/emeraldc
task test     # 71 golden tests across 5 stage suites
bin/emeraldc examples/ray_tracer/typed/main.rald -o /tmp/rt && /tmp/rt{{< /terminal >}}

The honest result of the work so far is a single number: six of sixteen propositions about a
real program are held by a practical type system, seven are not statable, and the seven say
exactly what to build next. The repository is at
[github.com/evangelion-research/emerald](https://github.com/evangelion-research/emerald); the
research agenda lives in
[`docs/research-directions.md`](https://github.com/evangelion-research/emerald/blob/main/docs/research-directions.md),
and the scorecard in
[`examples/ray_tracer/typed/README.md`](https://github.com/evangelion-research/emerald/blob/main/examples/ray_tracer/typed/README.md).

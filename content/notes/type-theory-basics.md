---
title: "Type theory for beginners: the notation, the conventions, and what they mean"
date: 2026-08-18
status: "note"
excerpt: "A first pass at the vocabulary — judgments, contexts, inference rules, binding, substitution, and the conventions everyone uses but nobody states — enough to read a typing rule out loud and know what it claims."
tags: ["type theory", "programming languages", "foundations", "notation"]
---

Most of the writing on this site leans on type theory as a working language: a type is a
property, a typechecker is a proof checker, an interpretation is a typed object. That
vocabulary is not hard, but it is written in a notation that papers assume you already read.
This note is the missing preamble. It states the conventions — what the turnstile means, why
rules are drawn as fractions, what a context is doing, why variable names are both essential
and irrelevant — and stops at the point where a reader can open a paper and parse its rules.

Nothing here is new. The point is that all of it is usually left implicit.

## The object of study is the judgment

A type theory is not primarily a set of types. It is a set of **judgments** — formal claims
that are either derivable or not — together with rules for deriving them. The judgment you
will see most often is the typing judgment:

{{< spec title="Typing judgment" >}}
`Γ ⊢ e : A`

Read: "in context `Γ`, the term `e` has type `A`." The turnstile `⊢` is pronounced
"proves" or "entails"; everything left of it is assumption, everything right of it is claim.
{{< /spec >}}

The claim is relative. `x + 1 : Int` is not a statement you can evaluate on its own, because
`x` might be a string. `x : Int ⊢ x + 1 : Int` is, because the assumption is carried along.
This relativity is the entire reason contexts exist, and it is why the turnstile is not
optional decoration.

Other judgment forms appear alongside it, and they follow the same shape:

- `Γ ⊢ A type` — `A` is a well-formed type in context `Γ`. (Needed once types can mention
  terms; in a simple language it is usually left implicit.)
- `Γ ⊢ e ≡ e' : A` — `e` and `e'` are *definitionally equal* at type `A`.
- `Γ ⊢ A <: B` — `A` is a subtype of `B`.
- `e ⟶ e'` — `e` steps to `e'` (an operational-semantics judgment; note there is no
  context, because evaluation happens on closed terms).

When a paper introduces a new judgment form, it is announcing what kind of claim the rest of
the paper will be making. Read that line carefully; everything else is machinery for
deriving it.

## Contexts are ordered lists of assumptions

`Γ` (capital gamma) conventionally names a context: a finite, ordered list of variable
bindings.

```
Γ ::= ·  |  Γ, x : A
```

The `·` is the empty context (sometimes `∅`, sometimes just blank). `Γ, x : A` is `Γ`
extended on the right with the assumption that `x` has type `A`.

Three conventions travel with this and are almost never stated:

1. **Contexts are ordered, and later entries may depend on earlier ones.** In a dependently
   typed setting `Γ, n : Nat, v : Vec n` is well-formed and its reverse is not. In a simple
   type system order does not matter semantically, but the notation keeps it anyway.
2. **Variables in a context are distinct.** `Γ, x : A` implicitly requires that `x` is not
   already bound in `Γ`. If a rule seems to violate this, it is relying on the renaming
   convention below.
3. **`Γ`, `Δ`, `Θ` are all contexts.** The choice of letter carries no meaning beyond "these
   are two different contexts I need to distinguish."

## Inference rules are read bottom-up

Rules are written as a fraction:

```
   premise₁   premise₂   ...   premiseₙ
  ───────────────────────────────────── NAME
                conclusion
```

This means: *if* every premise is derivable, *then* the conclusion is. A rule with no
premises is an **axiom**, and the bar is drawn anyway.

The convention that trips people up: you read rules **bottom-up** when you use them. A
typechecker is handed the conclusion — "does `e` have a type in `Γ`?" — and works upward,
turning one goal into subgoals, until it reaches axioms. The fraction bar points down, the
algorithm walks up.

Here is the simply typed lambda calculus in full, which is worth having memorised because
every larger system is this plus additions:

```
      x : A ∈ Γ
     ───────────── Var
      Γ ⊢ x : A


      Γ, x : A ⊢ e : B
     ────────────────────── →I     ("intro": how to build a function)
      Γ ⊢ λx:A. e : A → B


      Γ ⊢ e₁ : A → B     Γ ⊢ e₂ : A
     ─────────────────────────────── →E   ("elim": how to use a function)
              Γ ⊢ e₁ e₂ : B
```

Read `→I` out loud: "if, assuming `x` has type `A`, the body `e` has type `B`, then the
lambda has type `A → B`." That sentence is the rule. The notation is an abbreviation for it,
not a substitute.

### Intro and elim come in pairs

The `I`/`E` naming is a convention worth internalising. For each type former there are
**introduction** rules (how do I produce a value of this type?) and **elimination** rules
(given a value of this type, what may I do with it?). Products introduce by pairing and
eliminate by projection; sums introduce by injection and eliminate by case analysis;
functions introduce by lambda and eliminate by application.

The two must fit: eliminating something you just introduced should give back what you put
in. That is the **β-rule** (`(λx. e) v ⟶ e[v/x]`, `fst (a, b) ⟶ a`). Going the other way —
rebuilding a value from its projections — is the **η-rule** (`e ≡ λx. e x`, `p ≡ (fst p, snd p)`).
When someone says a connective is "well-behaved," this harmony is usually what they mean.

## Binding, α-equivalence, and substitution

Three conventions here are load-bearing and universally assumed.

**Binders scope to the right, as far as possible.** In `λx. e₁ e₂` the body is `e₁ e₂`, not
just `e₁`. And `A → B → C` means `A → (B → C)`: the arrow is right-associative, while
application `f a b` means `(f a) b` and is left-associative. Nearly every parenthesis in a
paper is omitted on these two rules.

**Bound variable names do not matter.** `λx. x` and `λy. y` are the *same term*, written
differently. This is **α-equivalence**, and the convention (the "Barendregt convention") is
that we silently rename bound variables whenever needed to avoid a clash. When a rule writes
`Γ, x : A ⊢ e : B` and `x` already appears in `Γ`, this convention is what rescues it.

**Substitution avoids capture.** `e[v/x]` means "`e` with `v` substituted for free
occurrences of `x`." Read it as "`v` for `x`" — the notation is unfortunately not universal;
some authors write `e[x := v]` or `[v/x]e`, and you must check which. The one absolute rule
is that substitution must not let a free variable of `v` get captured by a binder in `e`;
you α-rename first. This is the single most common source of bugs in a first implementation.

## The two theorems everyone proves

A type system is only worth stating if it *means* something. "Well-typed programs don't go
wrong" is made precise as two lemmas about the interaction of typing with evaluation:

{{< spec title="Type soundness" >}}
**Progress.** If `· ⊢ e : A`, then either `e` is a value or there is some `e'` with `e ⟶ e'`.
(A well-typed program is never stuck.)

**Preservation** (also called subject reduction). If `· ⊢ e : A` and `e ⟶ e'`, then
`· ⊢ e' : A`. (Evaluation does not change the type.)
{{< /spec >}}

Together they say a well-typed program either runs forever or reaches a value of the type
you predicted — it never reaches a state the semantics has no rule for. Both are proved by
induction, and the empty context in the statement is deliberate: progress is false for open
terms, because a free variable is stuck and is not a value.

The complementary property is **decidability** — an algorithm always terminates with a yes or
no. Soundness says the type system tells the truth; decidability says a machine can find out.
Rich type systems routinely trade the second away, and when a paper says a system is
"undecidable but sound," it means exactly this.

## Curry–Howard, stated once

The observation that reorganised the field: the typing rules above are, symbol for symbol,
the rules of intuitionistic natural deduction.

| Programs | Logic |
|---|---|
| type `A` | proposition `A` |
| term `e : A` | proof of `A` |
| `A → B` | implication |
| `A × B` (pair) | conjunction |
| `A + B` (sum) | disjunction |
| `Void` (empty type) | falsehood |
| `Unit` | truth |
| `Π(x:A). B` (dependent function) | universal quantification |
| `Σ(x:A). B` (dependent pair) | existential quantification |
| evaluation | proof normalisation |

A typechecker is therefore a proof checker, and this is not an analogy — it is the same
algorithm. It is also why "make the illegal state unrepresentable" is a real technique
rather than a slogan: an uninhabited type is an unprovable proposition.

Two cautions. The logic is *intuitionistic*: there is no term of type `A + (A → Void)`, so
excluded middle and double-negation elimination are not available. And a non-terminating
term inhabits every type, so a language with unrestricted recursion is an inconsistent
logic — which is precisely why proof assistants insist on termination checking.

## Conventions and notation, collected

These are the things that get assumed rather than said.

| Symbol | Meaning |
|---|---|
| `Γ`, `Δ` | typing contexts |
| `⊢` | turnstile; "in this context, the following is derivable" |
| `::=`, `\|` | BNF grammar: "is defined as", alternatives |
| `e`, `t`, `M` | terms (author-dependent) |
| `A`, `B`, `τ`, `σ` | types |
| `α`, `β`, `X` | type *variables*, as opposed to concrete types |
| `v` | a value — a term that cannot step further |
| `⟶`, `⟶*` | one evaluation step; zero or more steps |
| `≡` | definitional / judgmental equality (decided by the checker) |
| `=` | propositional equality (a type you must prove) |
| `e[v/x]` | capture-avoiding substitution of `v` for `x` |
| `A → B` | function type; right-associative |
| `f a b` | application; left-associative, means `(f a) b` |
| `∀α. A` | polymorphic type (System F) |
| `Π`, `Σ` | dependent function and pair types |
| `<:` | subtyping |
| `⊤`, `⊥` | top and bottom types (in a lattice: also greatest/least) |
| overbar `ē` | a sequence, e.g. `ē` for `e₁ … eₙ` |

Naming conventions that are near-universal and never justified: `x, y, z` for term
variables; `f, g` for functions; `n, m, k` for naturals; `i, j` for indices; `Γ` for the
context you have and `Δ` for the one you are comparing it to; rule names as `Ty-App`,
`E-If-True`, `S-Refl`, with the prefix naming the judgment (`Ty` typing, `E` evaluation, `S`
subtyping, `K` kinding).

Two more distinctions worth pinning down early, because they are silently assumed:

- **Judgmental vs propositional equality.** `≡` is decided automatically by the checker
  (`2 + 2 ≡ 4` needs no proof). `=` is a type whose inhabitants are proofs, and
  `∀n. n + 0 = n` is a theorem you must actually write. Confusing the two makes dependent
  type theory incomprehensible.
- **Types vs kinds.** Types classify terms; **kinds** classify types. `Int : *` ("Int is a
  proper type"), `List : * → *` ("List is a type constructor awaiting one type"). The
  judgment is `Γ ⊢ A : K`, and the whole apparatus repeats one level up.

## Where the ladder goes

The systems you will meet, in roughly increasing strength, form a standard progression:

**Simply typed lambda calculus** — the three rules above; total, decidable, weak.
**System F** — adds `∀α. A`, so `id : ∀α. α → α` is one function rather than one per type;
typechecking is decidable, full type *inference* is not. **System Fω** — adds type
operators, hence kinds. **Hindley–Milner** — the restriction of System F (prefix
quantification only) for which complete inference *is* decidable; this is why ML and Haskell
can infer your types and Coq cannot. **Dependent types** — types may mention terms
(`Vec Int n`), collapsing the term/type distinction and making the checker a general proof
assistant; the price is that typechecking now involves evaluation, and inference is
hopeless.

Sitting alongside these are the refinements that show up constantly in practice:
**subtyping** (`A <: B` with a subsumption rule), **refinement types** (`{x : Int | x > 0}`,
discharged to an SMT solver), **linear and affine types** (each variable used exactly, or at
most, once — contexts split rather than duplicate, which is how Rust's borrow checker is
best understood), and **effect systems** (the judgment grows to `Γ ⊢ e : A ! ε`, tracking
what the term does as well as what it returns).

## How to read a paper's rules

A practical procedure, which is the actual payload of this note:

1. **Find the judgment forms first.** They are usually in a figure captioned "syntax" or
   introduced in a line beginning "we write." Everything else derives these.
2. **Read the grammar.** `e ::= x | λx:A. e | e e | …` tells you exactly what terms exist.
   Anything not in the grammar is not in the language.
3. **For each type former, locate its intro and elim rules** and check they pair up. Missing
   or unusual pairings are where the paper's contribution usually lives.
4. **Translate one rule into English out loud.** If you cannot, you have missed a convention,
   not a concept.
5. **Look for what the context tracks.** If `Γ` carries more than `x : A` — usages, regions,
   effects, modes — that extra structure is the paper's idea.
6. **Check the metatheory section** for which of progress, preservation, decidability, and
   termination are claimed. What is *not* claimed is as informative as what is.

## Why this matters here

The claim running through this site is that interpretability needs formal objects rather
than plots: a circuit claim should be a statement with a truth value, and checking it should
be mechanical. Type theory is the best-developed technology we have for exactly that —
stating a property precisely and having a machine decide it — and everything specific we
build, [Emerald](/notes/emerald/) included, is an instance of the machinery above with the
judgments changed to talk about models instead of programs. The notation is the entry fee.

For going further, the standard references are Pierce's *Types and Programming Languages*
for the simply typed side, Harper's *Practical Foundations for Programming Languages* for a
judgment-first presentation, and the *HoTT Book* or Nordström–Petersson–Smith for dependent
type theory. All three assume the conventions in this note, and none of them state them.

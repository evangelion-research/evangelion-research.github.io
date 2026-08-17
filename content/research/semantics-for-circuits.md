---
title: "Semantics for Circuits"
code: "THR-01"
weight: 10
date: 2026-01-12
status: "active"
excerpt: "A denotational account of what a circuit means, so that 'this head does induction' becomes a statement with a truth value."
methods: ["denotational semantics", "operational semantics", "circuit analysis"]
tags: ["semantics", "circuits", "transformers"]
---

A circuit diagram is usually presented as a picture with arrows. The picture is doing two
jobs at once: it names a subgraph of the model, and it asserts a behaviour. The first job is
syntax, the second is semantics, and conflating them is why circuit claims are hard to falsify.

## The construction

We fix a small combinator language whose terms denote functions on the residual stream:
copy, match, shift, select, and composition. We give it a denotational semantics in the same
space the model operates on. A circuit claim is then a pair: a term $t$ in the language, and a
subgraph $G$ of the model. The claim is that $[\![t]\!]$ and the behaviour of $G$ agree up to
an explicitly stated error relation on an explicitly stated input set.

{{< spec title="Circuit claim" >}}
A claim is a triple ⟨t, G, R⟩ where t is a term, G a subgraph, and R an error relation.
It holds iff for all x in the stated domain, ⟦t⟧(x) R behaviour(G)(x).
{{< /spec >}}

Three things fall out immediately. The claim has a truth value. The error relation is visible
rather than implicit in a scatter plot. And two different research groups can state the *same*
claim, which is not currently possible.

## Why operational semantics too

Denotation tells you what a circuit computes; it does not tell you how the computation is
staged across layers. For that we keep a small-step relation over configurations of the
residual stream, which is what lets us talk about intermediate states, the objects activation
patching actually manipulates. Patching is then a rule of the operational semantics rather
than an experimental technique with unclear scope.

## Current work

- A machine-checked semantics for an attention-only fragment, with induction heads derivable
  as a combinator rather than assumed.
- Adequacy: the denotational and operational accounts agree, so patching results transfer to
  behavioural claims.
- A checker that takes a claimed term and a subgraph and returns the tightest error relation
  it can certify, instead of a yes/no.

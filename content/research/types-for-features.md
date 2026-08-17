---
title: "Type Systems for Features"
code: "THR-02"
weight: 20
date: 2026-01-14
status: "active"
excerpt: "If a feature has a meaning, that meaning is a type. Subtyping gives hierarchy; the typing judgement gives something a machine can check."
methods: ["refinement types", "subtyping", "sparse autoencoders"]
tags: ["types", "features", "sae"]
---

The output of a sparse autoencoder is a dictionary of directions, each labelled with a natural
language gloss produced by a model and rarely audited. The gloss is doing the work of a
specification while having none of its properties: it cannot be composed, cannot be checked,
and cannot conflict with another gloss in a detectable way.

## Features as refinement types

We read a feature as a refinement type over activation space: a base type (the layer's
activation type) refined by a predicate. The predicate is the content of the claim. A feature
whose predicate is `contains_indirect_object(x)` says something checkable about every
activation that fires it.

{{< spec title="Feature judgement" >}}
Γ ⊢ f : {v : Act_ℓ | φ(v)}

That is: f is a feature at layer ℓ whose firing set is contained in φ.
{{< /spec >}}

Subtyping then does real work. A "proper noun" feature should be a supertype of a "city name"
feature; if the dictionary says otherwise, the dictionary has a bug, and we find it by checking
containment on a finite sample rather than by reading two thousand glosses.

## What this buys

- **Composition.** Feature interaction becomes function application with a typing rule, so a
  claim about a downstream feature can *depend* on an upstream one.
- **Falsifiability.** A wrong gloss fails to typecheck against sampled activations, with a
  concrete counterexample attached.
- **Hierarchy for free.** Feature taxonomies are derived from the subtyping order rather than
  imposed by clustering.

## Open edge

The predicates that matter are not decidable, and the honest version of this work is a
*gradual* type system: precise where we can check, dynamic where we cannot, with the boundary
marked instead of hidden. Blame tracking then tells you which unchecked claim was responsible
when an explanation fails downstream.

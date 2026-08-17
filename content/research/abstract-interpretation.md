---
title: "Abstract Interpretation of Activations"
code: "THR-03"
weight: 30
date: 2026-01-16
status: "active"
excerpt: "Sound over-approximation of a layer's behaviour, so that ablation and steering results come with bounds instead of anecdotes."
methods: ["abstract interpretation", "Galois connections", "static analysis"]
tags: ["abstraction", "soundness", "ablation"]
---

Interpretability experiments are dynamic analyses: run the model, watch what happens, infer a
mechanism. Static analysis has the complementary failure mode: it says less, but what it says
holds for every input. We think the field is missing the static half.

## The connection

Fix an abstract domain over activation space: intervals per direction, polyhedra over a
feature basis, or a symbolic description of which features may fire. A Galois connection
between concrete activation sets and abstract descriptions gives, for each layer, an abstract
transformer that over-approximates the real one.

{{< spec title="Soundness condition" >}}
α(f(S)) ⊑ f#(α(S))   for every concrete set of activations S.
The abstract layer never claims a behaviour the real layer cannot exhibit.
{{< /spec >}}

Run the abstract transformers layer by layer and you get a statement of the form: *under this
ablation, the model's output distribution stays within these bounds, for all inputs in the
domain, not just the thousand you sampled.

## Precision is the whole game

Sound is easy; sound and informative is hard. The interesting research is in the domains and
the widening operators: how coarse a description can be while still separating the behaviours
we care about, and where in the network symbolic description must give way to measurement. We
expect a depth at which every domain we know collapses to top, and locating that depth is
itself a result about how the network computes.

## Current work

- Interval and zonotope domains over SAE feature bases, evaluated on how tight the bounds stay
  through depth.
- Sound ablation: replacing "we ablated it and the loss went up 3%" with a certified bound.
- A counterexample-guided loop that refines the domain when the bound is too loose to decide
  the question asked.

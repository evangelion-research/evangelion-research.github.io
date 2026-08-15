---
title: "Evangelion Research"
subtitle: "An interpretability lab. We read neural networks as programs — with the tools of formal reasoning and programming languages research."
description: "Evangelion Research is an interpretability lab studying mechanistic interpretability through formal reasoning and programming languages theory."
---

Mechanistic interpretability has an evidence problem. A circuit diagram is a claim about
what a computation *is*, but most such claims are supported by correlations, ablations, and
plots — artefacts that can be true of a model without being true of its mechanism.

Programming languages research spent forty years on exactly this question for a different
class of artefact. Semantics tells you what a program means. Type systems let you state a
property and check it. Abstract interpretation buys soundness at a known cost in precision.
Contextual equivalence says when two implementations may be substituted without any observer
noticing. None of this is metaphor: a trained network is a program in an unusual object
language, and interpretability is decompilation under uncertainty.

**Evangelion Research builds the formal side of that bridge.** We want interpretability claims
that are *stated* precisely enough to be wrong, and *checked* mechanically rather than eyeballed.

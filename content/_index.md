---
title: "Evangelion Research"
subtitle: "An interpretability lab. We read neural networks as programs, with the tools of formal reasoning and programming languages research."
description: "Evangelion Research is an interpretability lab studying mechanistic interpretability through formal reasoning and programming languages theory."
---

A circuit diagram is a claim about what a computation is. Most such claims are supported by
correlations, ablations, and plots, and those can hold without describing the mechanism that
produced them.

Programming languages research has spent decades on this problem for a different kind of
artefact. Semantics says what a program means. Type systems state a property and check it.
Abstract interpretation gives soundness at a known cost in precision. A trained network is a
program in an unusual object language, and interpretability is decompilation under
uncertainty.

We build the formal side of that bridge: interpretability claims that are precise enough to
be wrong and checked mechanically rather than by eye. The research threads below are the
standing programme. The lab notes track the systems we are actually building, most recently
Emerald, a typed language with a compiler written in C11.

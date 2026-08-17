---
title: "Proof-Carrying Interpretations"
code: "THR-04"
weight: 40
date: 2026-01-18
status: "early"
excerpt: "An explanation should ship with a certificate a third party can check without rerunning the experiment or trusting the author."
methods: ["proof-carrying code", "certificate checking", "mechanised proof"]
tags: ["proofs", "certificates", "verification"]
---

Proof-carrying code solved a trust problem that looks a lot like ours: a producer wants to
ship an artefact, a consumer will not trust it, and rerunning the producer's analysis is
infeasible. The answer was to ship a proof alongside the artefact and make the consumer's job
mere checking: cheap, decidable, and requiring no trust in the producer.

## Applied to interpretability

An interpretability result is currently distributed as a paper, some notebooks, and a set of
figures. Reproducing it means rerunning the pipeline on the same weights with the same seeds
and hoping. We want the result distributed as a *certificate*: a derivation in a small proof
language whose leaves are checkable facts about weights and a finite activation sample.

{{< spec title="What a checker verifies" >}}
Given: model weights W, activation sample A, claim C, certificate π.
Check(W, A, C, π) ∈ {accept, reject}. Decidable, no training, no sampling, no trust.
{{< /spec >}}

The design constraint is that checking must be far cheaper than discovery. Finding a circuit
can take a GPU-week; verifying the claim about it should take a laptop-minute. That asymmetry
is what makes the scheme worth having.

## Why this thread is marked early

The proof language is not settled. Too weak and real claims cannot be expressed; too strong
and checking stops being cheap. We are working the problem from the examples end: taking
published interpretability results and asking what the smallest certificate for each would
have to contain.

## Current work

- A core calculus with rules for patching, ablation, and feature containment.
- A reference checker, deliberately small enough to audit by reading.
- Retrofitting certificates onto three well-known published circuits, as a forcing function on
  the language design.

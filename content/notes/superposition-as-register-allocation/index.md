---
slug: "superposition-as-register-allocation"
title: "Superposition is register allocation"
date: 2026-07-22
status: "draft"
excerpt: "A compiler packs many virtual registers into few physical ones under a liveness constraint. If that is what superposition is, decompilation techniques should transfer."
tags: ["superposition", "compilers", "features", "analogy"]
authors: ["Sagnik Chatterjee"]
---

Superposition is usually explained through the geometry: more features than dimensions, so
features are stored as nearly-orthogonal directions and interfere a little. That explanation is
correct and it stops one step short of being useful, because it describes the *storage layout*
without describing the *allocation policy* that produced it.

Compilers have the same problem and a well-developed answer.

## The correspondence

Register allocation is the problem of mapping an unbounded set of virtual registers onto a
small fixed set of physical ones. The classical solution builds an interference graph — one
node per virtual register, an edge between two registers that are live at the same time — and
colours it. Registers that are never simultaneously live may share a physical register at no
cost.

{{< spec title="The claim" >}}
Features that never co-occur in the training distribution are non-interfering, and a network
under dimensional pressure will assign them overlapping directions — the same move a compiler
makes when it coalesces two non-interfering virtual registers.
{{< /spec >}}

{{< sidenote >}}
The analogy is not that the network *runs* a graph-colouring algorithm. It is that gradient
descent under a capacity constraint is solving the same combinatorial problem, and so the
solutions should have the same shape.
{{< /sidenote >}}

If that is right, several things follow that the geometric account does not predict.

## Predictions

**One.** Feature co-occurrence statistics should predict direction overlap better than feature
*similarity* does. Two semantically unrelated features that never appear together are good
candidates to share capacity; two related features that frequently co-occur are not.

**Two.** There should be a spill analogue. When pressure exceeds what the layer can colour,
compilers spill to memory — the network's equivalent is pushing a feature into a later layer
or reconstructing it on demand from cheaper features. Spilled features should look
computationally expensive and positionally late.

**Three.** Interference should be *structured*, not uniformly random. Polysemantic neurons
should preferentially combine features from disjoint contexts, which is a testable claim about
which pairs share a neuron.

## Where it breaks

The correspondence is imperfect in a way worth stating. Register allocation is exact: two
values either share a register or they do not. Superposition is continuous — directions are
nearly orthogonal, not identical, and the residual interference is part of the computation
rather than an error. The right formal object is probably a *fractional* or soft colouring,
and I do not yet know whether the useful theorems survive that relaxation.

The second gap is that a compiler allocates against a known liveness analysis, computed from
the program. The network allocates against the training distribution, which it never sees in
full. That makes this a claim about the data as much as about the model.

## What would settle it

Take a small model trained on a distribution where we control co-occurrence exactly. Construct
the interference graph from the data, colour it, and compare the predicted sharing pattern
against the measured direction overlap. If co-occurrence structure predicts the layout, the
analogy is doing work; if it does not, the geometry was the whole story and this note is
wrong in a useful way.

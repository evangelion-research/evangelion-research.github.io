---
title: "Repurtum Research Lab"
subtitle: "A small lab notebook for interpreters, agentic repair loops, and self-pairing software."
description: "Research notes from Repurtum on interpreters, agentic repair loops, and self-pairing software systems."
---

Repurtum studies software that can explain its own execution and use that explanation as part of the next pass. The work sits between programming language implementation, developer tools, and agentic repair systems.

The lab notebook is intentionally public and draft-friendly. Posts emphasize mechanisms over announcements: how an interpreter reports failure, how an agent consumes that report, and what can be measured when a program enters a repair loop.

## Research Agenda

The current program has three threads.

1. **Interpreters as instruments.** Build language runtimes that expose structured events, not just output and stack traces.
2. **Repair as a loop.** Treat an LLM patch as one pass in a measurable system with inputs, failure modes, and convergence criteria.
3. **Self-pairing programs.** Explore systems where separate passes hold different obligations: execution, diagnosis, repair, and verification.

## Working Questions

- What should an interpreter report so another system can make a precise repair?
- Which failures are recoverable from local context, and which require a wider execution trace?
- How do we distinguish a real fix from a patch that only silences the first error?
- What telemetry makes agentic repair auditable instead of theatrical?

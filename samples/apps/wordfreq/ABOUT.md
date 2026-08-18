# Why wordfreq?

This repo uses a small word frequency counter to demonstrate the SDLC (Requirements -> Design -> Implement -> Test -> Deploy) with PostQode. It's a deliberately simple app, but the choice isn't arbitrary. it is chosen because it has real ties to AI/ML, to agentic engineering, and to what a disciplined "AI SDLC" looks like in practice.

## Relevance to AI / ML

Word frequency counting is the direct ancestor of tokenization and vocabulary construction, a step every modern NLP pipeline still performs, including the ones behind LLMs. Before a transformer sees a sentence, that sentence is broken into tokens, and vocabulary construction historically starts by counting how often each unit appears in a corpus. Byte-pair encoding, the subword tokenization method most LLMs use, is built by iteratively merging the most *frequent* adjacent character pairs. The app in this repo is a simplified, visible version of a step that's normally invisible, buried inside a tokenizer nobody has to think about.

It's also the seed of TF-IDF, a technique still used as a real baseline in search, document retrieval, and as a lightweight feature extraction method taught alongside embeddings in ML coursework.

## Relevance to agentic engineering

This is less about the app itself and more about why it's a good *subject* for demonstrating an agentic workflow:

- **Small, bounded problem space with clear correctness criteria.**
  Case-insensitivity, punctuation stripping, and tie-breaking are all unambiguous   rules, which makes it possible to write a genuinely deterministic test suite.
- **Just enough moving parts to touch every SDLC stage meaningfully.** An algorithm, an API contract, an edge-case-heavy input surface, a UI, and a deployment target, without any one part being complex enough to introduce noise into the "watch the agent work"  narrative. A trivial task would give an agent nothing to design; a complex task would give it too much room to wander unpredictably from run to run.
- **Legible without explanation.** Tech audiences immediately understand what "count word frequency" means, so attention stays on *how the agent builds it* (planning, tool use, mode switching, file-anchored handoffs between stages), which is the actual subject of the demo, not on understanding what's being  built.

## Relevance to the AI SDLC

There's a reflexive point worth drawing out explicitly: the process demonstrated here, pin requirements into a file, pin design decisions before implementation, write tests against defined criteria before trusting the implementation, keep every stage auditable, is itself a small-scale mirror of how more serious AI/ML systems should be built and evaluated. Dataset requirements get specified, model architecture gets decided and documented, behavior gets tested against defined criteria before deployment. The discipline behind this repo's prompts (a "Resolved Decisions" section in the design doc, explicit scope fences between stages, a fixed answer key for requirements gathering) isn't just demo hygiene, it's a miniature of the same rigour that responsible AI/ML development requires at a much larger scale.

The reason this repo spends real effort pinning down the word frequency counter is the same reason real ML systems need specification, design, and test discipline. Here, you can see the whole cycle in a few minutes.

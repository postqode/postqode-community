# wordfreq: SDLC Demo with PostQode

This repo contains a small set of prompts that walk a project through the software
development lifecycle, Requirements -> Design -> Implement -> Test -> Deploy, using
PostQode. The prompts are designed to produce a predictable, repeatable outcome across
different runs and different underlying models.

The end result is a simple word frequency web app: paste text, get back the N most
frequent words.

## What's in this repo

The five prompts are saved as PostQode workflows, project-local, checked into this repo under `.postqode/workflows/`, so they travel with a `git clone` and are runnable immediately as slash commands, no copy-pasting required.

| File                      | Stage        | Mode  | Produces                              |
|---------------------------|--------------|-------|---------------------------------------|
| `1_PM_GenRequirements.md` | Requirements | Plan  | `requirements.md`                     |
| `2_PM_GenDesign.md`       | Design       | Plan  | `design.md`                           |
| `3_AM_GenCode.md`         | Implement    | Agent | application code                      |
| `4_AM_GenTests.md`        | Test         | Agent | `test-cases.md` + automated tests     |
| `5_AM_GenDeployment.md`   | Deploy       | Agent | `deploy.md`                           |
| `INPUT.md`                | -            | -     | Answer key for the requirements stage |
| `Text_for_testing.md`     | -            | -     | Sample input text                     |

This repo intentionally contains only the prompts and the answer key, not the generated
output. Running the prompts yourself is what produces `requirements.md`, `design.md`,
the application code, tests, and `deploy.md`.

`Text_for_testing.md` is a short original passage on the origin of the term "bug" in
computing (the 1947 Harvard Mark II moth incident), handy for pasting into the app once
it's running to see the word frequency output on real text.

See [ABOUT.md](ABOUT.md) for why this sample app was chosen.

## How to run this

1. Open this project in PostQode.
2. Run `1_PM_GenRequirements.md` in **Plan mode**. It will ask you a batch of clarifying
   questions (framework, input limits, visual style, testing approach, etc.).
3. Reply with the contents of `INPUT.md` as your answer. This is a fixed answer key,
   using it (rather than answering freely) is what keeps the outcome consistent across
   different runs and different models. PostQode will then prompt you to switch to
   **Agent mode** so it can save `requirements.md` to disk, Plan mode can propose the
   file but won't write it. Switch when prompted.
4. Run `2_PM_GenDesign.md` in **Plan mode**. This reads `requirements.md` and produces
   `design.md`, including a "Resolved Decisions" section that pins every technical
   choice as a fixed value for later stages to rely on. As with the previous step,
   PostQode will prompt you to switch to **Agent mode** to actually save `design.md`.
5. Run `3_AM_GenCode.md` in **Agent mode**. This reads `design.md` and implements the
   app.
6. Run `4_AM_GenTests.md` in **Agent mode**. This generates a test plan and automated
   tests, then runs them.
7. Run `5_AM_GenDeployment.md` in **Agent mode**. This documents how to run the app
   locally (Flask's built-in dev server, port 8000, bash and PowerShell start commands
   included).

Run the prompts in order, each one depends on a file produced by the previous stage.

## Why the prompts are structured this way

- **Plan mode vs. Agent mode**: Plan mode is used for the two stages that involve
  reasoning and proposing (requirements, design) without touching the file system.
  Agent mode is used for the stages that actually execute (implement, test, deploy).
- **File-anchored handoffs**: each prompt reads the previous stage's output file
  (`@requirements.md`, `@design.md`) rather than relying on conversation memory, so the
  chain works the same way whether it's run in one sitting or across several sessions.
- **Fixed answer key (`INPUT.md`)**: clarifying questions can vary between models and
  between runs of the same model. Answering with a fixed, prepared reply, rather than
  improvising, keeps the resulting `requirements.md` consistent regardless of exactly
  what was asked.
- **Resolved Decisions in `design.md`**: this section restates every constraint as a
  literal fixed value (framework, port, testing library, etc.), so later stages don't
  have to infer or re-derive anything.
- **Explicit scope fences**: each prompt states what *not* to do (e.g. "do not write
  test files" in the implementation prompt), keeping stages from bleeding into one
  another.

## Requirements

- [PostQode](https://postqode.ai)
- Python 3.x (the app itself is a Flask application; the implementation stage will
  generate a `requirements.txt`)

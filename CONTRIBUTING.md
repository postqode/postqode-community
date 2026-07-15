# Contributing to PostQode Community

Thanks for considering a contribution. This repo is for **runnable content** - code, not guides or prompts. If what you have in mind is a best-practice doc, a rule, or a reusable workflow prompt, it probably belongs in [`awesome-postqode`](https://github.com/postqode/awesome-postqode) instead.

## Where does my contribution go?

| Contribution                                                 | Folder                  |
|--------------------------------------------------------------|-------------------------|
| An app to point PostQode at                                  | `samples/apps/`         |
| An MCP server, auth client, or similar that extends PostQode | `samples/integrations/` |

If you're not sure which bucket fits, or you have something that doesn't fit either (a benchmark runner, a project template, a shared dataset - all things we're deliberately leaving out of scope for now), open an issue and let's talk about it before you put the work into a PR.

## Submitting an app sample (`samples/apps/`)

1. The app should build and run cleanly from a fresh clone with clear setup instructions in its own `README.md`.
2. If your app includes intentional bugs or edge cases meant to be discovered through testing (a hackathon-style challenge, like `leave-management-system`), **do not include an answer key, bug list, or grading rubric in the PR.** Keep that privately with whoever is running the exercise. The public sample should only contain the app itself and genuine, non-spoiler documentation (setup instructions, business rules describing intended behavior, general architecture).
3. Double-check the repo history and all files for real credentials, internal URLs, or other information that shouldn't be public - not just the final commit, the whole history you're contributing.
4. Include a test suite if the sample has one already (not required, but useful as a baseline / sanity check for people extending it).

## Submitting an integration sample (`samples/integrations/`)

1. Include a mock or offline mode if the integration normally requires a live external system (a real TFS/Jira/OAuth provider, etc.), so people can run and test it without needing that dependency.
2. Include a test suite covering the core logic.
3. Document the tool/API surface it exposes and any configuration (env vars, auth modes) needed to switch between mock and real modes.

## General checklist before opening a PR

- [ ] No real credentials, tokens, internal hostnames, or personal data anywhere in the diff or history
- [ ] Content has its own `README.md` with setup/run instructions
- [ ] Added a line for your contribution in the root `README.md` under the right category
- [ ] For app samples with seeded bugs: answer key / rubric is **not** included
- [ ] Tests (if any) pass from a clean clone

## Questions

Open an issue - happy to help figure out where something fits before you put the work into a full PR.

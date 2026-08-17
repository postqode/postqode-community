<context>
Read `requirements.md` and `design.md`, specifically the Resolved Decisions section.
</context>

<task>
Generate a test plan and test cases covering: empty input, oversized input (over 5,000 characters), N larger than vocabulary, tie-breaking, punctuation, case-insensitivity, and non-UTF8 input. Save to `test-cases.md`. Then implement these as automated tests using the testing library fixed in Resolved Decisions, run them, and report pass/fail.
</task>

<constraints>
Structure every test in Arrange-Act-Assert format, with each section clearly separated (a blank line or comment marking Arrange, Act, Assert).
One behavior per test function. Name test functions descriptively as test_<scenario>, e.g. test_empty_input_returns_error. Do not combine multiple assertions testing unrelated behaviors into a single test.
</constraints>
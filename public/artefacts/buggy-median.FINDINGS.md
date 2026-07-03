# FINDINGS — /workspace/samples/buggy-median

## The sceptic's case

**correctness:** Through the correctness lens this code is wrong for all even-length inputs: median() returns sorted[Math.floor(n/2)] (median.js:9-10), the upper of the two central elements, instead of the mean of the two central values. I confirmed it firsthand — median([1,2,3,4]) returns 3 (expected 2.5), median([1,2]) returns 2 (expected 1.5), median([1,2,3,4,5,6]) returns 4 (expected 3.5). Confidence is high; the shipped test suite passes but only exercises odd-length lists and the empty case, so it never catches this. Odd-length handling, the empty-list guard, and non-mutation of caller data (a defensive [...values] copy) are all correct.

**security:** Through the security lens this code is sound — it has essentially no attack surface. `median` (median.js:4-11) is a pure, in-memory numeric routine: it copies the input array, sorts it, and returns the middle element. I confirmed firsthand via grep that there is no shell/exec/eval, no filesystem or `require`/dynamic import of user data, no network, no environment/secret access, and no deserialization anywhere in the sample (grep for exec|spawn|eval|fs.|child_process|http|crypto|process.env|Function returned no matches). Adversarial inputs (strings, null, objects, NaN) either throw or return a benign value with no injection, resource-exhaustion, or memory-safety consequence, so I report no security findings. (There is a separate correctness bug for even-length inputs — outside this lens — which is already documented in the code's own test comment.)

**contract:** Through the contract lens this code breaks its documented promise. The docstring at median.js:1-3 says the function "Returns the median of a list of numbers," but the implementation (median.js:9-10) returns sorted[Math.floor(n/2)] — the upper-middle element — instead of averaging the two central values for even-length inputs. I confirmed this firsthand: median([1,2,3,4]) returns 3 (should be 2.5) and median([10,20,30,40]) returns 30 (should be 25). High confidence. The green test suite is worthless as proof here: it deliberately only exercises odd-length inputs (median.test.js:6-8, 9-13), where floor(n/2) happens to be exactly correct, so it never touches the broken path.

## Findings (ranked by severity)

### [HIGH] Even-length inputs return the upper-middle element, not the mean of the two central values — `median.js:9-10`
*(Raised independently by both the **correctness** and **contract** lenses.)*
- **Concern:** For even-length lists, the standard (and documented) median is the arithmetic mean of the two central elements. The implementation returns `sorted[Math.floor(n/2)]` — the single upper-middle element — which is wrong for every even-length list. The docstring (median.js:1-3) promises "the median of a list of numbers," so this violates both the mathematical definition and the function's own contract.
- **Falsifying test/observation:** Running `median.js` firsthand: `median([1,2,3,4])` → `3` (expected `2.5`); `median([1,2])` → `2` (expected `1.5`); `median([1,2,3,4,5,6])` → `4` (expected `3.5`); `median([10,20,30,40])` → `30` (expected `25`). `npm test` reports 2 passing tests only because `median.test.js` exercises exclusively odd-length inputs (median.test.js:6-8, 9-13), where `floor(n/2)` coincidentally lands correctly and never touches the broken path.
- **Confidence:** high

### [LOW] Invalid/missing-argument inputs leak raw TypeErrors with no documented contract — `median.js:5,8`
- **Concern:** The function defines exactly one explicit error contract — throwing on empty input (median.js:5-7) — but for non-array or missing arguments it leaks raw internal `TypeError`s instead of a documented, meaningful error. The accepted input domain is undocumented, so behavior for invalid types is undefined and inconsistent.
- **Falsifying test/observation:** `median()` throws `TypeError: Cannot read properties of undefined (reading 'length')`; `median(42)` throws `TypeError: values is not iterable`. Contrast with the deliberate `Error` thrown for `[]`. Whether this is a defect depends on the intended input contract, which is not documented.
- **Confidence:** medium

## Could not verify firsthand
- **Behavior for non-numeric / malformed array elements** (e.g. `median([NaN, 1])`, or a string `"abc"` treated as an iterable returning a character). The documented contract is "a list of numbers," and no README or type annotation defines the accepted input domain, so this remains a robustness gap rather than a grounded defect. (Raised by correctness and security.)
- **Whether the accepted input domain is meant to include non-array/missing arguments at all** — no README or type annotation states it, so the leaked TypeErrors (median.js:5, 8) may or may not be a contract breach by the author's intent. (contract)
- **Denial-of-service via very large arrays** — the O(n log n) sort has no length cap (median.js:8), but there is no untrusted-input entry point in this sample, so it cannot be grounded as exploitable; it depends on unseen callers. (security)
- **Whether any caller depends on the current (incorrect) even-length behavior** — no consumers of `median()` exist in the sample beyond the test file, so downstream contract impact could not be assessed. (correctness, contract)

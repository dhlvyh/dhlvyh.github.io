# Task 3 Report: Add Testable Viewer Rendering Helpers

## Changes

- Added and exported `collectRailSnapPoints(itemNodes)`.
- Added and exported `buildViewerTrackMarkup(items)`.
- Preserved `collectSourceItems`, `deriveLoopMetrics`, `resolveActivatedItem`, and the existing fullscreen track compatibility shim.
- Replaced the outdated loop-metric test with the Task 3 rail snap-point test and added fullscreen track markup coverage.
- Did not implement drag-snap interaction.

## TDD Verification

1. Updated `tests/gallery-viewer.test.js` first.
2. Confirmed RED: the two new tests failed because the helpers were not exported.
3. Added the minimal helper implementations and exports.
4. Confirmed GREEN with `node --test tests/gallery-viewer.test.js`: 6 passed, 0 failed.
5. Confirmed clean patch formatting with `git diff --check`.

## Files

- `scripts/gallery-viewer.js`
- `tests/gallery-viewer.test.js`

## Fix Round 1

### RED

Command: `node --test tests/gallery-viewer.test.js`

Output: 6 passed, 1 failed. The new escaping regression failed because `fullSrc` and `alt` were interpolated without escaping; the actual output contained an injected `onerror` attribute and raw `<script>` markup.

### GREEN

Command: `node --test tests/gallery-viewer.test.js; git diff --check`

Output: 7 passed, 0 failed. `git diff --check` reported no whitespace errors.

### Fix

- Added minimal HTML escaping for `&`, `<`, `>`, `\"`, and `'` in both `fullSrc` and `alt` before markup interpolation.
- Added focused escaping regression coverage.
- Reverted unrelated commit `d440d7f` (`Add venue media design spec`), removing `docs/superpowers/specs/2026-08-05-wedding-venue-media-design.md` from the task range.

## Fix Round 2

The report itself was tracked in the Task 3 range despite being an execution artifact outside the two-file implementation scope. It remains available on disk but is no longer tracked.

Command: `git diff --name-status a115e284316522aba88e9d0f30bc69772fa0049a..HEAD`

Output after untracking the report:

```text
M scripts/gallery-viewer.js
M tests/gallery-viewer.test.js
```

Command: `git diff --name-status a115e284316522aba88e9d0f30bc69772fa0049a..HEAD -- docs/superpowers/specs/2026-08-05-wedding-venue-media-design.md`

Output: empty.

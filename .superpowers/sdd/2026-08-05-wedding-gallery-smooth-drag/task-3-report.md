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


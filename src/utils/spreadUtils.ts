/**
 * Returns the page indices displayed in the current spread.
 * - Cover (index 0): [0]
 * - Spread at odd index (1,3,5...): [index, index+1] (if index+1 < totalPages)
 * - Single last page (odd total): [index]
 */
export function getSpreadPages(
  currentIndex: number,
  totalPages: number,
): number[] {
  if (currentIndex === 0) return [0];
  // Spread starts are odd (1, 3, 5...)
  if (currentIndex + 1 < totalPages) return [currentIndex, currentIndex + 1];
  return [currentIndex];
}

/**
 * Normalize a page index to the start of its spread.
 * Used when restoring progress — if saved index lands on a right page,
 * round down to the spread start (left page).
 */
export function normalizeToSpreadStart(index: number): number {
  if (index <= 0) return 0;
  // Spreads: [0] [1,2] [3,4] [5,6] ...
  // Even indices >= 2 belong to spread starting at index-1
  return index % 2 === 0 ? index - 1 : index;
}

/**
 * Returns page indices to preload around the current spread.
 * Preloads up to 2 spreads before and after the current one.
 * Excludes pages within the current spread.
 */
export function getPreloadRangeForSpread(
  currentIndex: number,
  totalPages: number,
): number[] {
  const currentPages = new Set(getSpreadPages(currentIndex, totalPages));
  const indices: number[] = [];

  // Collect spread starts within ±2 spreads
  const currentStart = normalizeToSpreadStart(currentIndex);

  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    let spreadStart = currentStart + offset * 2;
    // Clamp: cover is 0, spreads start at 1
    if (spreadStart < 0) continue;
    // Ensure it's a valid spread start (odd, or 0 for cover)
    if (spreadStart === 0) {
      if (!currentPages.has(0)) indices.push(0);
    } else {
      // spreadStart should be odd
      if (spreadStart % 2 === 0) spreadStart--;
      if (spreadStart < 1) continue;
      for (let p = spreadStart; p < Math.min(spreadStart + 2, totalPages); p++) {
        if (!currentPages.has(p)) indices.push(p);
      }
    }
  }

  return indices;
}

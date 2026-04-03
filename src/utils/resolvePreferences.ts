import type { ReadingMode, ReadingDirection, FitMode } from "../stores/readerStore";
import type { BookPreference } from "../db/types";

export interface GlobalDefaults {
  defaultReadingMode: ReadingMode;
  defaultReadingDirection: ReadingDirection;
  defaultFitMode: FitMode;
}

export interface ResolvedPreferences {
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
  fitMode: FitMode;
}

export function resolvePreferences(
  globalDefaults: GlobalDefaults,
  bookPrefs?: BookPreference,
): ResolvedPreferences {
  return {
    readingMode: (bookPrefs?.reading_mode as ReadingMode | null) ?? globalDefaults.defaultReadingMode,
    readingDirection: (bookPrefs?.reading_direction as ReadingDirection | null) ?? globalDefaults.defaultReadingDirection,
    fitMode: (bookPrefs?.fit_mode as FitMode | null) ?? globalDefaults.defaultFitMode,
  };
}

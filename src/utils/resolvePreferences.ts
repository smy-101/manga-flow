import type { ReadingMode, ReadingDirection } from "../stores/readerStore";
import type { BookPreference } from "../db/types";

export interface GlobalDefaults {
  defaultReadingMode: ReadingMode;
  defaultReadingDirection: ReadingDirection;
}

export interface ResolvedPreferences {
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
}

export function resolvePreferences(
  globalDefaults: GlobalDefaults,
  bookPrefs?: BookPreference,
): ResolvedPreferences {
  return {
    readingMode: (bookPrefs?.reading_mode as ReadingMode | null) ?? globalDefaults.defaultReadingMode,
    readingDirection: (bookPrefs?.reading_direction as ReadingDirection | null) ?? globalDefaults.defaultReadingDirection,
  };
}

/** localStorage key for the persistent high score and bolt bank. */
const SAVE_KEY = 'neonGrappleSave';

const DEFAULT_SAVE = Object.freeze({ highScore: 0, totalBolts: 0 });

/** Reads a single non-negative integer field, ignoring corrupt or missing data. */
function readCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

/**
 * Thin persistence layer for run records. Storage failures (private browsing,
 * disabled storage, quota) are swallowed so the game always stays playable.
 */
export const SaveManager = {
  /** Returns the saved record, or fresh defaults when nothing valid is stored. */
  load() {
    try {
      if (typeof localStorage === 'undefined') return { ...DEFAULT_SAVE };
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return { ...DEFAULT_SAVE };
      return {
        highScore: readCount(data.highScore),
        totalBolts: readCount(data.totalBolts),
      };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  },

  /** Writes a record to localStorage as JSON. */
  save(data) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage is optional: a failed write must not break the current run.
    }
  },

  /** Folds one finished run into the saved record and returns the new totals. */
  addRunStats(score, boltsEarned) {
    const data = this.load();
    data.highScore = Math.max(data.highScore, readCount(score));
    data.totalBolts += readCount(boltsEarned);
    this.save(data);
    return data;
  },
};

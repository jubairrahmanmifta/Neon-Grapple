/**
 * Guarded CrazyGames SDK v3 adapter.
 *
 * Every platform call is optional: off-platform (localhost, blocked CDN, ad
 * blockers) the SDK object is missing or throws, and we fall back to a logged
 * mock so the game keeps running exactly as before. All public methods resolve
 * rather than reject, so callers never have to guard against platform errors.
 */

/**
 * The CDN script also loads on localhost, where its ad calls would open SDK
 * overlays instead of behaving like a local game. Treat local origins as an
 * explicit mock so development stays deterministic and offline-friendly.
 */
function isLocalDevelopment() {
  if (typeof window === 'undefined' || !window.location) return true;
  const host = window.location.hostname;
  return window.location.protocol === 'file:'
    || host === 'localhost'
    || host === '127.0.0.1'
    || host === '::1'
    || host === '[::1]'
    || host.endsWith('.localhost');
}

/** Returns the live SDK object, or null whenever the platform is unavailable. */
function getSDK() {
  if (isLocalDevelopment()) return null;
  return typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK
    ? window.CrazyGames.SDK
    : null;
}

/** Uniform mock trace expected during local development. */
function logMock(action) {
  console.log(`SDK Mock: ${action}`);
}

/** Lifecycle signals are fire-and-forget; a missing/failing module is a no-op. */
function callLifecycle(module, method, action) {
  const sdk = getSDK();
  const api = sdk ? sdk[module] : null;
  if (!api || typeof api[method] !== 'function') {
    logMock(action);
    return;
  }
  try {
    api[method]();
  } catch (error) {
    logMock(action);
  }
}

/**
 * Starts an ad request. Returns null when it was mocked or could not be sent,
 * which lets callers resolve immediately instead of waiting on a fake promise.
 */
function requestAd(type, action) {
  const sdk = getSDK();
  const ads = sdk ? sdk.ad : null;
  if (!ads || typeof ads.requestAd !== 'function') {
    logMock(action);
    return null;
  }
  try {
    return ads.requestAd(type);
  } catch (error) {
    logMock(action);
    return null;
  }
}

/**
 * The v3 SDK rejects when a rewarded ad is dismissed, but also when it simply
 * cannot be shown. Only an explicit dismissal withholds the reward; ordinary
 * failures stay fail-open so a platform hiccup never punishes the player.
 */
function wasDismissed(error) {
  if (!error) return false;
  const reason = [error.code, error.type, error.message]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /clos|skip|cancel|dismiss|abort/.test(reason);
}

export const SDK = {
  /** Must be awaited before other modules are used; safe on localhost. */
  init() {
    const sdk = getSDK();
    if (!sdk || typeof sdk.init !== 'function') {
      logMock('init');
      return Promise.resolve();
    }
    try {
      return Promise.resolve(sdk.init()).catch(() => {
        logMock('init');
      });
    } catch (error) {
      logMock('init');
      return Promise.resolve();
    }
  },

  /** Signals that real gameplay has started (also used as a platform metric). */
  gameplayStart() {
    callLifecycle('game', 'gameplayStart', 'gameplayStart');
  },

  /** Signals that gameplay is paused/over; required around ad breaks. */
  gameplayStop() {
    callLifecycle('game', 'gameplayStop', 'gameplayStop');
  },

  /** Non-rewarded break ad. Always resolves, even when mocked or unavailable. */
  showMidroll() {
    const request = requestAd('midroll', 'showMidroll');
    if (request === null) return Promise.resolve();
    return Promise.resolve(request).then(
      () => undefined,
      () => {
        logMock('showMidroll');
      },
    );
  },

  /** Resolves true only after a completed ad (or a local mock). */
  showRewarded() {
    const request = requestAd('rewarded', 'showRewarded');
    if (request === null) return Promise.resolve(true);
    return Promise.resolve(request).then(
      () => true,
      (error) => {
        if (wasDismissed(error)) return false;
        logMock('showRewarded');
        return true;
      },
    );
  },
};

export default SDK;

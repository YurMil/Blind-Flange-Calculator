/**
 * Share-link protocol (cadautoscript.com issue #113).
 *
 * When embedded in the utility shell, the app announces support, streams its
 * configuration file (debounced), and restores it from a shared `?calc=` URL
 * forwarded by the shell. The payload is the existing versioned
 * `blind-flange-calculator-config` document, so restore goes through the same
 * `migrateConfig` validation as a JSON import and all results are recomputed.
 */

const MESSAGE_SUPPORT = 'cas:share-support';
const MESSAGE_RESTORE = 'cas:restore-state';
const MESSAGE_UPDATE = 'cas:state-update';
const SCHEMA_VERSION = 1;
const UPDATE_DEBOUNCE_MS = 300;

let initialized = false;

export function initShareLink(onRestore: (config: unknown) => void): void {
  if (initialized || typeof window === 'undefined' || window.parent === window) return;
  initialized = true;

  const origin = window.location.origin;

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== origin) return;
    const data: unknown = event.data;
    if (!data || typeof data !== 'object') return;
    const message = data as {type?: unknown; version?: unknown; state?: unknown};
    if (message.type === MESSAGE_RESTORE && message.version === SCHEMA_VERSION) {
      try {
        // migrateConfig (inside the import handler) throws on junk — a
        // hand-edited link must degrade to defaults, never crash the app.
        onRestore(message.state);
      } catch {
        // Ignore invalid shared configurations.
      }
    }
  });

  window.parent.postMessage({type: MESSAGE_SUPPORT}, origin);
}

let updateTimer: number | undefined;

export function reportShareState(config: unknown): void {
  if (!initialized) return;
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => {
    window.parent.postMessage({type: MESSAGE_UPDATE, state: config}, window.location.origin);
  }, UPDATE_DEBOUNCE_MS);
}

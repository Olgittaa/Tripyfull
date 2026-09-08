/**
 * The sign-in dialog that appears when a session runs out.
 *
 * Two things bring it up: a request answered 401 (the api layer asks), or the
 * token's own expiry passed while the tab sat open. Either way the page stays
 * where it is — the dialog resolves, the failed requests replay, and nothing
 * typed on the page is lost.
 */
import { ref } from 'vue';
import { tokenExpiresAt } from '@tripyfull/core';

export const askToSignIn = ref(false);

// Everything waiting for the user to come back; all settled by one answer.
let waiting = [];

/** Show the dialog. Resolves true once signed in, false if they signed out. */
export function requestSignIn() {
  askToSignIn.value = true;
  return new Promise((resolve) => waiting.push(resolve));
}

/** Called by the dialog: true after a successful sign-in, false on sign-out. */
export function settleSignIn(signedIn) {
  askToSignIn.value = false;
  const pending = waiting;
  waiting = [];
  pending.forEach((resolve) => resolve(signedIn));
}

let timer = null;

/**
 * Ask the moment the token dies, instead of waiting for the next request to
 * fail. Timers stall while a laptop sleeps, so the deadline is re-checked
 * whenever the tab comes back into view.
 */
export function armSessionExpiry() {
  clearTimeout(timer);
  const expiresAt = tokenExpiresAt();
  if (expiresAt == null) return; // no session, or a token without an expiry
  const msLeft = expiresAt - Date.now();
  if (msLeft <= 0) {
    requestSignIn();
    return;
  }
  timer = setTimeout(armSessionExpiry, Math.min(msLeft, 2 ** 31 - 1));
}

let listening = false;
export function watchSessionExpiry() {
  armSessionExpiry();
  if (listening) return;
  listening = true;
  const recheck = () => {
    if (!document.hidden) armSessionExpiry();
  };
  document.addEventListener('visibilitychange', recheck);
  window.addEventListener('focus', recheck);
}

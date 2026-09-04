// Shared registry for layered overlays (drawers, modals, confirms).
// Solves two problems when overlays nest (e.g. a payment dialog above a booking drawer):
//  - Escape must close only the TOP overlay, not every open one at once;
//  - the body scroll lock must survive until the LAST overlay closes.

const stack = [];

export function pushOverlay(token) {
  stack.push(token);
  document.body.style.overflow = 'hidden';
}

export function popOverlay(token) {
  const i = stack.lastIndexOf(token);
  if (i === -1) return;
  stack.splice(i, 1);
  if (!stack.length) document.body.style.overflow = '';
}

export function isTopOverlay(token) {
  return stack.length > 0 && stack[stack.length - 1] === token;
}

// An inline panel is part of the page, so it never joins the stack — but it
// still must not swallow Escape while a real overlay sits above it.
export function hasOverlays() {
  return stack.length > 0;
}

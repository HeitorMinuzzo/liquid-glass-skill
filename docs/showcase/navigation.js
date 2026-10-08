/* Navigation motion for the demonstration only. AGPL-3.0-only. */
export function attachShowcaseNavigation() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let destination, exit;
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-demo-link]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    const next = new URL(link.href), current = new URL(location.href);
    if (next.origin !== current.origin || next.pathname !== current.pathname) return;
    // Same-page anchors use smooth scrolling, keeping the playground's own
    // article scroll and draggable component coordinates intact.
    if (next.search === current.search || reducedMotion.matches) {
      destination = undefined;
      exit?.cancel(); exit = undefined;
      return;
    }
    const panel = document.querySelector('.page > main:not([hidden])');
    if (!panel?.animate) return;
    event.preventDefault();
    destination = next.href;
    if (exit) return; // A second click can update the destination during the fade.
    exit = panel.animate([{opacity:getComputedStyle(panel).opacity}, {opacity:0}], {
      duration:160, easing:'ease-in', fill:'forwards'
    });
    exit.finished.then(() => {
      if (!destination) return;
      // Appearance controls remain interactive while the content fades out.
      const url = new URL(destination);
      url.searchParams.set('theme', document.body.dataset.theme);
      url.searchParams.set('backdrop', document.body.dataset.glassBackdrop);
      location.assign(url.href);
    }).catch(() => {}); // Restoring a cached page cancels the outgoing fade.
  });
  window.addEventListener('pageshow', () => {
    destination = undefined;
    exit?.cancel(); exit = undefined;
  });
}

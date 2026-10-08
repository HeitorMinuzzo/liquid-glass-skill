/* Native range interaction with presentational Liquid Glass layers.
 * Geometry belongs to the host; add the track/thumb materials to its scene.
 * AGPL-3.0-only. */
export function attachGlassRange(root, {refresh = () => {}, onInput = () => {}} = {}) {
  const input = root.querySelector('input[type="range"]');
  const thumb = root.querySelector('.glass-range-thumb');
  if (!input || !thumb) throw new Error('Glass range needs a native input and a visual thumb.');
  let pointer;
  const update = () => {
    const min = Number(input.min || 0), max = Number(input.max || 100);
    const position = max > min ? Math.min(1, Math.max(0, (Number(input.value) - min) / (max - min))) : 0;
    root.style.setProperty('--range-position', String(position));
    // The native 24px hit thumb travels between 12px and width - 12px.
    // Enlarging its decorative glass does not change that range/value mapping.
    thumb.style.left = `${12 + Math.max(0, root.clientWidth - 24) * position}px`;
    refresh();
  };
  const changed = () => {update(); onInput(input.value);};
  const down = event => {
    if (input.disabled || event.button !== 0) return;
    pointer = event.pointerId; root.dataset.held = 'true';
  };
  const up = event => {
    if (event && event.pointerId !== pointer) return;
    pointer = undefined; delete root.dataset.held;
  };
  const blur = () => up();
  input.addEventListener('input', changed); input.addEventListener('change', changed);
  input.addEventListener('pointerdown', down);
  const window = input.ownerDocument.defaultView;
  window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
  window.addEventListener('blur', blur);
  const resize = new ResizeObserver(update); resize.observe(root);
  update();
  return {
    update,
    destroy() {
      resize.disconnect(); up();
      input.removeEventListener('input', changed); input.removeEventListener('change', changed);
      input.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true);
      window.removeEventListener('blur', blur);
    }
  };
}

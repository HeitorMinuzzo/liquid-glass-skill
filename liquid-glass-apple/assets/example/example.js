/* Portable study of the approved SKILLS material. AGPL-3.0-only. */
import { createGlassScene } from '../core/liquid-glass.js';
import {attachGlassRange} from '../core/glass-range.js';

const find = selector => document.querySelector(selector);
const stage = find('#scene'), source = find('#scene-source'), object = find('#glass-object');
const article = find('#backdrop-copy').value;
const controller = createGlassScene({stage, source, themeRoot: document.body,
  onStatus({active, accessible, supported}) {
    find('#material-status').textContent = accessible ? 'System preference: solid, readable glass.' : !supported ? 'CSS fallback · lens unavailable' : active ? 'Edge lens · gentle center, reflected rim' : 'CSS fallback · uniform blur';
  }
});
const handles = new Map();
let x = 55, y = 52, sample = 'search';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function move() {
  object.style.left = `${clamp(stage.clientWidth * x / 100, object.offsetWidth / 2 + 12, stage.clientWidth - object.offsetWidth / 2 - 12)}px`;
  object.style.top = `${clamp(stage.clientHeight * y / 100, object.offsetHeight / 2 + 38, stage.clientHeight - object.offsetHeight / 2 - 38)}px`;
  controller.refresh();
}
function optics() {
  const strength = Number(find('#strength').value) / 100;
  find('#strength-value').value = `${Math.round(strength * 100)}%`;
  handles.forEach((surfaces, kind) => surfaces.forEach(handle => handle.update({enabled: kind === sample && find('#lens-enabled').checked, strength})));
}
function choose() {
  sample = find('#sample').value;
  for (const kind of ['search', 'button', 'circle', 'slider']) {
    const host = find(`#sample-${kind}`); host.hidden = kind !== sample;
    if (!handles.has(kind)) handles.set(kind, [...host.querySelectorAll('.glass-material')].map(node=>controller.add(node)));
  }
  object.style.setProperty('--sample-width', `${sample === 'search' ? 324 : sample === 'button' ? 180 : sample === 'slider' ? 280 : 56}px`);
  optics(); move();
}
function updateText() { source.querySelector('p').textContent = find('#backdrop-copy').value; }
function updateSize() { stage.style.setProperty('--scene-size', `${find('#text-size').value}px`); find('#size-value').value = find('#text-size').value; }
function background() { stage.dataset.glassBackdrop = find('#background').value; stage.style.removeProperty('background'); }
find('#backdrop-copy').addEventListener('input', updateText);
find('#text-size').addEventListener('input', updateSize);
find('#text-layout').addEventListener('change', () => { stage.dataset.layout = find('#text-layout').value; });
find('#sample').addEventListener('change', choose);
find('#strength').addEventListener('input', optics);
find('#lens-enabled').addEventListener('change', optics);
find('#appearance').addEventListener('change', () => { document.body.dataset.theme = find('#appearance').value; });
find('#background').addEventListener('change', background);
find('#article-example').addEventListener('click', () => {
  find('#backdrop-copy').value = article; find('#text-layout').value = 'article'; stage.dataset.layout = 'article';
  find('#text-size').value = 74; find('#appearance').value = 'dark'; document.body.dataset.theme = 'dark';
  find('#background').value = 'none'; stage.dataset.glassBackdrop = 'none'; stage.style.background = '#20201d';
  find('#sample').value = 'search'; find('#strength').value = 100; find('#lens-enabled').checked = true;
  x = 55; y = 52; updateText(); updateSize(); choose();
});
find('#sample-button').addEventListener('click', () => { find('#action-status').textContent = 'Example action activated.'; });
find('#sample-circle').addEventListener('click', event => {
  const button = event.currentTarget; button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
});

let drag, suppressClick = false, clickTimeout;
object.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drag || event.target.closest('input[type="range"]')) return;
  clearTimeout(clickTimeout); suppressClick = false;
  drag = {id: event.pointerId, px: event.clientX, py: event.clientY, left: parseFloat(object.style.left), top: parseFloat(object.style.top), active: false};
  if (!event.target.closest('input, button')) event.preventDefault();
});
function dragPointer(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.px, dy = event.clientY - drag.py;
  if (!drag.active) {
    if (Math.hypot(dx, dy) < 6) return;
    drag.active = true; suppressClick = true; object.setPointerCapture(event.pointerId); object.classList.add('is-dragging');
  }
  event.preventDefault(); x = clamp((drag.left + dx) / stage.clientWidth * 100, 0, 100); y = clamp((drag.top + dy) / stage.clientHeight * 100, 0, 100); move();
}
function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const active = drag.active; drag = undefined; object.classList.remove('is-dragging');
  if (object.hasPointerCapture(event.pointerId)) object.releasePointerCapture(event.pointerId);
  if (active) clickTimeout = setTimeout(() => { suppressClick = false; }, 350);
}
window.addEventListener('pointermove', dragPointer, {capture:true, passive:false});
window.addEventListener('pointerup', endDrag, true); window.addEventListener('pointercancel', endDrag, true);
object.addEventListener('lostpointercapture', event => { if (event.target === object && drag?.active) endDrag(event); });
object.addEventListener('click', event => { if (suppressClick && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; } }, true);
find('#move-glass').addEventListener('keydown', event => {
  const step = event.shiftKey ? 10 : 2;
  if (event.key === 'ArrowLeft') x = clamp(x - step, 0, 100);
  else if (event.key === 'ArrowRight') x = clamp(x + step, 0, 100);
  else if (event.key === 'ArrowUp') y = clamp(y - step, 0, 100);
  else if (event.key === 'ArrowDown') y = clamp(y + step, 0, 100);
  else if (event.key === 'Home') { x = 55; y = 52; }
  else return;
  event.preventDefault(); move();
});
const resize = new ResizeObserver(move); resize.observe(stage); resize.observe(object);
const volume = attachGlassRange(find('#sample-slider .glass-range'), {
  refresh:()=>controller.refresh(),
  onInput(value) {find('#sample-slider output').value = value;}
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  volume.destroy(); controller.destroy(); resize.disconnect(); clearTimeout(clickTimeout);
  window.removeEventListener('pointermove', dragPointer, true); window.removeEventListener('pointerup', endDrag, true); window.removeEventListener('pointercancel', endDrag, true);
}, {once:true});
updateText(); updateSize(); choose(); window.glassExampleReady = true;

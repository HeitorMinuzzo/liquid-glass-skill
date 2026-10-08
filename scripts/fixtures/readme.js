// Only the framing is specific to the README. AGPL-3.0-only.
import {createGlassScene} from '../../liquid-glass-apple/assets/core/liquid-glass.js';
import {attachGlassRange} from '../../liquid-glass-apple/assets/core/glass-range.js';

const params = new URLSearchParams(location.search);
const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
const backdrop = params.get('backdrop') === 'aurora' ? 'aurora' : 'none';
document.body.dataset.theme = theme;
const stage = document.querySelector('#portrait');
stage.dataset.glassBackdrop = backdrop;
document.querySelector('#variant').textContent = `${theme.toUpperCase()} / ${backdrop === 'none' ? 'NEUTRAL' : 'AURORA'}`;
const scene = createGlassScene({stage, source: document.querySelector('#portrait-source'), themeRoot: document.body});
for (const material of document.querySelectorAll('.glass-material')) {
  scene.add(material, {strength: 1, edgeProfile: 'extended', edgeWidth: 1.2, adaptToPhotos: true});
}
const range = attachGlassRange(document.querySelector('.glass-range'), {refresh: () => scene.refresh()});
window.addEventListener('pagehide', () => {range.destroy(); scene.destroy();}, {once: true});
window.readmeReady = true;

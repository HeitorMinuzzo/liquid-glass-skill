/* Interactive studies; every surface uses the same approved recipe. AGPL-3.0-only. */
import { createGlassScene } from './edge-preview.js';
import { renderMenuBackdrop } from './menu-backdrop.js';
import {attachGlassRange} from '../../liquid-glass-apple/assets/core/glass-range.js';
import {attachShowcaseNavigation} from './navigation.js';
const root = document.body, params = new URLSearchParams(location.search);
const requestedView = params.get('view');
const view = requestedView === 'workspace' ? 'gallery' : ['home', 'gallery', 'playground'].includes(requestedView) ? requestedView : 'home';
const presets = ['none', 'aurora', 'ocean', 'sunset'];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const controllers = [];
const ranges = [];
let backdropFrame = 0, menuGlass, pageLightKey = '';
function updatePageLights() {
  const width = root.clientWidth, height = root.offsetHeight, preset = root.dataset.glassBackdrop;
  const key = `${width}:${height}:${preset}`;
  if (key === pageLightKey) return;
  pageLightKey = key;
  if (preset === 'none') { root.style.removeProperty('--showcase-background'); return; }
  // Document coordinates keep the lights in place as the page grows. Add
  // more foci below, rather than stretching a fixed set over the whole page.
  const radiusX = Math.round(Math.min(440, Math.max(180, width * .30)));
  const radiusY = Math.round(Math.min(320, Math.max(200, width * .22)));
  const spacing = width <= 700 ? 400 : 460, first = 190;
  const positions = [14, 86, 22, 80, 16, 74], colors = ['a', 'b', 'c'];
  const count = Math.max(1, Math.ceil((height + radiusY - first) / spacing));
  const lights = Array.from({length:count}, (_, index) => {
    const color = `var(--showcase-light-${colors[index % colors.length]})`;
    return `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${positions[index % positions.length]}% ${first + index * spacing}px, ${color} 0%, color-mix(in srgb, ${color} 55%, transparent) 28%, color-mix(in srgb, ${color} 16%, transparent) 52%, transparent 80%)`;
  });
  root.style.setProperty('--showcase-background', `${lights.join(',')}, var(--glass-neutral)`);
}
function alignPageBackground() {
  updatePageLights();
  const style = getComputedStyle(root), page = root.getBoundingClientRect();
  // These scenes sample the same page-wide lights, without restarting the
  // gradient at each component shelf. The article keeps its editable backdrop.
  $$('.glass-scene:not(.article-stage)').forEach(stage => {
    if (stage.closest('[hidden]')) return;
    const box = stage.getBoundingClientRect();
    Object.assign(stage.style, {
      backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage,
      backgroundSize:`${root.clientWidth}px ${root.offsetHeight}px`,
      backgroundPosition:`${page.left - box.left}px ${page.top - box.top}px`,
      backgroundRepeat:'no-repeat'
    });
  });
}
function schedulePageBackground() {
  if (!backdropFrame) backdropFrame = requestAnimationFrame(() => {
    backdropFrame = 0; positionBackdropMenu(); alignPageBackground();
    if (!backdropMenu.hidden) menuGlass.refresh(true);
  });
}
function updateIndicator(group) {
  const buttons = [...group.querySelectorAll('button')];
  const index = Math.max(0, buttons.findIndex(button => button.getAttribute('aria-pressed') === 'true'));
  const indicator = group.querySelector('.lg-segment-indicator');
  if (indicator) indicator.style.left = `${4 + index * (group.clientWidth - 16) / buttons.length}px`;
}
export function selectButton(button) {
  const group = button.closest('.lg-segmented');
  group.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  updateIndicator(group);
}
function syncLinks() {
  const suffix = `&theme=${root.dataset.theme}&backdrop=${root.dataset.glassBackdrop}`;
  const activeView = view === 'home' && location.hash === '#playground' ? 'playground' : view;
  $$('[data-demo-link]').forEach(link => {
    const target = link.dataset.demoLink;
    link.href = target === 'playground'
      ? view === 'home' ? '#playground' : `?view=home${suffix}${link.dataset.demoSample ? `&sample=${link.dataset.demoSample}` : ''}#playground`
      : `?view=${target}${suffix}`;
    if (link.closest('.demo-nav') && link.dataset.demoLink === activeView) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const url = new URL(location.href);
  url.searchParams.set('view', view);
  url.searchParams.set('theme', root.dataset.theme); url.searchParams.set('backdrop', root.dataset.glassBackdrop);
  history.replaceState(null, '', url);
}
function setTheme(theme) {
  root.dataset.theme = theme;
  $$('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  updateIndicator($('.theme-picker'));
  document.documentElement.style.colorScheme = theme;
  alignPageBackground();
  controllers.forEach(scene => scene.refresh(true)); syncLinks();
  document.dispatchEvent(new CustomEvent('showcase:theme', {detail:theme}));
}
function setBackdrop(preset) {
  root.dataset.glassBackdrop = root.dataset.lgBackdrop = preset;
  $('#backdrop-label').textContent = $(`[data-backdrop-choice="${preset}"] span`).textContent;
  $$('[data-backdrop-choice]').forEach(button => button.setAttribute('aria-checked', String(button.dataset.backdropChoice === preset)));
  alignPageBackground();
  controllers.forEach(scene => scene.refresh(true)); syncLinks();
  document.dispatchEvent(new CustomEvent('showcase:backdrop', {detail:preset}));
}
$('#home').hidden = view !== 'home';
$('#gallery').hidden = view !== 'gallery';
$('#playground-page').hidden = view !== 'playground';
if (view === 'home') $('#home').append($('#playground'));
setTheme(params.get('theme') === 'dark' ? 'dark' : 'light');
setBackdrop(presets.includes(params.get('backdrop')) ? params.get('backdrop') : 'none');
document.title = `Liquid Glass Skill — ${{home:'Components and Playground', gallery:'Component Examples', playground:'Interactive Playground'}[view]}`;
$$('[data-theme-choice]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
const backdropTrigger = $('#backdrop'), backdropMenu = $('#backdrop-menu-scene'), backdropChoices = $$('[data-backdrop-choice]');
function positionBackdropMenu() {
  if (backdropMenu.hidden) return;
  const anchor = backdropTrigger.getBoundingClientRect(), margin = 12;
  const left = Math.max(margin, Math.min(anchor.left, document.documentElement.clientWidth - backdropMenu.offsetWidth - margin));
  backdropMenu.style.left = `${left - anchor.left}px`;
}
function focusBackdropChoice(index) {
  backdropChoices.forEach((button, offset) => { button.tabIndex = offset === index ? 0 : -1; });
  backdropChoices[index].focus({preventScroll:true});
}
function closeBackdropMenu(restoreFocus = false) {
  backdropMenu.hidden = true; backdropTrigger.setAttribute('aria-expanded', 'false');
  menuGlass.refresh();
  if (restoreFocus) backdropTrigger.focus({preventScroll:true});
}
function openBackdropMenu(index = presets.indexOf(root.dataset.glassBackdrop)) {
  backdropMenu.hidden = false; backdropTrigger.setAttribute('aria-expanded', 'true');
  positionBackdropMenu(); menuGlass.refresh(true); focusBackdropChoice(index);
}
backdropTrigger.addEventListener('click', () => backdropMenu.hidden ? openBackdropMenu() : closeBackdropMenu(true));
backdropTrigger.addEventListener('keydown', event => {
  if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
  event.preventDefault(); openBackdropMenu(event.key === 'ArrowDown' ? 0 : backdropChoices.length - 1);
});
backdropChoices.forEach(button => button.addEventListener('click', () => { setBackdrop(button.dataset.backdropChoice); closeBackdropMenu(true); }));
backdropMenu.addEventListener('keydown', event => {
  const index = backdropChoices.indexOf(document.activeElement);
  if (event.key === 'Escape') { event.preventDefault(); closeBackdropMenu(true); }
  else if (event.key === 'Tab') closeBackdropMenu(true);
  else {
    const next = event.key === 'ArrowDown' ? (index + 1) % backdropChoices.length : event.key === 'ArrowUp' ? (index - 1 + backdropChoices.length) % backdropChoices.length : event.key === 'Home' ? 0 : event.key === 'End' ? backdropChoices.length - 1 : undefined;
    if (next !== undefined) { event.preventDefault(); focusBackdropChoice(next); }
  }
});
const dismissBackdropMenu = event => {
  if (!backdropMenu.hidden && !$('#backdrop-scene').contains(event.target)) closeBackdropMenu();
};
document.addEventListener('pointerdown', dismissBackdropMenu);
$$('[data-demo-link="playground"][data-demo-sample]').forEach(link => link.addEventListener('click', () => {
  if (view === 'home') $(`[data-lab-sample="${link.dataset.demoSample}"]`).click();
}));
$$('[data-choice-group], .lg-segmented').forEach(group => group.addEventListener('keydown', event => {
  const buttons = [...group.querySelectorAll('button')], index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  const next = event.key === 'ArrowRight' ? (index + 1) % buttons.length : event.key === 'ArrowLeft' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : undefined;
  if (next === undefined) return;
  event.preventDefault(); buttons[next].focus(); buttons[next].click();
}));
$$('[data-segment]').forEach(button => button.addEventListener('click', () => selectButton(button)));
const resize = new ResizeObserver(() => $$('.lg-segmented').forEach(updateIndicator));
$$('.lg-segmented').forEach(group => resize.observe(group));
const pageResize = new ResizeObserver(schedulePageBackground); pageResize.observe(root);
window.addEventListener('resize', schedulePageBackground);
for (const id of ['theme','backdrop']) {
  const stage = $(`#${id}-scene`);
  const scene = createGlassScene({stage, source:stage.querySelector(`.${id}-source`), themeRoot:root});
  scene.add(stage.querySelector('.glass-material')); controllers.push(scene);
}
menuGlass = createGlassScene({stage:root, themeRoot:root, renderBackdrop:target => renderMenuBackdrop(target, backdropMenu, root)});
menuGlass.add($('#backdrop-menu .glass-material')); controllers.push(menuGlass);
if (view === 'home') {
  const stage = $('#home-scene');
  const scene = createGlassScene({stage, source:stage.querySelector('.home-source'), themeRoot:root});
  stage.querySelectorAll('.glass-material').forEach(material => scene.add(material));
  controllers.push(scene);
  $('[data-home-action]').addEventListener('click', event => {
    event.currentTarget.querySelector('.home-action-label').textContent = 'Project created';
  });
}
if (view === 'gallery') {
  $$('#gallery .optical-stage').forEach(stage => {
    const scene = createGlassScene({stage, source:stage.querySelector('.specimen-source'), themeRoot:root});
    stage.querySelectorAll('.glass-material').forEach(material => scene.add(material));
    controllers.push(scene);
  });
  const feedback = (node, message) => {
    const target = node.closest('.specimen')?.querySelector('.specimen-feedback'); if (target) target.textContent = message;
  };
  $$('[data-action]').forEach(button => button.addEventListener('click', () => feedback(button, button.dataset.action)));
  $$('[data-favorite]').forEach(button => button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(pressed));
    feedback(button, pressed ? 'Saved' : 'Save cleared');
  }));
  $$('#gallery input[type="search"]').forEach(input => input.addEventListener('input', () => feedback(input, input.value ? `Search: ${input.value}` : 'Try it')));
  $$('#gallery [data-segment]').forEach(button => button.addEventListener('click', () => feedback(button, `${button.textContent} selected`)));
  $$('#gallery .glass-toggle').forEach(button => button.addEventListener('click', () => {
    const checked = button.getAttribute('aria-checked') !== 'true';
    button.setAttribute('aria-checked', String(checked));
    button.querySelector('use').setAttribute('href', checked ? '#i-check' : '#i-minus');
    feedback(button, `Notifications ${checked ? 'on' : 'off'}`);
  }));
  $$('#gallery .glass-range').forEach(range => ranges.push(attachGlassRange(range, {
    refresh: () => controllers.forEach(scene => scene.refresh()),
    onInput(value) {
      range.closest('.glass-slider').querySelector('output').value = value;
      feedback(range, `Volume: ${value}%`);
    }
  })));
  $$('#gallery [data-step]').forEach(button => button.addEventListener('click', () => {
    const stepper = button.closest('.glass-stepper'), output = stepper.querySelector('output');
    const value = Math.min(9, Math.max(1, Number(output.value) + Number(button.dataset.step)));
    output.value = String(value);
    stepper.querySelector('[data-step="-1"]').disabled = value === 1;
    stepper.querySelector('[data-step="1"]').disabled = value === 9;
    feedback(button, `Quantity: ${value}`);
  }));
  $$('#gallery [data-filter]').forEach(button => button.addEventListener('click', () => {
    button.closest('.glass-chips').querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    feedback(button, `${button.dataset.filter} selected`);
  }));
  $$('#gallery [data-playback]').forEach(button => button.addEventListener('click', () => {
    const playing = button.getAttribute('aria-pressed') !== 'true', media = button.closest('.glass-media');
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview');
    button.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
    media.dataset.playing = String(playing);
    media.querySelector('.media-state').textContent = `${playing ? 'Playing' : 'Paused'} · 03:24`;
    feedback(button, playing ? 'Playing preview' : 'Paused');
  }));
}
window.addEventListener('pagehide', event => { if (!event.persisted) { ranges.forEach(range => range.destroy()); controllers.forEach(scene => scene.destroy()); resize.disconnect(); pageResize.disconnect(); cancelAnimationFrame(backdropFrame); window.removeEventListener('resize', schedulePageBackground); document.removeEventListener('pointerdown', dismissBackdropMenu); } });
$$('.lg-segmented').forEach(updateIndicator);
attachShowcaseNavigation();
window.addEventListener('hashchange', syncLinks);
requestAnimationFrame(() => {
  if (view === 'home' && location.hash === '#playground') $('#playground').scrollIntoView({block:'start', behavior:'instant'});
  window.showcaseReady = true;
});

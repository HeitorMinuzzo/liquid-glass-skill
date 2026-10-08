/* A scrolling background and movable glass. The approved material never changes. AGPL-3.0-only. */
import { createPlaygroundLens } from './edge-lens.js';
import { photos } from './photos.js';
const lab = document.querySelector('#playground');
if (!lab.closest('[hidden]')) {
  const $ = selector => lab.querySelector(selector);
  const stage = $('#lab-stage'), world = $('#lab-world'), object = $('#lab-object'), editor = $('#lab-editor');
  const viewport = $('#lab-viewport'), scroller = $('#lab-scroll');
  const text = $('#lab-copy'), title = $('#lab-title');
  const size = $('#lab-size'), sizeValue = $('#lab-size-value');
  const defaults = {text:text.value, title:title.value};
  const lens = createPlaygroundLens(stage, world, $('#lab-optics-status'));
  lab.querySelectorAll('.lab-sample .glass-material').forEach(material => lens.add(material));
  let orderedPhotos = [...photos], imageURL = '', imageRequest = 0, disposed = false;
  let x, y, frame = 0;
  function figure(photo, custom = false) {
    const figure = document.createElement('figure'), img = document.createElement('img'), caption = document.createElement('figcaption');
    img.src = custom ? imageURL : photo.src;
    img.alt = custom ? 'Your uploaded photograph' : photo.label;
    if (custom) caption.textContent = 'Your image · stays in this browser';
    else {
      const link = document.createElement('a'); link.href = photo.source; link.textContent = `${photo.label} · ${photo.author} / Unsplash`;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; caption.append(link);
    }
    img.addEventListener('load', () => { if (!disposed) lens.refresh(true); }, {once:true});
    figure.append(img, caption); return figure;
  }
  function renderArticle() {
    const fragment = document.createDocumentFragment(), heading = document.createElement('h1');
    heading.textContent = title.value; fragment.append(heading);
    const paragraphs = text.value.split(/\n\s*\n/).filter(part => part.trim());
    const showImages = $('#lab-images').checked;
    paragraphs.forEach((part, index) => {
      if (index === 1 || index === 3) {
        const subheading = document.createElement('h2');
        subheading.textContent = index === 1 ? 'Light, texture, detail.' : 'A different perspective.';
        fragment.append(subheading);
      }
      const p = document.createElement('p'); p.className = 'article-paragraph'; p.textContent = part; fragment.append(p);
      if (showImages && (index === 0 || index === 2)) fragment.append(figure(orderedPhotos[index === 0 ? 0 : 1], index === 0 && !!imageURL));
    });
    // Keep a useful image backdrop even when the user replaces the article with a short sentence.
    if (showImages && paragraphs.length < 3) fragment.append(figure(orderedPhotos[1]));
    world.replaceChildren(fragment); lens.refresh(true); schedulePosition();
  }
  function clamp(value, min, max) { return Math.min(Math.max(value, min), Math.max(min, max)); }
  function position() {
    frame = 0;
    const width = object.offsetWidth || Math.min(324, viewport.clientWidth - 32);
    const height = object.offsetHeight || 52, margin = 12;
    // Coordinates belong to the playground frame, never the page or article.
    const left = clamp(x ?? viewport.clientWidth / 2, width / 2 + margin, viewport.clientWidth - width / 2 - margin);
    const top = clamp(y ?? viewport.clientHeight / 2, height / 2 + 26 + margin, viewport.clientHeight - height / 2 - margin);
    if (x !== undefined) x = left;
    if (y !== undefined) y = top;
    object.style.left = `${left}px`; object.style.top = `${top}px`;
    lens.refresh();
  }
  function schedulePosition() { if (!frame) frame = requestAnimationFrame(position); }
  function setSize(value) {
    const percent = clamp(Number(value) || 100, 100, 200);
    size.value = percent; sizeValue.value = `${percent}%`;
    size.setAttribute('aria-valuetext', `${percent} percent`);
    // Resize the actual lens geometry so its refraction is recalculated,
    // rather than magnifying a rendered bitmap with a CSS scale transform.
    object.style.setProperty('--lab-scale', percent / 100);
    schedulePosition();
  }
  function chooseSample(sample) {
    if (!['switcher','search'].includes(sample)) return;
    lab.querySelectorAll('[data-lab-sample]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.labSample === sample)));
    lab.querySelectorAll('.lab-sample').forEach(node => { node.hidden = node.id !== `lab-${sample}`; });
    schedulePosition();
  }
  function syncColors() {
    const style = getComputedStyle(document.body);
    $('#lab-paper').value = stage.style.backgroundColor ? rgbToHex(getComputedStyle(stage).backgroundColor) : style.getPropertyValue('--glass-neutral').trim();
    $('#lab-ink').value = stage.style.getPropertyValue('--article-ink') || style.getPropertyValue('--glass-text').trim();
    lens.refresh(true);
  }
  function rgbToHex(value) { return '#' + value.match(/\d+/g).slice(0,3).map(number => Number(number).toString(16).padStart(2,'0')).join(''); }
  function reset() {
    imageRequest++; if (imageURL) URL.revokeObjectURL(imageURL); imageURL = '';
    orderedPhotos = [...photos]; text.value = defaults.text; title.value = defaults.title;
    $('#lab-images').checked = true; $('#lab-image').value = ''; $('#lab-image-name').textContent = ''; $('#lab-image-error').hidden = true;
    stage.style.removeProperty('background'); stage.style.removeProperty('--article-ink');
    x = y = undefined; setSize(100); scroller.scrollTop = 0; chooseSample('switcher'); syncColors(); renderArticle();
  }
  $('#lab-edit').addEventListener('click', () => editor.showModal());
  $('#lab-reset').addEventListener('click', reset);
  size.addEventListener('input', () => setSize(size.value));
  $('#lab-lorem').addEventListener('click', () => { text.value = defaults.text; title.value = defaults.title; renderArticle(); });
  [text, title].forEach(input => input.addEventListener('input', renderArticle));
  $('#lab-images').addEventListener('change', renderArticle);
  $('#lab-paper').addEventListener('input', event => { stage.style.background = event.target.value; lens.refresh(true); });
  $('#lab-ink').addEventListener('input', event => { stage.style.setProperty('--article-ink', event.target.value); lens.refresh(true); });
  $('#lab-shuffle').addEventListener('click', () => {
    // Always select a different first image, rather than occasionally shuffling to the same order.
    const next = photos.filter(photo => photo.id !== orderedPhotos[0].id);
    const first = next[Math.floor(Math.random() * next.length)];
    orderedPhotos = [first, ...photos.filter(photo => photo !== first)];
    imageRequest++; if (imageURL) URL.revokeObjectURL(imageURL); imageURL = '';
    $('#lab-image').value = ''; $('#lab-image-name').textContent = ''; $('#lab-image-error').hidden = true; $('#lab-images').checked = true; renderArticle();
  });
  $('#lab-image').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    const request = ++imageRequest; let pendingURL = '';
    try {
      if (!/^image\/(png|jpeg|webp|avif|gif)$/.test(file.type)) throw new Error('Choose a PNG, JPG, WebP, AVIF, or GIF image.');
      pendingURL = URL.createObjectURL(file); const image = new Image(); image.src = pendingURL; await image.decode();
      if (request !== imageRequest || disposed) { URL.revokeObjectURL(pendingURL); return; }
      if (imageURL) URL.revokeObjectURL(imageURL); imageURL = pendingURL;
      $('#lab-images').checked = true; $('#lab-image-name').textContent = file.name; $('#lab-image-error').hidden = true; renderArticle();
    } catch (error) {
      if (pendingURL) URL.revokeObjectURL(pendingURL); if (request !== imageRequest) return;
      $('#lab-image-error').textContent = error.message.startsWith('Choose a') ? error.message : 'This image could not be opened. Try another file.';
      $('#lab-image-error').hidden = false; event.target.value = '';
    }
  });
  lab.querySelectorAll('[data-lab-sample]').forEach(button => button.addEventListener('click', () => chooseSample(button.dataset.labSample)));
  let drag, suppressClick = false, clickTimeout;
  object.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    clearTimeout(clickTimeout); suppressClick = false;
    const rect = object.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
    drag = {id:event.pointerId, px:event.clientX, py:event.clientY, x:rect.left + rect.width / 2 - bounds.left - viewport.clientLeft, y:rect.top + rect.height / 2 - bounds.top - viewport.clientTop, active:false};
    if (!event.target.closest('input, button, a')) event.preventDefault();
  });
  function dragPointer(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.px, dy = event.clientY - drag.py;
    if (!drag.active) {
      if (Math.hypot(dx,dy) < 6) return;
      drag.active = true; suppressClick = true; object.setPointerCapture(event.pointerId); object.classList.add('is-dragging');
    }
    event.preventDefault(); x = drag.x + dx; y = drag.y + dy; schedulePosition();
  }
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const active = drag.active; drag = null; object.classList.remove('is-dragging');
    if (object.hasPointerCapture(event.pointerId)) object.releasePointerCapture(event.pointerId);
    if (active) clickTimeout = setTimeout(() => { suppressClick = false; }, 350);
  }
  window.addEventListener('pointermove', dragPointer, {capture:true, passive:false});
  window.addEventListener('pointerup', endDrag, true); window.addEventListener('pointercancel', endDrag, true);
  object.addEventListener('lostpointercapture', event => { if (event.target === object && drag?.active && event.pointerId === drag.id) endDrag(event); });
  object.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  object.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const unit = event.deltaMode === 1 ? 34 : event.deltaMode === 2 ? scroller.clientHeight : 1;
    scroller.scrollBy({left:event.deltaX * unit, top:event.deltaY * unit, behavior:'instant'});
    event.preventDefault();
  }, {passive:false});
  $('.lab-drag').addEventListener('keydown', event => {
    const step = event.shiftKey ? 48 : 16;
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)) return;
    x ??= viewport.clientWidth / 2; y ??= viewport.clientHeight / 2;
    if (event.key === 'ArrowLeft') x -= step; else if (event.key === 'ArrowRight') x += step;
    else if (event.key === 'ArrowUp') y -= step; else if (event.key === 'ArrowDown') y += step;
    else if (event.key === 'Home') x = y = undefined; else return;
    event.preventDefault(); schedulePosition();
  });
  const resize = new ResizeObserver(schedulePosition); resize.observe(viewport); resize.observe(object);
  const onArticleScroll = () => lens.refresh();
  scroller.addEventListener('scroll', onArticleScroll, {passive:true});
  window.addEventListener('resize', schedulePosition);
  document.addEventListener('showcase:theme', syncColors);
  const onBackdrop = () => { stage.style.removeProperty('background'); lens.refresh(true); syncColors(); };
  document.addEventListener('showcase:backdrop', onBackdrop);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return; disposed = true; imageRequest++; cancelAnimationFrame(frame); clearTimeout(clickTimeout);
    resize.disconnect(); lens.destroy(); if (imageURL) URL.revokeObjectURL(imageURL);
    scroller.removeEventListener('scroll', onArticleScroll); window.removeEventListener('resize', schedulePosition);
    window.removeEventListener('pointermove', dragPointer, true); window.removeEventListener('pointerup', endDrag, true); window.removeEventListener('pointercancel', endDrag, true);
    document.removeEventListener('showcase:theme', syncColors); document.removeEventListener('showcase:backdrop', onBackdrop);
  });
  setSize(size.value); syncColors(); renderArticle(); chooseSample(new URLSearchParams(location.search).get('sample') || 'switcher');
  requestAnimationFrame(() => { position(); window.playgroundReady = true; });
}

// Measure redundant work and compare actual before/after browser pixels.
// Optional: --baseline path/to/previous-liquid-glass.js. AGPL-3.0-only.
import {createRequire} from 'node:module';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from './serve.mjs';

const {chromium} = createRequire(import.meta.url)('playwright');
const flag = process.argv.indexOf('--baseline');
const baseline = flag < 0 ? undefined : await readFile(process.argv[flag + 1], 'utf8');
const artifacts = fileURLToPath(new URL('../.artifacts/performance/', import.meta.url));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [], results = {}, captures = new Map();
let browser;

async function frames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function open(path, old) {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 2, reducedMotion: 'reduce'});
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);});
  if (old) await page.route('**/assets/core/liquid-glass.js', route => route.fulfill({contentType: 'text/javascript', body: baseline}));
  await page.goto(`${base}${path}`);
  return page;
}
async function shot(page, locator, name, mode) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    const maps = new Set([...document.querySelectorAll('feImage')].map(node => node.getAttribute('href')).filter(Boolean));
    await Promise.all([...maps].map(async url => {const image = new Image(); image.src = url; await image.decode();}));
  });
  await frames(page);
  let png = await locator.screenshot({animations: 'disabled'}), stable = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    await frames(page);
    const next = await locator.screenshot({animations: 'disabled'});
    if (png.equals(next)) {stable = true; break;}
    png = next;
  }
  assert(stable, `Unsettled browser pixels in ${name}`);
  await writeFile(`${artifacts}${mode}-${name}.png`, png);
  if (mode === 'before') captures.set(name, png);
  else if (baseline) assert(captures.get(name).equals(png), `Pixels changed in ${name}`);
}
async function aligned(page) {
  await page.waitForFunction(() => {
    const source = document.querySelector('#lab-world').getBoundingClientRect();
    const copy = document.querySelector('#lab-object .glass-lens-scene .lab-world')?.getBoundingClientRect();
    return copy && ['x', 'y', 'width', 'height'].every(key => Math.abs(source[key] - copy[key]) < .5);
  });
  await frames(page);
}
async function photos(page) {
  await page.locator('#lab-scroll').evaluate(node => {
    const image = document.querySelector('#lab-world img').getBoundingClientRect();
    const glass = document.querySelector('#lab-object').getBoundingClientRect();
    node.scrollTop += image.top + image.height * .6 - glass.top - glass.height / 2;
  });
  await aligned(page);
  await page.waitForFunction(() => document.querySelector('#lab-search .liquid-glass').hasAttribute('data-photo-glass'));
}

async function workload(old) {
  const page = await browser.newPage({viewport: {width: 1200, height: 800}, deviceScaleFactor: 2});
  page.on('pageerror', error => errors.push(error.message));
  if (old) await page.route('**/assets/core/liquid-glass.js', route => route.fulfill({contentType: 'text/javascript', body: baseline}));
  await page.goto(`${base}/README.md`);
  await page.setContent(`<!doctype html><base href="${base}/"><link rel="stylesheet" href="liquid-glass-apple/assets/core/liquid-glass.css"><style>
    *{box-sizing:border-box}body{margin:0;padding:40px;background:var(--glass-neutral);color:var(--glass-text);font:24px 'Segoe UI',sans-serif}
    #performance-stage{position:relative;width:920px;height:520px;overflow:hidden}.perf-source{position:absolute;inset:0;overflow:hidden}.perf-source p{margin:0;line-height:35px}
    .performance-glass{position:absolute;width:324px;height:52px;--glass-radius:999px;border:0;background:transparent;font:16px 'Segoe UI',sans-serif}.glass-content{display:grid;place-items:center;height:100%}
    </style><body data-liquid-glass data-theme="light"><main id="performance-stage" class="glass-scene" data-glass-backdrop="none"><article class="perf-source"></article></main></body>`);
  const report = await page.evaluate(async base => {
    const {createGlassScene} = await import(`${base}/liquid-glass-apple/assets/core/liquid-glass.js`);
    const stage = document.querySelector('#performance-stage'), source = stage.querySelector('article');
    for (let index = 0; index < 64; index++) {
      const text = document.createElement('p');
      text.textContent = `Paragraph ${index + 1}. A controlled source keeps typography, transparency and refraction in sync.`;
      source.append(text);
    }
    const counters = {mapRenders: 0, sourceStyleReads: 0, styleReads: 0};
    const originalStyle = window.getComputedStyle, originalPixels = CanvasRenderingContext2D.prototype.putImageData;
    window.getComputedStyle = function(node, ...args) {
      counters.styleReads++;
      if (node === source || source.contains(node)) counters.sourceStyleReads++;
      return originalStyle.call(this, node, ...args);
    };
    CanvasRenderingContext2D.prototype.putImageData = function(...args) {
      counters.mapRenders++; return originalPixels.apply(this, args);
    };
    const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const snapshot = () => ({maps: counters.mapRenders / 2, sourceStyleReads: counters.sourceStyleReads, styleReads: counters.styleReads});
    const reset = () => {counters.mapRenders = counters.sourceStyleReads = counters.styleReads = 0;};
    const handles = [], surfaces = [];
    const scene = createGlassScene({stage, source, themeRoot: document.body});
    for (let index = 0; index < 8; index++) {
      const surface = document.createElement('button'); surface.type = 'button';
      surface.className = 'performance-glass liquid-glass';
      surface.style.left = `${80 + index % 2 * 410}px`; surface.style.top = `${50 + Math.floor(index / 2) * 105}px`;
      surface.innerHTML = '<span class="glass-material" aria-hidden="true"></span><span class="glass-content">Save item</span><span class="glass-rim" aria-hidden="true"></span>';
      stage.append(surface); surfaces.push(surface); handles.push(scene.add(surface.querySelector('.glass-material')));
    }
    await settle(); const mount = snapshot();
    reset();
    source.querySelector('p').textContent = 'Live text changes must update every surface in the same frame.';
    await settle(); const sourceUpdate = snapshot();
    const originalText = source.querySelector('p').textContent;
    if (![...stage.querySelectorAll('.glass-lens-scene p:first-child')].every(node => node.textContent === originalText)) throw new Error('Stale source copy');
    reset();
    for (let frame = 0; frame < 12; frame++) {
      surfaces.forEach(node => {node.style.transform = `translateX(${frame % 3}px)`;});
      scene.refresh(); await settle();
    }
    const movement = snapshot();
    reset();
    surfaces[0].style.width = '340px'; scene.refresh(); await settle();
    surfaces[0].style.width = '324px'; scene.refresh(); await settle();
    const resizeRoundTrip = snapshot();
    const copiedColor = originalStyle(stage.querySelector('.glass-lens-scene p')).color;
    const realColor = originalStyle(source.querySelector('p')).color;
    if (copiedColor === realColor) throw new Error('Local glyph attenuation disappeared');
    scene.destroy();
    if (stage.querySelector('.glass-lens-window') || document.querySelector('.glass-lens-definitions')) throw new Error('Incomplete cleanup');
    window.getComputedStyle = originalStyle;
    CanvasRenderingContext2D.prototype.putImageData = originalPixels;
    return {surfaces: 8, paragraphs: 64, mount, sourceUpdate, movement, resizeRoundTrip};
  }, base);
  await page.close(); return report;
}

try {
  await mkdir(artifacts, {recursive: true});
  browser = await chromium.launch({headless: true, ...(process.env.SHOWCASE_BROWSER ? {executablePath: process.env.SHOWCASE_BROWSER} : {})});
  for (const mode of baseline ? ['before', 'after'] : ['after']) {
    const old = mode === 'before';
    results[mode] = await workload(old);
    console.log(`${mode} workload: ${JSON.stringify(results[mode])}`);
    for (const theme of ['light', 'dark']) {
      for (const backdrop of ['none', 'aurora']) {
        const page = await open(`/scripts/fixtures/readme.html?theme=${theme}&backdrop=${backdrop}`, old);
        await page.waitForFunction(() => window.readmeReady && document.querySelectorAll('[data-glass-lens="edge"]').length === 7);
        await shot(page, page.locator('#portrait'), `cover-${theme}-${backdrop}`, mode); await page.close();
      }
      const gallery = await open(`/docs/showcase/index.html?view=gallery&theme=${theme}&backdrop=none`, old);
      await gallery.waitForFunction(() => window.showcaseReady && document.querySelectorAll('#gallery [data-glass-lens="edge"]').length === 14);
      await shot(gallery, gallery.locator('.collection-section'), `gallery-${theme}`, mode);
      await gallery.locator('#backdrop').click(); await gallery.locator('#backdrop-menu [data-glass-lens="edge"]').waitFor({state: 'visible'});
      await shot(gallery, gallery.locator('#backdrop-scene'), `menu-${theme}`, mode);
      await gallery.keyboard.press('Escape');
      const slider = gallery.locator('.specimen').filter({has: gallery.getByRole('heading', {name: 'Slider', exact: true})});
      await slider.scrollIntoViewIfNeeded(); await frames(gallery);
      const thumb = await slider.locator('.glass-range-thumb').boundingBox();
      await gallery.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2); await gallery.mouse.down();
      await gallery.waitForFunction(() => document.querySelector('#gallery .glass-range-thumb').offsetWidth === 29);
      await shot(gallery, slider, `slider-pressed-${theme}`, mode); await gallery.mouse.up(); await gallery.close();

      const page = await open(`/docs/showcase/index.html?view=playground&theme=${theme}&backdrop=none&sample=search`, old);
      await page.waitForFunction(() => window.playgroundReady && [...document.querySelectorAll('#lab-world img')].every(img => img.complete && img.naturalWidth > 0));
      await aligned(page); await shot(page, page.locator('#lab-viewport'), `text-${theme}`, mode);
      await photos(page); await shot(page, page.locator('#lab-viewport'), `photo-${theme}`, mode);
      await page.locator('#lab-size').fill('200'); await page.locator('#lab-size').dispatchEvent('input');
      await aligned(page); await photos(page); await shot(page, page.locator('#lab-viewport'), `photo-large-${theme}`, mode);
      await page.locator('#lab-size').fill('100'); await page.locator('#lab-size').dispatchEvent('input'); await aligned(page);
      await page.locator('#lab-edit').click(); await page.locator('#lab-title').fill(''); await page.locator('#lab-copy').fill('');
      await page.locator('#lab-paper').fill(theme === 'light' ? '#ffffff' : '#000000'); await page.locator('#lab-paper').dispatchEvent('input');
      await page.locator('#lab-images').uncheck(); await page.locator('.editor-done').click(); await aligned(page);
      await shot(page, page.locator('#lab-viewport'), `plain-${theme}`, mode); await page.close();
    }
  }
  const current = results.after;
  assert.equal(current.mount.maps, 1, 'Equal surfaces must reuse one exact map');
  assert.equal(current.sourceUpdate.maps, 0, 'Editing text must not rebuild optical geometry');
  assert.equal(current.movement.maps, 0, 'Movement must not rebuild optical geometry');
  assert.equal(current.resizeRoundTrip.maps, 1, 'Returning to a recent size must reuse its map');
  assert.equal(current.sourceUpdate.sourceStyleReads, 64, 'Read live source colors once for all surfaces');
  if (baseline) {
    assert(current.mount.maps < results.before.mount.maps);
    assert(current.sourceUpdate.sourceStyleReads < results.before.sourceUpdate.sourceStyleReads);
    assert(current.movement.styleReads < results.before.movement.styleReads);
  }
  assert.deepEqual(errors, []);
  const report = {passed: true, pixelComparisons: captures.size, identicalPixels: baseline ? true : undefined, workload: results};
  await writeFile(`${artifacts}results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
}

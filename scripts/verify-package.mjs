// Exercise the self-contained skill example and the reusable lens lifecycle.
// The screenshots are actual browser renders, not mockups. AGPL-3.0-only.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createServer } from './serve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const output = fileURLToPath(new URL('../liquid-glass-apple/assets/reference/', import.meta.url));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [], failures = [];
let browser;
try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.SHOWCASE_BROWSER ? { executablePath: process.env.SHOWCASE_BROWSER } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${base}/liquid-glass-apple/assets/example/index.html`);
  await page.waitForFunction(() => window.glassExampleReady && document.querySelector('[data-glass-lens="edge"]'));
  const search = page.locator('#sample-search input');
  const rim = page.locator('#sample-search > .glass-rim');
  const restingRim = await rim.evaluate(node => getComputedStyle(node, '::before').backgroundImage);
  await search.click();
  assert.equal(await search.evaluate(node => getComputedStyle(node).outlineStyle), 'none', 'Search must not gain a native rectangular outline');
  assert.notEqual(await rim.evaluate(node => getComputedStyle(node, '::before').backgroundImage), restingRim, 'Focus must remain visible on the existing glass rim');
  assert(await search.evaluate(node => node === document.activeElement), 'Search keeps native focus and editing');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'move-glass', 'Keyboard can leave the glass field');
  const material = page.locator('#sample-search .glass-material');
  const initialMap = await material.evaluate(node => {
    const id = node.querySelector('.glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];
    return document.getElementById(id).querySelector('feImage').getAttribute('href');
  });
  const screenshots = [];
  for (const theme of ['light', 'dark']) for (const [name, backdrop] of [['neutral', 'none'], ['color', 'aurora']]) {
    await page.locator('#appearance').selectOption(theme);
    await page.locator('#background').selectOption(backdrop);
    await page.waitForFunction(({theme, backdrop}) => {
      const stage = document.querySelector('#scene'), copy = document.querySelector('[data-glass-lens] .glass-lens-scene');
      return document.body.dataset.theme === theme && stage.dataset.glassBackdrop === backdrop &&
        getComputedStyle(stage).backgroundImage === copy.style.backgroundImage &&
        getComputedStyle(stage).backgroundColor === copy.style.backgroundColor;
    }, {theme, backdrop});
    // A stable frame after the SVG feImage update avoids capturing an empty filter.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const filename = `example-${name}-${theme}.png`;
    await page.screenshot({ path: `${output}${filename}`, fullPage: true });
    screenshots.push(filename);
    assert.equal(await material.evaluate(node => {
      const id = node.querySelector('.glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];
      return document.getElementById(id).querySelector('feImage').getAttribute('href');
    }), initialMap, 'Changing backdrop must not change the optical geometry');
  }
  await page.locator('#backdrop-copy').fill('A background that belongs to this product.\nIts original typography stays outside the glass.');
  await page.waitForFunction(() => document.querySelector('[data-glass-lens] .background-text').textContent === document.querySelector('#backdrop-copy').value);
  await page.locator('#text-size').fill('110');
  await page.waitForFunction(() => document.querySelector('[data-glass-lens] .glass-lens-scene').style.getPropertyValue('--scene-size') === '110px');
  await page.locator('#text-layout').selectOption('poster');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#scene-source p')).fontSize === getComputedStyle(document.querySelector('[data-glass-lens] .background-text')).fontSize);

  // Drag starts on the input itself without erasing its text. A stationary click edits it.
  await page.locator('#sample-search input').fill('Keep this search');
  const field = await page.locator('#sample-search input').boundingBox();
  const start = await page.locator('#glass-object').boundingBox();
  await page.mouse.move(field.x + 55, field.y + field.height / 2);
  await page.mouse.down(); await page.mouse.move(field.x + 110, field.y + 45, {steps: 8}); await page.mouse.up();
  const end = await page.locator('#glass-object').boundingBox();
  assert.ok(end.x - start.x > 45 && end.y - start.y > 15);
  assert.equal(await page.locator('#sample-search input').inputValue(), 'Keep this search');
  await page.waitForFunction(() => {
    const a = document.querySelector('#scene-source').getBoundingClientRect();
    const b = document.querySelector('[data-glass-lens] .scene-source').getBoundingClientRect();
    return Math.abs(a.x - b.x) < .5 && Math.abs(a.y - b.y) < .5;
  });
  await page.locator('#sample').selectOption('button');
  await page.locator('#sample-button [data-glass-lens]').waitFor({state: 'visible'});
  await page.locator('#sample-button').click();
  assert.equal(await page.locator('#action-status').textContent(), 'Example action activated.');
  await page.locator('#action-status').evaluate(node => {node.textContent = '';});
  const button = await page.locator('#sample-button').boundingBox();
  await page.mouse.move(button.x + 35, button.y + 24); await page.mouse.down();
  await page.mouse.move(button.x + 65, button.y + 50, {steps: 6}); await page.mouse.up();
  assert.equal(await page.locator('#action-status').textContent(), '', 'Dragging an action must not click it');
  await page.locator('#sample').selectOption('circle');
  await page.locator('#sample-circle [data-glass-lens]').waitFor({state: 'visible'});
  await page.locator('#sample-circle').click();
  assert.equal(await page.locator('#sample-circle').getAttribute('aria-pressed'), 'true');
  await page.locator('#move-glass').focus();
  const beforeKey = await page.locator('#glass-object').boundingBox();
  await page.keyboard.press('ArrowLeft');
  assert.ok((await page.locator('#glass-object').boundingBox()).x < beforeKey.x);
  await page.locator('#article-example').click();
  assert.equal(await page.locator('#appearance').inputValue(), 'dark');
  assert.equal(await page.locator('#background').inputValue(), 'none');
  assert.equal(await page.locator('#text-layout').inputValue(), 'article');
  await page.locator('#sample-search [data-glass-lens]').waitFor({state: 'visible'});
  await page.locator('#lens-enabled').uncheck();
  await page.waitForFunction(() => !document.querySelector('[data-glass-lens]'));
  await page.locator('#lens-enabled').check();
  await page.waitForFunction(() => document.querySelector('[data-glass-lens]'));
  await page.evaluate(() => { document.body.dataset.glassFallback = 'true'; });
  await page.waitForFunction(() => !document.querySelector('[data-glass-lens]'));
  assert.equal(await material.evaluate(node => getComputedStyle(node).backdropFilter), 'none');
  assert.equal(await material.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(39, 39, 41)');
  await page.evaluate(() => {delete document.body.dataset.glassFallback;});
  await page.waitForFunction(() => document.querySelector('[data-glass-lens]'));
  await page.emulateMedia({forcedColors: 'active'});
  await page.waitForFunction(() => !document.querySelector('[data-glass-lens]'));
  await search.focus();
  assert.equal(await rim.evaluate(node => getComputedStyle(node).borderTopWidth), '2px', 'Forced colors preserve a system-color focus indication');
  await page.emulateMedia({forcedColors: 'none'});
  await page.waitForFunction(() => document.querySelector('[data-glass-lens]'));
  await page.locator('#sample').selectOption('slider');
  await page.waitForFunction(()=>document.querySelectorAll('#sample-slider [data-glass-lens]').length===3);
  const volume=page.getByRole('slider',{name:'Volume'});
  await volume.press('End'); assert.equal(await page.locator('#sample-slider output').textContent(),'100');
  await volume.press('Home'); assert.equal(await volume.inputValue(),'0');
  const thumb=await page.locator('#sample-slider .glass-range-thumb').boundingBox();
  const sliderPosition=await page.locator('#glass-object').boundingBox();
  await page.mouse.move(thumb.x+thumb.width/2,thumb.y+thumb.height/2); await page.mouse.down();
  await page.waitForFunction(()=>document.querySelector('#sample-slider .glass-range-thumb').offsetWidth===29);
  await page.mouse.move(thumb.x+90,thumb.y+thumb.height/2,{steps:8}); await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('#sample-slider .glass-range-thumb').offsetWidth===24);
  assert(Number(await volume.inputValue())>0);
  assert.equal((await page.locator('#glass-object').boundingBox()).x,sliderPosition.x,'Volume dragging must not drag the whole example');

  await page.setViewportSize({width: 390, height: 844});
  for (const sample of ['search', 'button', 'circle', 'slider']) {
    await page.locator('#sample').selectOption(sample);
    await page.locator(`#sample-${sample} [data-glass-lens]`).first().waitFor({state: 'visible'});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const host = await page.locator(`#sample-${sample}`).boundingBox();
    const stage = await page.locator('#scene').boundingBox();
    assert.ok(host.x >= stage.x && host.x + host.width <= stage.x + stage.width + .5);
  }

  // Two differently shaped surfaces share one scene without sharing filters.
  // Destruction must release all DOM filters/copies and allow a clean remount.
  const lifecycle = await page.evaluate(async () => {
    const {createGlassScene} = await import('../core/liquid-glass.js');
    const fixture = document.createElement('div');
    fixture.setAttribute('data-liquid-glass', '');
    fixture.style.cssText = 'position:relative;width:380px;height:160px;--custom-scene-test:23px;';
    fixture.innerHTML = '<div class="fixture-source" id="original-source">Independent surfaces</div><div class="liquid-glass" style="position:absolute;left:10px;top:40px;width:180px;height:52px"><span class="glass-material"></span></div><div class="liquid-glass" style="--glass-radius:28px;position:absolute;left:260px;top:40px;width:56px;height:56px"><span class="glass-material"></span></div>';
    document.body.append(fixture);
    const materials = [...fixture.querySelectorAll('.glass-material')];
    const core = createGlassScene({stage:fixture, source:fixture.querySelector('.fixture-source'), themeRoot:fixture});
    const handles = materials.map(node => core.add(node));
    const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await settle();
    const ids = materials.map(node => node.querySelector('.glass-lens-window').style.filter.match(/#([^"\)]+)/)[1]);
    const widths = ids.map(id => document.getElementById(id).querySelector('feImage').getAttribute('width'));
    const duplicateIDs = fixture.querySelectorAll('#original-source').length;
    fixture.style.removeProperty('--custom-scene-test'); await settle();
    const staleVariable = materials[0].querySelector('.glass-lens-scene').style.getPropertyValue('--custom-scene-test');
    handles[0].destroy(); await settle();
    const otherSurvives = !document.getElementById(ids[0]) && materials[1].dataset.glassLens === 'edge';
    core.destroy(); core.destroy(); handles[1].destroy(); await settle();
    const cleaned = ids.every(id => !document.getElementById(id)) && !fixture.querySelector('.glass-lens-window, [data-glass-lens]');
    const remount = createGlassScene({stage:fixture, source:fixture.querySelector('.fixture-source'), themeRoot:fixture});
    remount.add(materials[0], {strength: .5}); await settle();
    const mountedAgain = materials[0].dataset.glassLens === 'edge';
    remount.destroy(); fixture.remove();
    return {ids, widths, duplicateIDs, staleVariable, otherSurvives, cleaned, mountedAgain};
  });
  assert.notEqual(lifecycle.ids[0], lifecycle.ids[1]);
  assert.deepEqual(lifecycle.widths, ['276', '152']);
  assert.equal(lifecycle.duplicateIDs, 1);
  assert.equal(lifecycle.staleVariable, '');
  assert.ok(lifecycle.otherSurvives && lifecycle.cleaned && lifecycle.mountedAgain);
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  console.log(JSON.stringify({passed:true, screenshots, checks:['neutral/color × light/dark', 'geometry independent of colors', 'live scene typography', 'field drag and action click', 'keyboard movement', 'native glass slider with press expansion', 'solid fallback and forced colors', 'mobile 4 shapes', 'independent surfaces and clean remount']}, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

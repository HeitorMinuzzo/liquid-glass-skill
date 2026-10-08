// Genuine 2x browser renders for the repository cover. AGPL-3.0-only.
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from './serve.mjs';

const {chromium} = createRequire(import.meta.url)('playwright');
const images = fileURLToPath(new URL('../docs/images/', import.meta.url));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [], shots = [];
let browser;
try {
  await mkdir(images, {recursive: true});
  browser = await chromium.launch({headless: true, ...(process.env.SHOWCASE_BROWSER ? {executablePath: process.env.SHOWCASE_BROWSER} : {})});
  for (const theme of ['light', 'dark']) for (const backdrop of ['none', 'aurora']) {
    const page = await browser.newPage({viewport: {width: 1120, height: 800}, deviceScaleFactor: 2, reducedMotion: 'reduce'});
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);});
    await page.route('https://**/*', route => {errors.push(`Unexpected external asset: ${route.request().url()}`); return route.abort();});
    await page.goto(`${base}/scripts/fixtures/readme.html?theme=${theme}&backdrop=${backdrop}`);
    await page.waitForFunction(() => window.readmeReady && document.querySelectorAll('[data-glass-lens="edge"]').length === 7);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const source = document.querySelector('#portrait-source').getBoundingClientRect();
      return [...document.querySelectorAll('.glass-lens-scene .portrait-source')].every(node => {
        const copy = node.getBoundingClientRect();
        return ['x', 'y', 'width', 'height'].every(key => Math.abs(source[key] - copy[key]) < .5);
      });
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const geometry = await page.locator('.hero-search').boundingBox();
    assert.equal(geometry.width, 604);
    assert.equal(geometry.height, 80);
    const textLines = await page.locator('#portrait-source .sample-copy p > span').evaluateAll(nodes => nodes.map(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const box = range.getBoundingClientRect();
      return {top: box.top, bottom: box.bottom, center: box.top + box.height / 2};
    }));
    assert(textLines[1].top < geometry.y + 24 && textLines[1].bottom > geometry.y, 'The upper shoulder must cross the second text line');
    assert(textLines[2].top < geometry.y + geometry.height && textLines[2].bottom > geometry.y + geometry.height - 24, 'The lower shoulder must cross the third text line');
    const midpoint = (textLines[1].center + textLines[2].center) / 2;
    assert(Math.abs(midpoint - geometry.y - geometry.height / 2) < 3, 'The Search center must sit between both background lines');
    assert.equal(await page.locator('.glass-range-thumb').evaluate(node => node.offsetWidth), 24);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1120);
    const name = `readme-${backdrop === 'none' ? 'neutral' : 'color'}-${theme}.png`;
    await page.screenshot({path: `${images}${name}`, animations: 'disabled'});
    shots.push({file: name, theme, backdrop, width: 2240, height: 1600, deviceScaleFactor: 2, surfaces: 7, material: 'approved-shared-core', geometry});
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${images}readme-captures.json`, `${JSON.stringify({source: 'scripts/fixtures/readme.html', modifiedMaterial: false, captures: shots}, null, 2)}\n`);
  console.log(JSON.stringify({passed: true, files: shots.map(shot => shot.file), errors}, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

// Focused interaction and rendering checks for the playground lens experiment.
// AGPL-3.0-only; see ../LICENSE.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createServer } from './serve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const checks = fileURLToPath(new URL('../.artifacts/lens/', import.meta.url));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [];
let browser;
try {
  await mkdir(checks, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.SHOWCASE_BROWSER ? { executablePath: process.env.SHOWCASE_BROWSER } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1250 }, deviceScaleFactor: 2 });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/scripts/fixtures/lens.html`);
  await page.waitForFunction(() => window.fixture && document.querySelector('[data-glass-lens]'));
  // Measure attenuation on actual glyphs, separately from photographic backing.
  // A block glyph gives a known black/white edge with a large solid sampling area.
  await page.evaluate(() => {
    const p=document.createElement('p'); p.className='lab-background-text'; p.textContent='█';
    document.querySelector('#lab-world').append(p); window.fixture.refresh(true);
  });
  const opticalFixture = await page.addStyleTag({ content: '.lab-world { background: #fff !important; } .lab-background-text {position:absolute;left:0;top:0;width:50%;height:100%;overflow:hidden;font:800px/380px Arial!important;color:#000;margin:0!important;} #lab-switcher .lg-segmented > :not(.lg-segment-material) { visibility: hidden !important; }' });
  // Ensure computed glyph color has reached the cloned scene before measuring.
  await page.evaluate(() => window.fixture.refresh(true));
  await page.waitForFunction(()=>document.querySelector('[data-glass-lens] .lab-background-text')?.style.color);
  const opticalBounds = await page.locator('[data-glass-lens]').boundingBox();
  const stageBounds = await page.locator('#lab-stage').boundingBox();
  const fixture = await page.locator('#lab-stage').screenshot({ path: `${checks}local-contrast-sharpness.png` });
  const opticalResults = await page.evaluate(async ({ png, glass, stage }) => {
    const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const scale = canvas.width / stage.width;
    const centerX = Math.round(stage.width / 2 * scale);
    const centerY = Math.round((glass.y + glass.height / 2 - stage.y) * scale);
    const valueAt = x => pixels[(centerY * canvas.width + Math.round(x)) * 4];
    const insideBlack = valueAt(centerX - 35 * scale);
    const insideWhite = valueAt(centerX + 35 * scale);
    const outsideBlack = valueAt((glass.x - stage.x - 20) * scale);
    const outsideWhite = valueAt((glass.x + glass.width - stage.x + 20) * scale);
    const transition = [];
    for (let x = centerX - 12 * scale; x < centerX + 12 * scale; x++) {
      const fraction = (valueAt(x) - insideBlack) / (insideWhite - insideBlack);
      if (fraction > .1 && fraction < .9) transition.push(x);
    }
    return { outsideBlack, outsideWhite, insideBlack, insideWhite, transitionCSSPixels: transition.length / scale };
  }, { png: fixture.toString('base64'), glass: opticalBounds, stage: stageBounds });
  assert(opticalResults.outsideBlack <= 2 && opticalResults.outsideWhite >= 253, `Glass changed uncovered backing: ${JSON.stringify(opticalResults)}`);
  assert(opticalResults.insideBlack >= 145 && opticalResults.insideBlack <= 210, `Black backing did not become gray: ${JSON.stringify(opticalResults)}`);
  assert(opticalResults.insideWhite - opticalResults.insideBlack >= 30, 'The tinted backdrop lost its visible detail.');
  assert(opticalResults.transitionCSSPixels <= 2, `Center blur erased the edge shape: ${JSON.stringify(opticalResults)}`);
  console.log('Local backdrop tint and sharp center:', JSON.stringify(opticalResults));
  const edgeResults = [];
  for (const axis of ['horizontal', 'vertical']) {
    await opticalFixture.evaluate((node, axis) => { node.textContent = `.lab-world { background: repeating-linear-gradient(${axis === 'horizontal' ? '90deg' : '0deg'}, #000 0 3px, #fff 3px 6px) !important; } .lab-background-text, #lab-switcher .lab-drag, #lab-switcher .lg-segmented > :not(.lg-segment-material) { visibility: hidden !important; }`; }, axis);
    const shots = [];
    for (const strength of ['0', '100']) {
      await page.evaluate(strength => window.fixture.strength(Number(strength) / 100), strength);
      shots.push((await page.locator('[data-glass-lens]').screenshot({ path: `${checks}${axis}-rim-${strength}.png` })).toString('base64'));
    }
    const difference = await page.evaluate(async ({ shots, axis }) => {
      const decoded = await Promise.all(shots.map(async png => {
        const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        return { width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data };
      }));
      const [flat, curved] = decoded;
      const average = (x1, x2, y1, y2) => {
        let difference = 0, count = 0;
        for (let y = Math.ceil(y1); y < Math.floor(y2); y++) for (let x = Math.ceil(x1); x < Math.floor(x2); x++) {
          const index = (y * flat.width + x) * 4;
          difference += Math.abs(flat.pixels[index] - curved.pixels[index]); count++;
        }
        return Number((difference / count).toFixed(2));
      };
      // The rim should bend within 1–5 CSS pixels of the contour, while a
      // 21–24 pixel strip in the central reading area remains unchanged.
      // Sample straight portions away from the rounded corners.
      return axis === 'horizontal'
        ? { edges: ['left', 'right'], nearEdge: [average(2, 10, flat.height / 2 - 4, flat.height / 2 + 4), average(flat.width - 10, flat.width - 2, flat.height / 2 - 4, flat.height / 2 + 4)], interior: [average(42, 48, flat.height / 2 - 4, flat.height / 2 + 4), average(flat.width - 48, flat.width - 42, flat.height / 2 - 4, flat.height / 2 + 4)] }
        : { edges: ['top', 'bottom'], nearEdge: [average(flat.width * .3, flat.width * .7, 2, 10), average(flat.width * .3, flat.width * .7, flat.height - 10, flat.height - 2)], interior: [average(flat.width * .3, flat.width * .7, 42, 48), average(flat.width * .3, flat.width * .7, flat.height - 48, flat.height - 42)] };
    }, { shots, axis });
    assert(difference.nearEdge.every(value => value >= 4), `An edge has no visible refraction: ${JSON.stringify(difference)}`);
    assert(difference.interior.every(value => value <= 2), `The edge fold extends too far inward: ${JSON.stringify(difference)}`);
    edgeResults.push(difference);
  }
  console.log('Refraction on all four edges:', JSON.stringify(edgeResults));
  const curveResults = [];
  for (const sample of ['Switcher', 'Search']) {
    await page.evaluate(sample => window.fixture.sample(sample.toLowerCase()), sample);
    for (const strength of ['100', '140']) {
      await page.evaluate(strength => window.fixture.strength(Number(strength) / 100), strength);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      // Verify visible edge refraction, a stable center, and continuous 2D
      // curvature at rounded ends. Straight edges must not have a sideways ripple.
      const curve = await page.evaluate(async () => {
        const material = document.querySelector('[data-glass-lens]');
        const id = material.querySelector('.glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];
        const filter = document.getElementById(id);
        const map = filter.querySelector('feImage');
        const scale = Number(filter.querySelector('feDisplacementMap').getAttribute('scale'));
        const image = new Image(); image.src = map.getAttribute('href'); await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const resolution = canvas.width / Number(map.getAttribute('width'));
        const padding = -Number(map.getAttribute('x'));
        const middleX = Math.floor((padding + material.offsetWidth / 2) * resolution);
        const middleY = Math.floor((padding + material.offsetHeight / 2) * resolution);
        const sampling = (length, channel) => {
          let previous, reflectedDepth = 0, maximumPull = 0, centerPull = 0;
          for (let pixel = padding * resolution; pixel < (padding + length) * resolution; pixel++) {
            const x = channel === 0 ? pixel : middleX, y = channel === 1 ? pixel : middleY;
            const position = (pixel + .5) / resolution - padding;
            const offset = scale * (pixels[(y * canvas.width + x) * 4 + channel] / 255 - .5);
            const source = position + offset;
            const depth = Math.min(position, length - position);
            maximumPull = Math.max(maximumPull, Math.abs(offset));
            if (depth > 21) centerPull = Math.max(centerPull, Math.abs(offset));
            if (previous !== undefined && source - previous < -.1) reflectedDepth = Math.max(reflectedDepth, depth);
            previous = source;
          }
          return { reflectedDepth: Number(reflectedDepth.toFixed(2)), maximumPull: Number(maximumPull.toFixed(2)), centerPull: Number(centerPull.toFixed(2)) };
        };
        const tangentX = Math.floor((padding + material.offsetWidth / 4) * resolution);
        const tangentY = Math.floor((padding + 2) * resolution);
        const tangentialPull = Math.abs(scale * (pixels[(tangentY * canvas.width + tangentX) * 4] / 255 - .5));
        const radius = Math.min(parseFloat(getComputedStyle(material).borderTopLeftRadius), material.offsetHeight / 2);
        const corner = radius - (radius - 2) / Math.SQRT2;
        const cornerPixel = Math.floor((padding + corner) * resolution);
        const cornerPull = [0, 1].map(channel => Number((scale * (pixels[(cornerPixel * canvas.width + cornerPixel) * 4 + channel] / 255 - .5)).toFixed(2)));
        return { horizontal: sampling(material.offsetWidth, 0), vertical: sampling(material.offsetHeight, 1), tangentialPull: Number(tangentialPull.toFixed(2)), cornerPull };
      });
      assert([curve.horizontal, curve.vertical].every(axis => axis.maximumPull >= 16 && axis.maximumPull < 32 && axis.reflectedDepth >= 5 && axis.reflectedDepth <= 16 && axis.centerPull <= .3), `Uncontrolled or imperceptible edge refraction: ${JSON.stringify({ sample, strength, ...curve })}`);
      assert(curve.tangentialPull <= .3, `Artificial sideways ripple on a straight rim: ${JSON.stringify(curve)}`);
      assert(curve.cornerPull.every(value => value >= 3), `Rounded ends did not refract on both axes: ${JSON.stringify(curve)}`);
      curveResults.push({ sample, strength, ...curve });
    }
  }
  console.log('Curved shoulder refraction confined to the bevel:', JSON.stringify(curveResults));
  await page.evaluate(() => window.fixture.strength(1));
  // The approved shoulder scales with larger components instead of staying
  // confined to the same few pixels while the rest of the capsule grows.
  const scaled=[];
  for(const [width,height] of [[324,52],[648,104],[777,144]]) {
    await page.evaluate(({width,height})=>window.fixture.size(width,height),{width,height});
    await page.waitForFunction(({width,height})=>{
      const material=document.querySelector('#lab-search [data-glass-lens]');
      const id=material.querySelector('.glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];
      const map=document.getElementById(id).querySelector('feImage');
      return Number(map.getAttribute('width'))===width+96&&Number(map.getAttribute('height'))===height+96;
    },{width,height});
    const measure=await page.evaluate(async()=>{
      const material=document.querySelector('#lab-search [data-glass-lens]');
      const id=material.querySelector('.glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];
      const filter=document.getElementById(id),map=filter.querySelector('feImage');
      const image=new Image();image.src=map.getAttribute('href');await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d');context.drawImage(image,0,0);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      const resolution=canvas.width/Number(map.getAttribute('width'));
      const scale=Number(filter.querySelector('feDisplacementMap').getAttribute('scale'));
      const x=Math.floor((48+material.offsetWidth/2)*resolution);
      const pull=y=>Math.abs(scale*(pixels[(Math.floor((48+y)*resolution)*canvas.width+x)*4+1]/255-.5));
      let reach=0;
      for(let depth=.25;depth<material.offsetHeight/2;depth+=.5)if(pull(material.offsetHeight-depth)>1)reach=depth;
      return {height:material.offsetHeight,reach,centerPull:pull(material.offsetHeight/2),centerBlur:filter.querySelector('[result="soft-center"]').getAttribute('stdDeviation')};
    });
    assert(measure.reach>height*.24&&measure.reach<height*.40,'Refraction must occupy a proportional shoulder, leaving a flat center');
    assert(measure.centerPull<.5&&Number(measure.centerBlur)===.25,'Sizing must not distort or blur the reading center');
    scaled.push(measure);
  }
  assert(scaled[2].reach>scaled[0].reach*2.5,'A large capsule must not retain the narrow pixel cap');
  console.log('Refraction follows component size:',JSON.stringify(scaled));
  await page.evaluate(()=>window.fixture.size(324,52));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await opticalFixture.evaluate(node => node.remove());
  const contrastResults = [];
  const labels = '#lab-switcher [data-segment] > span, #lab-search input';
  for (const theme of ['Light', 'Dark']) {
    await page.evaluate(theme => window.fixture.theme(theme.toLowerCase()), theme);
    // A solid black/white backing is a stricter case than individual text strokes.
    const backing = await page.addStyleTag({ content: `.lab-world { background: ${theme === 'Light' ? '#000' : '#fff'} !important; }` });
    for (const sample of ['Switcher', 'Search']) {
      await page.evaluate(sample => window.fixture.sample(sample.toLowerCase()), sample);
      if (sample === 'Search') await page.locator('#lab-search input').fill('Busca');
      await page.locator(`#lab-${sample.toLowerCase()} [data-glass-lens]`).waitFor({ state: 'visible' });
      const positions = await page.locator(labels).evaluateAll(nodes => {
        const object = document.querySelector('#lab-object').getBoundingClientRect();
        const swatch = document.createElement('canvas'); swatch.width = swatch.height = 1;
        const context = swatch.getContext('2d');
        return nodes.filter(node => node.checkVisibility()).map(node => {
          node.dataset.contrastLabel = '';
          const rect = node.getBoundingClientRect();
          context.fillStyle = getComputedStyle(node).color; context.fillRect(0, 0, 1, 1);
          return { text: node.value || node.textContent, x: rect.x - object.x, y: rect.y - object.y, width: rect.width, height: rect.height, color: [...context.getImageData(0, 0, 1, 1).data].slice(0, 3) };
        });
      });
      const visibleText = await page.locator('#lab-object').screenshot();
      const hidden = await page.addStyleTag({ content: '[data-contrast-label] { color: transparent !important; text-shadow: none !important; }' });
      const buffer = await page.locator('#lab-object').screenshot();
      const scores = await page.evaluate(async ({ png, visible, positions }) => {
        const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const foregroundImage = new Image(); foregroundImage.src = `data:image/png;base64,${visible}`; await foregroundImage.decode();
        context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(foregroundImage, 0, 0);
        const painted = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const luminance = rgb => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
        return positions.map(label => {
          const foreground = luminance(label.color);
          let minimum = Infinity;
          let worstBackground;
          let inkPixels = 0;
          for (let y = Math.ceil(label.y * 2) + 2; y < Math.floor((label.y + label.height) * 2) - 2; y++) {
            for (let x = Math.ceil(label.x * 2) + 2; x < Math.floor((label.x + label.width) * 2) - 2; x++) {
              const i = (y * canvas.width + x) * 4;
              // Measure the background under solid glyph pixels, excluding
              // empty parts of the line box and unrelated control highlights.
              const distance = label.color.reduce((sum, value, channel) => sum + Math.abs(value - painted[i + channel]), 0) / 3;
              const change = [0, 1, 2].reduce((sum, channel) => sum + Math.abs(painted[i + channel] - pixels[i + channel]), 0) / 3;
              if (distance > 24 || change < 32) continue;
              inkPixels++;
              const background = luminance([pixels[i], pixels[i + 1], pixels[i + 2]]);
              const ratio = (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
              if (ratio < minimum) { minimum = ratio; worstBackground = [pixels[i], pixels[i + 1], pixels[i + 2]]; }
            }
          }
          return { text: label.text, minimum: Number(minimum.toFixed(2)), inkPixels, color: label.color, worstBackground };
        });
      }, { png: buffer.toString('base64'), visible: visibleText.toString('base64'), positions });
      await hidden.evaluate(node => node.remove());
      assert(scores.every(score => score.inkPixels > 0 && score.minimum >= 4.5), `Low foreground contrast in ${theme} ${sample}: ${JSON.stringify(scores)}`);
      contrastResults.push({ theme, sample, minimum: Math.min(...scores.map(score => score.minimum)) });
    }
    await backing.evaluate(node => node.remove());
  }
  console.log('Rendered label contrast against an extreme backing:', JSON.stringify(contrastResults));
  await page.evaluate(() => window.fixture.theme('light'));
  await page.evaluate(() => window.fixture.sample('switcher'));
  await page.locator('#lab-switcher [data-glass-lens]').waitFor({state:'visible'});
  // Hold the lens input fixed while changing the layer below it. An opaque
  // optical result must not leak the lower layer through a mask transition.
  const fixedInput = await page.addStyleTag({ content: '#lab-world { visibility: hidden; } .glass-lens-scene .lab-world { visibility: visible; background: #606060 !important; } .glass-lens-scene .lab-background-text, #lab-switcher .lg-segmented > :not(.lg-segment-material) { visibility: hidden; }' });
  const opacityShots = [];
  for (const color of ['#000000', '#ffffff']) {
    // Change the physical backing without changing the neutral paper color
    // used for adaptive tone. The controlled filter input remains #606060.
    await page.evaluate(color => { document.querySelector('#lab-stage').style.backgroundImage = `linear-gradient(${color}, ${color})`; window.fixture.refresh(true); }, color);
    opacityShots.push((await page.locator('[data-glass-lens]').screenshot({ path: `${checks}opacity-${color.slice(1)}.png` })).toString('base64'));
  }
  const opacityDelta = await page.evaluate(async shots => {
    const decoded = await Promise.all(shots.map(async png => {
      const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return { width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data };
    }));
    const [a, b] = decoded;
    let maximum = 0;
    for (let y = 6; y < a.height - 6; y++) for (let x = a.height / 2 + 4; x < a.width - a.height / 2 - 4; x++) {
      const index = (y * a.width + Math.floor(x)) * 4;
      for (let channel = 0; channel < 3; channel++) maximum = Math.max(maximum, Math.abs(a.pixels[index + channel] - b.pixels[index + channel]));
    }
    return maximum;
  }, opacityShots);
  assert(opacityDelta <= 2, `The lens transition leaked its backing: channel delta ${opacityDelta}`);
  console.log(`Opaque optical blend verified: maximum channel delta ${opacityDelta}/255.`);
  await fixedInput.evaluate(node => node.remove());
  await page.evaluate(() => { document.querySelector('#lab-stage').style.removeProperty('background-image'); window.fixture.refresh(true); });
  // A genuinely white backing must read as clear glass: nearly white in the
  // reading area, with a visible, narrow contour rather than a gray plate.
  await page.evaluate(() => window.fixture.sample('search'));
  const plainFixture = await page.addStyleTag({content:'#lab-stage,.lab-world {background:#fff!important;} .lab-background-text,.glass-content {visibility:hidden!important;}'});
  await page.evaluate(() => window.fixture.refresh(true));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const plainShot = await page.locator('[data-glass-lens]').screenshot({path:`${checks}white-paper-contour.png`});
  const plainResults = await page.evaluate(async png => {
    const image=new Image();image.src=`data:image/png;base64,${png}`;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const context=canvas.getContext('2d');context.drawImage(image,0,0);
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    const at=(x,y)=>pixels[(Math.round(y)*canvas.width+Math.round(x))*4];
    const center=at(canvas.width*.65,canvas.height/2);
    const rim=[];for(let y=0;y<8;y++)rim.push(at(canvas.width*.65,y),at(canvas.width*.65,canvas.height-1-y));
    const interior=[];for(let y=12;y<canvas.height-12;y++)interior.push(at(canvas.width*.65,y));
    return {center,rimMinimum:Math.min(...rim),interiorRange:Math.max(...interior)-Math.min(...interior)};
  },plainShot.toString('base64'));
  assert(plainResults.center>=245,`White backing became a gray plate: ${JSON.stringify(plainResults)}`);
  assert(plainResults.rimMinimum<=230,`Flat white glass has no visible contour: ${JSON.stringify(plainResults)}`);
  assert(plainResults.interiorRange<=4,`Surface lighting extends into the reading area: ${JSON.stringify(plainResults)}`);
  console.log('Clear interior and visible contour on pure white:',JSON.stringify(plainResults));
  await plainFixture.evaluate(node=>node.remove());
  await page.evaluate(()=>window.fixture.sample('switcher'));
  // Photo-like color patches must retain their hue instead of washing into a
  // gray plate. This is measured from rendered pixels, not filter attributes.
  const photoFixture = await page.addStyleTag({content:'.lab-world { background: var(--photo-patch) !important; } #lab-switcher .lg-segmented > :not(.lg-segment-material) {visibility:hidden!important;}'});
  const colorResults=[];
  for (const theme of ['light','dark']) {
    await page.evaluate(theme=>window.fixture.theme(theme),theme);
    for (const rgb of [[35,124,140],[208,166,83],[169,84,136]]) {
      await page.evaluate(rgb=>{document.querySelector('#lab-stage').style.setProperty('--photo-patch',`rgb(${rgb.join(',')})`);window.fixture.refresh(true);},rgb);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const shot=await page.locator('[data-glass-lens]').screenshot();
      const rendered=await page.evaluate(async png=>{
        const image=new Image();image.src=`data:image/png;base64,${png}`;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
        const context=canvas.getContext('2d');context.drawImage(image,0,0);
        return [...context.getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data].slice(0,3);
      },shot.toString('base64'));
      const sourceSpread=Math.max(...rgb)-Math.min(...rgb),glassSpread=Math.max(...rendered)-Math.min(...rendered);
      assert(glassSpread/sourceSpread>=.6,`Photographic color was washed out: ${JSON.stringify({theme,rgb,rendered})}`);
      assert.equal(rendered.indexOf(Math.max(...rendered)),rgb.indexOf(Math.max(...rgb)),'Dominant photographic hue changed');
      colorResults.push({theme,source:rgb,glass:rendered,chromaRatio:Number((glassSpread/sourceSpread).toFixed(2))});
    }
  }
  console.log('Photo color retained under the material:',JSON.stringify(colorResults));
  await photoFixture.evaluate(node=>node.remove());
  await page.evaluate(()=>{document.querySelector('#lab-stage').style.removeProperty('--photo-patch');window.fixture.refresh(true);});
  await page.locator('body').evaluate(node => { node.dataset.glassFallback = 'true'; });
  await page.waitForFunction(() => !document.querySelector('[data-glass-lens]'));
  await page.locator('body').evaluate(node => { delete node.dataset.glassFallback; });
  await page.waitForFunction(() => document.querySelector('[data-glass-lens]'));
  await page.emulateMedia({forcedColors:'active'});
  await page.waitForFunction(() => !document.querySelector('[data-glass-lens]'));
  assert.deepEqual(errors, []);
  console.log('Optical checks passed. Engineering comparisons run in a separate fixture; public material parameters are fixed.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}

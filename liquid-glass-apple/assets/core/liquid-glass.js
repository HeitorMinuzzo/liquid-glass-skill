/* Liquid Glass optical material, refined in SKILLS. AGPL-3.0-only.
 * Controlled scene adapter; not an arbitrary DOM backdrop renderer.
 */
const NS = 'http://www.w3.org/2000/svg';
let sequence = 0;
const photoSamples = new WeakMap();
// Reuse identical, immutable maps across surfaces and resize round trips.
// Bound the number of entries and their serialized payload; never downsample.
const opticalMaps = new Map();
const mapCacheEntries = 16, mapCachePayload = 4 * 1024 * 1024;
let mapCacheSize = 0;
const svgNode = (tag, attributes = {}) => {
  const node = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
  return node;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Sample only supplied photo sources. Small cached canvases make dragging cheap;
// a cross-origin image that cannot be read still receives optical diffusion.
function photoBackdrop(material, source) {
  const glass = material.getBoundingClientRect();
  const images = [...(source?.matches('img') ? [source] : []), ...(source?.querySelectorAll('img') || [])];
  const nearby = images.map(image => ({image, box:image.getBoundingClientRect()})).filter(({box}) => box.right > glass.left && box.left < glass.right && box.bottom > glass.top && box.top < glass.bottom);
  if (!nearby.length) return {coverage:0};
  const radius = Math.min(parseFloat(getComputedStyle(material).borderTopLeftRadius) || 0, glass.width / 2, glass.height / 2);
  const color = [0,0,0]; let colored = 0;
  for (const item of nearby) {
    const {image, box} = item;
    let cached = photoSamples.get(image);
    if (!cached || cached.src !== image.currentSrc) {
      cached = {src:image.currentSrc};
      if (image.complete && image.naturalWidth) {
        try {
          const canvas = image.ownerDocument.createElement('canvas'); canvas.width = canvas.height = 64;
          const context = canvas.getContext('2d', {willReadFrequently:true}); context.drawImage(image,0,0,64,64);
          cached.pixels = context.getImageData(0,0,64,64).data;
        } catch { /* Image permissions must not prevent rendering the glass. */ }
        photoSamples.set(image,cached);
      }
    }
    item.pixels = cached.pixels;
    const style = getComputedStyle(image), fit = style.objectFit;
    const scale = fit === 'cover' ? Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight) : Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    item.width = fit === 'cover' || fit === 'contain' ? image.naturalWidth * scale : box.width;
    item.height = fit === 'cover' || fit === 'contain' ? image.naturalHeight * scale : box.height;
    const positions = style.objectPosition.split(' ');
    const offset = (value, available) => value?.endsWith('%') ? available * parseFloat(value) / 100 : parseFloat(value) || 0;
    item.left = box.left + offset(positions[0],box.width-item.width);
    item.top = box.top + offset(positions[1] || positions[0],box.height-item.height);
  }
  for (let row=0; row<5; row++) for (let column=0; column<13; column++) {
    const x=(column+.5)*glass.width/13, y=(row+.5)*glass.height/5;
    if (shapeAt(x,y,glass.width,glass.height,radius).depth < 0) continue;
    const px=glass.left+x, py=glass.top+y;
    const photo=nearby.find(item=>px>=item.box.left && px<=item.box.right && py>=item.box.top && py<=item.box.bottom && px>=item.left && px<=item.left+item.width && py>=item.top && py<=item.top+item.height);
    if (!photo) continue;
    if (!photo.pixels) continue;
    const sx=clamp(Math.floor((px-photo.left)/photo.width*64),0,63), sy=clamp(Math.floor((py-photo.top)/photo.height*64),0,63), index=(sy*64+sx)*4;
    if (!photo.pixels[index+3]) continue;
    for (let channel=0; channel<3; channel++) color[channel]+=photo.pixels[index+channel]/255;
    colored++;
  }
  // Area changes continuously while the image crosses the glass. Using a count
  // of color samples here would make the finish jump one row at a time.
  const area = nearby.reduce((sum,photo)=>{
    const width = Math.max(0,Math.min(glass.right,photo.box.right,photo.left+photo.width)-Math.max(glass.left,photo.box.left,photo.left));
    const height = Math.max(0,Math.min(glass.bottom,photo.box.bottom,photo.top+photo.height)-Math.max(glass.top,photo.box.top,photo.top));
    return sum + width*height;
  },0);
  return {coverage:clamp(area/(glass.width*glass.height),0,1), color:colored ? color.map(value=>value/colored) : null};
}

// Signed distance and outward normal of a rounded rectangle, in CSS pixels.
function shapeAt(x, y, width, height, radius) {
  const px = x - width / 2, py = y - height / 2;
  const qx = Math.abs(px) - (width / 2 - radius);
  const qy = Math.abs(py) - (height / 2 - radius);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  const length = Math.hypot(ax, ay);
  const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
  let nx = 0, ny = 0;
  if (length > 0) { nx = ax / length; ny = ay / length; }
  else if (qx > qy) nx = 1;
  else ny = 1;
  return { depth: -distance, nx: nx * Math.sign(px), ny: ny * Math.sign(py) };
}

function makeMap(width, height, radius, amount, edgeWidth, edgeProfile) {
  const canvas = document.createElement('canvas');
  const padding = 48;
  // Sample the optical curve at 2x for smooth corners. Repeated drag frames
  // reuse the same map instead of regenerating it.
  const resolution = 2;
  canvas.width = Math.ceil((width + padding * 2) * resolution);
  canvas.height = Math.ceil((height + padding * 2) * resolution);
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(canvas.width, canvas.height);
  const reflectionCanvas = document.createElement('canvas');
  reflectionCanvas.width = canvas.width; reflectionCanvas.height = canvas.height;
  const reflectionContext = reflectionCanvas.getContext('2d');
  const reflections = reflectionContext.createImageData(canvas.width, canvas.height);
  // The rounded shoulder begins at the contour and occupies roughly a third
  // of a small capsule's height. A narrow 7px bevel merely cropped body text;
  // this shoulder leaves room for an elongated, reflected image at the rim.
  // Larger capsules need a proportionally deeper optical shoulder. Keeping
  // the 18px cap while doubling a search bar flattened its photographic fold.
  // Extended is the approved profile; standard retains the earlier geometry.
  const extended = edgeProfile === 'extended';
  const opticalScale = extended ? Math.max(1, Math.min(height / 52, radius / 26)) : 1;
  const verticalBand = Math.min(18 * opticalScale, height * .33, width * .08, radius * .66);
  const lateralBand = Math.min(21 * opticalScale, height * .36, width * .1, radius * .72);
  // A rounded, flattened shoulder supplies the surface normal. Trace a ray
  // through that shoulder with Snell's law instead of imposing an arbitrary
  // cubic offset and sideways stretch. The thickness starts at the contour,
  // rises through the bevel, then joins a flat reading area.
  const thickness = Math.min(18 * opticalScale, radius * .70);
  // Optical separation from the backing is part of the ray's travel. With
  // zero separation, thickness collapses at the rim and the reflection turns
  // into a tiny pinch. This calibrated distance restores the visible fold.
  const backingDistance = Math.min(14 * opticalScale, radius * .54);
  const refractiveIndex = 1.50;
  // Keep the full ray travel instead of clipping large lenses at +/-32px.
  const scale = 64 * opticalScale;
  const shoulderPower = extended ? 3 : 4;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const px = (x + .5) / resolution - padding;
      const py = (y + .5) / resolution - padding;
      const { depth, nx, ny } = shapeAt(px, py, width, height, radius);
      const lateral = nx * nx;
      const band = verticalBand + (lateralBand - verticalBand) * lateral;
      // Width stretches the chosen shoulder without changing its ray travel.
      // Keep a flat center on small pills, including their rounded ends.
      const edgeScale = band > 0 ? Math.min(edgeWidth, height * .42 / band, width * .42 / band) : 1;
      const opticalDepth = depth / edgeScale;
      const t = band > 0 ? clamp(opticalDepth / band, 0, 1) : 1;
      const u = 1 - t;
      // A rounder shoulder carries the bend farther inward, then joins the
      // flat center with zero slope. This changes refraction, not center blur.
      const surface = Math.max(1 - u ** shoulderPower, .0001) ** (1 / shoulderPower);
      const slope = band > 0 ? thickness / band * u ** (shoulderPower - 1) / surface ** (shoulderPower - 1) : 0;
      const incidence = Math.atan(slope);
      const transmission = Math.asin(Math.sin(incidence) / refractiveIndex);
      const shift = depth >= 0 && opticalDepth < band
        ? -Math.tan(incidence - transmission) * (thickness * surface + backingDistance) * amount : 0;
      // Rounded ends use the true 2D normal, so the same lens curves around
      // the left and right ends without a separate horizontal ripple.
      const dx = nx * shift;
      const dy = ny * shift;
      const index = (y * canvas.width + x) * 4;
      pixels.data[index] = clamp(Math.round(127.5 + dx / scale * 255), 0, 255);
      pixels.data[index + 1] = clamp(Math.round(127.5 + dy / scale * 255), 0, 255);
      // A continuous mask transitions from the softer rim to the reading area.
      pixels.data[index + 2] = Math.round((1 - t * t * (3 - 2 * t)) * 255);
      pixels.data[index + 3] = 255;
      if (depth >= 0) {
        // Fresnel reflection rises toward grazing angles. A neutral studio
        // environment supplies light and dark reflections even on blank paper.
        // It uses the same shoulder normal, without moving background pixels.
        const cosine = Math.cos(incidence);
        const fresnel = .04 + .96 * (1 - cosine) ** 5;
        const direction = nx * -.55 + ny * -.83;
        const key = clamp((direction + .2) / 1.1, 0, 1);
        const environment = .16 + .84 * key * key * (3 - 2 * key);
        // One continuous roll of reflected light, strongest at the contour,
        // fades through the rounded shoulder. The dark side reflects less of
        // the environment, rather than becoming a thick black bevel.
        const shoulder = Math.exp(-(((opticalDepth - 1.3) / 2.4) ** 2));
        const reflectance = (.55 * fresnel + .50 * shoulder) * (.12 + .88 * key) * (1 - t) ** 2;
        reflections.data[index] = reflections.data[index + 1] = reflections.data[index + 2] = Math.round(environment * 255);
        reflections.data[index + 3] = Math.round(reflectance * 255);
      }
    }
  }
  context.putImageData(pixels, 0, 0);
  reflectionContext.putImageData(reflections, 0, 0);
  return { url: canvas.toDataURL('image/png'), reflection: reflectionCanvas.toDataURL('image/png'), scale };
}

function opticalMap(key, width, height, radius, options) {
  const cached = opticalMaps.get(key);
  if (cached) {
    opticalMaps.delete(key); opticalMaps.set(key, cached);
    return cached;
  }
  const map = makeMap(width, height, radius, options.strength, options.edgeWidth, options.edgeProfile);
  const size = map.url.length + map.reflection.length;
  if (size <= mapCachePayload) {
    while (opticalMaps.size >= mapCacheEntries || mapCacheSize + size > mapCachePayload) {
      const oldest = opticalMaps.keys().next().value, entry = opticalMaps.get(oldest);
      mapCacheSize -= entry.url.length + entry.reflection.length;
      opticalMaps.delete(oldest);
    }
    opticalMaps.set(key, map); mapCacheSize += size;
  }
  return map;
}

/**
 * Attach the approved lens to surfaces above a controlled, presentational scene.
 * Call on mount. `source` holds background text/images, not interactive UI.
 * `renderBackdrop` may supply a project-specific background instead of cloning.
 */
export function createGlassScene({ stage, source, themeRoot = stage.closest('[data-liquid-glass]') || stage,
  renderBackdrop, adaptToPhotos = true, onStatus = () => {} }) {
  if (!stage || (!source && !renderBackdrop)) throw new Error('Glass needs a stage and a presentational background source.');
  const records = new Map();
  const svg = svgNode('svg', { width: 0, height: 0, 'aria-hidden': true, focusable: false });
  svg.classList.add('glass-lens-definitions');
  const defs = svgNode('defs'); svg.append(defs); stage.ownerDocument.body.append(svg);
  const preferences = ['(prefers-reduced-transparency: reduce)', '(prefers-contrast: more)', '(forced-colors: active)'].map(query => matchMedia(query));
  let frame = 0, disposed = false;

  function build(node, options) {
    const id = `glass-lens-${++sequence}`;
    const filter = svgNode('filter', { id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
    const map = svgNode('feImage', { result: 'lens-map', preserveAspectRatio: 'none', x: -48, y: -48 });
    const softness = svgNode('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: .4, edgeMode: 'duplicate', result: 'soft-background' });
    const displacement = svgNode('feDisplacementMap', { in: 'soft-background', in2: 'lens-map', xChannelSelector: 'R', yChannelSelector: 'G', result: 'refracted' });
    const mask = svgNode('feColorMatrix', { in: 'lens-map', type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0', result: 'rim-mask' });
    const rimBlur = svgNode('feGaussianBlur', { in: 'refracted', stdDeviation: 1.15, edgeMode: 'duplicate', result: 'soft-rim' });
    const centerBlur = svgNode('feGaussianBlur', { in: 'refracted', stdDeviation: .25, edgeMode: 'duplicate', result: 'soft-center' });
    const tone = (input, result, slope) => {
      // Compress luminance for legibility without crushing photographic color.
      // A uniform RGB slope turned a blue/green/gold image into gray plastic.
      const transfer = svgNode('feColorMatrix', { in: input, result, type: 'matrix' });
      return { transfer, slope, chroma: .86 };
    };
    const rimTone = tone('soft-rim', 'rim-material', .30);
    const centerTone = tone('soft-center', 'center-material', .24);
    const rim = svgNode('feComposite', { in: 'rim-material', in2: 'rim-mask', operator: 'in', result: 'rim' });
    const center = svgNode('feComposite', { in: 'center-material', in2: 'rim-mask', operator: 'out', result: 'center' });
    // Add complementary masks; alpha-over introduced a pale seam at the bevel.
    const merge = svgNode('feComposite', { in: 'center', in2: 'rim', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'tinted-backdrop' });
    const reflection = svgNode('feImage', { result: 'surface-reflection', preserveAspectRatio: 'none', x: -48, y: -48 });
    const reflectionTone = svgNode('feComponentTransfer', { in: 'surface-reflection', result: 'theme-reflection' });
    const reflectionAlpha = svgNode('feFuncA', { type: 'linear', slope: 1 }); reflectionTone.append(reflectionAlpha);
    const finish = svgNode('feComposite', { in: 'theme-reflection', in2: 'tinted-backdrop', operator: 'over' });
    filter.append(map, softness, displacement, mask, rimBlur, centerBlur, rimTone.transfer, centerTone.transfer, rim, center, merge, reflection, reflectionTone, finish);
    defs.append(filter);
    const windowNode = document.createElement('span'); windowNode.className = 'glass-lens-window';
    windowNode.setAttribute('aria-hidden', 'true'); windowNode.inert = true;
    windowNode.style.filter = `url("#${id}") saturate(1.15)`;
    const scene = document.createElement('span'); scene.className = 'glass-lens-scene';
    windowNode.append(scene); node.append(windowNode);
    return { node, options, windowNode, scene, filter, map, reflection, reflectionAlpha, displacement, rimTone, centerTone, geometry: '', dirty: true };
  }

  function syncAppearance(record, context) {
    const {style, value, light} = context;
    const hex = /^#([\da-f]{6})$/i.exec(value)?.[1] || (themeRoot.dataset.theme === 'dark' ? '1b1b1d' : 'e8e8e9');
    const photo = adaptToPhotos ? photoBackdrop(record.node,source) : {coverage:0};
    const coverage = photo.coverage;
    const appearance = `${themeRoot.dataset.theme}:${value}:${style.backgroundColor}:${coverage.toFixed(2)}:${photo.color?.map(channel=>Math.round(channel*255)).join(',')}`;
    if (record.appearance === appearance) return;
    record.appearance = appearance;
    record.reflectionAlpha.setAttribute('slope', (light ? 1 : .48) * (1 - coverage * .32));
    record.windowNode.style.filter = `url("#${record.filter.id}") saturate(${1.15 - coverage * .10})`;
    const surface = record.node.closest('.liquid-glass');
    if (adaptToPhotos && surface) {
      surface.toggleAttribute('data-photo-glass',coverage > 0);
      surface.style.setProperty('--glass-photo-rim-opacity',String(1 - coverage * .28));
    }
    const base = [0, 1, 2].map(index => parseInt(hex.slice(index * 2, index * 2 + 2), 16) / 255);
    const paper = /^rgba?\(([^)]+)\)$/.exec(style.backgroundColor)?.[1].match(/[\d.]+/g)?.map(Number);
    // A white page should transmit white instead of turning into a gray plate.
    // Follow brighter neutral paper; keep the calibrated base on colored/dark
    // backgrounds so photographic and foreground contrast stay predictable.
    if (light && paper?.length >= 3 && (paper[3] ?? 1) === 1 && Math.max(...paper.slice(0, 3)) - Math.min(...paper.slice(0, 3)) <= 8) {
      const brightness = Math.min(...paper.slice(0, 3)) / 255;
      for (let index = 0; index < 3; index++) base[index] = Math.max(base[index], brightness);
    }
    if (photo.color) {
      // A softly lit tint follows the actual photograph, rather than laying
      // neutral gray over wood, greenery or sky. Text-only backdrops are intact.
      const luminance = photo.color.reduce((sum,channel,index)=>sum+channel*[.2126,.7152,.0722][index],0);
      const target = light ? .91 : .27, weight = coverage * (light ? .75 : .55);
      for (let index=0; index<3; index++) {
        const tint = clamp(target + (photo.color[index]-luminance)*.45,0,1);
        base[index] += (tint-base[index])*weight;
      }
    }
    [record.rimTone, record.centerTone].forEach(tone => {
      // Light glass passes more image detail instead of mixing 76% pale base
      // into every pixel. Text is attenuated separately in the scene copy.
      const originalSlope = light ? (tone === record.rimTone ? .50 : .47) : tone.slope;
      // Let a little more of a photograph through the light material instead
      // of filling it with a pale gray veil. Keep the optical map, diffusion
      // and attenuation of text-only backdrops exactly as calibrated.
      const slope = originalSlope + ((light ? .56 : .38)-originalSlope)*coverage;
      const chroma = tone.chroma + ((light ? .70 : .72)-tone.chroma)*coverage;
      const luminance = [.2126, .7152, .0722];
      const values = [0, 1, 2].flatMap(index => [
        ...luminance.map((weight, channel) => (index === channel ? chroma : 0) + (slope - chroma) * weight),
        0, base[index] * (1 - slope)
      ]);
      tone.transfer.setAttribute('values', [...values, 0, 0, 0, 1, 0].join(' '));
    });
  }

  function syncScene(record, context) {
    const {light} = context;
    if (!context.variables) {
      const style = context.computedStage;
      context.variables = [...style].filter(name => name.startsWith('--')).map(name => [name, style.getPropertyValue(name)]);
      context.sceneStyle = {
        width: `${stage.clientWidth}px`, height: `${stage.clientHeight}px`,
        backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage,
        backgroundSize: style.backgroundSize, backgroundPosition: style.backgroundPosition,
        backgroundRepeat: style.backgroundRepeat
      };
    }
    Object.assign(record.scene.style, context.sceneStyle);
    // Preserve scene variables (text size, colors, layout) without assuming
    // names belonging to this demo or to a particular framework.
    record.variables?.forEach(name => record.scene.style.removeProperty(name));
    record.variables = context.variables.map(([name]) => name);
    context.variables.forEach(([name, value]) => record.scene.style.setProperty(name, value));
    record.scene.replaceChildren();
    if (renderBackdrop) renderBackdrop(record.scene);
    else {
      // Read the live source once per paint, then keep independent copies.
      // No extra clone is needed for a scene with only one active surface.
      if (!context.colors) {
        context.colors = [];
        if (light) [source, ...source.querySelectorAll('*')].forEach((original, index) => {
          if (![...original.childNodes].some(node => node.nodeType === 3 && node.textContent.trim())) return;
          context.colors.push([index, `color-mix(in srgb, ${getComputedStyle(original).color} 52%, transparent)`]);
        });
        const originals = [...(source.matches('img') ? [source] : []), ...source.querySelectorAll('img')];
        context.imageFilters = originals.map(image => getComputedStyle(image).filter);
      }
      const copy = source.cloneNode(true);
      if (context.colors.length) {
        const elements = [copy, ...copy.querySelectorAll('*')];
        context.colors.forEach(([index, color]) => {elements[index].style.color = color;});
      }
      copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      // Photographs get a gentle diffusion before refraction. Text still uses
      // the sharp reading center; this does not raise blur across the scene.
      const pictures = [...(copy.matches('img') ? [copy] : []), ...copy.querySelectorAll('img')];
      pictures.forEach((picture, index) => {
        const originalFilter = context.imageFilters[index];
        const diffusion = adaptToPhotos ? clamp(record.node.offsetHeight * (light ? .035 : .04),1.5,6) : light ? .9 : 1.4;
        picture.style.filter = `${originalFilter === 'none' ? '' : originalFilter} blur(${diffusion}px)`.trim();
      });
      record.scene.append(copy);
    }
    record.dirty = false;
  }

  function paint() {
    frame = 0;
    if (disposed) return;
    const accessible = preferences.some(query => query.matches) || themeRoot.dataset.glassFallback === 'true' || themeRoot.dataset.lgFallback === 'true';
    const supported = CSS.supports('filter', 'url("#glass-lens")');
    let active = 0, context;
    for (const record of records.values()) {
      const { node } = record;
      const visible = node.isConnected && node.offsetWidth > 0 && node.offsetHeight > 0 && (!node.checkVisibility || node.checkVisibility());
      if (accessible || !supported || !record.options.enabled || !visible) { node.removeAttribute('data-glass-lens'); clearAppearance(record); continue; }
      const width = node.offsetWidth, height = node.offsetHeight;
      const radius = Math.min(parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0, width / 2, height / 2);
      if (!context) {
        const style = getComputedStyle(stage), theme = getComputedStyle(themeRoot);
        context = {
          computedStage: style, style: {backgroundColor: style.backgroundColor},
          value: theme.getPropertyValue('--glass-neutral').trim(), light: themeRoot.dataset.theme !== 'dark',
          rect: stage.getBoundingClientRect(), left: stage.clientLeft, top: stage.clientTop
        };
      }
      const geometry = `${width}:${height}:${radius}:${record.options.strength}:${record.options.edgeWidth}:${record.options.edgeProfile}`;
      if (record.geometry !== geometry) {
        const map = opticalMap(geometry, width, height, radius, record.options);
        Object.entries({ x: -48, y: -48, width: width + 96, height: height + 96 }).forEach(([name, value]) => record.filter.setAttribute(name, value));
        record.map.setAttribute('width', width + 96); record.map.setAttribute('height', height + 96);
        record.map.setAttribute('href', map.url); record.displacement.setAttribute('scale', map.scale);
        record.reflection.setAttribute('width', width + 96); record.reflection.setAttribute('height', height + 96);
        record.reflection.setAttribute('href', map.reflection);
        record.geometry = geometry;
      }
      const rect = node.getBoundingClientRect();
      record.scene.style.left = `${context.rect.left + context.left - rect.left}px`;
      record.scene.style.top = `${context.rect.top + context.top - rect.top}px`;
      syncAppearance(record, context);
      if (record.dirty) syncScene(record, context);
      node.dataset.glassLens = 'edge'; active++;
    }
    onStatus({ active, accessible, supported });
  }

  function refresh(background = false) {
    if (disposed) return;
    if (background) records.forEach(record => { record.dirty = true; });
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function clearAppearance(record) {
    if (!adaptToPhotos) return;
    const surface = record.node.closest('.liquid-glass');
    surface?.removeAttribute('data-photo-glass');
    surface?.style.removeProperty('--glass-photo-rim-opacity');
    record.appearance = '';
  }
  const resize = new ResizeObserver(() => refresh(true)); resize.observe(stage);
  const appearance = new MutationObserver(() => refresh(true));
  appearance.observe(themeRoot, { attributes: true, attributeFilter: ['data-theme', 'data-glass-fallback', 'data-lg-fallback', 'class', 'style'] });
  const background = new MutationObserver(() => refresh(true));
  if (source) background.observe(source, { childList: true, subtree: true, characterData: true, attributes: true });
  if (stage !== themeRoot) background.observe(stage, { attributes: true });
  const reposition = () => refresh();
  preferences.forEach(query => query.addEventListener('change', reposition));
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
  document.fonts?.ready.then(() => refresh(true));

  function add(node, options = {}) {
    if (disposed) throw new Error('This glass scene was destroyed.');
    if (records.has(node)) throw new Error('This material already belongs to the scene.');
    const normalize = values => ({
      enabled: values.enabled ?? true,
      strength: clamp(Number.isFinite(values.strength) ? values.strength : 1, 0, 1.4),
      edgeWidth: clamp(Number.isFinite(values.edgeWidth) ? values.edgeWidth : 1.2, .75, 1.25),
      edgeProfile: values.edgeProfile === 'standard' ? 'standard' : 'extended'
    });
    const record = build(node, normalize(options)); records.set(node, record); resize.observe(node); refresh();
    return {
      update(next) { if (!records.has(node)) return; record.options = normalize({ ...record.options, ...next }); refresh(); },
      destroy() {
        if (!records.has(node)) return;
        resize.unobserve(node); node.removeAttribute('data-glass-lens'); clearAppearance(record);
        record.windowNode.remove(); record.filter.remove(); records.delete(node); refresh();
      }
    };
  }
  return {
    add, refresh,
    destroy() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); appearance.disconnect(); background.disconnect();
      preferences.forEach(query => query.removeEventListener('change', reposition));
      window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true);
      records.forEach(record => { record.node.removeAttribute('data-glass-lens'); clearAppearance(record); record.windowNode.remove(); });
      records.clear(); svg.remove();
    }
  };
}

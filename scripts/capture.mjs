// Real browser captures and checks for the fixed-material article playground. AGPL-3.0-only.
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from './serve.mjs';
const {chromium} = createRequire(import.meta.url)('playwright');
const images = fileURLToPath(new URL('../docs/images/', import.meta.url));
const server = createServer();
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const errors = [], output = [];
let browser;
async function settled(page) {
  await page.waitForFunction(() => document.querySelector('[data-glass-lens="edge"]'));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function aligned(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => {
    const source = document.querySelector('#lab-world').getBoundingClientRect();
    const copy = document.querySelector('[data-glass-lens] .lab-world')?.getBoundingClientRect();
    return copy && ['x','y','width','height'].every(key => Math.abs(source[key]-copy[key]) < .5);
  });
}
async function homeAligned(page) {
  await page.waitForFunction(() => {
    const original=document.querySelector('#home-scene > .home-source')?.getBoundingClientRect();
    const copies=[...document.querySelectorAll('#home-scene .glass-lens-scene .home-source')];
    return original&&copies.length===3&&copies.every(node=>{
      const copy=node.getBoundingClientRect();
      return ['x','y','width','height'].every(key=>Math.abs(original[key]-copy[key])<.5);
    });
  });
}
async function centeredInFrame(page) {
  assert(await page.locator('#lab-object').evaluate(object=>{
    const viewport=document.querySelector('#lab-viewport'), box=viewport.getBoundingClientRect(), glass=object.getBoundingClientRect();
    return Math.abs(glass.x+glass.width/2-box.x-viewport.clientLeft-viewport.clientWidth/2)<1&&Math.abs(glass.y+glass.height/2-box.y-viewport.clientTop-viewport.clientHeight/2)<1;
  }),'Glass must start centered inside the playground frame');
}
async function scrollArticle(page,offset) {
  await page.locator('#lab-scroll').evaluate((node,offset)=>{node.scrollTop=offset;},offset); await aligned(page);
}
async function moveToPhoto(page) {
  await page.evaluate(() => {
    const image = document.querySelector('#lab-world img').getBoundingClientRect();
    const glass = document.querySelector('#lab-object').getBoundingClientRect();
    document.querySelector('#lab-scroll').scrollTop += image.top + image.height * .6 - (glass.top + glass.height/2);
  }); await aligned(page);
}
function observe(page) {
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))errors.push(`${response.status()} ${response.url()}`);});
  return page.route('https://**/*',route=>{errors.push(`Unexpected external asset: ${route.request().url()}`);return route.abort();});
}
try {
  await mkdir(images,{recursive:true});
  browser = await chromium.launch({headless:true,...(process.env.SHOWCASE_BROWSER?{executablePath:process.env.SHOWCASE_BROWSER}:{})});
  const shots = [
    {name:'home-light',view:'home',theme:'light'},
    {name:'home-dark',view:'home',theme:'dark'},
    {name:'home-color-light',view:'home',theme:'light',backdrop:'aurora'},
    {name:'home-color-dark',view:'home',theme:'dark',backdrop:'aurora'},
    {name:'home-mobile',view:'home',theme:'light',mobile:true},
    {name:'home-playground-light',view:'home',theme:'light',embedded:true,sample:'search'},
    {name:'home-playground-dark',view:'home',theme:'dark',embedded:true,sample:'search'},
    {name:'home-playground-mobile',view:'home',theme:'light',embedded:true,mobile:true,sample:'search'},
    {name:'components-light',view:'gallery',theme:'light'},
    {name:'components-dark',view:'gallery',theme:'dark'},
    {name:'components-color-light',view:'gallery',theme:'light',backdrop:'aurora'},
    {name:'components-color-dark',view:'gallery',theme:'dark',backdrop:'aurora'},
    {name:'components-mobile',view:'gallery',theme:'light',mobile:true},
    {name:'playground-light',view:'playground',theme:'light'},
    {name:'playground-dark',view:'playground',theme:'dark'},
    {name:'playground-search-light',view:'playground',theme:'light',sample:'search'},
    {name:'playground-search-dark',view:'playground',theme:'dark',sample:'search'},
    {name:'playground-photo',view:'playground',theme:'light',sample:'search',photo:true},
    {name:'playground-mixed',view:'playground',theme:'dark',photo:true},
    {name:'playground-mobile',view:'playground',theme:'light',mobile:true},
    {name:'material-photo-light',view:'playground',theme:'light',sample:'search',photo:true,detail:true},
    {name:'material-photo-dark',view:'playground',theme:'dark',sample:'search',photo:true,detail:true},
    {name:'material-empty-light',view:'playground',theme:'light',sample:'search',empty:true,paper:'#ffffff',detail:true},
    {name:'material-empty-dark',view:'playground',theme:'dark',sample:'search',empty:true,paper:'#000000',detail:true},
  ];
  for (const shot of shots) {
    const viewport = shot.mobile ? {width:390,height:844} : {width:1440,height:1000};
    const page = await browser.newPage({viewport,deviceScaleFactor:2,reducedMotion:'reduce'});
    await observe(page);
    await page.goto(`${base}/docs/showcase/index.html?view=${shot.view}&theme=${shot.theme}&backdrop=${shot.backdrop||'none'}&sample=${shot.sample||'switcher'}`);
    await page.waitForFunction(() => window.showcaseReady);
    if (shot.view==='gallery') await page.waitForFunction(() => document.querySelectorAll('#gallery [data-glass-lens]').length===14);
    else if (shot.view==='home') {
      await homeAligned(page);
      await page.waitForFunction(() => window.playgroundReady && [...document.querySelectorAll('#lab-world img')].every(img=>img.complete&&img.naturalWidth>0));
      if (shot.embedded) {
        await page.locator('#playground').evaluate(node=>node.scrollIntoView({block:'start'}));
        await page.locator('#lab-object').waitFor({state:'visible'}); await aligned(page);
      }
    } else {
      await page.waitForFunction(() => window.playgroundReady && [...document.querySelectorAll('#lab-world img')].every(img=>img.complete&&img.naturalWidth>0));
      if (shot.photo) await moveToPhoto(page); await aligned(page);
      if (shot.empty) {
        await page.locator('#lab-edit').click(); await page.locator('#lab-title').fill(''); await page.locator('#lab-copy').fill('');
        if(shot.paper) {await page.locator('#lab-paper').fill(shot.paper);await page.locator('#lab-paper').dispatchEvent('input');}
        await page.locator('#lab-images').uncheck(); await page.locator('.editor-done').click(); await aligned(page);
      }
    }
    await settled(page);
    const metrics = await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport:innerWidth}));
    assert(metrics.width<=metrics.viewport,`Horizontal overflow in ${shot.name}`);
    const fullPage=shot.view==='gallery'; let clip;
    if (shot.detail) {
      await page.addStyleTag({content:'.lab-drag{visibility:hidden;}'});
      const rect=await page.locator('#lab-object').boundingBox(); clip={x:rect.x-80,y:rect.y-70,width:rect.width+160,height:rect.height+140};
    }
    await page.screenshot({path:`${images}${shot.name}.png`,fullPage,...(clip?{clip}:{}),animations:'disabled'});
    output.push({file:`${shot.name}.png`,width:(clip?clip.width:viewport.width)*2,height:(clip?clip.height:fullPage?Math.max(metrics.height,viewport.height):viewport.height)*2,theme:shot.theme,view:shot.view,backdrop:shot.backdrop||'none',scale:2,material:'fixed-recipe',...(shot.embedded?{content:'playground below home showcase'}:shot.photo?{content:'article photograph'}:shot.empty?{content:'empty background',paper:shot.paper}:{})});
    if (['components-light','components-dark'].includes(shot.name)) {
      const name=`components-detail-${shot.theme}.png`;
      const bounds=await page.locator('.collection-section').boundingBox();
      await page.locator('.collection-section').screenshot({path:`${images}${name}`});
      output.push({file:name,width:Math.round(bounds.width*2),height:Math.ceil(bounds.height*2),theme:shot.theme,view:'gallery',scale:2,material:'fixed-recipe'});
    }
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2}); await observe(page);
  // The public entry introduces the skill with three functioning glass examples.
  await page.goto(`${base}/`); await settled(page);
  assert.equal(await page.locator('#home').isVisible(),true,'Site entry must lead to the skill introduction');
  assert.equal(await page.locator('main:visible').count(),1);
  assert.equal(await page.locator('.demo-nav [aria-current="page"]').getAttribute('data-demo-link'),'home');
  const homeInput=page.getByRole('searchbox',{name:'Search skill demonstration'});
  await homeInput.fill('A glass example'); await homeAligned(page);
  assert.equal(await page.locator('#home .home-example').count(),3);
  assert.equal(await page.locator('#home-scene [data-glass-lens]').count(),3);
  assert.deepEqual(await page.locator('#home-scene figcaption').allTextContents(),['Search','Switcher','Button']);
  await page.waitForFunction(()=>window.playgroundReady);
  assert.equal(await page.locator('#home > #playground').count(),1,'Home must contain the original playground');
  assert(await page.locator('#lab-object').evaluate(object=>object.getBoundingClientRect().top>=document.querySelector('#lab-viewport').getBoundingClientRect().top),'Playground glass must stay inside its frame');
  const homeSwitcher=page.getByRole('group',{name:'Home view mode'});
  await homeSwitcher.getByRole('button',{name:'Preview',exact:true}).click();
  assert.equal(await homeSwitcher.getByRole('button',{name:'Preview',exact:true}).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Home');
  assert.equal(await homeSwitcher.getByRole('button',{name:'Editor',exact:true}).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('ArrowRight');
  assert.equal(await homeSwitcher.getByRole('button',{name:'Split',exact:true}).getAttribute('aria-pressed'),'true');
  await page.locator('#home [data-home-action]').click();
  assert.equal(await page.locator('.home-action-label').textContent(),'Project created');
  const homeMap=await page.locator('.glass-lens-definitions feImage').first().getAttribute('href');
  await page.getByRole('button',{name:'Dark',exact:true}).click(); await settled(page); await homeAligned(page);
  await page.locator('#backdrop').click(); await page.locator('[data-backdrop-choice="aurora"]').click(); await settled(page); await homeAligned(page);
  assert.equal(await homeInput.inputValue(),'A glass example','Appearance settings must preserve the Search field');
  assert(homeMap===await page.locator('.glass-lens-definitions feImage').first().getAttribute('href'),'Home appearance settings must preserve the material geometry');
  assert.equal(await homeSwitcher.getByRole('button',{name:'Split',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.home-action-label').textContent(),'Project created');
  await page.locator('.home-primary').click(); await settled(page);
  assert.equal(await page.locator('#gallery').isVisible(),true);
  assert.equal(await page.locator('body').getAttribute('data-theme'),'dark');
  assert.equal(await page.locator('body').getAttribute('data-glass-backdrop'),'aurora');
  await page.locator('.demo-nav [data-demo-link="home"]').click(); await settled(page); await homeAligned(page);
  assert.equal(await page.locator('#home').isVisible(),true);
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900}); await settled(page); await homeAligned(page);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Home overflow at ${width}`);
    assert(await page.locator('#home-scene').evaluate(stage=>{
      const box=stage.getBoundingClientRect();
      return [...stage.querySelectorAll('.home-component > .liquid-glass')].every(node=>{
        const glass=node.getBoundingClientRect();
        return glass.left>=box.left&&glass.right<=box.right&&glass.top>=box.top&&glass.bottom<=box.bottom;
      });
    }),`Home examples must remain inside the showcase at ${width}`);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('.home-secondary').click(); await settled(page);
  assert.equal(await page.locator('#lab-search').isVisible(),true,'Home playground link must open the Search example');
  assert.equal(await page.locator('#home').isVisible(),true,'The playground shortcut must stay on Home');
  assert.equal(new URL(page.url()).hash,'#playground');
  await aligned(page);
  const homeLabInput=page.locator('#lab-search input');
  await homeLabInput.fill('Home playground');
  await centeredInFrame(page);
  // Reproduce the user's exact Home route and appearance.
  await page.goto(`${base}/docs/showcase/index.html?view=home&theme=dark&backdrop=none#playground`);
  await settled(page); await aligned(page); await centeredInFrame(page);
  await page.locator('[data-lab-sample="search"]').click(); await homeLabInput.fill('Home playground'); await aligned(page);
  const homeLabBounds=await page.locator('#lab-object').boundingBox();
  await page.evaluate(()=>{
    window.scrollPositionWrites=0;
    window.scrollPositionObserver=new MutationObserver(records=>{window.scrollPositionWrites+=records.length;});
    window.scrollPositionObserver.observe(document.querySelector('#lab-object'),{attributes:true,attributeFilter:['style']});
  });
  const homePageScroll=await page.evaluate(()=>scrollY);
  for(const offset of [220,900,1600,600,0]) {
    await scrollArticle(page,offset);
    const bounds=await page.locator('#lab-object').boundingBox();
    assert(bounds&&Math.abs(bounds.x-homeLabBounds.x)<1&&Math.abs(bounds.y-homeLabBounds.y)<1,'Internal article scrolling must preserve the glass position');
    assert.equal(await page.evaluate(()=>scrollY),homePageScroll,'Article scrolling must not move Home');
  }
  assert.equal(await page.evaluate(()=>{window.scrollPositionObserver.disconnect();return window.scrollPositionWrites;}),0,'Article scrolling must never rewrite glass coordinates');
  const homeDocumentPosition=homeLabBounds.y+homePageScroll;
  for(const offset of [homePageScroll+200,0,homePageScroll]) {
    await page.evaluate(offset=>scrollTo(0,offset),offset); await aligned(page);
    const bounds=await page.locator('#lab-object').boundingBox();
    assert(Math.abs(bounds.y+await page.evaluate(()=>scrollY)-homeDocumentPosition)<1,'Scrolling Home must leave glass attached to the same place in its frame');
    assert.equal(await page.locator('#lab-scroll').evaluate(node=>node.scrollTop),0,'Home scrolling must not advance the article');
  }
  await page.mouse.move(homeLabBounds.x+120,homeLabBounds.y+25); await page.mouse.wheel(0,260);
  await page.waitForFunction(()=>document.querySelector('#lab-scroll').scrollTop>0); await aligned(page);
  assert.equal(await page.evaluate(()=>scrollY),homePageScroll,'Wheel input over glass must scroll only the article');
  assert(Math.abs((await page.locator('#lab-object').boundingBox()).y-homeLabBounds.y)<1,'Wheel input must not move glass');
  await moveToPhoto(page); assert.equal(await homeLabInput.inputValue(),'Home playground');
  const homeGrip=page.locator('.lab-drag'); await homeGrip.focus(); await homeGrip.press('ArrowRight'); await homeGrip.press('ArrowUp'); await aligned(page);
  const movedHomeGlass=await page.locator('#lab-object').boundingBox(),movedHomeScroll=await page.locator('#lab-scroll').evaluate(node=>node.scrollTop);
  for(const offset of [240,-120,0]) {
    await scrollArticle(page,movedHomeScroll+offset);
    const bounds=await page.locator('#lab-object').boundingBox();
    assert(bounds&&Math.abs(bounds.x-movedHomeGlass.x)<1&&Math.abs(bounds.y-movedHomeGlass.y)<1,'Internal scrolling must preserve a user-chosen glass position');
  }
  await homeGrip.press('Home'); await aligned(page); await centeredInFrame(page);
  await page.locator('#lab-edit').click(); await page.locator('#lab-title').fill('Glass on the Home page');
  assert.equal(await page.locator('#lab-world h1').textContent(),'Glass on the Home page');
  await page.locator('.editor-done').click(); await aligned(page);
  await page.waitForFunction(()=>document.querySelector('[data-glass-lens] .lab-world h1')?.textContent==='Glass on the Home page');
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.locator('#playground').evaluate(node=>node.scrollIntoView({block:'start'})); await aligned(page); await centeredInFrame(page);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>scrollTo(0,0)); await homeAligned(page);
  assert(await page.locator('#lab-object').evaluate(object=>object.getBoundingClientRect().top>innerHeight),'Glass must leave the screen with its frame instead of following Home scroll');
  await page.goto(`${base}/docs/showcase/index.html?view=gallery`); await settled(page);
  assert.equal(await page.locator('#gallery .specimen').count(),10);
  assert.equal(await page.locator('#gallery img,#gallery .hero-study,#gallery .study-copy').count(),0,'Components should contain only component samples');
  await page.locator('#gallery [data-segment]').last().click();
  assert.equal(await page.locator('#gallery [data-segment]').last().getAttribute('aria-pressed'),'true');
  await page.locator('#gallery .glass-search input').last().fill('Mountains');
  assert.match(await page.locator('.specimen-feedback').nth(1).textContent(),/Mountains/);
  await page.locator('#gallery .glass-circle').click();
  assert.equal(await page.locator('#gallery .glass-circle').getAttribute('aria-pressed'),'true');
  await page.locator('#gallery [data-action]').first().click();
  assert.match(await page.locator('.specimen-feedback').nth(3).textContent(),/Crop/);
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  assert.match(await page.locator('.specimen-feedback').nth(4).textContent(),/Project created/);
  const toggle=page.getByRole('switch',{name:'Enable notifications'});
  await toggle.click(); assert.equal(await toggle.getAttribute('aria-checked'),'false');
  await toggle.focus(); await page.keyboard.press('Space'); assert.equal(await toggle.getAttribute('aria-checked'),'true');
  const slider=page.getByRole('slider',{name:'Volume'});
  await slider.focus(); await page.keyboard.press('End');
  assert.equal(await slider.inputValue(),'100');
  assert.equal(await page.locator('.glass-slider output').textContent(),'100');
  await page.keyboard.press('Home'); assert.equal(await slider.inputValue(),'0');
  await page.keyboard.press('ArrowRight'); assert.equal(await slider.inputValue(),'1');
  assert.match(await page.locator('.specimen-feedback').nth(6).textContent(),/Volume: 1%/);
  // Real native range semantics with an optically rendered track and thumb.
  const thumb=page.locator('#gallery .glass-range-thumb');
  assert.equal(await page.locator('#gallery .glass-slider [data-glass-lens]').count(),3);
  const atRest=await thumb.boundingBox();
  await page.mouse.move(atRest.x+atRest.width/2,atRest.y+atRest.height/2); await page.mouse.down();
  await page.waitForFunction(()=>document.querySelector('#gallery .glass-range-thumb').offsetWidth===29);
  const grown=await thumb.boundingBox(); assert(grown.width>atRest.width);
  await page.mouse.move(grown.x+80,grown.y+grown.height/2,{steps:8});
  assert(Number(await slider.inputValue())>1,'Dragging the native range must change its value');
  await page.mouse.up(); await page.waitForFunction(()=>document.querySelector('#gallery .glass-range-thumb').offsetWidth===24);
  assert.equal(await page.locator('#gallery .glass-range').getAttribute('data-held'),null);
  await slider.press('End');
  assert(await thumb.evaluate(node=>Math.abs(parseFloat(node.style.left)-(node.parentElement.clientWidth-12))<.5));
  await slider.press('Home');
  assert(await thumb.evaluate(node=>Math.abs(parseFloat(node.style.left)-12)<.5));
  const decrease=page.getByRole('button',{name:'Decrease quantity'}),increase=page.getByRole('button',{name:'Increase quantity'});
  await decrease.click(); assert.equal(await page.locator('.glass-stepper output').textContent(),'1'); assert(await decrease.isDisabled());
  for(let i=0;i<8;i++) await increase.click();
  assert.equal(await page.locator('.glass-stepper output').textContent(),'9'); assert(await increase.isDisabled());
  await decrease.click(); assert(await increase.isEnabled());
  const photos=page.locator('[data-filter="Photos"]'); await photos.click();
  assert.equal(await photos.getAttribute('aria-pressed'),'true');
  await photos.focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-filter="Videos"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.glass-chip[aria-pressed="true"]').count(),1);
  await page.getByRole('button',{name:'Play preview',exact:true}).click();
  assert.equal(await page.locator('.glass-media').getAttribute('data-playing'),'true');
  await page.getByRole('button',{name:'Pause preview',exact:true}).click();
  assert.equal(await page.locator('.glass-media').getAttribute('data-playing'),'false');
  // Fourteen optical surfaces, including the slider track/thumb, in ten examples.
  assert.equal(await page.locator('#gallery [data-glass-lens]').count(),14);
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Collection overflow at ${width}`);
    assert(await page.locator('#gallery .liquid-glass').evaluateAll(nodes=>nodes.every(node=>{
      const rect=node.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth;
    })),`Component outside collection viewport at ${width}`);
  }
  await page.getByRole('button',{name:'Dark',exact:true}).click(); await settled(page);
  await page.locator('#backdrop').click(); await page.locator('[data-backdrop-choice="ocean"]').click(); await settled(page);
  assert.match(await page.locator('.demo-nav [data-demo-link="playground"]').getAttribute('href'),/theme=dark&backdrop=ocean/);
  await page.goto(`${base}/docs/showcase/index.html?view=playground`); await settled(page); await aligned(page);
  assert(await page.evaluate(async()=>{
    const copy=document.querySelector('[data-glass-lens] .lab-world');
    for (let i=0;i<4;i++) await new Promise(resolve=>requestAnimationFrame(resolve));
    return copy===document.querySelector('[data-glass-lens] .lab-world');
  }),'Idle glass must not continually rebuild the background');
  assert.equal(await page.locator('#lab-optics,#lab-refraction,#lab-x,#lab-y').count(),0);
  assert.equal(await page.locator('#playground input[type="range"]').count(),1,'Only component size is adjustable, not material parameters');
  assert.equal(await page.locator('#lab-world img').count(),2);
  assert(await page.locator('#lab-scroll').evaluate(node=>node.scrollHeight>node.clientHeight),'Article must have its own scroll area');
  const materialMap=await page.evaluate(()=>{
    const id=document.querySelector('#lab-object [data-glass-lens] .glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];
    return document.getElementById(id).querySelector('feImage').getAttribute('href');
  });
  const initial=await page.locator('#lab-object').boundingBox(); await centeredInFrame(page);
  const pageScroll=await page.evaluate(()=>scrollY);
  for (const offset of [220,600,1050,1600,0]) {
    await scrollArticle(page,offset);
    const rect=await page.locator('#lab-object').boundingBox();
    assert(Math.abs(rect.y-initial.y)<1,'Glass must stay stationary while the article scrolls inside its frame');
    assert.equal(await page.evaluate(()=>scrollY),pageScroll);
  }
  await page.mouse.move(initial.x+120,initial.y+25); await page.mouse.wheel(0,200);
  await page.waitForFunction(()=>document.querySelector('#lab-scroll').scrollTop>0); await aligned(page);
  assert.equal(await page.evaluate(()=>scrollY),pageScroll,'Wheel input over glass must not scroll the page');
  await scrollArticle(page,0);
  await page.locator('#lab-edit').click(); await page.locator('#lab-editor').waitFor({state:'visible'});
  await page.locator('#lab-title').fill('Your own article');
  await page.locator('#lab-copy').fill('A literal <img src=x onerror=alert(1)> sentence.\n\nA second paragraph.');
  await page.waitForFunction(()=>document.querySelector('[data-glass-lens] .article-paragraph')?.textContent.includes('<img'));
  assert.equal(await page.locator('#lab-world h1').textContent(),'Your own article');
  assert.equal(await page.locator('#lab-world [onerror]').count(),0);
  for (const [selector,color] of [['#lab-paper','#ddc8b6'],['#lab-ink','#152b30']]) {
    await page.locator(selector).evaluate((node,color)=>{node.value=color;node.dispatchEvent(new Event('input',{bubbles:true}));},color);
  }
  await page.waitForFunction(()=>document.querySelector('#lab-object [data-glass-lens] .glass-lens-scene')?.style.backgroundColor==='rgb(221, 200, 182)');
  await page.waitForFunction(()=>{const copy=document.querySelector('[data-glass-lens] .lab-world');return copy&&getComputedStyle(copy).color==='rgb(21, 43, 48)';});
  await page.locator('#lab-images').uncheck(); assert.equal(await page.locator('#lab-world img').count(),0);
  await page.locator('#lab-images').check();
  const beforeShuffle=await page.locator('#lab-world img').first().getAttribute('src');
  await page.locator('#lab-shuffle').click(); assert.notEqual(await page.locator('#lab-world img').first().getAttribute('src'),beforeShuffle);
  await page.locator('#lab-image').setInputFiles(fileURLToPath(new URL('../docs/showcase/assets/coast.jpg',import.meta.url)));
  await page.waitForFunction(()=>document.querySelector('#lab-world img')?.src.startsWith('blob:'));
  const uploaded=await page.locator('#lab-world img').first().getAttribute('src');
  await page.locator('#lab-image').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await page.locator('#lab-image-error').waitFor({state:'visible'});
  assert.equal(await page.locator('#lab-world img').first().getAttribute('src'),uploaded);
  await page.locator('.editor-done').click(); await page.locator('#lab-editor').waitFor({state:'hidden'});
  await page.locator('#lab-reset').click(); await aligned(page);
  assert.equal(await page.locator('#lab-world h1').textContent(),'Liquid glass');
  assert.equal(await page.evaluate(()=>{const id=document.querySelector('#lab-object [data-glass-lens] .glass-lens-window').style.filter.match(/#([^"\)]+)/)[1];return document.getElementById(id).querySelector('feImage').getAttribute('href');}),materialMap,'Background editing changed the optical recipe');
  // Drag on a segment preserves click behavior when stationary and suppresses selection after dragging.
  const segment=page.locator('#lab-switcher [data-segment]').last(); await segment.click();
  assert.equal(await segment.getAttribute('aria-pressed'),'true');
  const start=await page.locator('#lab-object').boundingBox(),button=await segment.boundingBox();
  await page.mouse.move(button.x+button.width/2,button.y+button.height/2); await page.mouse.down();
  await page.mouse.move(button.x+button.width/2-80,button.y+button.height/2-60,{steps:8}); await page.mouse.up(); await aligned(page);
  const end=await page.locator('#lab-object').boundingBox(); assert(Math.hypot(start.x-end.x,start.y-end.y)>80);
  const grip=page.locator('.lab-drag'); await grip.focus(); await grip.press('ArrowLeft'); await aligned(page);
  assert((await page.locator('#lab-object').boundingBox()).x<end.x-10);
  await page.locator('[data-lab-sample="search"]').click(); await settled(page);
  const input=page.locator('#lab-search input'); await input.fill('Keep this text');
  const field=await input.boundingBox(),before=await page.locator('#lab-object').boundingBox();
  await page.mouse.move(field.x+60,field.y+field.height/2); await page.mouse.down();
  await page.mouse.move(field.x+120,field.y+field.height/2+65,{steps:8}); await page.mouse.up(); await aligned(page);
  const after=await page.locator('#lab-object').boundingBox(); assert(Math.hypot(after.x-before.x,after.y-before.y)>60);
  assert.equal(await input.inputValue(),'Keep this text');
  await page.locator('body').evaluate(node=>node.dataset.glassFallback='true');
  await page.waitForFunction(()=>!document.querySelector('[data-glass-lens]'));
  await page.locator('body').evaluate(node=>delete node.dataset.glassFallback); await settled(page);
  await page.emulateMedia({forcedColors:'active'}); await page.waitForFunction(()=>!document.querySelector('[data-glass-lens]'));
  await page.emulateMedia({forcedColors:'none'}); await settled(page);
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:900}); await page.evaluate(()=>scrollTo(0,0)); await scrollArticle(page,0);
    for (const sample of ['switcher','search']) {
      await page.locator(`[data-lab-sample="${sample}"]`).click(); await settled(page); await aligned(page); await moveToPhoto(page);
      const bounds=await page.locator('#lab-object').boundingBox();
      const frame=await page.locator('#lab-viewport').boundingBox();
      assert(bounds.x>=frame.x&&bounds.x+bounds.width<=frame.x+frame.width&&bounds.y>=frame.y&&bounds.y+bounds.height<=frame.y+frame.height,`Glass left playground frame ${width} ${sample}`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Article overflow at ${width}`);
      await scrollArticle(page,0);
    }
    await page.locator('#lab-edit').click();
    assert(await page.locator('#lab-editor').evaluate(node=>{const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height<=innerHeight;}));
    await page.locator('.editor-done').click();
  }
  await page.goto(`${base}/docs/showcase/index.html?view=workspace`); await settled(page);
  assert.equal(await page.locator('#gallery').isVisible(),true);
  assert.deepEqual(errors,[]);
  await writeFile(`${images}manifest.json`,JSON.stringify({renderer:'Chromium / shared SVG refraction module',captures:output},null,2)+'\n');
  console.log(`Captured ${output.length} images at 2×. Passed: Home showcase and embedded playground, fixed material, contained article scroll alignment, text/image editing, local uploads, full-surface drag, keyboard, fallback and responsive bounds.`);
} finally {
  if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve));
}

// Reproduce the V1 skill references from the same modules as the demo. AGPL-3.0-only.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from './serve.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const output=fileURLToPath(new URL('../liquid-glass-apple/assets/reference/',import.meta.url));
const server=createServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`, errors=[], files=[];
let browser;
async function frame(page) {
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function capture(node,name,options={}) {
  await node.screenshot({path:`${output}${name}.png`,animations:'disabled',...options}); files.push(`${name}.png`);
}
async function open(url,viewport={width:1440,height:1000}) {
  const page=await browser.newPage({viewport,deviceScaleFactor:2,reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(`${base}${url}`); return page;
}
async function aligned(page) {
  await page.waitForFunction(()=>{
    const original=document.querySelector('#lab-world').getBoundingClientRect();
    const copy=document.querySelector('#lab-object [data-glass-lens] .lab-world')?.getBoundingClientRect();
    return copy&&['x','y','width','height'].every(key=>Math.abs(original[key]-copy[key])<.5);
  }); await frame(page);
}
async function photo(page) {
  await page.locator('#lab-scroll').evaluate(node=>{
    const image=document.querySelector('#lab-world img').getBoundingClientRect();
    const glass=document.querySelector('#lab-object').getBoundingClientRect();
    node.scrollTop+=image.top+image.height*.6-(glass.top+glass.height/2);
  }); await aligned(page);
  await page.waitForFunction(()=>document.querySelector('#lab-search .liquid-glass')?.hasAttribute('data-photo-glass'));
}
async function detail(page,name) {
  const box=await page.locator('#lab-object').boundingBox();
  await capture(page,name,{clip:{x:box.x-80,y:box.y-70,width:box.width+160,height:box.height+140}});
}
try {
  await mkdir(output,{recursive:true});
  browser=await chromium.launch({headless:true,...(process.env.SHOWCASE_BROWSER?{executablePath:process.env.SHOWCASE_BROWSER}:{})});
  for(const theme of ['light','dark']) {
    const gallery=await open(`/docs/showcase/index.html?view=gallery&theme=${theme}&backdrop=none`,{width:1440,height:1100});
    await gallery.waitForFunction(()=>window.showcaseReady&&document.querySelectorAll('#gallery [data-glass-lens]').length===14);
    const slider=gallery.locator('.specimen').filter({has:gallery.getByRole('heading',{name:'Slider',exact:true})});
    await capture(slider,`slider-${theme}`);
    if(theme==='light') {
      const thumb=await slider.locator('.glass-range-thumb').boundingBox();
      await gallery.mouse.move(thumb.x+thumb.width/2,thumb.y+thumb.height/2); await gallery.mouse.down();
      await gallery.waitForFunction(()=>document.querySelector('#gallery .glass-range-thumb').offsetWidth===29);
      await capture(slider,'slider-pressed-light'); await gallery.mouse.up();
    }
    const trigger=gallery.locator('#backdrop'); await trigger.click();
    await gallery.locator('#backdrop-menu [data-glass-lens]').waitFor({state:'visible'}); await frame(gallery);
    assert.equal(await trigger.evaluate(node=>getComputedStyle(node).outlineStyle),'none');
    const selected=gallery.locator('#backdrop-menu [aria-checked="true"]');
    assert.equal(await selected.locator('.menu-choice-rim').evaluate(node=>getComputedStyle(node).opacity),'1');
    assert(await selected.evaluate(node=>getComputedStyle(node).backgroundColor.startsWith('color(')||getComputedStyle(node).backgroundColor.startsWith('rgba(')), 'Menu selection must be translucent');
    const triggerBox=await trigger.boundingBox(), menuBox=await gallery.locator('#backdrop-menu').boundingBox();
    const menuLeft=Math.min(triggerBox.x,menuBox.x)-12, menuTop=triggerBox.y-12;
    await capture(gallery,`menu-${theme}`,{clip:{x:menuLeft,y:menuTop,width:Math.max(triggerBox.x+triggerBox.width,menuBox.x+menuBox.width)-menuLeft+12,height:menuBox.y+menuBox.height-menuTop+12}});
    await gallery.keyboard.press('Escape');
    assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    assert(await trigger.evaluate(node=>document.activeElement===node));
    await gallery.close();

    const page=await open(`/docs/showcase/index.html?view=playground&theme=${theme}&backdrop=none&sample=search`);
    await page.waitForFunction(()=>window.playgroundReady&&[...document.querySelectorAll('#lab-world img')].every(img=>img.complete&&img.naturalWidth>0));
    await page.addStyleTag({content:'.lab-drag{visibility:hidden;}'});
    await photo(page); await detail(page,`photo-${theme}`);
    if(theme==='light') {
      await page.locator('#lab-size').fill('200'); await page.locator('#lab-size').dispatchEvent('input');
      await aligned(page); await photo(page);
      // scaled-photo-light.png is the author's chosen capture over Apple Park.
      // Keep that visual reference when regenerating the reproducible scenes.
      assert.equal(await page.locator('#lab-object').evaluate(node=>node.offsetHeight),104);
      await page.locator('#lab-size').fill('100'); await page.locator('#lab-size').dispatchEvent('input'); await aligned(page);
    }
    await page.locator('#lab-edit').click();
    await page.locator('#lab-title').fill(''); await page.locator('#lab-copy').fill('');
    await page.locator('#lab-paper').fill(theme==='light'?'#ffffff':'#000000'); await page.locator('#lab-paper').dispatchEvent('input');
    await page.locator('#lab-images').uncheck(); await page.locator('.editor-done').click();
    await aligned(page); await detail(page,`plain-${theme}`); await page.close();
  }
  const article=await open('/liquid-glass-apple/assets/example/index.html',{width:1440,height:1000});
  await article.waitForFunction(()=>window.glassExampleReady);
  await article.locator('#article-example').click();
  await article.addStyleTag({content:'.move-grip,.scene-label,.scene-foot{visibility:hidden;}'});
  await article.waitForFunction(()=>document.querySelector('#sample-search [data-glass-lens]'));
  await frame(article);
  const textBox=await article.locator('#scene-source > .background-text').boundingBox(), searchBox=await article.locator('#sample-search').boundingBox();
  const left=Math.min(textBox.x,searchBox.x)-32, top=Math.min(textBox.y,searchBox.y)-32;
  const articleClip={x:left,y:top,width:Math.max(textBox.x+textBox.width,searchBox.x+searchBox.width)-left+32,height:Math.max(textBox.y+textBox.height,searchBox.y+searchBox.height)-top+32};
  await capture(article,'article-dark',{clip:articleClip});
  const panels=[];
  for(const strength of ['0','100']) {
    await article.locator('#strength').fill(strength); await article.locator('#strength').dispatchEvent('input'); await frame(article);
    panels.push((await article.screenshot({clip:articleClip})).toString('base64'));
  }
  const comparison=await browser.newPage({viewport:{width:1200,height:550},deviceScaleFactor:2});
  await comparison.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#1b1b1d;color:#e1e1e1;font:14px system-ui}.panels{display:flex;gap:24px}figure{margin:0;width:calc((100% - 24px)/2)}img{display:block;width:100%;border-radius:18px}figcaption{padding:12px 4px}</style><div class="panels">${panels.map((data,i)=>`<figure><img src="data:image/png;base64,${data}"><figcaption>${i?'100% · Approved edge refraction':'0% · Same tone, no displacement'}</figcaption></figure>`).join('')}</div></html>`);
  await comparison.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(node=>node.decode())));
  await capture(comparison.locator('.panels'),'article-comparison'); await comparison.close(); await article.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,files},null,2));
} finally {
  await browser?.close(); await new Promise(resolve=>server.close(resolve));
}

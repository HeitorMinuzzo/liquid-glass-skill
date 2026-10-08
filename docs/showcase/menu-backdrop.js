/* A presentational sample of the page behind the menu. AGPL-3.0-only. */
const sources = '.masthead > .brand, .masthead > .demo-nav, #home > .home-overview > .home-intro, #gallery > .collection-intro, #playground > .playground-heading';
const typography = ['fontFamily','fontSize','fontWeight','fontStyle','fontVariant','letterSpacing','wordSpacing','textTransform','textShadow','textDecoration','textUnderlineOffset'];

export function renderMenuBackdrop(target, surface, themeRoot) {
  const page = themeRoot.getBoundingClientRect(), glass = surface.getBoundingClientRect();
  const intersects = box => box.width && box.height && box.right > glass.left - 48 && box.left < glass.right + 48 && box.bottom > glass.top - 48 && box.top < glass.bottom + 48;
  const light = themeRoot.dataset.theme !== 'dark';
  const position = (node, box) => Object.assign(node.style, {
    position:'absolute', left:`${box.left - page.left}px`, top:`${box.top - page.top}px`,
    width:`${box.width}px`, height:`${box.height}px`, margin:'0', padding:'0', border:'0', pointerEvents:'none'
  });
  // Copy only painted text and icons, rather than duplicating interactive UI,
  // IDs, selectors or the menu itself inside its optical background.
  document.querySelectorAll(sources).forEach(source => {
    if (source.closest('[hidden]') || !intersects(source.getBoundingClientRect())) return;
    [source, ...source.querySelectorAll('*')].forEach(element => {
      if (element.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const text = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      text.forEach(textNode => {
        const leaf = !element.childElementCount;
        const range = document.createRange(); range.selectNodeContents(textNode);
        const box = leaf ? element.getBoundingClientRect() : range.getBoundingClientRect();
        if (!intersects(box)) return;
        const copy = document.createElement('span'); copy.className = 'menu-backdrop-text';
        copy.textContent = textNode.textContent; copy.dataset.menuSource = element.id || element.tagName.toLowerCase();
        position(copy, box);
        typography.forEach(property => { copy.style[property] = style[property]; });
        Object.assign(copy.style, {
          display:'block', lineHeight:leaf ? style.lineHeight : 'normal',
          textAlign:leaf ? style.textAlign : 'left', whiteSpace:leaf ? style.whiteSpace : 'pre',
          color:light ? `color-mix(in srgb, ${style.color} 52%, transparent)` : style.color
        });
        target.append(copy);
      });
    });
    source.querySelectorAll('svg').forEach(original => {
      const box = original.getBoundingClientRect(); if (!intersects(box)) return;
      const copy = original.cloneNode(true), style = getComputedStyle(original);
      [copy, ...copy.querySelectorAll('*')].forEach(node => {
        [...node.attributes].forEach(attribute => {
          if (attribute.name === 'id' || attribute.name === 'class' || attribute.name.startsWith('data-')) node.removeAttribute(attribute.name);
        });
      });
      copy.classList.add('menu-backdrop-icon'); position(copy, box);
      Object.assign(copy.style, {color:style.color, stroke:style.stroke, fill:style.fill, strokeWidth:style.strokeWidth, opacity:light ? '.52' : '1'});
      target.append(copy);
    });
  });
}

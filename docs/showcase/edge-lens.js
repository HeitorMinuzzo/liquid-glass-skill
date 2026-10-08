/* Fixed-recipe adapter. Material parameters belong to the shared module. AGPL-3.0-only. */
import { createGlassScene } from './edge-preview.js';
export function createPlaygroundLens(stage, world, status) {
  const scene = createGlassScene({stage, source:world, themeRoot:document.body,
    onStatus({active, accessible, supported}) {
      const optics = active ? 'edge' : 'fallback';
      const message = accessible ? 'System preference: solid, readable glass.' : !supported ? 'CSS glass fallback.' : 'Liquid Glass material · fixed recipe.';
      // The stage is observed for background changes. Rewriting the same flag
      // here would trigger an endless refresh/clone cycle while the glass rests.
      if (stage.dataset.optics !== optics) stage.dataset.optics = optics;
      if (status.textContent !== message) status.textContent = message;
    }
  });
  return {add:scene.add, refresh:scene.refresh, destroy:scene.destroy};
}

# Integração portátil

## Integrar à arquitetura existente

Inspecione a organização do projeto antes de escolher onde aplicar o material. A integração deve aproveitar suas primitivas, tokens e ciclo de vida. Copie o núcleo para o local adequado de recursos/componentes compartilhados ou adapte-o ao renderer já usado, mantendo a calibração. A aplicação de destino não depende de `docs/`, de scripts de captura nem do HTML do laboratório portátil.

| Estrutura do projeto | Forma de integração |
| --- | --- |
| HTML/CSS/JS | Classes/camadas materiais no componente real e um cenário inicializado pelo módulo. |
| Framework de componentes | Refs e um wrapper, hook, diretiva ou variante que monta e desmonta o cenário junto ao componente. Preserve props e eventos existentes. |
| Biblioteca de UI | Reutilize a primitiva e seus estados; aplique as camadas pelos slots/wrappers disponíveis. Mantenha a semântica da biblioteca. |
| CSS Modules ou estilos isolados | Preserve o sistema de estilos; deixe as classes do núcleo disponíveis no escopo das camadas ópticas ou adapte os seletores consistentemente. |
| Renderer canvas/WebGL existente | Use a fonte visual do renderer e transporte mapa, máscaras, tonalidade e reflexão da receita; compare o resultado com as referências. |

A fonte do vidro é o cenário atrás do componente **na aplicação do usuário**. Identifique texto, imagens, fundo e rolagem reais, e sincronize a representação apresentacional correspondente. Escolha componentes e composição conforme a função da aplicação; medidas e nomes dos snippets abaixo são exemplos locais de integração.

## Cenário controlado

Copie `assets/core/liquid-glass.css`, `liquid-glass.js` e, em TypeScript, `liquid-glass.d.ts`. Não é preciso instalar um framework ou usar um normal map externo. O JS é um ES module; carregue por HTTP ou pelo bundler do projeto.

```html
<div data-liquid-glass data-theme="light">
  <div class="glass-scene" data-glass-backdrop="none" id="scene">
    <div id="backdrop-content">Conteúdo visual atrás do vidro</div>
    <button class="liquid-glass" style="--glass-radius:999px">
      <span class="glass-material" aria-hidden="true"></span>
      <span class="glass-content">Ação do produto</span>
      <span class="glass-rim" aria-hidden="true"></span>
    </button>
  </div>
</div>
```

O exemplo omite layout de propósito. Posicione o cenário e a fonte do fundo com dimensões reais; coloque a superfície acima dessa fonte. Defina tipografia, padding e tamanho no componente do produto e remova seu fundo/borda opacos anteriores (inclusive os padrões do navegador no botão). A camada `.glass-material` herda o raio do componente. Veja [componentes e estados](components.md) para os wrappers, o foco e menus.

Para um controle compacto novo, `--glass-radius:999px` produz extremidades de cápsula: CSS e lente limitam o raio à metade da menor dimensão. Em um botão ou controle de quantidade de `52px` de altura, o raio efetivo é `26px`. Use a mesma proporção nos controles da família; não copie um raio pequeno fixo de um cartão para uma ação compacta. Contêineres maiores ou componentes com identidade existente podem ter outro raio. Material, recorte e contorno devem herdar a mesma geometria.

```js
import { createGlassScene } from './liquid-glass.js';
const stage = document.querySelector('#scene');
const scene = createGlassScene({
  stage,
  source: document.querySelector('#backdrop-content'),
  themeRoot: document.querySelector('[data-liquid-glass]'),
  adaptToPhotos: true,
});
const material = scene.add(document.querySelector('.glass-material'), {
  strength: 1, edgeWidth: 1.2, edgeProfile: 'extended'
});

// Use a preferência existente da aplicação ou exponha as duas variantes.
stage.dataset.glassBackdrop = 'none';   // sem cores
stage.dataset.glassBackdrop = 'aurora'; // com cores

// Depois de mover a superfície: scene.refresh().
// Se um renderer customizado mudou seu cenário: scene.refresh(true).
// Registre o cleanup no unmount/dispose do framework:
function disposeGlass() {
  material.destroy(); // remove só essa superfície
  scene.destroy();    // desmonta o cenário inteiro
}
```

O cenário aceita várias superfícies, cada uma com mapa, dimensões e ciclo de vida próprios. `strength` varia de `0` a `1.4`; `enabled:false` volta ao material CSS. Inicialize no mount/effect, não durante renderização do servidor.

Mantenha `strength:1` na entrega. Em uma comparação de desenvolvimento, `material.update({strength:0})` conserva tonalidade e remove deslocamento; restaure `material.update({strength:1})` ao terminar. Não deixe a óptica desligada por copiar uma comparação como código de produção.

Sem configurações adicionais, `createGlassScene` já usa o perfil estendido aprovado, alcance `1.2` e adaptação fotográfica. O CSS inclui o contorno suavizado sobre fotos; não depende de regras exclusivas do site de demonstração. `edgeProfile:'standard'` conserva a curva antiga apenas para comparações técnicas. O renderer DOM difunde as imagens copiadas e ajusta a tonalidade pela fotografia sob cada superfície; não altera o DOM original. Um `renderBackdrop` próprio continua responsável por tratar suas imagens.

## Slider nativo

Se o produto pedir um slider, os arquivos opcionais `core/glass-range.css` e `glass-range.js` mostram uma integração sem recriar a interação nativa. A estrutura está em `assets/example/index.html`, na amostra **Slider**: um `input[type=range]` real fica sobre uma barra e uma bolinha apresentacionais, ambas com `.glass-material` e `.glass-rim`. Adicione os três materiais ao mesmo cenário para amostrar o fundo original; não filtre uma cópia de controles interativos.

```js
import {attachGlassRange} from './glass-range.js';
const range = attachGlassRange(rangeElement, {
  refresh: () => scene.refresh(),
  onInput: value => { output.value = value; }
});
// Após alterar valor/min/max por código: range.update().
// Ao desmontar: range.destroy(), além de scene.destroy().
```

No exemplo, a bolinha cresce de `24px` para `29px` enquanto o ponteiro é segurado e retorna ao soltar, cancelar ou perder o foco da janela. O hit target nativo e o mapeamento entre valor e posição não mudam. O crescimento usa dimensões reais, permitindo que a lente recalcule sua geometria; não escala um bitmap já filtrado. Preserve foco, teclado, toque e estados desabilitados do componente existente. Num playground com arraste, ajustar o range deve ajustar seu valor; o restante da superfície ou uma alça podem continuar movendo a amostra.

## Limite importante da fonte

`source` é uma árvore **apresentacional controlada**, como texto, gradientes e imagens estáticas. O módulo copia essa árvore, remove IDs duplicados, mantém dimensões, propriedades CSS do cenário e alinhamento da fonte. A cópia fica `aria-hidden`, `inert` e sem eventos de ponteiro. O componente real continua interativo acima dela.

Estilize a fonte por classes. Regras baseadas nos IDs removidos e referências internas de SVG exigem um renderer que preserve o resultado visual sem duplicar IDs. Para personalizar a base da atenuação óptica, defina `--glass-neutral` em hexadecimal de seis dígitos (`#rrggbb`); tipografia, cores funcionais e raio continuam configuráveis pelo CSS do produto.

Não clone uma aplicação inteira, um editor, vídeo, canvas, iframes, conteúdo privado de terceiros ou componentes que iniciam efeitos ao montar. Isso não é captura universal do DOM. Se o projeto já renderiza o fundo em canvas/WebGL, adapte sua fonte de pixels à lente. Para outro cenário sincronizável, forneça um renderer:

```js
const scene = createGlassScene({stage, themeRoot, renderBackdrop(target) {
  const background = document.createElement('div');
  background.textContent = currentBackgroundText;
  background.className = 'my-presentational-backdrop';
  target.append(background);
}});
// Chame scene.refresh(true) quando currentBackgroundText mudar.
```

O renderer deve preencher somente a camada de fundo. As cores/tamanho usados nessa camada e no cenário real precisam coincidir. O adapter padrão copia texto, gradientes e imagens CSS, mas a **adaptação fotográfica completa** usa elementos DOM `img` na fonte: são eles que fornecem cobertura, cor média e difusão separada do texto. Uma foto usada somente como `background-image` recebe refração, mas não esse tratamento fotográfico completo. Para a receita aprovada, represente-a por `img` apresentacional com o mesmo recorte/posição, ou implemente tratamento equivalente no renderer. Imagens locais/same-origin ou com CORS adequado permitem amostrar a cor; sem acesso aos pixels, a base continua neutra. Não afirme equivalência visual se essa adaptação não estiver disponível. Se a árvore depender de estilos de um ancestral fora do cenário, replique explicitamente esses estilos no renderer.

## Framework e movimento

React: crie o cenário num effect com refs, destrua no cleanup e preserve as primitivas existentes. Svelte/Vue: inicialize no mount, destrua no unmount. As mesmas classes e funções servem para outros frameworks; nenhum layout Svelte ou conjunto de componentes é exigido.

Mudanças da fonte, tamanho e aparência são observadas. Movimentos por drag, transform ou animação podem não alterar o tamanho observado: chame `scene.refresh()` após atualizar a posição. Recalcule o mapa só quando geometria/intensidade mudar. Leia [motion.md](motion.md) quando houver animações.

## Desempenho sem alterar o material

O núcleo reutiliza mapas ópticos de geometria e parâmetros **exatamente iguais**, inclusive entre superfícies e ao retornar a um tamanho recente. O cache guarda no máximo 16 entradas e 4 MiB de URLs serializadas; um mapa maior é calculado normalmente, sem reduzir sua resolução. Evicção afeta somente o reaproveitamento futuro, não os filtros já montados.

Em cada atualização, o cenário compartilha as leituras de aparência e a preparação da fonte entre suas superfícies. Essa preparação vale somente para aquele frame: alterações de texto, tipografia, tema e imagens continuam invalidando o fundo. Cada superfície mantém filtro, recorte, posição e difusão fotográfica próprios. O renderer customizado continua sendo chamado separadamente para cada superfície que precisa atualizar o fundo.

Mova superfícies com `scene.refresh()`; use `scene.refresh(true)` quando um renderer customizado mudar seu conteúdo. Evite reconstruir o cenário para mudar posição ou valor. Preserve a qualidade e o ritmo de atualização aprovados; meça o trabalho de JS e a renderização no dispositivo de destino antes de prometer ganho de fluidez. O fallback de acessibilidade/compatibilidade permanece independente dessas otimizações.

## Fallback e navegador

A imagem sincronizada usa `filter: url(...)`, não `backdrop-filter: url(...)`. Isso evita depender da refração SVG direta sobre o backdrop, que não é portável entre navegadores. `CSS.supports` é uma verificação inicial de sintaxe; não prova que a lente renderizou corretamente. Confira os pixels no navegador de destino, especialmente no Safari/iPhone.

Sem a lente, o CSS oferece blur de `8px`, prata a `6%` no claro / `12%` no escuro e contorno. Esse fallback preserva usabilidade, mas não o espelhamento aprovado nem a reflexão calculada do ombro. Transparência reduzida, contraste aumentado, cores forçadas ou `data-glass-fallback="true"` usam uma superfície sólida. Não habilite o SVG à força contra essas preferências.

O raio suportado pelo mapa é uniforme; formas irregulares exigem outro mapa/renderer ou o fallback. O alinhamento padrão usa coordenadas CSS do cenário: evite escalar apenas um dos planos ou adapte a transformação no renderer. Portais fora do cenário também precisam de alinhamento/estilos explícitos.

## Exemplo completo

`assets/example/index.html` funciona sozinho com os arquivos da pasta da skill. Sirva por HTTP quando precisar comparar o material isoladamente. Ele oferece tema, fundo neutro/colorido, texto editável e arraste para testes. Para a entrega, integre somente os recursos necessários à aplicação do usuário.

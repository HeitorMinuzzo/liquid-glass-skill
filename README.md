# Liquid Glass Skill

**Web / Front-end · HTML, CSS, JavaScript & SVG · Framework-agnostic core**

**Refracted edges. A quiet center. Your product's components.**

Liquid Glass Skill helps AI coding agents create or adapt components in any web project with Apple-inspired Liquid Glass. It includes calibrated refraction, transparency and reflections, installation instructions, reusable examples and an interactive playground.

**Refração nas bordas. Centro nítido. Componentes do seu produto.**

Liquid Glass Skill é uma skill para agentes de programação com IA criarem ou adaptarem componentes de qualquer projeto web com o material inspirado no Liquid Glass da Apple. Inclui refração, transparência e reflexos calibrados, instruções de instalação, exemplos reutilizáveis e um playground interativo.

**[Live demo / Demonstração](https://HeitorMinuzzo.github.io/liquid-glass-skill/) · [Download V1 ZIP](https://github.com/HeitorMinuzzo/liquid-glass-skill/releases/download/v1.0.1/liquid-glass-skill-v1.0.1.zip) · [Releases](https://github.com/HeitorMinuzzo/liquid-glass-skill/releases)**

Repository: [liquid-glass-skill on GitHub](https://github.com/HeitorMinuzzo/liquid-glass-skill) · Skill: `$liquid-glass-apple` · Author: **Heitor Minuzzo**

[English](#english) · [Português](#português) · [Web guide / Guia Web](https://heitorminuzzo.github.io/liquid-glass-skill/docs/liquid-glass-web-skill.html) · [Home / Início](docs/showcase/index.html?view=home) · [Playground](docs/showcase/index.html?view=playground) · [Portable example / Exemplo portátil](liquid-glass-apple/assets/example/index.html) · [SKILL.md](liquid-glass-apple/SKILL.md)

<a id="com-e-sem-cores--with-and-without-colors"></a>

## With and without colors / Com e sem cores

One recipe, four appearances. Search crosses two lines of text to reveal the refracted edges. Actual **2×** browser captures with identical material and framing. Click to see the details.

Uma receita, quatro aparências. O Search atravessa duas linhas de texto para destacar a refração nas bordas. Capturas reais em **2×**, com o mesmo material e enquadramento. Clique para ver os detalhes.

| Neutral / Sem cores | Colored / Com cores |
| :---: | :---: |
| [![Light neutral glass / Liquid Glass claro sem cores: Search sobre texto e componentes em fundo neutro](docs/images/readme-neutral-light.png)](docs/images/readme-neutral-light.png) | [![Light colored glass / Liquid Glass claro com Aurora: a mesma refração e transparência](docs/images/readme-color-light.png)](docs/images/readme-color-light.png) |
| [![Dark neutral glass / Liquid Glass escuro sem cores: Search, Switcher, Slider e ações](docs/images/readme-neutral-dark.png)](docs/images/readme-neutral-dark.png) | [![Dark colored glass / Liquid Glass escuro com Aurora: a mesma receita em fundo colorido](docs/images/readme-color-dark.png)](docs/images/readme-color-dark.png) |

<a id="liquid-glass-para-web--liquid-glass-for-the-web"></a>

## Liquid Glass for the web / Liquid Glass para Web

**HeitorMinuzzo/liquid-glass-skill** is a Liquid Glass skill for web UI components. Use it to create glass surfaces or convert existing components while preserving the product's architecture and interactions. The implementation uses CSS, JavaScript and SVG filters, with no runtime dependencies in the core.

**HeitorMinuzzo/liquid-glass-skill** é uma skill de Liquid Glass para componentes web. Serve para criar novas superfícies ou converter componentes existentes, preservando a arquitetura e as interações do produto. A implementação usa CSS, JavaScript e filtros SVG; o núcleo não tem dependências de runtime.

| Area / Aspecto | Implementation / Implementação |
| --- | --- |
| Material | Calculated edge and shoulder refraction, continuous reflection, local text attenuation and photo adaptation. / Refração calculada nas bordas e ombros, reflexão contínua, atenuação local do texto e adaptação fotográfica. |
| Frameworks | Framework-independent core with React, Vue and Svelte lifecycle guidance; integration is adapted to the project, without prebuilt framework adapters. / Núcleo independente de framework; orientação de montagem/desmontagem para React, Vue e Svelte. A integração é adaptada ao projeto, sem adapters prontos específicos. |
| Appearance / Aparência | Light and dark, with neutral backgrounds or optional colors. / Claro e escuro, com fundo neutro ou cores opcionais. |
| Examples / Exemplos | Search, Switcher, Slider, menus, buttons and other controls, including focus, selection and dragging. / Search, Switcher, Slider, menus, botões e outros controles, incluindo foco, seleção e arraste. |
| Agents / Agentes | `SKILL.md` package validated and installed in Codex; other agents require their own setup and verification. / Pacote `SKILL.md` validado e instalado no Codex. Outros agentes precisam de configuração e verificação próprias. |
| Browsers / Navegadores | Recipe verified in Chromium/Edge; Safari/iPhone needs on-device visual testing. The fallback preserves usability with a simplified appearance. / Receita verificada no Chromium/Edge; Safari/iPhone precisa de teste visual no dispositivo. O fallback preserva usabilidade, com aparência simplificada. |

The captures above are actual browser renders. The [web guide](https://heitorminuzzo.github.io/liquid-glass-skill/docs/liquid-glass-web-skill.html#english) explains scope, installation and presentational-source limitations. This implementation targets browser interfaces; SwiftUI or React Native projects need an implementation for their native environment.

As capturas acima são renderizações reais do navegador. O [guia Web](https://heitorminuzzo.github.io/liquid-glass-skill/docs/liquid-glass-web-skill.html) explica escopo, instalação e limites da fonte apresentacional. Esta implementação atende interfaces no navegador; projetos SwiftUI ou React Native precisam de uma implementação para seu ambiente nativo.

<a id="componentes-e-cenários--components-and-backdrops"></a>

## Components and backdrops / Componentes e cenários

![Minimal Liquid Glass component collection / Coleção simples de componentes Liquid Glass](docs/images/components-detail-light.png)

[View the full collection / Ver a coleção completa](docs/showcase/index.html?view=gallery) · [Dark collection / Tema escuro](docs/images/components-detail-dark.png) · [Optical comparison / Comparação óptica 0%/100%](liquid-glass-apple/assets/reference/article-comparison.png)

| Text playground / Texto no playground | Over a photograph / Sobre uma fotografia |
| :---: | :---: |
| [![Lorem ipsum playground / Playground com lorem ipsum](docs/images/playground-light.png)](docs/images/playground-light.png) | [![Text and photography playground / Playground com texto e fotografia](docs/images/playground-photo.png)](docs/images/playground-photo.png) |

Light glass lets more image detail through, with less gray tint and separate attenuation of background text. Refraction reaches into the rounded shoulder and follows the component's size. On uniform backgrounds, a continuous reflection across the curved shoulder provides volume, with a thin boundary and soft exterior shadow. Light and dark share the same geometry with theme-specific intensities. Over pure white, the interior stays nearly white. The collection shows only components; text and photography experiments belong to the playground.

O tema claro deixa mais da imagem atravessar o vidro, com menos camada cinza e atenuação separada do texto de fundo. A refração avança para dentro do ombro arredondado e acompanha o tamanho do componente. Em fundo uniforme, o volume vem de um reflexo contínuo pela curvatura da borda, com um limite fino e sombra exterior suave. Claro e escuro usam a mesma geometria, com intensidades próprias. Sobre branco puro, o interior continua quase branco. A coleção inicial mostra somente componentes; os testes com texto e fotografias ficam no playground.

The slider uses the same lens on its track and thumb. Holding it slightly enlarges the thumb; a native input preserves mouse, touch, and keyboard controls.

O slider usa a mesma lente na barra e na bolinha. Ao segurar, a bolinha cresce discretamente; o input nativo preserva mouse, toque e teclado.

| Light / Claro | Dark / Escuro |
| :---: | :---: |
| ![Slider Liquid Glass](liquid-glass-apple/assets/reference/slider-light.png) | ![Slider Liquid Glass](liquid-glass-apple/assets/reference/slider-dark.png) |

| Photograph / Fotografia | Plain background / Fundo plano |
| :---: | :---: |
| [![Author-approved photo reference / Referência aprovada pelo autor sobre fotografia](liquid-glass-apple/assets/reference/scaled-photo-light.png)](liquid-glass-apple/assets/reference/scaled-photo-light.png) | [![Glass over pure white / Vidro sobre branco puro](docs/images/material-empty-light.png)](docs/images/material-empty-light.png) |
| [![Glass over a photo, dark / Vidro sobre fotografia, escuro](docs/images/material-photo-dark.png)](docs/images/material-photo-dark.png) | [![Glass over pure black / Vidro sobre preto puro](docs/images/material-empty-dark.png)](docs/images/material-empty-dark.png) |

## English

### What the skill does

Applies an Apple Liquid Glass inspired material to the components your product needs, preserving its framework, layout, identity, and interactions. The examples demonstrate the material; they do not dictate the components an agent must build.

**V1 · 1.0.1:** the [skill](liquid-glass-apple/SKILL.md) guides application of the Liquid Glass recipe to any web project, adapting integration to its framework, architecture, and required components. The portable core implements the calibrated optics. The [component and state guide](liquid-glass-apple/references/components.md) covers translucent menus, glass selection finishes, and focus without the native rectangle while preserving keyboard navigation.

- **Refraction and a mirrored rim:** background text stretches and reverses near the contour, including the sides and corners.
- **Local text contrast reduction:** background glyphs lose contrast beneath the glass; photographs keep their colors and uncovered content keeps its original appearance.
- **Little blur in the center:** background letters remain recognizable; foreground text, icons, and inputs stay sharp above the lens.
- **Optional colors:** always includes neutral and colored variants through appearance settings, props, or examples. Aurora, Ocean, and Sunset are replaceable presets.
- **Project-specific composition:** function, hierarchy, layout, and visual identity guide component selection and placement.
- **Accessible fallback:** solid surfaces for reduced transparency, increased contrast, or forced colors.

The primary recipe comes from the **SKILLS** playground. The collection includes ten examples: a segmented control, search, circular action, icon toolbar, button, switch, slider, stepper, filter chips, and playback control on a simple background. Text and photography belong to the article playground. All use the same refraction curve, with a gently blurred center and light/dark finishes.

### Install and invoke

**From Codex:** send this prompt to your agent. The installer selects the skill folder from the V1 release:

```text
Use $skill-installer to install the skill at:
https://github.com/HeitorMinuzzo/liquid-glass-skill/tree/v1.0.1/liquid-glass-apple
```

**Manual download:** download the [V1 ZIP](https://github.com/HeitorMinuzzo/liquid-glass-skill/releases/download/v1.0.1/liquid-glass-skill-v1.0.1.zip), extract it, and copy the complete `liquid-glass-apple` folder into your agent's skills directory. The ZIP contains only the skill, including its core, portable example, references, and license; installing the skill does not require Node.js or Python.

Current Codex local discovery uses `~/.agents/skills/` for personal skills and `.agents/skills/` for a project. If your installation uses another configured location, such as `~/.codex/skills/`, use that destination. See the [official skills documentation](https://learn.chatgpt.com/docs/build-skills).

In PowerShell, run from the extracted directory:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills" | Out-Null
Copy-Item -LiteralPath .\liquid-glass-apple -Destination "$env:USERPROFILE\.agents\skills" -Recurse
```

On macOS/Linux:

```sh
mkdir -p ~/.agents/skills
cp -R liquid-glass-apple ~/.agents/skills/
```

When updating an older installation, back it up and replace the complete package; overlaying files can leave obsolete resources behind. Avoid installing the same skill in multiple locations at once. The package does not depend on `docs/`, `scripts/`, or `node_modules/`. Your agent discovers the new skill; if it does not appear, restart Codex.

Example prompt:

```text
Use $liquid-glass-apple on this application's controls.
Preserve the framework and existing components.
Include neutral and colored background options.
```

### Explore the material

```sh
git clone https://github.com/HeitorMinuzzo/liquid-glass-skill.git
cd liquid-glass-skill
npm run showcase
```

With Node.js 20 or later, the server runs at `http://127.0.0.1:4173`:

- [Skill introduction](http://127.0.0.1:4173/docs/showcase/index.html?view=home): a short introduction and a small showcase with interactive Search, Switcher, and button examples, each with a discreet caption. The playground sits directly below the showcase on the same page. Author: **Heitor Minuzzo**. Every component on the site is an example created using the skill.
- [Project playground](http://127.0.0.1:4173/docs/showcase/index.html?view=home#playground): a frame with its own scroll area for the article, lorem ipsum, and photographs. The component starts centered in this frame and keeps its position while the content passes underneath, including after it is dragged. Scrolling Home leaves it attached to the same point in the playground. Drag anywhere on the component to move it. The glass recipe is fixed, with no blur, reflection, or refraction settings.
- [Portable technical example](http://127.0.0.1:4173/liquid-glass-apple/assets/example/index.html): independent samples for skill integration, with optical comparisons for development.
- [Component collection](http://127.0.0.1:4173/docs/showcase/index.html?view=gallery): ten compact, interactive samples using the same lens as the playground.

In the playground, **Edit background & text** opens the title, article text, and background colors. Hide, shuffle, or replace the photographs with a local image. **Size** enlarges the component from 100% to 200%, recalculating the same recipe for its geometry. Stationary clicks still work; dragging across an input preserves its value. The grip also accepts keyboard arrows and Home to reposition.

Serve the example over HTTP; do not open ES modules directly through `file://`.

### Integrate into your project

Copy the CSS and JS from [`assets/core/`](liquid-glass-apple/assets/core/). The module has no runtime dependencies. It receives a controlled, presentational background source such as text, gradients, and static images:

```js
import { createGlassScene } from './liquid-glass.js';

const scene = createGlassScene({ stage, source: backgroundContent, themeRoot });
const glass = scene.add(materialElement, { strength: 1 });

stage.dataset.glassBackdrop = 'none';   // neutral
stage.dataset.glassBackdrop = 'aurora'; // colored

scene.refresh();    // after moving the component
scene.destroy();    // on unmount
```

Place separate `.glass-material`, `.glass-content`, and `.glass-rim` layers inside `.liquid-glass`. Choose the shape and layout for the component's function. The [integration reference](liquid-glass-apple/references/integration.md) covers HTML structure, multiple surfaces, a custom renderer, and framework lifecycle integration. The skill instructions and detailed references are in Portuguese.

The lens synchronizes a known scene rather than capturing arbitrary DOM content. Adapt the pixel source for other renderers; the CSS fallback preserves usability but does not reproduce the mirrored rim. Rendering was verified in Chromium/Edge; Safari/iPhone requires device testing. This is a web approximation, without a claim of parity with Apple's native renderer.

**1.0.1 · Same visuals, less repeated work:** identical maps are reused in a bounded cache; surfaces share scene reads and background preparation during each update. Resolution, refraction, blur, transparency, and reflections remain unchanged. Before/after comparisons verified identical pixels in 18 Edge scenarios. In a workload with eight identical surfaces and 64 paragraphs, initial map calculations went from 8 to 1 and text style reads from 512 to 64. These measure JavaScript work, not guaranteed FPS across devices.

### Verify and regenerate screenshots

```sh
npm ci
npx playwright install chromium
npm run verify:package
npm run verify:lens
npm run verify:performance
npm run screenshots
npm run screenshots:reference
npm run screenshots:readme
```

`verify:package` checks the portable technical example, its variants, and cleanup. `verify:lens` measures refraction, contrast, sharpness, and mask composition in a fixture separate from the public interface. `screenshots` verifies alignment during article scrolling, text/image editing, dragging over controls, fixed material, fallback, and layouts from 320 to 1440px; it also updates site captures at 2×. The optional `SHOWCASE_BROWSER` environment variable selects an existing Chromium/Edge executable.

`screenshots:readme` reproduces the four presentation images using the same core and controls as the demo. The capture composition lives in `scripts/fixtures/readme.*`, outside the skill package; it changes neither the recipe nor the site's interface.

`verify:performance` measures map/source-read reuse and checks live updates and cleanup. To compare pixels against an earlier core, run `npm run verify:performance -- --baseline path/to/previous-liquid-glass.js`. Captures and the report are saved in `.artifacts/performance/`, outside Git.

### Package a release

With Python 3 available, `npm run package:skill` creates `dist/liquid-glass-skill-v1.0.1.zip` and `dist/SHA256SUMS.txt`. The script checks the inventory and contents of every packaged file. `dist/` stays outside Git; these files are distributed as release assets. Regenerating the references preserves the author's selected photo capture.

## Português

### O que a skill faz

Aplica um material inspirado no Liquid Glass da Apple aos componentes necessários ao produto, preservando seu framework, layout, identidade e interações. Os exemplos ajudam a observar o vidro; não determinam quais componentes o agente deve criar.

**V1 · 1.0.1:** a [skill](liquid-glass-apple/SKILL.md) orienta a aplicação da receita Liquid Glass em qualquer projeto web, adaptando a integração ao framework, à arquitetura e aos componentes necessários. O núcleo portátil implementa a óptica calibrada. O [guia de componentes e estados](liquid-glass-apple/references/components.md) cobre menus translúcidos, seleções com acabamento em vidro e foco sem o retângulo nativo, preservando navegação por teclado.

- **Refração e espelhamento no contorno:** texto se alonga e se inverte perto das bordas, incluindo as laterais e os cantos.
- **Texto de fundo atenuado apenas sob o vidro:** glifos perdem contraste localmente; fotografias preservam suas cores e o conteúdo fora da superfície mantém a aparência original.
- **Centro com pouco blur:** letras do fundo continuam reconhecíveis; texto, ícones e campos do componente permanecem nítidos acima da lente.
- **Cores opcionais:** sempre inclui uma variante neutra e outra colorida, por opção de aparência, prop ou exemplos. Aurora, Ocean e Sunset são presets substituíveis.
- **Composição própria do projeto:** função, hierarquia, layout e identidade visual orientam a escolha e a disposição dos componentes.
- **Fallback acessível:** superfície sólida com transparência reduzida, contraste aumentado ou cores forçadas.

A receita principal vem do playground do **SKILLS**. A coleção reúne dez exemplos: seletor, busca, ação circular, barra de ícones, botão, switch, slider, controle de quantidade, filtros e reprodução, em um fundo simples. O artigo com texto e fotografias fica no playground. Todos usam a mesma curva de refração, com centro pouco borrado e acabamento claro/escuro.

### Instalar e usar

**Pelo Codex:** envie este pedido ao agente. O instalador busca a pasta correta na versão V1:

```text
Use $skill-installer para instalar a skill deste endereço:
https://github.com/HeitorMinuzzo/liquid-glass-skill/tree/v1.0.1/liquid-glass-apple
```

**Download manual:** baixe o [ZIP da V1](https://github.com/HeitorMinuzzo/liquid-glass-skill/releases/download/v1.0.1/liquid-glass-skill-v1.0.1.zip), extraia-o e copie a pasta completa `liquid-glass-apple` para o diretório de skills do seu agente. O ZIP contém apenas a skill, com seu núcleo, exemplo portátil, referências e licença; instalar a skill não requer Node.js nem Python.

Na descoberta local atual do Codex, a pasta pessoal é `~/.agents/skills/`; a pasta de um projeto é `.agents/skills/`. Se sua instalação usa outra pasta configurada, como `~/.codex/skills/`, use esse destino. Consulte a [documentação oficial de skills](https://learn.chatgpt.com/docs/build-skills).

No PowerShell, execute a partir da pasta extraída:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills" | Out-Null
Copy-Item -LiteralPath .\liquid-glass-apple -Destination "$env:USERPROFILE\.agents\skills" -Recurse
```

No macOS/Linux:

```sh
mkdir -p ~/.agents/skills
cp -R liquid-glass-apple ~/.agents/skills/
```

Para atualizar uma instalação antiga, faça backup da pasta anterior e substitua o pacote completo; apenas sobrepor arquivos pode manter recursos obsoletos. Evite instalar a mesma skill simultaneamente em vários destinos. O pacote é independente de `docs/`, `scripts/` e `node_modules/`. A skill fica disponível após a descoberta do agente; se não aparecer, reinicie o Codex.

Exemplo de pedido:

```text
Use $liquid-glass-apple nos controles desta aplicação.
Preserve o framework e os componentes existentes.
Inclua opções com fundo neutro e com cores.
```

### Experimentar o material

```sh
git clone https://github.com/HeitorMinuzzo/liquid-glass-skill.git
cd liquid-glass-skill
npm run showcase
```

Com Node.js 20 ou superior, o servidor abre em `http://127.0.0.1:4173`:

- [Apresentação da skill](http://127.0.0.1:4173/docs/showcase/index.html?view=home): uma apresentação curta e uma pequena vitrine com Search, Switcher e botão interativos, cada um com uma legenda discreta. O playground fica logo abaixo da vitrine, na mesma página. Autor: **Heitor Minuzzo**. Todos os componentes do site são exemplos criados utilizando a skill.
- [Playground do projeto](http://127.0.0.1:4173/docs/showcase/index.html?view=home#playground): uma caixa com rolagem própria para o artigo, lorem ipsum e fotografias. O componente começa centralizado nessa caixa e mantém sua posição enquanto o conteúdo passa por baixo, inclusive após ser arrastado. Ao rolar a Home, ele permanece preso ao mesmo ponto do playground. Arraste em qualquer parte do componente para movê-lo. A receita de vidro é fixa; não há ajustes de blur, reflexão ou refração.
- [Exemplo técnico portátil](http://127.0.0.1:4173/liquid-glass-apple/assets/example/index.html): amostras independentes para integrar a skill, com comparação óptica para desenvolvimento.
- [Coleção de componentes](http://127.0.0.1:4173/docs/showcase/index.html?view=gallery): dez amostras compactas e interativas com a mesma lente do playground.

No playground, **Edit background & text** abre a edição de título, texto e cores do fundo. Você pode ocultar, embaralhar ou substituir as fotografias por uma imagem local. **Size** aumenta o componente de 100% a 200%, recalculando a mesma receita para sua geometria. Um clique parado continua funcionando; arrastar sobre um campo mantém seu valor. A alça também aceita setas do teclado e Home para reposicionar.

Sirva o exemplo por HTTP; módulos ES não devem ser abertos diretamente por `file://`.

### Integrar no seu projeto

Copie o CSS e o JS de [`assets/core/`](liquid-glass-apple/assets/core/). O módulo não tem dependências de runtime. Ele recebe uma fonte apresentacional controlada do cenário, como texto, gradientes e imagens estáticas:

```js
import { createGlassScene } from './liquid-glass.js';

const scene = createGlassScene({ stage, source: backgroundContent, themeRoot });
const glass = scene.add(materialElement, { strength: 1 });

stage.dataset.glassBackdrop = 'none';   // sem cores
stage.dataset.glassBackdrop = 'aurora'; // com cores

scene.refresh();    // após mover o componente
scene.destroy();    // ao desmontar
```

Use camadas separadas para `.glass-material`, `.glass-content` e `.glass-rim` dentro de `.liquid-glass`. Defina a forma e o layout conforme a função do componente. A [integração completa](liquid-glass-apple/references/integration.md) explica a estrutura HTML, múltiplas superfícies, renderer customizado e ciclo de vida em outros frameworks.

A lente não captura um DOM arbitrário: sincroniza um cenário conhecido. Para outro renderer, adapte a fonte de pixels; o fallback CSS mantém o uso, mas não reproduz o espelhamento. A implementação foi verificada em Chromium/Edge; Safari/iPhone precisa de avaliação no dispositivo. É uma aproximação web, sem promessa de paridade com o renderer nativo da Apple.

**1.0.1 · Otimização com o mesmo visual:** mapas idênticos são reutilizados num cache limitado; as superfícies compartilham leituras do cenário e preparação do fundo em cada atualização. Resolução, refração, blur, transparência e reflexos permanecem iguais. A comparação antes/depois verificou pixels idênticos em 18 cenários no Edge. Num teste com oito superfícies iguais e 64 parágrafos, os cálculos iniciais de mapas passaram de 8 para 1 e as leituras de estilos do texto, de 512 para 64. São medidas de trabalho do JS, não uma promessa de FPS em qualquer aparelho.

### Verificar e regenerar capturas

```sh
npm ci
npx playwright install chromium
npm run verify:package
npm run verify:lens
npm run verify:performance
npm run screenshots
npm run screenshots:reference
npm run screenshots:readme
```

`verify:package` testa o exemplo técnico portátil, suas variantes e a desmontagem. `verify:lens` mede refração, contraste, nitidez e composição da máscara em um fixture separado da interface pública. `screenshots` verifica o alinhamento durante a rolagem do artigo, edição de texto/imagens, arraste sobre controles, material fixo, fallback e layouts de 320 a 1440px; também atualiza as capturas do site em 2×. A variável opcional `SHOWCASE_BROWSER` permite usar um executável Chromium/Edge existente.

`screenshots:readme` reproduz as quatro imagens de apresentação usando o mesmo núcleo e os controles da demonstração. A composição para captura fica em `scripts/fixtures/readme.*`, fora do pacote da skill; não modifica a receita ou a interface do site.

`verify:performance` mede o reaproveitamento de mapas e leituras da fonte, além de verificar atualizações e desmontagem. Para comparar pixels com uma versão anterior do núcleo, use `npm run verify:performance -- --baseline caminho/para/liquid-glass-anterior.js`. As capturas e o relatório ficam em `.artifacts/performance/`, fora do Git.

### Empacotar uma versão

Com Python 3 disponível, `npm run package:skill` gera `dist/liquid-glass-skill-v1.0.1.zip` e `dist/SHA256SUMS.txt`. O script verifica o inventário e o conteúdo de cada arquivo do pacote. A pasta `dist/` fica fora do Git; os arquivos são distribuídos como assets da release. A captura principal escolhida pelo autor é preservada na regeneração das referências.

<a id="estrutura--structure"></a>

## Structure / Estrutura

```text
liquid-glass-apple/       ← complete installable skill / pacote completo para instalar
  SKILL.md                 material-focused guidance / instruções centradas no material
  agents/openai.yaml       metadata / metadados
  assets/core/             CSS, ES module, and types / CSS, ES module e tipos
  assets/example/          portable example / exemplo portátil
  assets/reference/        current screenshots / capturas atuais
  assets/source-license.txt
  references/              material, integration, components, motion, validation, origin

docs/showcase/           ← component collection and playground / coleção de componentes e playground
scripts/                 ← server, checks, and captures / servidor, verificações e capturas
```

The playground and the skill import the **same optical module**, keeping the recipe consistent.

O playground e a skill importam o **mesmo módulo óptico**, evitando receitas divergentes.

<a id="licença-e-créditos--license-and-credits"></a>

## License and credits / Licença e créditos

[AGPL-3.0-only](LICENSE). The original code license is also bundled with the skill as [source-license.txt](liquid-glass-apple/assets/source-license.txt). LowNotes history and attribution to Vadik Matveev's material are preserved in the [provenance notices](THIRD_PARTY_NOTICES.md) and [skill origin](liquid-glass-apple/references/origin.md).

[AGPL-3.0-only](LICENSE). A licença do código de origem também acompanha a skill em [source-license.txt](liquid-glass-apple/assets/source-license.txt). O histórico do LowNotes e a atribuição ao material de Vadik Matveev foram preservados em [avisos de procedência](THIRD_PARTY_NOTICES.md) e [origem da skill](liquid-glass-apple/references/origin.md).

Sample photographs are bundled locally in `docs/showcase/assets/`, with [authors and sources](docs/showcase/assets/photos.json) and terms separate from the code in the [provenance notices](THIRD_PARTY_NOTICES.md). No external image service request is needed during use.

As fotos de exemplo estão incluídas localmente em `docs/showcase/assets/`, com [autores e fontes](docs/showcase/assets/photos.json) e termos separados do código em [avisos de procedência](THIRD_PARTY_NOTICES.md). Nenhuma requisição a serviços de imagens é necessária durante o uso.

An independent project, not affiliated with or sponsored by Apple. The images demonstrate this project's code and do not include the iPhone reference screenshots.

Projeto independente, sem vínculo ou patrocínio da Apple. As imagens demonstram código deste projeto e não incluem os prints de referência do iPhone.

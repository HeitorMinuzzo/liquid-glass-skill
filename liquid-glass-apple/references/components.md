# Componentes e estados

Use este guia conforme os componentes pedidos. Não acrescente todos os exemplos a cada interface. A receita óptica é a mesma do núcleo; varie geometria, densidade e estados conforme a função.

## Estrutura e conversão

```html
<button class="product-action liquid-glass" style="--glass-radius:999px" type="button">
  <span class="glass-material" aria-hidden="true"></span>
  <span class="glass-content">Ação do produto</span>
  <span class="glass-rim" aria-hidden="true"></span>
</button>
```

Defina layout/tamanho no produto e remova o preenchimento anterior **do host**: por exemplo, `.product-action {border:0; background:transparent;}`. Um fundo opaco entre a lente e o conteúdo encobre o vidro. Inspecione também pseudo-elementos, wrappers da biblioteca e estilos de hover, seleção, foco e disabled. Não baixe `opacity` no host: isso apagaria também os rótulos.

Registre `.glass-material` com `scene.add(material)` nos padrões aprovados. Material, conteúdo e contorno ocupam a mesma forma; use `--glass-radius` explícito. O núcleo não troca o `button`, `input` ou componente do framework: preserve os elementos reais e seus eventos. As camadas apresentacionais têm `aria-hidden` e `pointer-events:none`.

Ao converter, altere a apresentação e mantenha a API do componente. Não clone handlers, IDs, campos editáveis ou popups interativos como fonte do filtro. Use uma representação apresentacional sincronizada do cenário, conforme [integração](integration.md#limite-importante-da-fonte).

## Campos e foco

Um campo de busca tem input transparente dentro da camada nítida, sem borda retangular própria. Marque seu host com `data-glass-field`: o CSS do núcleo remove o outline dos inputs de texto/busca **dentro desse host** e reforça o mesmo contorno ao focar. Ele não remove o foco dos demais controles da aplicação. Associe um label ou `aria-label` e preserve seleção do texto, cursor, digitação e validação.

```html
<label class="product-search liquid-glass" data-glass-field style="--glass-radius:999px">
  <span class="glass-material" aria-hidden="true"></span>
  <span class="glass-content">
    <span class="sr-only">Buscar</span>
    <input type="search" placeholder="Buscar" />
  </span>
  <span class="glass-rim" aria-hidden="true"></span>
</label>
```

Defina a classe `sr-only` conforme o produto. Estilize o input com `border:0; background:transparent; color:inherit` e dimensões próprias. Não aplique `outline:none` a todos os inputs ou a todos os botões. Para gatilhos/itens de menu, uma indicação de teclado pode reforçar o contorno existente ou sublinhar o rótulo; deve ser perceptível nos dois temas. Clique de ponteiro não deve criar o retângulo preto nativo. Em cores forçadas, preserve uma indicação com cores de sistema.

## Menus e popups

O gatilho, o menu aberto e o estado selecionado precisam de acabamento coerente. Um popup opaco do sistema não satisfaz o pedido de menu Liquid Glass. Use a primitiva acessível já disponível no projeto para popup/listbox/menu; não introduza outra biblioteca apenas para o material. Para escolha de valor, preserve o padrão apropriado de seleção (como listbox ou opções menuitemradio); um menu de ações segue o padrão de menu. Preserve navegação por teclado, Escape, seleção, foco retornando ao gatilho e fechamento por clique externo.

- **Gatilho:** host transparente, uma lente e um rim. Preserve `aria-expanded`, relação com o popup e indicação de teclado.
- **Menu:** `.glass-material` cobrindo toda a superfície, conteúdo real acima e `.glass-rim` no contorno. Defina a fonte visual **atrás do menu**, não uma cópia de suas opções; chamar `scene.refresh()` após abrir/posicionar permite medir a geometria visível.
- **Selecionado:** fundo translúcido e `.glass-rim` próprio na mesma forma da opção. Compartilhe a lente do menu, sem uma segunda captura/refração do mesmo cenário. Não use uma placa preta/cinza sólida ou uma borda reta para marcar a escolha. Mantenha check/estado semântico independente do acabamento.
- **Posição:** por padrão, alinhe a borda esquerda do menu à borda esquerda do gatilho, expandindo para a direita; respeite RTL e a posição solicitada. Faça clamp/flip próximo dos limites da tela. Portais precisam herdar o tema e manter coordenadas/fonte sincronizadas; abrir no `body` não registra o vidro automaticamente.

Sobreposição: nunca capture o próprio menu no cenário que sua lente usa. Um popup sobre um artigo/imagem deve representar esse artigo/imagem na fonte apresentacional. Se a biblioteca usa portal, posicione um cenário correspondente no mesmo sistema de coordenadas ou use um renderer apropriado; veja os limites em [integração](integration.md). Para reprodução fiel, não use apenas o fallback CSS quando o ambiente comporta a lente.

Menus densos continuam usando a transparência aprovada por padrão. Resolva legibilidade com rótulos nítidos, espaçamento e atenuação local do cenário. Uma variante mais sólida só deve entrar por preferência de acessibilidade, necessidade demonstrada de contraste ou pedido explícito; não substitua silenciosamente a receita.

## Seleção, switcher e toggle

Um indicador sobre outra superfície de vidro é uma camada de **estado**, não um fundo opaco. Use preenchimento transparente/neutro, a mesma geometria e `.glass-rim` próprio. O núcleo fornece a óptica ao controle; o indicador não refiltra o cenário. Posicione ícones/rótulos acima do indicador e contorno sem bloquear eventos.

O CSS do núcleo inclui os tokens do acabamento aprovado para estados: `--glass-selected-fill` (prata `32%` no claro / `14%` no escuro, restante transparente) e `--glass-selected-shadow` (luz interna superior/esquerda, sombra inferior e contato curto). Use-os num indicador ou opção selecionada e mantenha o `.glass-rim` padrão; não precisam do CSS da demonstração. Exemplo de estado de opção, adaptando as classes/atributos à primitiva do produto:

```css
.product-choice { position:relative; border:0; background:transparent; border-radius:999px; }
.product-choice[aria-checked="true"] { background:var(--glass-selected-fill); }
.product-choice > .glass-rim { --glass-rim-shadow:var(--glass-selected-shadow); opacity:0; }
.product-choice[aria-checked="true"] > .glass-rim { opacity:1; }
.product-choice:focus-visible { outline:none; }
.product-choice:focus-visible > .choice-label { text-decoration:underline; text-underline-offset:4px; }
```

O rótulo real `.choice-label` e o check ficam acima do cenário óptico. Adapte `aria-selected` ou o estado equivalente quando a primitiva usar outra semântica; não adicione ARIA incoerente só para reutilizar um seletor CSS.

Anime o indicador contínuo entre opções em vez de criar/destruir cápsulas sem transição. A duração/easing devem seguir o produto; a amostra usa `500ms`. Não modifique rótulos, seleção ou teclado para simular a animação. Em movimento reduzido, a escolha muda imediatamente.

## Botões, grupos e sliders

Botões compactos, controles de quantidade e playback podem ser cápsulas; botões de ícone podem ser círculos. Um raio pequeno fixo não deve deixar apenas esses controles quadrados numa família arredondada. Preserve superfície e contorno em hover/pressionado; disabled reduz a ênfase sem remover legibilidade ou semântica.

No slider, barra **e** bolinha devem mostrar vidro, em vez de uma barra/bolinha preta sólida. Use o controle acessível existente ou o adapter nativo opcional de [integração](integration.md#slider-nativo). A amostra mantém um `input[type=range]` real e cresce a bolinha de `24px` a `29px` durante pressão, retornando ao soltar/cancelar. O crescimento altera geometria real para recalcular a lente, sem mudar o mapeamento valor/posição. Não interceptar o drag do range para arrastar o playground.

## Erros que impedem a conclusão

| Sintoma | Verificação e correção |
| --- | --- |
| Menu opaco, gatilho em vidro | Registre o material do popup e remova seu background anterior; um select nativo não estiliza as opções como vidro. |
| Seleção plana ou contorno preto | Verifique fundo translúcido e rim próprio do estado; retire border/outline nativos apenas nesse elemento, preservando foco de teclado. |
| Search ganha um retângulo ao clicar | Use `data-glass-field` no host; mantenha input nítido/transparente e a indicação no contorno do host. |
| Cápsula branca/cinza sobre foto | Confirme adaptação fotográfica, fonte DOM `img` alinhada e sem camada opaca adicional; não diminua opacity do conteúdo. |
| Fundo vazio parece um botão comum | Confira mapa de reflexão e rim do núcleo, inclusive no branco puro; não acrescente uma segunda borda. |
| Refração só em topo/fundo ou estreita em tamanho maior | Registre o material com a geometria real e padrões `extended`/`1.2`; não reutilize mapa fixo ou estique a captura pronta. |
| Texto do controle fica borrado | Tire o conteúdo real do filtro/cópia e mantenha-o em `.glass-content`. |
| Efeito fica parado ao mover/rolar | Sincronize posição da fonte e da lente; chame `refresh()` durante movimento e confira alinhamento de portal/transform. |

Confira esses estados visualmente, além dos valores computados. Não finalize a conversão quando somente o estado de repouso do gatilho estiver correto.

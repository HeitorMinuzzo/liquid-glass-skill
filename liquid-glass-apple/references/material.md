# Especificação do material Liquid Glass

## Comportamento visual

O vidro altera o fundo somente dentro de sua silhueta. No claro, texto preto atrás fica cinza; no escuro, texto branco atrás perde intensidade. Fora do componente, a cor original continua intacta. As letras permanecem identificáveis no centro, com pouco blur, e se alongam, comprimem e invertem no ombro arredondado da borda. O efeito existe também nas extremidades esquerda/direita.

Fotografias preservam cor e textura sob o material, com difusão suave. Em fundo plano, não há detalhes para refratar: o volume vem de um reflexo contínuo que perde intensidade ao atravessar o ombro arredondado, de um limite fino e de uma sombra exterior curta. Claro e escuro compartilham a geometria desse acabamento, com intensidades adaptadas ao tema. Não desenhe duas linhas paralelas para representar espessura: trabalhe a transição de luz e sombra na curvatura. A reflexão depende do ângulo da superfície; não invente ondulações no centro para simular detalhes no cenário.

Essa especificação se aplica às superfícies necessárias ao projeto. Círculos, cápsulas e retângulos arredondados podem usar a mesma lente; layouts, estados, dimensões e ícones vêm da interface em que o material é aplicado.

## Camadas

1. **Material óptico:** cenário sincronizado ou renderer do projeto, recortado na silhueta do componente; fallback CSS quando necessário.
2. **Estado:** indicador, seleção ou hover, se a função pedir. Não inclua esse estado numa cópia do fundo.
3. **Conteúdo:** elementos semânticos e interativos reais, acima da lente; texto e ícones não recebem displacement.
4. **Contorno:** reflexo discreto independente do filtro, sem faixa branca grossa.

O CSS do pacote fornece `.liquid-glass`, `.glass-material`, `.glass-content` e `.glass-rim`. Defina tamanho, padding, layout e raio conforme o componente; o pacote não estiliza uma biblioteca de widgets nem obriga fonte, ícones ou ações.

Quando uma seleção aparecer como uma segunda superfície, seu acabamento também precisa acompanhar a curvatura. O indicador translúcido recebe seu próprio contorno: luz suave no topo/esquerda, sombra curta na parte inferior e um único limite fino. Na integração DOM, use `.glass-rim`. Ele compartilha a lente do controle, sem filtrar o fundo novamente. O acabamento acompanha a animação; rótulos e ícones permanecem acima das duas camadas. Esse tratamento pertence ao estado do componente e não altera a receita das outras superfícies.

## Curva aprovada

O mapa RG usa a distância até um retângulo arredondado e sua normal em duas dimensões. A espessura da lente segue um perfil arredondado e achatado; a direção do raio é calculada com a lei de Snell. Uma distância óptica entre vidro e fundo evita que o deslocamento colapse no contorno. A derivada da amostragem se inverte num pequeno trecho: isso produz a imagem espelhada, não uma linha branca pintada.

| Parâmetro | Receita atual |
| --- | --- |
| Escala óptica `s` | `max(1, min(altura / 52, raio / 26))` |
| Ombro superior/inferior | `min(18 × s, altura × .33, largura × .08, raio × .66)` px |
| Ombro lateral | `min(21 × s, altura × .36, largura × .10, raio × .72)` px |
| Alcance do ombro | multiplicador `1.2`, limitado a `42%` da menor dimensão para preservar o centro plano |
| Perfil arredondado | `surface = (1 − (1 − t)³)^(1/3)`, com inclinação nula ao encontrar o centro |
| Espessura | `min(18 × s, raio × .70)` px |
| Separação óptica do fundo | `min(14 × s, raio × .54)` px |
| Índice de refração do modelo | `1.50` |
| Amostragem do mapa | `2×`, cache por geometria, intensidade, alcance e perfil |
| Margem da imagem filtrada | `48px` em cada lado |
| Deslocamento SVG | escala `64 × s`, com canais RG centrados em `.5`; evita cortar a refração de cápsulas maiores |
| Suavização antes da refração | `.4px` |
| Suavização do ombro / centro | `1.15px` / `.25px` |
| Luminância do fundo, ombro / centro | claro `.50` / `.47`; escuro `.30` / `.24`, em direção à base neutra do tema |
| Transmissão de fotografias | claro `.56` / escuro `.38`, interpolados conforme a área coberta por imagem |
| Atenuação adicional dos glifos no claro | cor do texto da cópia a `52%`, com imagens intactas |
| Crominância | `.86` em texto/fundo plano; sobre fotos, claro `.70` / escuro `.72` |
| Difusão de imagens DOM clonadas | `clamp(altura × .035, 1.5, 6)` px no claro; `.04` no escuro; somente em `img` |
| Tonalidade fotográfica | cor média da imagem sob a superfície, com luminância alvo `.91` no claro / `.27` no escuro; leitura de pixels indisponível conserva a base neutra |
| Reflexão no ombro | mapa RGBA na mesma geometria `2×`; Fresnel `F = .04 + .96 × (1 − cos(incidência))⁵` |
| Ambiente refletido | luz neutra superior/esquerda, direção `−.55 nx − .83 ny`; luminosidade `.16` a `1`; não copia fotos nem introduz cores |
| Direção da reflexão | `key = clamp((−.55 nx − .83 ny + .2)/1.1, 0, 1)`; o lado sombreado reflete menos luz |
| Opacidade da reflexão | `(.55 F + .50 exp(−((profundidade − 1.3)/2.4)²)) × (.12 + .88 key) × (1 − t)²`, sendo `t` a profundidade normalizada do ombro |
| Intensidade por tema | reflexão a `100%` no claro e `48%` no escuro; mesma geometria, sem anel interior separado |
| Acabamento sobre fotografia | reflexão reduzida em até `32%` e contorno em até `28%`, suavemente conforme a cobertura |
| Limite exterior | gradiente direcional fino de `.75px`; o volume vem do reflexo contínuo no ombro |
| Sombra exterior | contato curto e queda suave abaixo do vidro, com intensidade adaptada a claro/escuro |
| Branco puro no tema claro | a base acompanha papel neutro mais claro; branco atravessa branco, sem preencher a cápsula com cinza |
| Prata acima da imagem óptica | `#bbbbbc`, claro `6%` / escuro `12%` |

Valores calibrados para esta receita, não constantes fornecidas pela Apple. O padrão do pacote é `edgeProfile:'extended'`, `edgeWidth:1.2`, `adaptToPhotos:true` e `strength:1`. O ombro alcança mais o interior e cresce junto com a superfície, sem aumentar o blur do centro. `strength:0` mantém tonalidade, suavização e luz sem deslocamento; `1.4` é o limite técnico. Preserve os padrões em todos os componentes do projeto. As opções técnicas do módulo servem para comparar e aperfeiçoar a óptica quando solicitado; não exigem controles públicos no produto.

As máscaras de centro e ombro são complementares e somadas (`k2=1`, `k3=1`). Compor com alpha-over criou uma costura clara por perda de opacidade. Preserve essa soma e o campo RG neutro fora da deformação.

## Leitura e aparência

No centro, comprima o contraste do cenário em vez de apagar as letras com blur forte. Não modifique o texto real da página para obter o cinza: filtre a cópia/renderização do fundo sob o vidro. O conteúdo do componente continua na camada nítida, com foco e estados legíveis.

A compressão usa luminância `Y = .2126R + .7152G + .0722B` e preserva separadamente a diferença de cada canal em relação a `Y`. O resultado é `chroma × (RGB − Y) + slope × Y + (1 − slope) × base`, limitado à gama RGB. Fotografias mantêm azul, verde, dourado e outras cores, com menos preenchimento cinza no tema claro; texto e áreas vazias usam a base neutra. Uma multiplicação uniforme de RGB por `.24` apagava tanto contraste quanto crominância.

No claro, a luminância da imagem atravessa mais o vidro para evitar uma placa branca opaca. A cópia sincronizada atenua separadamente a cor dos elementos com texto direto, mantendo o preto acinzentado sob a lente sem reduzir a opacidade de containers que também contêm fotografias. Nunca aplique essa atenuação ao DOM original. Sobre papel neutro mais claro que a base do tema, o módulo eleva a base até a luminosidade do papel. Isso evita uma placa cinza sobre branco puro; a receita de refração, as inclinações da matriz e o blur continuam iguais. Fundos coloridos, escuros ou transparentes conservam a base calibrada.

O módulo difunde somente `img` da cópia sincronizada; o DOM real não muda. Um `renderBackdrop` próprio precisa fornecer tratamento equivalente de imagens e atenuação de glifos no claro, pois pixels de um canvas não distinguem texto de fotografia automaticamente. O mapa de reflexão usa a normal da mesma curva óptica e um ambiente neutro de iluminação, com reflexão maior em ângulos rasantes. Fica mais visível junto ao contorno e desaparece no centro, independentemente de `strength`. A reflexão se sobrepõe à composição já opaca; mantenha a soma das máscaras de centro/ombro para não reintroduzir uma costura clara.

Menus e seus estados usam a mesma receita por padrão; não substitua o popup por uma placa opaca. Para conteúdo denso, preserve rótulos nítidos e a atenuação local do cenário. Uma superfície mais sólida exige preferência de acessibilidade, necessidade demonstrada de contraste ou pedido explícito. Preserve cores de marca e cores funcionais; neutralidade do material não significa proibir azul ou outros acentos. Veja [componentes e estados](components.md) para foco, popups e seleções.

Fundo neutro e fundo colorido têm a mesma lente. `data-glass-backdrop="none"` é a variante sem cores; `aurora`, `ocean` e `sunset` são exemplos opcionais com cores. Os presets usam picos de luz localizados, alternando posições no topo, centro e parte inferior do cenário. Os tamanhos são limitados conforme o viewport para manter os focos definidos em telas estreitas; as bordas do cenário recebem uma suavização curta. Ofereça ambas as opções e adapte os presets à direção visual do produto.

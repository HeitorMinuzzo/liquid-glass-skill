# Origem e referências atuais

A receita atual foi construída e aprovada no projeto **SKILLS**, comparando o playground com prints de Liquid Glass do iPhone fornecidos pelo usuário. A aprovação cobre o alongamento e espelhamento nas bordas, a atenuação local do texto, o centro pouco borrado, a refração proporcional de componentes maiores e a maior transmissão fotográfica no tema claro. O pacote e o site compartilham esses padrões.

## Capturas do projeto atual

- [Artigo, tema escuro sem cores](../assets/reference/article-dark.png): a busca atravessa duas linhas; o texto mantém sua cor fora do vidro e se deforma nas bordas.
- [Comparação sobre artigo](../assets/reference/article-comparison.png): 0%/100%, mantendo fundo e posição.
- [Exemplo neutro claro](../assets/reference/example-neutral-light.png), [colorido claro](../assets/reference/example-color-light.png), [neutro escuro](../assets/reference/example-neutral-dark.png) e [colorido escuro](../assets/reference/example-color-dark.png): material portátil em diferentes cenários.
- [Fotografia, claro](../assets/reference/photo-light.png) e [escuro](../assets/reference/photo-dark.png): acabamento refinado com crominância preservada e difusão suave, mantendo a curva de refração previamente aprovada.
- [Branco puro, tema claro](../assets/reference/plain-light.png) e [preto puro, tema escuro](../assets/reference/plain-dark.png): reflexos direcionais no ombro e contorno fino dão espessura sem texto/imagens atrás. Esse acabamento refina a iluminação; mantém a curva de refração aprovada.
- [Slider claro](../assets/reference/slider-light.png) e [escuro](../assets/reference/slider-dark.png): barra e bolinha com a mesma lente; [pressionado](../assets/reference/slider-pressed-light.png) mostra o crescimento discreto da bolinha.
- [Menu claro](../assets/reference/menu-light.png) e [escuro](../assets/reference/menu-dark.png): popup translúcido e seleção com contorno próprio em vidro.
- [Busca sobre fotografia · referência principal aprovada](../assets/reference/scaled-photo-light.png): captura fornecida por Heitor Minuzzo, com a busca deste projeto sobre a fotografia do Apple Park utilizada na comparação. Foi escolhida pelo autor para mostrar a transparência e a refração da V1; é preservada durante a regeneração das outras capturas.

São capturas reais do navegador, não mockups, pinturas ou filtros aplicados aos prints do usuário. Use-as para comparar o efeito; nomes, textos, tipografia, ícones, dimensões e composição dos exemplos são substituíveis. O pacote não inclui os prints proprietários do iPhone como assets de aplicação.

As capturas regeneráveis `photo-light.png` e `photo-dark.png` usam a imagem de lago de **Simon Hurry**, publicada no [Unsplash](https://unsplash.com/photos/lake-near-mountain-under-blue-sky-during-daytime-jAAk__SlP8U) sob a [licença Unsplash](https://unsplash.com/license). A referência principal `scaled-photo-light.png` foi fornecida pelo autor sobre uma fotografia do Apple Park e conserva a origem separada desse conjunto. A licença das fotografias é separada da AGPL do código. O repositório contém os créditos das demais fotos em `docs/showcase/assets/photos.json` e `THIRD_PARTY_NOTICES.md`.

## Histórico e licença

A versão inicial extraía um conjunto de material e componentes do LowNotes, sob **AGPL-3.0-only**, com referência ao theme switcher de Vadik Matveev (`vadik.design`, via FreeFrontend). Essa composição não é mais a receita nem o exemplo padrão da skill. O normal map fixo e o CSS/JS externos brutos não fazem parte da versão atual.

O repositório conserva o CSS anterior como histórico em `docs/showcase/baseline.css`, incluindo seus créditos. A coleção inicial mostra somente controles compactos sobre fundo simples. O playground concentra os testes em artigo rolável, texto e fotografias, com material fixo; a geometria compacta do seletor preserva a atribuição em `controls.css`. A licença AGPL permanece em `assets/source-license.txt` e na raiz do repositório. Consulte também o aviso de procedência do repositório; a reformulação não remove a atribuição do histórico.

O código de refração atual gera o mapa para cada forma, usando uma curva óptica calibrada neste projeto. Isso é uma aproximação web: não publica nem reproduz exatamente o renderer proprietário da Apple. A receita foi verificada em Chromium/Edge; Safari/iPhone continua exigindo avaliação no dispositivo. Apple não é autora nem patrocinadora do pacote.

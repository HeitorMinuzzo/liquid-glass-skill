# Validação do material

Valide os componentes e estados reais da aplicação de destino. As referências fornecidas ajudam a comparar a óptica e o acabamento; a geometria, o conteúdo e a composição do teste devem corresponder ao contexto do projeto.

## Verificação visual

- Compare `strength:0` e `1` com o mesmo fundo, posição, tema e tonalidade. As letras junto ao contorno devem mudar de formato, não apenas ficar mais borradas.
- Passe texto de artigo, título grande e uma imagem pelo topo, fundo e laterais. No ombro, observe alongamento e um trecho espelhado; no centro, preserve as formas com pouco blur.
- Fora do vidro, o cenário mantém sua cor. Sob o vidro, preto vira cinza no claro e branco é atenuado no escuro. O conteúdo do controle não participa da deformação.
- Observe raio pequeno, cápsula e círculo quando essas formas fizerem parte do produto. O filtro acompanha o contorno real, sem faixa branca larga ou ondulação transversal artificial.
- Veja **sem cores** e **com cores**. Cor do cenário não é prova do efeito óptico e não deve ser necessária para ele funcionar.
- Passe fotografias com cores frias e quentes atrás do vidro. A cor predominante continua reconhecível; o cenário não vira uma placa cinza. A difusão deve afetar a foto clonada, preservando o centro nítido sobre texto.
- Confira fundo plano em claro/escuro e **branco puro**: o brilho e a sombra acompanham a curvatura em uma transição contínua, sem duas linhas paralelas, faixa branca larga ou textura artificial no centro. Em branco puro, o centro deve continuar quase branco e a borda precisa ser visível; uma placa cinza com sombra difusa não comprova vidro.

## Interação e implementação

Confira foco, clique, digitação, estados e conteúdo no viewport estreito. Busca e gatilhos não devem ganhar um retângulo preto ao clicar; a indicação de teclado continua perceptível no acabamento/rótulo. Abra menus nos dois temas: o popup e a seleção revelam o fundo, possuem contorno em vidro e preservam navegação, Escape e retorno do foco. Confira a posição em relação ao gatilho e limites do viewport. Para playgrounds arrastáveis, iniciar sobre um botão/campo move o componente após um limiar de movimento; um clique parado continua funcionando. Campos mantêm seu valor após arraste.

Confira mudança de fundo/texto, resize, troca de tema e movimento do componente: cópia e cenário real precisam continuar alinhados. Ao desmontar, remova filtros SVG, cópias, observers e listeners. Duas superfícies não compartilham um filtro dimensionado para outra geometria.

Ao aumentar uma cápsula, a faixa refratada também avança para dentro proporcionalmente, sem transformar o centro numa área de blur pesado. No slider, confira barra e bolinha ópticas, crescimento ao pressionar e retorno ao soltar/cancelar; teclado e extremos de valor continuam sincronizados com a bolinha. Ajustar o volume não deve arrastar o componente inteiro.

Verifique material sólido nas preferências de transparência reduzida, contraste aumentado e cores forçadas. Não invente uma tela de configurações num produto só para expor os controles de laboratório.

Para otimizações, compare capturas da implementação anterior e da nova no mesmo navegador, viewport, escala, fonte e estado; aguarde a decodificação das imagens e atualização da lente. Confira texto/fotos/fundo plano em claro/escuro, superfícies de tamanhos diferentes, alteração da fonte, resize, menus e slider pressionado. Meça cálculos de mapas, leituras de estilo e trabalho de renderização separadamente: menos chamadas de JS não equivale a uma promessa de FPS para todos os aparelhos.

## Recursos desta skill

- `../assets/reference/article-dark.png`: referência aprovada no tema escuro, sem cores.
- `../assets/reference/article-comparison.png`: comparação real de 0%/100% sobre texto menor.
- `../assets/reference/example-neutral-light.png` e `example-color-light.png`: mesma base de material, com e sem cores.
- `../assets/reference/photo-light.png` e `photo-dark.png`: acabamento sobre fotografia, preservando cor.
- `../assets/reference/plain-light.png` e `plain-dark.png`: luz e volume sobre branco/preto puros, sem detalhes no cenário.
- `../assets/reference/scaled-photo-light.png`: referência principal de transparência e refração sobre fotografia, escolhida e fornecida pelo autor.
- `../assets/reference/slider-light.png`, `slider-dark.png` e `slider-pressed-light.png`: acabamento e estado pressionado do range nativo.
- `../assets/reference/menu-light.png` e `menu-dark.png`: gatilho, menu aberto e opção selecionada.
- `../assets/example/index.html`: exemplo portátil para experimentar em outro projeto.

No repositório SKILLS, `scripts/verify-lens.mjs` mede contraste local, nitidez no centro, refração nas quatro bordas, máscara sem vazamento e interior claro com contorno visível sobre branco puro em um fixture técnico separado. `scripts/capture.mjs` verifica alinhamento durante a rolagem do artigo, edição de texto/imagens, arraste em qualquer parte do controle, material fixo, fallback e responsividade. O playground público mantém a receita aprovada e permite editar o cenário e o tamanho da amostra; comparações ópticas ficam nos recursos de desenvolvimento. `scripts/verify-package.mjs` verifica o pacote portátil, variantes de aparência, geometria e desmontagem. Esses testes não comprovam paridade com o renderer da Apple nem substituem validação no navegador/dispositivo do produto.

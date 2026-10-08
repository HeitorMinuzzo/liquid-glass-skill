# Movimento do material

A lente acompanha o fundo e a geometria durante o movimento do componente. Integre essa sincronização às animações e interações previstas no projeto.

Use a biblioteca de animação e o ritmo do produto. Preserve estado, foco e conteúdo. Reversões devem partir da posição atual, sem remounts usados só para reiniciar um efeito. Respeite movimento reduzido.

No renderer portátil, chame `scene.refresh()` após mudar posição/transform em cada frame de movimento. ResizeObserver cuida das mudanças de tamanho; o mapa é regenerado somente para largura, altura, raio ou intensidade diferentes. Não recrie o filtro nem clone o cenário em cada frame de drag.

Mantenha o conteúdo e o contorno fora do filtro. Ao final da animação, confira que borda, clipping e contexto de composição continuam iguais aos do estado intermediário. Transformações de escala entre cenário e vidro exigem um adapter de coordenadas; uma translação dentro do mesmo plano não deve deslocar a cópia do fundo.

Para um playground, um limiar de aproximadamente 6px distingue clique de arraste. Capture o ponteiro apenas quando o movimento começar, evite acionar o botão de origem depois de um drag e permita iniciar em qualquer parte da superfície. Ofereça posicionamento por teclado como alternativa. Não aplique essa interação a todos os componentes de uma aplicação.

Quando uma bolinha de slider cresce ao pressionar, mantenha seu centro e o percurso nativo estáveis. Anime largura/altura, sem escalar a camada filtrada: o ResizeObserver acompanha o raio e a refração. A amostra portátil usa `24px → 29px` em `140ms`; movimento reduzido retira a transição e preserva o estado pressionado. Soltar, cancelar o ponteiro ou perder o foco da janela restaura o tamanho. Exclua o input de range do arraste do playground para não mover o componente enquanto seu valor muda.

# Modificadores de tela

Tela em **Utilitários › Modificadores de tela** (`src/components/ScreenModifiers.tsx`). Dois toggles independentes que alteram telas nativas do jogo, sem esconder que a alteração veio do script.

## Visualizar tropas em produção

`src/lib/trainingQueueOverlay.ts` + `trainingQueue.ts`. Só ativa na Visão Geral, aba Tropas (`screen=overview_villages&mode=units`) — em qualquer outra tela, não faz nada.

- Adiciona uma linha **"recrutando"** acima da linha "total" de cada aldeia na tabela nativa, com a quantidade de cada unidade atualmente na fila de recrutamento.
- Anota o total nativo de cada unidade com o que está a caminho, em verde: ex. `1627 (+333)` quando há 333 daquela unidade na fila. Unidades sem nada na fila não ganham anotação.
- Como o jogo não expõe a fila de todas as aldeias numa chamada só, o script busca a tela de recrutamento (`screen=train`) de cada aldeia individualmente.
- **Cache de 30 minutos** por conjunto de aldeias — dentro da janela, reabrir a tela não refaz a requisição. O botão "atualizar" força um refetch imediato, ignorando o cache.
- Sem polling automático — só atualiza na montagem ou no clique manual de "atualizar".
- **Limitação conhecida**: desligar o toggle não remove a linha/anotação já injetada na página atual — só some numa navegação nova, quando o script reinicializa e não reinjeta.

## Visualizar recursos chegando do saque

`src/lib/incomingFarmingResources.ts`. Injeta um banner na Visão Geral, logo antes do widget nativo "Suas tropas".

- Olha a lista de comandos retornando e identifica quais são **especificamente ataques de saque** (pelo ícone do comando) — comandos de apoio ou espionagem retornando são excluídos, mesmo aparecendo na mesma lista.
- Pra cada comando de saque identificado, busca o recurso previsto (`booty`) via `info_command`. Esse valor é fixado no momento em que o ataque retorna e **nunca muda depois** — por isso fica em cache **sem expiração**, só sendo buscado uma vez por comando.
- Busca com **delay aleatório de 400 a 900ms** entre um comando e outro, pra não gerar rajada de requisições quando muitos comandos retornam de uma vez.
- Atualiza sozinho via `MutationObserver` na lista de comandos — reage a qualquer comando aparecendo/saindo da lista, sem depender de polling fixo.
- Some automaticamente (banner escondido) quando não há nenhum saque retornando no momento.
- **Limitação conhecida**: o texto do banner menciona "aldeias bárbaras", mas na prática soma qualquer comando de saque retornando, independente do tipo de alvo.
- Mesma limitação de desligar o toggle não remover o que já foi injetado na página atual.

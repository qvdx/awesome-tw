# Mapeamento de aldeias + espionagem em massa

Tela em **Utilitários › Mapeamento de aldeias** (`src/components/VillageMapping.tsx`, `src/lib/villageMap.ts`, `sendMassSpyAttacks.ts`, `spyAttack.ts`, `spySendBanner.ts`).

## Fonte dos dados

Não existe endpoint oficial pra isso — o script busca o HTML da própria tela de **Mapa** do jogo (`GET /game.php?screen=map`) e extrai a variável `TWMap.sectorPrefech` que o jogo já embute na página. Só entram **aldeias sem dono** (owner id `0`) — aldeias de jogador nunca aparecem na lista.

- `type`: `'bonus'` se a aldeia tiver bônus associado, senão `'barbarian'`.
- `distance`: distância euclidiana até a aldeia atual (a que está aberta na aba).
- `points`: parseado do formato `1.234` (separador de milhar pt-BR).

## Cache

Um cache por aldeia (`awesometw:cache:nearby-villages:<villageId>`), **sem expiração automática** — uma vez mapeado, os dados ficam válidos indefinidamente até você clicar em "atualizar" (que força um novo fetch e sobrescreve o cache). Abrir a tela de novo com cache existente já mostra os resultados na hora, sem esperar rede.

## Filtros

Escondidos por padrão atrás de um ícone de funil:

- **Tipo**: todas / só bárbaras / só bônus (default: todas).
- **Distância**: sem limite, ou um teto de 10/15/20 campos (default: sem limite).
- **Pontos**: mínimo e máximo livres, ambos opcionais (default: sem limite).

**"Selecionar todas"** só considera as aldeias que passam no filtro atual — mudar o filtro depois de selecionar remove da seleção qualquer aldeia que não bate mais com o novo filtro (evita "selecionar todas" incluir aldeia escondida pelo filtro).

Não existe busca por texto/coordenada nessa tela — só os filtros acima.

## Tempo de viagem

Calculado só pra 4 unidades: **cavalaria leve, aríete, catapulta e nobre**. Se uma unidade não existir no mundo (ex: nobre desabilitado), ela simplesmente não aparece na linha. Fórmula: `campos × minutos-por-campo`, onde minutos-por-campo já vem ajustado pela velocidade do mundo (`worldSpeeds.ts`: `velocidadeBaseDaUnidade ÷ (velocidadeDoMundo × velocidadeDeUnidade)`).

## Espionagem em massa

- Quantidade de exploradores configurável (default: 5), aplicada igualmente a **todas** as aldeias selecionadas no lote — não é por-aldeia.
- Envio sequencial, um alvo por vez, com delay aleatório de **1 a 3 segundos** entre um envio e outro (sem espera depois do último).
- **Interromper não cancela um envio em voo**: a aldeia que já começou a ser processada termina normalmente; só as que ainda não começaram são puladas. Por isso o resultado final pode ter menos aldeias processadas que o total selecionado.
- Falha ao espiar uma aldeia específica não aborta o lote — fica registrada como falha e o envio continua pras próximas.
- Confirma o envio pra **todas as aldeias selecionadas no momento**, não só as visíveis pelo filtro atual (a seleção já vem podada pelo filtro, ver acima).
- Barra de progresso injetada direto na tela do jogo (`spySendBanner.ts`, logo abaixo do cabeçalho) — continua visível mesmo se você fechar o menu do AwesomeTW, com botão de interromper próprio.

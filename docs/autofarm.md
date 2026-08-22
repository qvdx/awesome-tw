# Autofarm

Automação em **Automações › Autofarm** (`src/lib/autoFarmScheduler.ts`, `runAutoFarmOnce.ts`, `planAutoFarm.ts`, `sendAutoFarmActions.ts`, `farmAssistant.ts`). Cicla pelas aldeias configuradas, lê o assistente de saque (`am_farm`) de cada uma e decide sozinho o que enviar.

## Configuração

Tela de configuração (`AutoFarmSettings.tsx`), salva em `localStorage` via `autoFarmConfig.ts`:

| Campo | Default | Regra |
|---|---|---|
| `intervalMinutes` | 5 | mínimo efetivo de 60s (`MIN_INTERVAL_MS`), mesmo se configurado menor |
| `minDelaySeconds` / `maxDelaySeconds` | 2 / 6 | intervalo aleatório entre um envio e outro |
| `villageIds` | vazio | vazio = roda só na aldeia da aba aberta; preenchido = roda nessas aldeias |
| `maxWallLevel` | sem limite | maior nível de muralha que ainda recebe comando |
| `maxDistance` | sem limite | maior distância (campos) que ainda recebe comando |
| `configured` | `false` | trava o toggle de ativação até a primeira config salva |

## Prioridade de modelo (A vs. C)

Pra cada relatório elegível do assistente de saque:

- **Modelo C** (calculado a partir do relatório de um saque anterior) só entra quando o relatório **não é de saque total** e o forecast de recurso do relatório pede **tropa suficiente** — nunca menos do que o modelo A exigiria.
- Se essas condições não baterem, cai pro **modelo A**, e só se houver tropa configurada disponível pra montar o comando.

## Ordenação — "farm ótimo"

Os relatórios elegíveis são ordenados por **eficiência de saque** (`lootEfficiency = recurso previsto ÷ distância`), não por distância pura. Um alvo mais longe com bastante recurso pode valer mais que um alvo pertinho quase vazio.

## Coordenação entre aldeias

O assistente de saque é compartilhado pra conta inteira (os mesmos alvos aparecem pra várias aldeias, com distância diferente cada). O planejamento (`planAutoFarmAcrossVillages`) é feito **globalmente**, olhando todas as aldeias configuradas de uma vez: cada alvo só é reivindicado por **uma** aldeia — a mais eficiente que ainda tem tropa disponível pra ele — evitando duas aldeias mirarem o mesmo alvo no mesmo ciclo.

## Envio

- Uma ação por vez, com intervalo aleatório (`minDelaySeconds`–`maxDelaySeconds`) entre elas — evita disparar tudo em rajada e levar bloqueio antiflood.
- Falha ao enviar uma ação específica **não** interrompe as demais — fica registrada como falha (contabilizada em `itemsFailed`, ver Telemetria abaixo) e o envio continua pro próximo alvo.
- Falha ao buscar o assistente de saque de uma aldeia específica também não aborta o ciclo — essa aldeia só fica de fora do plano desse ciclo (contabilizada em `villagesFailed`).

## Agendamento

- Dispara um ciclo e se reagenda sozinho a cada `intervalMinutes` (relido do `localStorage` a cada ciclo — mudar a config vale a partir do próximo ciclo, sem precisar desligar/religar).
- O jogo não é uma SPA — toda navegação recarrega a página e destruiria o loop. O horário da próxima execução é persistido em `localStorage` (`NEXT_RUN_KEY`), então ao remontar a contagem regressiva é retomada, não reiniciada.
- Religar o toggle manualmente (`resetAutoFarmSchedule()`) força um ciclo do zero, descartando o agendamento antigo — é o único jeito de "pular a fila" voluntariamente.

## Status visível no jogo

Barra fixa abaixo do cabeçalho (`autoFarmBanner.ts`): bolinha amarela piscando enquanto verifica, verde piscando enquanto envia (mostrando qual comando está indo agora), azul parada enquanto aguarda o próximo ciclo.

## Telemetria (se o opt-in estiver ligado)

Todo ciclo gera um evento `cycle_completed` no PostHog (`feature: 'autofarm'`), com `durationMs`, `itemsTotal`/`itemsFailed` (ações enviadas com sucesso vs. falha) e `villagesFailed` (aldeias que nem conseguiram buscar o assistente). Uma exceção não tratada no ciclo também gera um evento de erro no Sentry. Ver [`telemetria-e-analytics.md`](./telemetria-e-analytics.md).

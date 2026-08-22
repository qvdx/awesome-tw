# Coleta automática

Automação em **Automações › Coleta automática** (`src/lib/scavengeScheduler.ts`, `runAutoScavengeOnce.ts`, `planAutoScavenge.ts`, `scavengeAllocation.ts`, `sendScavengeSquads.ts`). Diferente do autofarm, roda **um loop independente por aldeia** — cada uma com seu próprio horário de retorno.

## Configuração

Tela de configuração (`ScavengeSettings.tsx`), salva via `scavengeConfig.ts`:

- `troops`: quais unidades participam e quanto reservar (não usar) de cada uma.
- `autoUnlock`: se ligado, cada ciclo tenta desbloquear o próximo nível de coleta disponível (respeitando a ordem sequencial do jogo — um nível só desbloqueia depois do anterior).
- `intervalHours`: usado só como **fallback**, quando não há nenhuma coleta ativa pra ancorar o próximo ciclo (ver Agendamento).
- `villageIds`: vazio = roda só na aldeia da aba aberta; preenchido = um loop por aldeia selecionada.

## Ciclo

1. Se `autoUnlock` ligado, busca o estado da aldeia, acha o próximo nível bloqueável (`findNextUnlockTarget`) e pede o desbloqueio.
2. Planeja a distribuição de tropas entre os níveis desbloqueados e ociosos (`planAutoScavenge` + `scavengeAllocation.ts`) — a alocação é pensada pra que **todos os níveis voltem por volta do mesmo horário**: níveis com fator de saque (`loot_factor`) maior recebem **menos** carga, não mais, pra equilibrar o tempo de viagem/coleta entre eles.
3. Monta e envia os esquadrões (`sendScavengeSquads`) — diferente do autofarm, uma falha aqui **não** é engolida por nível: se o envio falhar, o ciclo inteiro é marcado como falho.

## Agendamento — reagenda pelo horário real de retorno

Depois de enviar, busca o estado atualizado da aldeia (`fetchScavengeVillageState`) e calcula o próximo ciclo:

- Se há coleta ativa: `delayMs = max(0, maiorRetornoMs − agora_do_servidor) + 60_000` — usa o **maior** horário de retorno entre os níveis ativos (`RETURN_BUFFER_MS`, 1 minuto de folga depois do retorno da leva mais demorada, pra dar tempo do servidor processar o "chegou"). O horário vem do relógio do servidor, não do navegador.
- Se não há nada ativo (ex: sem tropa disponível ainda): cai no fallback, `max(60_000, intervalHours × 3.600.000)`.

Como a coleta roda **um loop por aldeia**, esse agendamento é persistido em `localStorage` **por aldeia** (chave inclui o `villageId`) — mesmo motivo do autofarm: o jogo recarrega a página inteira a cada navegação, e sem persistência cada troca de tela disparava um ciclo novo do zero, mesmo sem nada pendente pra enviar (corrigido na 0.1.0-alpha.11). Religar o toggle manualmente força um ciclo do zero pras aldeias afetadas.

## Telemetria (se o opt-in estiver ligado)

Todo ciclo gera um evento `cycle_completed` no PostHog (`feature: 'scavenge'`), com `durationMs` e `itemsTotal`/`itemsFailed` (esquadrões enviados vs. que falharam). Uma exceção não tratada no ciclo também gera um evento de erro no Sentry. Ver [`telemetria-e-analytics.md`](./telemetria-e-analytics.md).

# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não lançado]

## [0.1.0-alpha.5] - 2026-08-19

### Alterado

- Menu "Reportar um problema" virou "Saiba mais": ganhou uma seção "Sobre o projeto" com link do repositório no GitHub e aviso de que o script é gratuito, open source e licenciado sob MIT, mantendo a seção de reporte de bug/sugestão que já existia.

## [0.1.0-alpha.4] - 2026-08-19

### Adicionado

- **Coleta automática em múltiplas aldeias**: nova seção "ALDEIAS" na tela de configuração, com busca (a partir de 8 aldeias), lista com scroll e checkbox "selecionar todas". Sem seleção explícita, o comportamento continua o mesmo de antes (só a aldeia da aba aberta); com aldeias selecionadas, a automação passa a rodar em todas elas ao mesmo tempo, cada uma com seu próprio ciclo/horário de retorno de tropas.

## [0.1.0-alpha.3] - 2026-08-18

### Corrigido

- "Desbloquear níveis de coleta automaticamente" não fazia nada: a opção existia na tela de configurações e era salva, mas nenhum código chamava a ação de desbloqueio de fato. Agora, quando habilitada, cada ciclo pede o desbloqueio do próximo nível bloqueado disponível (respeitando a ordem sequencial do jogo — um nível só pode ser desbloqueado depois do anterior).

## [0.1.0-alpha.2] - 2026-08-17

### Corrigido

- Nome do jogador aparecia como "jogador desconhecido" e a coleta automática não conseguia enxergar o jogo: o build final ganha `@grant GM_addStyle` (por causa do CSS Modules), o que faz o Tampermonkey rodar o script num sandbox isolado da página. Trocado `window.game_data`/`window.TribalWars` por `unsafeWindow`, a ponte oficial do Tampermonkey pra esses casos.

## [0.1.0-alpha.1] - 2026-08-17

### Adicionado

- Launcher integrado à barra de missões do jogo (`#questlog_new`), com badge hexagonal, glow e glitch.
- Painel principal em estilo terminal: sequência de boot (usuário, tier, scripts ativos), menu navegável por teclado (setas + Enter) e atalho global configurável (padrão `Ctrl/Cmd+Espaço`, regravável em Configurações).
- **Automações › Coleta automática**: descobre em background quais níveis de coleta estão desbloqueados/ativos via `scavenge_api`; distribui as tropas disponíveis (respeitando unidades habilitadas e reserva mínima configurada) para que todos os níveis terminem por volta do mesmo horário; monta e envia os esquadrões; se reagenda sozinha a partir do horário de retorno da leva mais demorada, sem depender de um timer fixo.
- Tela de configuração da coleta (intervalo de fallback, desbloqueio automático de níveis, tropas habilitadas e reserva por unidade), com salvamento explícito e trava do toggle de ativação até a primeira configuração salva.
- Tela "Pague um café" com QR code Pix gerado inteiramente no cliente (sem terceiros).
- Tela "Reportar um problema" com contato por e-mail, Reddit e GitHub.

[Não lançado]: https://github.com/qvdx/awesome-tw/compare/v0.1.0-alpha.5...HEAD
[0.1.0-alpha.5]: https://github.com/qvdx/awesome-tw/compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: https://github.com/qvdx/awesome-tw/compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: https://github.com/qvdx/awesome-tw/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/qvdx/awesome-tw/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/qvdx/awesome-tw/releases/tag/v0.1.0-alpha.1

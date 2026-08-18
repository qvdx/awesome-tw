# AwesomeTW

Userscript para o [Tribal Wars](https://www.tribalwars.com.br/) (`tribalwars.com.br`) construído com Vite + React + TypeScript, empacotado como um único `.user.js` via [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey).

A interface se mescla à barra lateral do jogo (um ícone próprio ao lado do Nexus) e abre um painel com identidade visual "terminal hacker" — mono espaçada, verde-neon, glow, tudo renderizado dentro do próprio `game.php`.

## Funcionalidades

- **Launcher integrado** — ícone próprio dentro de `#questlog_new`, badge hexagonal com caveira, brilho e glitch RGB.
- **Painel em estilo terminal** — modal com esmaecimento/blur do fundo, sequência de boot (usuário, tier, scripts ativos) e menu navegável por teclado (setas + Enter).
- **Atalho de teclado configurável** — padrão `Ctrl/Cmd+Espaço`, pode ser regravado em Configurações (útil no macOS, onde `Cmd+Espaço` é interceptado pelo Spotlight).
- **Automações › Coleta automática** — a peça mais robusta do projeto:
  - Descobre em background quais níveis de coleta estão desbloqueados/ativos, via `scavenge_api` (a mesma API que o próprio jogo usa — nada de raspagem de HTML).
  - Distribui as tropas disponíveis (respeitando as unidades habilitadas e a reserva mínima configurada por tropa) entre os níveis desbloqueados para que **todos terminem por volta do mesmo horário**, usando a fórmula real de duração do jogo.
  - Monta e envia o payload de `send_squads` direto pela API.
  - Se autoagenda: depois de cada envio, calcula o horário de retorno da leva mais demorada (usando o relógio do servidor) e já dispara o próximo ciclo sozinho — sem timer fixo, sem checagem desnecessária.
- **Pague um café** — QR code Pix gerado 100% no cliente (sem terceiros) + botão de copiar código.
- **Reportar um problema** — contato direto (e-mail e Reddit).

## Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey) — empacota tudo (React, CSS Modules, ícones) num único userscript, com hot-reload no Tampermonkey durante o desenvolvimento
- [lucide-react](https://lucide.dev/) — ícones
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) — geração de QR code client-side

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/), extensão [Tampermonkey](https://www.tampermonkey.net/) no navegador.

```bash
npm install
npm run dev
```

Abra o link impresso no terminal (`http://127.0.0.1:5173/`) uma vez para instalar o script "loader" no Tampermonkey. A partir daí, qualquer alteração no código recarrega sozinha na página do jogo — não precisa reinstalar nada.

### Build de produção

```bash
npm run build
```

Gera `dist/awesometw.user.js`, o arquivo final para instalar/distribuir (arraste na aba de extensões do Tampermonkey, ou abra o arquivo direto no navegador).

## Estrutura do projeto

```
src/
├── main.tsx                 # ponto de entrada, injeta a raiz React no body
├── App.tsx                  # estado global: modal aberto, tela atual, atalho, toggle da coleta
├── components/              # UI (Modal, Menu, Automations, ScavengeSettings, Coffee, Report...)
├── hooks/                   # useLocalStorage, useMountNode, useShortcutConfig
└── lib/                     # lógica de domínio (sem React):
    ├── tribalWarsApi.ts      # wrapper em Promise pro TribalWars.get/post nativo do jogo
    ├── fetchScavengeLevels.ts
    ├── scavengeAllocation.ts # algoritmo de distribuição de tropas por duração
    ├── sendScavengeSquads.ts
    ├── planAutoScavenge.ts / runAutoScavengeOnce.ts
    └── scavengeScheduler.ts  # loop autoagendado da coleta automática
```

## Changelog

Veja [CHANGELOG.md](./CHANGELOG.md).

## Licença

[MIT](./LICENSE)

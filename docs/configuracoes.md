# Configurações

Tela **Configurações** (`src/components/Settings.tsx`). Cobre o atalho de teclado — a parte de telemetria/analytics, que também mora nessa tela, está documentada separadamente em [`telemetria-e-analytics.md`](./telemetria-e-analytics.md).

## Atalho de teclado

`src/lib/shortcut.ts`, `src/hooks/useShortcutConfig.ts`.

- Default: **Ctrl/Cmd + Espaço** (`{ mod: true, shift: false, alt: false, code: 'Space' }`).
- `Ctrl` e `Cmd` são tratados como **um modificador só** (`event.ctrlKey || event.metaKey`) — assim uma única configuração funciona em Windows/Linux e macOS sem precisar detectar o SO.
- Pra bater o atalho, **todos os campos precisam corresponder exatamente** — inclusive não pode ter um modificador extra pressionado além dos configurados.
- Persistido em `localStorage` (`awesometw:launcher-shortcut`); JSON corrompido ou chave ausente cai silenciosamente no default.
- No macOS, a tela mostra um aviso de que `⌘+Espaço` costuma ser interceptado pelo Spotlight antes de chegar no navegador — **isso é só um aviso pro usuário trocar manualmente**, o código não detecta nem contorna esse conflito automaticamente.
- Durante a gravação de um novo atalho, `Escape` cancela a gravação (não fecha a tela de Configurações) — teclas modificadoras sozinhas (`ControlLeft`, `ShiftLeft` etc.) são ignoradas até uma tecla "de verdade" ser pressionada junto.

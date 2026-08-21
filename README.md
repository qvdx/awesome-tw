# AwesomeTW

[![Release](https://img.shields.io/github/v/release/qvdx/awesome-tw)](https://github.com/qvdx/awesome-tw/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/qvdx/awesome-tw/total)](https://github.com/qvdx/awesome-tw/releases)
[![License](https://img.shields.io/github/license/qvdx/awesome-tw)](./LICENSE)

Userscript para o [Tribal Wars](https://www.tribalwars.com.br/) que adiciona um menu direto no jogo, com automações pra facilitar o dia a dia.

## Instalação

1. Instale a extensão [Tampermonkey](https://www.tampermonkey.net/).
2. [Clique aqui para instalar o AwesomeTW](https://github.com/qvdx/awesome-tw/releases/latest/download/awesometw.user.js).
3. Abra o jogo — um novo ícone (☠) aparece junto com o ícone das missões.

Atualizações futuras chegam automaticamente pelo próprio Tampermonkey.

## Funcionalidades

### Automações › Coleta automática

Liga o toggle em **Automações**, escolhe quais tropas participam e quantas reservar de cada uma, salva — e pronto:

- Descobre sozinho quais níveis de coleta você já tem desbloqueados.
- Distribui as tropas escolhidas entre os níveis pra que todos voltem por volta do mesmo horário.
- Assim que uma leva retorna, já manda a próxima — sem precisar deixar o jogo aberto ficando de olho.

### Utilitários

Em breve.

### Atalho de teclado

`Ctrl/Cmd + Espaço` abre o menu de qualquer tela do jogo. Pode ser trocado em **Configurações** (útil no macOS, onde esse atalho padrão às vezes é interceptado pelo Spotlight).

### Telemetria (opcional)

Em **Configurações**, tem um toggle opt-in — **desligado por padrão** — que, se ligado, reporta tempo de ciclo e erros do autofarm/coleta automática, e quais automações estão ativas (e por quanto tempo), tudo marcado só com um ID aleatório gerado no seu navegador. Isso ajuda a pegar quebras causadas por mudanças no jogo antes de alguém precisar reportar, e a entender como as automações estão sendo usadas. Nunca é enviado nome de jogador, aldeia ou mundo. Pode ser desligado a qualquer momento na mesma tela.

## Suporte

Achou um bug ou tem uma sugestão? Usa a opção **Reportar um problema** no próprio menu do script, ou chama direto:

- E-mail: qualvalordex@gmail.com
- Reddit: [u/qvdx](https://www.reddit.com/user/qvdx)
- GitHub: [qvdx](https://github.com/qvdx)

## Desenvolvimento

```bash
npm install
npm run dev
```

Veja o [CHANGELOG.md](./CHANGELOG.md) para o histórico de versões.

## Licença

[MIT](./LICENSE)

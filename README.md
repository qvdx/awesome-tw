# AwesomeTW

[![Release](https://img.shields.io/github/v/release/qvdx/awesome-tw)](https://github.com/qvdx/awesome-tw/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/qvdx/awesome-tw/total)](https://github.com/qvdx/awesome-tw/releases)
[![License](https://img.shields.io/github/license/qvdx/awesome-tw)](./LICENSE)

Userscript para o [Tribal Wars](https://www.tribalwars.com.br/) que adiciona um menu direto no jogo, com automações pra facilitar o dia a dia.

![Uma nave alienígena abduzindo uma casa, aldeões e uma vaca de uma aldeia medieval, com guardas em pânico observando de baixo](./assets/awesome-tw.png)

> *"Elas vieram do céu, levaram os celeiros e as muralhas — e deixaram pra trás aldeões que não erram mais uma conta de saque. Não sei o que fizeram lá em cima. Só sei que não sou mais eu que preciso ficar acordado calculando isso."*

## Funcionalidades

### Automações

#### Autofarm

Liga o toggle em **Automações**, escolhe as aldeias (ou deixa vazio pra rodar só na aba aberta), define limites de muralha/distância — e as tropas passam a se mover sozinhas:

- Lê o assistente de saque de cada aldeia e decide entre os modelos A e C automaticamente, priorizando o C quando o relatório indica recurso suficiente.
- Ordena os alvos por eficiência (recurso previsto ÷ distância), não só por quem está mais perto.
- Coordena entre todas as aldeias de uma vez, pra duas nunca mirarem o mesmo alvo no mesmo ciclo.
- Intervalo aleatório entre cada envio, pra não levar bloqueio por flood.
- Barra de status fixa no jogo, com contagem regressiva que sobrevive a troca de tela.

#### Coleta automática

Liga o toggle em **Automações**, escolhe quais tropas participam e quanto reservar de cada uma, salva — e pronto:

- Descobre sozinho quais níveis de coleta você já tem desbloqueados (e pode desbloquear o próximo automaticamente).
- Distribui as tropas escolhidas entre os níveis pra que todos voltem por volta do mesmo horário.
- Assim que uma leva retorna, já manda a próxima — sem precisar deixar o jogo aberto de olho, e sem perder a contagem ao trocar de tela.

### Utilitários

#### Mapeamento de aldeias

Mapeia as aldeias bárbaras e bônus ao redor da sua aldeia atual, sem precisar abrir o Mapa do jogo:

- Filtros por tipo, distância e pontos, escondidos por padrão atrás de um ícone de funil.
- Tempo de viagem estimado por cavalaria leve, aríete, catapulta e nobre, calculado com a velocidade real do mundo.
- **Espionagem em massa**: manda exploradores pra todas as aldeias selecionadas de uma vez, com quantidade configurável, intervalo aleatório entre os envios, botão de interromper e barra de progresso — tanto no menu quanto injetada direto na tela do jogo.

#### Modificadores de tela

Alterações visuais direto nas telas do próprio jogo, sem esconder que vieram daqui:

- **Visualizar tropas em produção**: mostra, na Visão Geral, quantas unidades cada aldeia tem na fila de recrutamento.
- **Visualizar recursos chegando do saque**: soma, na Visão Geral, quanto de madeira/argila/ferro está a caminho nos ataques de saque que ainda não voltaram — atualiza sozinho conforme os comandos retornam.

### Configurações

#### Atalho de teclado

`Ctrl/Cmd + Espaço` abre o menu de qualquer tela do jogo. Pode ser trocado em **Configurações** (útil no macOS, onde esse atalho padrão às vezes é interceptado pelo Spotlight).

#### Telemetria e analytics (opcional)

Em **Configurações**, um único toggle opt-in — **desligado por padrão** — liga o envio de dados anônimos que ajudam a manter o script funcionando: erros e tempo de ciclo do autofarm/coleta, e quais automações estão ativas (e por quanto tempo). Tudo marcado só com um ID aleatório gerado no seu navegador — nunca nome de jogador, aldeia ou mundo. Pode ser desligado a qualquer momento na mesma tela.

## Instalação

A nave já passou. A tecnologia ficou. Falta só instalar:

1. Instale a extensão [Tampermonkey](https://www.tampermonkey.net/).
2. [Clique aqui para instalar o AwesomeTW](https://github.com/qvdx/awesome-tw/releases/latest/download/awesometw.user.js).
3. Abra o jogo — um novo ícone (☠) aparece junto com o ícone das missões.

Atualizações futuras chegam automaticamente pelo próprio Tampermonkey.

## Suporte

Achou um bug ou tem uma sugestão? Usa a opção **Reportar um problema** no próprio menu do script, ou escolhe o canal que preferir:

- **E-mail** — pra um bug bem detalhado, com print e tudo: qualvalordex@gmail.com
- **Reddit** — pra bater um papo rápido ou só mandar um oi: [u/qvdx](https://www.reddit.com/user/qvdx)
- **GitHub** — pra quem já sabe exatamente o que quer reportar, ou só quer dar uma olhada no código: [qvdx](https://github.com/qvdx)

## Changelog

Todas as mudanças notáveis ficam documentadas no [CHANGELOG.md](./CHANGELOG.md).

## Contribuindo

Quer ajudar? Toda contribuição é bem-vinda, de um relatório de bug a uma automação nova. Dá uma olhada no [CONTRIBUTING.md](./CONTRIBUTING.md) pra saber como rodar o projeto localmente e o fluxo de PR.

Se quiser entender as regras de negócio por trás de cada automação antes de mexer em algo, tem a pasta [`docs/`](./docs).

## Licença

Distribuído sob a licença [MIT](./LICENSE) — livre pra usar, copiar, modificar e redistribuir, contanto que o aviso de copyright original seja mantido.

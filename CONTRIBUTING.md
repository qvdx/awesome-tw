# Contribuindo

Valeu o interesse em ajudar no AwesomeTW! É um projeto solo/hobby, então esse guia é mais um "como as coisas funcionam por aqui" do que uma checklist burocrática — sinta-se à vontade pra abrir uma issue com dúvida antes de codar qualquer coisa.

## Rodando localmente

```bash
npm install
npm run dev
```

O `vite-plugin-monkey` sobe um servidor de dev e te dá uma URL pra instalar como userscript no Tampermonkey, apontando pro código local — mudanças recarregam sozinhas.

## Antes de abrir a PR

O CI (`.github/workflows/ci.yml`) roda esses três comandos em toda PR pra `main`, e é gate obrigatório — rodar localmente antes evita ida e volta:

```bash
npx tsc --noEmit      # checagem de tipo
npx vite build        # confirma que o .user.js builda
npm run test:coverage # testes unitários (npm run test, sem cobertura, é mais rápido no dia a dia)
```

Não tem lint/formatter configurado no projeto — não precisa rodar nada além disso.

## Fluxo de branch e PR

- Branches de feature/fix saem de `dev` (não de `main`) e voltam pra `dev` via PR.
- `main` só recebe PRs de release (`dev` → `main`), que fazem bump de versão em `package.json` e adicionam a entrada correspondente no `CHANGELOG.md` — o workflow de release falha se a seção da versão não existir lá.
- Prefira commits pequenos e ordenados por dependência (ex: módulo novo primeiro, depois quem usa ele) em vez de um commit gigante com tudo junto.
- Prefixo no estilo [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`) — sem regra rígida de ferramenta, só pra manter o histórico legível.

## Regras de negócio das features

Antes de mexer numa automação existente, vale a pena olhar a pasta [`docs/`](./docs) — cada feature tem um arquivo descrevendo exatamente as regras/fórmulas que ela segue hoje (prioridades, thresholds, cache, etc.), pra evitar quebrar um comportamento intencional sem perceber.

## Dúvidas

Sem processo formal de RFC ou nada do tipo — abre uma issue, manda um e-mail (qualvalordex@gmail.com) ou chama no Reddit ([u/qvdx](https://www.reddit.com/user/qvdx)). Ver a seção **Suporte** do [README](./README.md#suporte) pra mais opções.

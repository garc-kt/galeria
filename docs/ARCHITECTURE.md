# Arquitetura

Monólito modular. Um deployable, um banco, um worker embutido. Não é monorepo por enquanto.

## Camadas

~~~text
src/app          rotas, layouts, metadata, handlers HTTP
src/features     domínio: componentes, server, queries, schemas
src/components   UI compartilhada sem domínio
src/server       infraestrutura compartilhada
src/db           schema Drizzle + client
src/lib          helpers isomórficos
~~~

Dependência permitida:

~~~text
app -> features -> lib / server / db
components/ui -> lib
~~~

Proibido:

- feature importar de app;
- componente de UI importar feature;
- código de cliente importar server/db;
- rota conter regra de negócio extensa.

## Contrato de uma feature

~~~text
features/<name>/
  components/     UI da feature (client/server components)
  server/         queries, jobs, integrações, regras de servidor
  schemas.ts      validação da feature (quando houver)
~~~

- component não importa server/;
- server não importa componente React;
- feature expõe o que precisa por imports explícitos, sem barrel global;
- queries ficam em server/queries.ts da própria feature;
- schemas Zod ficam em schemas.ts da própria feature; lib/validation só tem primitivas compartilhadas;
- pnpm check:boundaries barra import de UI para server/db e de feature para app.

## Features atuais

| Feature | Responsabilidade |
|---|---|
| auth | senha, sessão, TOTP, guard, login/segurança |
| photos | upload, RAW preview, derivadas, galeria, lightbox |
| collections | séries, associação foto-coleção |
| store | compra, FAQ da loja |
| payments | Mercado Pago, Bricks, Pix/cartão/boleto |
| orders | pedido, entrega, tokens, downloads, reenvio |
| admin | painel, upload form, pedidos, coleções |
| contact | formulário de contato |

## Fronteiras importantes

### Dinheiro

- app/api/checkout cria pedido; app/api/payments cria pagamento.
- valor sempre de orders/photos; nunca do cliente.
- features/payments/server fala com o Mercado Pago; features/orders/server libera arquivo.
- token de acesso em features/orders/server/order-token.ts.

### Arquivos

- features/photos/server gera derivadas; src/server/storage move bytes.
- originais/masters são privados; /media só serve derivadas.
- download passa por features/orders/server/queries + token.

### Auth

- features/auth/server/guard.ts é a única entrada de sessão no servidor.
- API administrativa sempre valida sessão + origem.

## Quando dividir

Não divida antes de doer.

- Worker separado quando processamento de imagem/email competir com requests. Mova para apps/worker e mantenha packages/db.
- Segundo app (ex.: admin separado) quando o bundle ou o deploy precisarem ser independentes. Aí vira monorepo pnpm/Turborepo.
- Pacotes compartilhados quando houver dois ou mais apps: packages/db, packages/ui, packages/config.
- CMS só se o fotógrafo exigir edição de páginas; hoje o admin cobre.

## Adicionar uma feature

1. Crie src/features/<name>/{components,server}.
2. Modele queries em server/queries.ts.
3. Mantenha rotas em src/app finas: parse, auth, chamada, resposta.
4. Tipos de banco vêm de src/db/schema.ts.
5. Testes de lógica pura em tests/; E2E em e2e/ quando existir.
6. Rode pnpm typecheck, pnpm test, pnpm build.

## Testes

- tests/ unitário/contrato: dinheiro, token, assinatura, upload, validação.
- Próximo passo: Playwright para checkout, admin e download.
- Banco de teste: PGlite em diretório temporário ou Postgres de CI.

## Trade-offs atuais

- Um app só. Sem monorepo: menos custo operacional.
- Processamento de imagem síncrono. Mover para pg-boss quando uploads passarem de ~20/lote.
- Rate limit em memória. Redis só com múltiplas instâncias.
- Admin próprio em vez de CMS. Menos dependências, mais código de UI.

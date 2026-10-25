# Galeria

Galeria de fotografia autoral + loja de arquivos digitais. Um fotógrafo, um arquivo, checkout convidado (sem conta de cliente).

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Radix UI · PostgreSQL 17 + Drizzle · sharp · Mercado Pago Checkout API (Pix/cartão/boleto) · HostGator VPS.

## O que está pronto

- Site público: início, coleções, detalhe da coleção, detalhe da foto, loja, sobre, contato, privacidade e termos.
- Foto com zoom em tela cheia, link para a coleção e breadcrumb; lightbox com teclado, swipe, zoom, miniaturas e legendas.
- SEO: metadata por página, canonical, sitemap, robots, JSON-LD (WebSite, Organization, Product/Offer, CollectionPage), OG/Twitter image por foto.
- Admin: login com senha + TOTP, troca de senha, upload de RAW/JPEG com arrastar-e-soltar e progresso, edição, publicação, coleções, pedidos, reenvio de entrega e reembolso.
- Upload: RAW até 95 MB, prévia extraída do JPEG embutido, derivadas AVIF/JPEG em 640/1280/2048, blur placeholder e marca d'água.
- Loja: página de pagamento no site com Pix (QR + copia e cola), cartão (Brick tokenizado) e boleto; preço no servidor, webhook assinado e idempotente, entrega por link assinado (30 dias, 5 downloads).
- Operação: storage local ou S3/R2, e-mail Resend (ou console em dev), health check, rate limit, security headers, estados de erro/carregamento/404, CI, backups e deploy com Nginx + systemd.

## Requisitos

- Node.js 24 LTS (mínimo 20.9)
- pnpm 12
- PostgreSQL 17 no servidor (o dev usa PGlite embutido, sem instalar banco)
- <code>fonts-dejavu-core</code> no servidor: a marca d'água usa texto SVG; sem fonte o texto não renderiza
- Opcional: <code>libraw-bin</code> no servidor para extrair prévia de RAWs sem JPEG embutido
- Opcional: Cloudflare R2 (ou outro S3) para originais/masters

## Rodar local

~~~bash
pnpm install
cp .env.example .env.local
# edite AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pnpm db:init
pnpm db:seed
pnpm dev
~~~

Abra http://localhost:3000.

Credenciais do seed:

~~~
admin@example.com
change-me-now
~~~

Troque a senha antes de publicar, no painel <code>/admin/security</code>. O seed cria 3 coleções e 9 imagens abstratas para você ver o layout. Não rode o seed em produção.

### Banco local

Sem <code>DATABASE_URL</code>, o app usa PGlite em <code>./.pglite</code>. É um Postgres em WASM, bom para dev e demonstração. Em produção use Postgres real. O código recusa subir em produção sem <code>DATABASE_URL</code>, a menos que <code>PGLITE_DIR</code> seja definido explicitamente.

Pare o <code>pnpm dev</code> antes de rodar scripts de banco. PGlite é single-process; dois processos no mesmo diretório travam.

### Scripts

| Comando | O que faz |
|---|---|
| <code>pnpm dev</code> | Servidor de desenvolvimento |
| <code>pnpm build</code> | Build de produção |
| <code>pnpm start</code> | Sobe o build localmente |
| <code>pnpm typecheck</code> | TypeScript sem emitir |
| <code>pnpm check:boundaries</code> | Garante as fronteiras app/features/lib/server |
| <code>pnpm test</code> | Testes unitários (Vitest) |
| <code>pnpm db:init</code> | Aplica migrations via Drizzle (PGlite ou Postgres) |
| <code>pnpm db:migrate</code> | Aplica migrations pendentes (produção) |
| <code>pnpm db:admin</code> | Cria o admin (ou troca a senha com <code>--update</code>) |
| <code>pnpm db:seed</code> | Dados de demonstração (dev) |
| <code>pnpm db:clear-orders</code> | Apaga pedidos, pagamentos e downloads (dev) |
| <code>pnpm db:reset</code> | Apaga fotos, coleções, pedidos e arquivos (dev) |
| <code>pnpm db:status</code> | Conta fotos, coleções, pedidos e downloads |

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| <code>NEXT_PUBLIC_SITE_URL</code> | URL pública, sem barra final. Use antes do build. |
| <code>NEXT_PUBLIC_SITE_NAME</code> | Nome no header, metadata e e-mails. |
| <code>NEXT_PUBLIC_PHOTOGRAPHER</code> | Assinatura da marca d'água. |
| <code>NEXT_PUBLIC_INSTAGRAM</code> | Link do Instagram (opcional). |
| <code>CONTACT_EMAIL</code> | Recebe o formulário de contato. |
| <code>AUTH_SECRET</code> | Segredo HS256 das sessões. Mínimo 32 caracteres. |
| <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> | Usados pelos scripts de admin/seed. |
| <code>DATABASE_URL</code> | Postgres em produção. Vazio = PGlite local. |
| <code>PGLITE_DIR</code> | Pasta do PGlite (padrão <code>./.pglite</code>). Em produção exige valor explícito se não houver Postgres. |
| <code>APP_ROOT</code> | Raiz absoluta para resolver <code>storage</code> e PGlite. O systemd define <code>/srv/galeria/current</code>. |
| <code>STORAGE_DRIVER</code> | <code>local</code> ou <code>s3</code>. |
| <code>STORAGE_LOCAL_DIR</code> | Pasta do storage local (padrão <code>./storage</code>). |
| <code>S3_ENDPOINT</code> | Endpoint S3/R2. |
| <code>S3_REGION</code> | <code>auto</code> para R2. |
| <code>S3_BUCKET</code> | Bucket privado. |
| <code>S3_ACCESS_KEY_ID</code> / <code>S3_SECRET_ACCESS_KEY</code> | Credenciais do bucket. |
| <code>MP_ACCESS_TOKEN</code> | Access token do Mercado Pago (server). |
| <code>MP_PUBLIC_KEY</code> | Public key do Mercado Pago (client, cartão). |
| <code>MP_WEBHOOK_SECRET</code> | Segredo da assinatura do webhook. |
| <code>PAYMENTS_MOCK</code> | <code>true</code> só em dev: painel de pagamento simulado. Ignorado em produção. |
| <code>RESEND_API_KEY</code> | Envio de e-mail. Vazio = log no console em dev; obrigatório em produção. |
| <code>EMAIL_FROM</code> | Remetente verificado no Resend. |
| <code>MAX_UPLOAD_MB</code> | Limite por arquivo (padrão 95; Cloudflare limita 100). |

Gere o segredo com:

~~~bash
openssl rand -base64 48
~~~

## Fluxo de imagem

1. Você envia o RAW (arquivo) e, de preferência, o JPEG master editado no Lightroom/Capture One.
2. O servidor extrai a prévia embutida do RAW com <code>exifr</code> (ou <code>dcraw_emu</code>, se instalado). Não decodifica o RAW inteiro.
3. O master vira derivadas AVIF (q62) e JPEG (q88) em 640, 1280 e 2048 px, com Lanczos3, sem upscale. A 1280+ recebe a marca d'água.
4. O RAW e o master ficam privados no storage. Só as derivadas são públicas, em <code>/media</code>.
5. A compra entrega o master JPEG, não a derivada web. Se a foto não tiver master, o arquivo entregue é o RAW original.

Por que não decodificar RAW no servidor: decodificação completa custa CPU/RAM, demora e entrega cor sem a sua edição. O master editado é o produto; o RAW é arquivo.

## Mercado Pago

1. Crie uma aplicação no painel de desenvolvedores do Mercado Pago.
2. Copie o Access Token para <code>MP_ACCESS_TOKEN</code>.
3. Copie a Public Key para <code>MP_PUBLIC_KEY</code>. Ela é usada pelo Brick de cartão no navegador.
4. Configure a URL de notificação: <code>https://seudominio.com/api/webhooks/mercadopago</code>, evento <code>payment</code>.
5. Copie o segredo do webhook para <code>MP_WEBHOOK_SECRET</code>.
6. Em sandbox, use as credenciais de teste e nunca deixe <code>PAYMENTS_MOCK=true</code> em produção.

O valor é sempre lido do banco; o cliente não envia preço. O cartão é tokenizado pelo Brick (PCI SAQ-A) e nunca passa pelo servidor. O webhook confere assinatura, valor e idempotência antes de liberar o download.

### Área de pagamento

- <code>/checkout/pay/&lt;token&gt;</code> mostra resumo do pedido e as abas Pix, Cartão e Boleto.
- Pix: gera QR code e código copia e cola via Checkout API; a página consulta o status a cada 5s.
- Cartão: Card Payment Brick do Mercado Pago; o backend cria o pagamento com o token do cartão.
- Boleto: gera boleto e link; confirmação por webhook.
- O token do pedido é um HMAC assinado com <code>AUTH_SECRET</code>, válido por 2h; não há IDOR por UUID.
- Cada tentativa vira uma linha em <code>payments</code>; Pix/boleto pendentes são reaproveitados para não duplicar QR.
- <code>PAYMENTS_MOCK=true</code> em dev troca a área real por um painel de simulação aprovada.

## Storage S3/R2

1. Crie um bucket privado no Cloudflare R2.
2. Gere um token com permissão de leitura/escrita no bucket.
3. Preencha <code>S3_ENDPOINT</code>, <code>S3_BUCKET</code>, <code>S3_ACCESS_KEY_ID</code> e <code>S3_SECRET_ACCESS_KEY</code>.
4. Use <code>STORAGE_DRIVER=s3</code>.

As derivadas continuam no disco da VPS para resposta rápida e cache do Cloudflare. Originais e masters vão para o R2; o download usa URL assinada de curta duração. O R2 tem egress zero, o que importa quando o arquivo vendido tem 30-80 MB.

## Deploy na HostGator VPS

Alvo: VPS Node.js (Ubuntu 24.04, root). O plano compartilhado da HostGator não roda Next.js com API, upload e webhook; ele serve apenas export estático. Para esta loja, use VPS.

Dimensionamento: 2 vCPU, 4 GB RAM, 80 GB NVMe. Com 2 GB, crie swap e faça o build em CI ou local.

### 1. Base do servidor

~~~bash
apt update && apt upgrade -y
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw fail2ban restic fonts-dejavu-core
# opcional: prévia de RAW sem JPEG embutido
apt install -y libraw-bin
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
corepack enable
corepack prepare pnpm@12.15.0 --activate
~~~

Crie o usuário e as pastas:

~~~bash
adduser --disabled-password --gecos "" galeria
mkdir -p /srv/galeria/current /srv/galeria/backups
chown -R galeria:galeria /srv/galeria
~~~

### 2. Banco

~~~bash
sudo -u postgres psql -c "CREATE USER galeria WITH PASSWORD 'troque-esta-senha';"
sudo -u postgres psql -c "CREATE DATABASE galeria OWNER galeria;"
~~~

<code>DATABASE_URL=postgres://galeria:senha@127.0.0.1:5432/galeria</code>

### 3. Aplicação

Copie o projeto para <code>/srv/galeria/current</code>, crie <code>/srv/galeria/.env</code> com as variáveis de produção e rode. Não copie <code>.env.local</code> para o servidor: ele sobrescreve o <code>.env</code> e aponta para localhost.

~~~bash
cd /srv/galeria/current
pnpm install --frozen-lockfile
pnpm build
pnpm db:init        # primeira vez
pnpm db:admin       # cria o admin, sem dados de demo
~~~

O build precisa de <code>NEXT_PUBLIC_SITE_URL</code> correto. O Next embute variáveis <code>NEXT_PUBLIC_*</code> no bundle.

### 4. systemd + Nginx

~~~bash
cp deploy/galeria.service /etc/systemd/system/galeria.service
systemctl daemon-reload
systemctl enable --now galeria
cp deploy/nginx.conf /etc/nginx/sites-available/galeria
ln -s /etc/nginx/sites-available/galeria /etc/nginx/sites-enabled/galeria
nginx -t && systemctl reload nginx
certbot --nginx -d seudominio.com -d www.seudominio.com
~~~

Edite <code>server_name</code> e os caminhos do certificado antes do certbot. O serviço roda <code>next start</code> em <code>127.0.0.1:3000</code>; o Nginx faz o proxy. Não usamos <code>output: standalone</code> porque o sharp nativo e o pnpm dão atrito no deploy; <code>next start</code> usa o <code>node_modules</code> completo e é mais confiável na VPS.

### 5. Atualizações

~~~bash
cd /srv/galeria/current
bash scripts/deploy.sh
~~~

O script instala, builda, roda <code>pnpm db:migrate</code> e reinicia o serviço.

### 6. Firewall

~~~bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
~~~

Postgres fica em <code>127.0.0.1</code>; não abra a porta 5432.

## Cloudflare

- DNS proxied (nuvem laranja), SSL/TLS Full (strict).
- Desligue Polish/Image Resizing: eles recomprescrevem a imagem e podem degradar o JPEG.
- Cache rule: <code>/media/*</code> cache, <code>/_next/static/*</code> cache; bypass em <code>/api/*</code>, <code>/admin/*</code> e <code>/download/*</code>.
- O webhook precisa passar sem challenge/WAF. A regra do Nginx já isola a rota.
- O Cloudflare (planos free/pro) limita upload a 100 MB. RAW maior que isso falha antes de chegar na VPS. Use <code>MAX_UPLOAD_MB=95</code> ou um subdomínio DNS-only (nuvem cinza) só para o admin.

## Backups

~~~bash
# /etc/cron.d/galeria-backup
15 3 * * * galeria ENV_FILE=/srv/galeria/.env /srv/galeria/current/scripts/backup.sh
~~~

O script faz <code>pg_dump</code> compactado e envia banco + originais/masters para o restic (R2/B2). Teste a restauração:

~~~bash
gunzip -c /srv/galeria/backups/db-AAAAMMDD.sql.gz | psql "$DATABASE_URL"
~~~

Originais de fotos são insubstituíveis. Tenha pelo menos uma cópia fora da VPS.

## Segurança

- Troque a senha do seed e ative 2FA em <code>/admin/security</code>. A troca de senha fica no mesmo painel; sessões já abertas seguem até expirar.
- Se o e-mail de entrega falhar, use <b>Reenviar e-mail</b> em Pedidos. O reenvio emite um link novo e invalida os antigos depois do envio.
- Headers de segurança são enviados pelo Next e pelo Nginx (nosniff, frame-options, referrer-policy, permissions-policy).
- A página de pagamento usa token HMAC de 2h; não aceita UUID solto. O valor vem do banco, o cartão é tokenizado no Brick e o servidor só vê o token.
- Pagamentos têm tabela própria e idempotência; Pix/boleto pendentes são reaproveitados para evitar QR duplicado.
- <code>AUTH_SECRET</code> forte, <code>MP_WEBHOOK_SECRET</code> configurado, HTTPS obrigatório.
- Sessão em cookie httpOnly, SameSite=Lax, Secure em produção.
- Login, contato, checkout e download têm rate limit.
- Upload valida extensão, tamanho e magic bytes do master; o arquivo é reprocessado pelo sharp.
- Originais ficam fora do webroot; downloads usam token hasheado, expiração e limite de uso.
- Preço sempre do banco; webhook confere valor e assinatura.
- Não há códigos de recuperação de 2FA nesta versão. Guarde o segredo.
- Textos de privacidade e termos são modelos: revise com advogado e preencha CNPJ/endereço.

## Testes e verificação

~~~bash
pnpm typecheck
pnpm test
pnpm build
~~~

Resultado desta entrega:

- TypeScript sem erros.
- 34 testes unitários passando (dinheiro, senha, slug, upload, assinatura, TOTP, downloads, validação, token de pedido, dados de pagamento).
- Build de produção OK (Next 16.4.3, Turbopack).
- Smoke test: home, coleções, loja, foto, admin, health, sitemap, robots.
- Checkout mock E2E: pedido pago, download emitido, JPEG válido, link inválido 404, reembolso, reenvio de entrega.
- Troca de senha testada: senha atual errada 401, troca 200, login com a nova senha 200.
- CI em <code>.github/workflows/ci.yml</code>: install, typecheck, test, build em push/PR.

## Limites conhecidos

- Uma foto por pedido. Sem carrinho; para múltiplas, faça pedidos separados.
- Processamento de imagem é síncrono no upload. Acima de ~20 fotos por lote, mova para fila.
- Rate limit em memória; funciona com uma instância. Múltiplas instâncias exigem Redis.
- PGlite é só dev. Produção usa Postgres.
- Sem conta de cliente, sem impressão, sem assinatura, sem i18n, sem blog, sem NF-e.
- A prévia do RAW depende do JPEG embutido. Se o arquivo não tiver prévia, instale <code>libraw-bin</code> ou envie o master.
- Boleto depende de habilitação na conta Mercado Pago; cartão depende de <code>MP_PUBLIC_KEY</code>. Pix/cartão/boleto reais não foram testados sem credenciais.
- A marca d'água é texto fixo no canto; não é um padrão repetido.
- O texto legal é modelo, não parecer jurídico.

## Arquitetura

Monólito modular: rotas finas, features donas do domínio, infra compartilhada. O desenho completo, regras de dependência e quando virar monorepo estão em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Estrutura

~~~
src/
  app/                 rotas, layouts, metadata, handlers HTTP
  components/
    layout/            header, footer, container
    shared/            page header, JSON-LD
    ui/                button, fields
  features/
    admin/             painel, forms, pedidos, coleções
    auth/              senha, sessão, TOTP, guard
    collections/       séries e consultas
    contact/           formulário
    orders/            entrega, tokens, downloads
    payments/          Mercado Pago, Bricks, Pix/cartão/boleto
    photos/            upload, derivadas, galeria, lightbox
    store/             compra e FAQ
  db/                  schema Drizzle, client PGlite/Postgres
  lib/                 money, slug, utils, validation
  server/              env, email, storage, http, rate-limit
docs/                  ARCHITECTURE.md
drizzle/               migration SQL
scripts/               init, migrate, seed, admin, reset, status, deploy, backup
deploy/                nginx.conf, galeria.service
tests/                 Vitest
~~~

## Custo aproximado

- VPS HostGator Node.js: R$ 21-60/mês (promoção vs renovação)
- Domínio: ~R$ 40/ano
- Cloudflare: R$ 0
- R2 50 GB: ~US$ 0,75/mês, egress zero
- Resend: grátis até 3.000 e-mails/mês
- Mercado Pago: ~5-7% por cartão; Pix menor

Fixo: ~R$ 30-80/mês + taxas por venda.

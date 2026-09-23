# TOM GAMES — Blog de Tecnologia V2 (Cloudflare Worker + D1)

Esta versão transforma o painel do autor em um sistema real: artigos ficam no banco D1 e qualquer visitante vê os artigos publicados. O login usa sessão HTTP-only e a senha é armazenada como hash PBKDF2, não em texto puro.

## 1. Criar o banco D1
No Cloudflare: Workers & Pages → D1 → Create database.
Nome sugerido: `tom-games-blog`.

Copie o **Database ID**.

## 2. Criar as tabelas
Abra o banco → Console e execute todo o conteúdo de `schema.sql`.

## 3. Configurar o Worker
Use este projeto como um Cloudflare Worker com Assets. No `wrangler.toml`, substitua:
`COLOQUE_AQUI_O_ID_DO_SEU_BANCO_D1`
pelo Database ID real.

Se estiver usando o dashboard, crie um Worker e envie os arquivos do projeto; configure o binding D1 com o nome de variável `DB` e o binding Assets com o nome `ASSETS`.

## 4. Criar a chave de configuração
No Worker: Settings → Variables and Secrets → Add secret.
Nome: `SETUP_KEY`
Valor: uma chave longa e aleatória escolhida por você.

Não publique essa chave no site.

## 5. Criar seu usuário administrador
Depois de publicar o Worker, abra o Console do navegador no domínio do seu site e execute:

```js
fetch('/api/setup',{method:'POST',headers:{'Content-Type':'application/json','X-Setup-Key':'COLE_SUA_CHAVE_AQUI'},body:JSON.stringify({username:'SEU_USUARIO',password:'SUA_SENHA_FORTE'})}).then(r=>r.json()).then(console.log)
```

A senha deve ter pelo menos 8 caracteres. Depois de criar o administrador, você pode remover/rotacionar a `SETUP_KEY` no Cloudflare para impedir novas criações.

## 6. Usar o blog
- `blog.html`: público, busca e leitura dos artigos.
- `admin.html`: login, publicação e exclusão.
- Artigos publicados ficam disponíveis para todos os visitantes.
- O login não depende de localStorage.

## Observação
O ZIP também mantém os jogos e páginas existentes do TOM GAMES. Para uma publicação real, é necessário configurar o Worker, o D1 e o Secret conforme os passos acima; apenas enviar o ZIP como site estático não ativa o backend.

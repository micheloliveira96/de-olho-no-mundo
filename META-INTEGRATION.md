# Integração Meta Marketing API

## Estado inicial

O endpoint `GET /api/meta/status` confirma apenas se as variáveis necessárias existem. Nunca devolve os seus valores.

## Variáveis de ambiente na Vercel

Adicionar em Project → Settings → Environment Variables:

- `META_APP_ID`: ID da aplicação criada em Meta for Developers.
- `META_APP_SECRET`: segredo da aplicação Meta. Manter apenas no servidor; não enviar por chat nem colocar no código.
- `META_REDIRECT_URI`: URL HTTPS exata do callback OAuth, por exemplo `https://de-olho-no-mundo-qqyh.vercel.app/api/meta/callback`.

Aplicar a Production e Preview conforme necessário e voltar a publicar após guardar.

## Antes de ativar campanhas

1. Criar uma aplicação em Meta for Developers e adicionar o produto Marketing API.
2. Confirmar o negócio e a conta de anúncios a utilizar.
3. Definir permissões e modo de acesso de acordo com os requisitos atuais da Meta.
4. Implementar OAuth com validação de `state`, callback e armazenamento seguro dos tokens no servidor.
5. Só depois implementar leitura de contas/campanhas e criação de campanhas, com confirmação explícita antes de publicar ou gastar dinheiro.

Não guardar tokens em localStorage, no browser ou no repositório. Não permitir criação/publicação de campanhas enquanto a autorização e as permissões não forem validadas.

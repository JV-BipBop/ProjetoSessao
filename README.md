# Portal Acadêmico — versão do aluno

## Objetivo do projeto

implementar camada de autenticação, sessão e autorização sem reconstruir o banco, o CSS ou as views já prontas. O projeto inicial apresentava caminhos desprotegidos e a ausência de um sistema de login que verificasse os dados inseridos pelo usuário e mantivessem eles durante a sessão.

## Instalação

Faça download do projeto.
Descompacte o arquivo e abra no VsCode.
Execute `npm install` para instalar as dependências do projeto.

## Configuração do `.env`

Copie `.env.example` para `.env`, ainda na pasta principal, e configure as variáveis de ambiente como for necessário.

## Executar

Execute `npm start`
Acesse `http://localhost:3000`.

## Contas didáticas

- email: estudante@escola.test / senha: aluno123
- email: admin@escola.test / senha: admin123

## Fluxo do login

1. Acesse `/login` e informe o e-mail e a senha.
2. O sistema verifica se a conta está ativa e compara a senha com o hash armazenado.
3. Se as credenciais forem inválidas, o sistema exibe uma mensagem genérica, sem indicar se o erro foi no e-mail ou na senha.
4. Se forem válidas, o sistema cria uma nova sessão e redireciona o usuário para `/painel`.

Os dados do usuário ficam na sessão do servidor. O navegador recebe um cookie assinado que identifica a sessão; o cookie não contém a senha nem o hash da senha.

## Rotas públicas e protegidas

`GET /`: Pública; redireciona para `/login`.
`GET /login` e `POST /login`: Públicas; exibem o formulário e recebem as credenciais.
`GET /saude`: Pública; retorna o estado do serviço em JSON.
`GET /painel`: Protegida; exige que o usuário esteja autenticado.
`GET /administracao`: Protegida; exige autenticação com perfil de administrador.
`POST /logout`: Encerra a sessão atual.

## Autorização por perfil
Um perfil pode ser estudante ou admin.
Estudante tem acesso somente a tela `/painel`.
Admin tem acesso a tela `/painel` e `/administracao`.

## Logout
Ao clicar em `Sair`, o servidor destrói a sessão e remove o cookie de sessão
Redirecionamento para página de login.

## Execução dos testes

Execute no terminal o comando `npm test`.
São realizados 8 testes para conferir funcionamento.

## Limitação do armazenamento em memória

As sessões são armazenadas em memória pelo armazenamento padrão do `express-session`. Por isso, elas são perdidas quando o servidor reinicia e não são compartilhadas entre várias instâncias do aplicativo. Esse armazenamento é adequado apenas para desenvolvimento e demonstração, não para produção. Em produção, deve-se configurar um armazenamento de sessões persistente e apropriado. O banco SQLite dos usuários é separado das sessões e continua sendo armazenado no arquivo indicado por `DATABASE_STORAGE`.

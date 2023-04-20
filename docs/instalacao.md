# Instalação e Execução

Para instalar e executar o *backend* do sistema **LibMVC** em sua máquina, basta
seguir as instruções abaixo:

1. Instale a versão mais recente do Node.js, que pode ser encontrada nesse [link](https://nodejs.org/en/download).

2. Instale a versão mais recente do MongoDB, que pode ser encontrada nesse [link](https://www.mongodb.com/try/download/community).

3. Clone o repositório:

```console git clone https://github.com/PedroPires20/LibMVC-Backend.git```

4. Instale as dependências do projeto, executando, a partir do diretório em que clonou o repositório, o seguinte comando:

```console npm install```

5. Crie, no diretório raiz do código, um arquivo `.env` e defina as seguintes variáveis, informando onde o servidor
do MongoDB pode ser encontrado:

```env
MONGO_URL="URL do seu servidor do MongoDB"
MONGO_PORT="Porta utilizada pelo MongoDB"
MONGO_DATABASE="Nome do banco de dados a ser criado para utilização pelo LibMVC"
```

## Execução

Para executar o servidor da API, execute o seguinte comando no diretório em que clonou o repositório:

```console npm start```

A API já estará disponível para atender requisições na porta `3000` (url
`http://localhost:3000`), mas você pode alterar essa configuração definido a
variável `PORT` no seu arquivo `.env`, com o número de porta desejado.

# Utilização (*Endpoints*)

Conforme mencionado anteriormente, o *backend* do **LibMVC** é implementado como
uma API REST e, sendo assim, as operações que dão suporte às funcionalidades são
acessadas pelo *frontend* via requisições HTTP. Cada uma das operações
disponibilizadas pelo *backend*, seus *endpoints*, bem como o formato das requisições
enviadas e de suas respectivas respostas, serão detalhadas a seguir.

**Obs.:** O corpo das requisições/respostas, que utilizam o formato JSON, é
apresentado com valores que representam o tipo de dados aceitável para seu
respectivo campo (chave), seguindo o sistema de tipos da linguagem TypeScript.

## Registrar um livro

Registra um novo livro do acervo no sistema e retorna seu ID

### Requisição

`POST /books`

```json
{
    "isbn": "string",
    "title": "string",
    "author": "string",
    "categories": "string[]",
    "publisher": "string",
    "edition": "string",
    "format": "string",
    "date": "string",
    "pages": "number",
    "copies": "number | null",
    "description": "string",
    "location": "string"
}
```

### Resposta

```json
{
  "createdId": "string"
}
```

## Recuperar os dados de um livro

Dado o ID de um livro (gerado pelo MongoDB para o documento correspondente),
essa requisição permite recuperar seus dados

### Requisição

`GET /books/:id`

#### Variáveis de Rota

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| id | string | ID do livro que deseja recuperar |

```plain
Corpo vazio
```

### Resposta

```json
{
    "_id": "string",
    "isbn": "string",
    "title": "string",
    "author": "string",
    "categories": "string[]",
    "publisher": "string",
    "edition": "string",
    "format": "string",
    "date": "string",
    "pages": "number",
    "copies": "number | null",
    "description": "string",
    "location": "string"
}
```

## Listar os livros cadastrados

Essa requisição permite retornar os dados de todos os livros cadastrados no
sistema com suportando paginação, retornando apenas uma porção da lista de
livros por vez. O corpo da requisição permite controlar dois parâmetros
(opcionais) adicionais que são: o número de livros retornados em cada página
(`booksPerPage`, que possui `10` como valor padrão) e a ordenação das
informações informadas (alterada informando o nome de qualquer campo
correspondente a qualquer uma das informações do livro e o valor `1`, para ordem
crescente, ou `-1`, para ordem decrescente).

### Requisição

`GET /books`

#### Variáveis de consulta

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| page | number | (Opcional) Número da página que deseja recuperar. Se não informado, recupera todos os livros de uma só vez. |

```json
{
  "booksPerPage": "number",
  "sortBy": {
    "$nomeCampo": "-1 | 1"
  }
}
```

### Resposta

```json
[
  {
      "_id": "string",
      "isbn": "string",
      "title": "string",
      "author": "string",
      "categories": "string[]",
      "publisher": "string",
      "edition": "string",
      "format": "string",
      "date": "string",
      "pages": "number",
      "copies": "number | null",
      "description": "string",
      "location": "string"
  },
  ...
}
```

## Pesquisar livros

Esse *endpoint* permite fazer uma busca textual entre os livros registrados,
levando em conta todos os campos (embora alguns campos como título e autor
tenham um "peso" especial). Também é possível aplicar filtros à busca, que podem
ser somados a uma consulta textual ou utilizados isoladamente. E possível
filtrar pelos valores dos seguintes campos: `author`, `categories`, `publisher`
e `format`. Assim como o *endpoint* anterior, também há suporte para a paginação
e a ordenação dos resultados, que funciona de maneira análoga.

### Requisição

`GET /books/search`

#### Variáveis de consulta

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| query | string | (Opcional) Texto que deseja pesquisar nos registros de livros do acervo. Se não informado, apenas os filtros informados no corpo da requisição serão aplicados. |
| page | number | (Opcional) Número da página que deseja recuperar. Se não informado, recupera todos os livros de uma só vez. |

```json
"filters": {
    "author": "string",
    "categories": "string[]",
    "publisher": "string",
    "format": "string"
},
"booksPerPage": "number",
"sortBy": {
    "$nomeCampo": "-1 | 1"
}
```

### Resposta

```json
[
  {
      "_id": "string",
      "isbn": "string",
      "title": "string",
      "author": "string",
      "categories": "string[]",
      "publisher": "string",
      "edition": "string",
      "format": "string",
      "date": "string",
      "pages": "number",
      "copies": "number | null",
      "description": "string",
      "location": "string"
  },
  ...
}
```

## Atualizar informações de um livro

Dado o ID de um livro, essa requisição permite atualizar suas informações no
sistema


### Requisição

`PATCH /books/:id`

#### Variáveis de Rota

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| id | string | ID do livro que deseja editar |

```json
{
    "isbn": "string",
    "title": "string",
    "author": "string",
    "categories": "string[]",
    "publisher": "string",
    "edition": "string",
    "format": "string",
    "date": "string",
    "pages": "number",
    "copies": "number | null",
    "description": "string",
    "location": "string"
}
```

### Resposta

```plain
Corpo vazio
```

## Apagar um livro

Dado o ID de um livro essa requisição permite apagá-lo do sistema

### Requisição

`DEL /books/:id`

#### Variáveis de Rota

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| id | string | ID do livro que deseja apagar |

```plain
Corpo vazio
```

### Resposta

```plain
Corpo vazio
```

## Registrar um empréstimo

Registra um novo empréstimo no sistema e retorna seu ID

### Requisição

`POST /loans`

```json
{
    "reader": "string",
    "phone": "string",
    "bookId": "string",
    "startDate": "string",
    "duration": "number",
    "renew": "boolean"
}
```

### Resposta

```json
{
  "createdId": "string"
}
```

## Recuperar os dados de um empréstimo

Dado o ID de um empréstimo, essa requisição permite recuperar seus dados

### Requisição

`GET /loans/:id`

#### Variáveis de Rota

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| id | string | ID do empréstimo que deseja recuperar |

```plain
Corpo vazio
```

### Resposta

```json
{
    "_id": "string",
    "reader": "string",
    "phone": "string",
    "bookId": "ObjectId",
    "bookTitle": "string",
    "startDate": "Date",
    "endDate": "Date",
    "duration": "number",
    "daysRemaining": "number",
    "renew": "boolean",
    "late": "boolean"
}
```

## Listar os empréstimos cadastrados

Essa requisição permite retornar os dados de todos os empréstimos cadastrados no
sistema, suportando paginação e ordenação dos resultados de forma análoga à
apresentada para o *endpoit* responsável por listar os livros. Esse endpoint
também suporta a filtragem dos resultados utilizando os valores dos campos:
`reader`, `bookName`, `loanDate`, `endDate`, `late` e `renew`.

### Requisição

`GET /loans`

#### Variáveis de consulta

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| page | number | (Opcional) Número da página que deseja recuperar. Se não informado, recupera todos os empréstimos de uma só vez. |

```json
{
  "loansPerPage": "number",
  "filters": {
    "reader": "string",
    "bookName": "string",
    "loanDate": "string",
    "endDate": "string",
    "late": "boolean",
    "renew": "boolean"
  }
  "sortBy": {
    "$nomeCampo": "-1 | 1"
  }
}
```

### Resposta

```json
[
  {
    "_id": "string",
    "reader": "string",
    "phone": "string",
    "bookId": "ObjectId",
    "bookTitle": "string",
    "startDate": "Date",
    "endDate": "Date",
    "duration": "number",
    "daysRemaining": "number",
    "renew": "boolean",
    "late": "boolean"
  },
  ...
}
```

## Atualizar informações de um empréstimo

Dado o ID de um empréstimo, essa requisição permite atualizar suas informações no
sistema

### Requisição

`PATCH /loans/:id`

#### Variáveis de Rota

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| id | string | ID do empréstimo que deseja editar |

```json
{
    "reader": "string",
    "phone": "string",
    "bookId": "string",
    "startDate": "string",
    "duration": "number",
    "renew": "boolean"
}
```

### Resposta

```plain
Corpo vazio
```

## Finalizar um empréstimo

Dado o ID de um empréstimo, essa requisição permite finalizá-lo, apagando seus
dados do sistema

### Requisição

`DEL /loans/:id`

#### Variáveis de Rota

| Nome | Tipo | Descrição |
| --- | ------|-------------|
| id | string | ID do livro que deseja finalizar |

```plain
Corpo vazio
```

### Resposta

```plain
Corpo vazio
```


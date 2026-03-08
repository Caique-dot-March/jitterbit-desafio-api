# Jitterbit Desafio API

API REST para gerenciamento de pedidos desenvolvida em Node.js com PostgreSQL.

## Tecnologias

- Node.js
- Express
- PostgreSQL
- JWT (autenticação)
- Swagger (documentação)

## Instalação

```bash
npm install
```

Configure o banco de dados PostgreSQL e ajuste as credenciais em `src/database.js`.

## Rodando o projeto

```bash
npm start
```

O servidor sobe em `http://localhost:3000`.

## Testes

```bash
npm test
```

## Autenticação

As rotas de pedido são protegidas por JWT. Para obter um token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Use o token retornado no header das próximas requisições:
```
Authorization: Bearer <token>
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Gerar token JWT |
| POST | `/order` | Criar pedido |
| GET | `/order/list` | Listar todos os pedidos |
| GET | `/order/:orderId` | Buscar pedido pelo número |
| PUT | `/order/:orderId` | Atualizar pedido |
| DELETE | `/order/:orderId` | Deletar pedido |

## Documentação

Acesse `http://localhost:3000/api-docs` para ver a documentação completa via Swagger.

## Exemplo de requisição

```bash
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [
      {
        "idItem": "2434",
        "quantidadeItem": 1,
        "valorItem": 1000
      }
    ]
  }'
```

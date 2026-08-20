# Transaction Import Service

High-throughput NDJSON import and reconciliation (NestJS, Drizzle, PostgreSQL).

Requires **Node.js 22+** and Docker.

## Run with Docker Compose

Copy the example env, then start. Compose reads `.env` for credentials and ports. `.env` is gitignored.

```bash
cp .env.example .env
docker compose up --build
```

- API / Swagger: http://localhost:${PORT}/docs (default **8000**)
- PostgreSQL on the host: `localhost:${POSTGRES_HOST_PORT}` (default **55432**)

Change values in `.env` only. Do not put passwords in the Dockerfile or commit `.env`.

## Local development

Start Postgres only, then the API (uses `DATABASE_URL` with `localhost` from `.env`):

```bash
docker compose up database -d
cp .env.example .env
npm install
npm run start:dev
```

## Database (Drizzle)

Schema and migrations are added in a later commit. The Drizzle client is wired to `DATABASE_URL`.

```bash
npm run db:generate
npm run db:migrate
```
# srnode-asgnmt

# Transaction Import Service

High-throughput NDJSON import and reconciliation (NestJS, Drizzle, PostgreSQL).

Requires **Node.js 22+** and Docker.

## Run with Docker Compose

Copy the example env, then start. Compose reads `.env` for credentials and ports. `.env` is gitignored.

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL, runs Drizzle migrations, then the API and worker.

- API / Swagger: http://localhost:${PORT}/docs (default **8000**)
- PostgreSQL on the host: `localhost:${POSTGRES_PORT}` (default **55432**)
- Worker: same image, `node dist/worker.js` (idle until import processing is added)

Change values in `.env` only. Do not put passwords in the Dockerfile or commit `.env`.

## Local development

Start Postgres and migrations, then the API (uses `DATABASE_URL` with `localhost` from `.env`):

```bash
docker compose up database -d
cp .env.example .env
npm install
npm run db:migrate
npm run start:dev
npm run start:worker:dev
```

## Database (Drizzle)

Schema lives in `src/infra/db/schema.ts`. Migrations are committed under `drizzle/`.

```bash
npm run db:generate
npm run db:migrate
```

HTTP errors use `{ error: { code, message, requestId } }` and never include stack traces.

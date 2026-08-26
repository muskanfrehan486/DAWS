# Production deployment

DAWS is two apps: a React UI (`frontend`) and an Express API (`backend`). They must be served on the **same origin**. The UI calls `/api/...` with no separate API URL. In development Vite proxies `/api` to port 3000; in production a reverse proxy must do the same.


## What to provision

- Node.js 18 or newer
- PostgreSQL 14 or newer
- A Supabase project (auth + storage)
- A reverse proxy (IIS, nginx, Caddy, or similar)
- A process manager for the API (Windows Service, NSSM, PM2, or systemd)

## Environment (backend only)

Copy [`backend/.env.example`](backend/.env.example) on the server. 

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000
NODE_ENV=production
```

Use `DIRECT_URL` for Prisma migrations. `DATABASE_URL` may use a pooler.

## Build and run

### Backend

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

`migrate deploy` applies existing migrations. Do not use `npm run prisma:migrate` in production (that is `migrate dev`).

The API listens on `PORT` (default 3000).

### Frontend

```bash
cd frontend
npm ci
npm run build
```

Host the contents of `frontend/dist` as the site root.

### Reverse proxy

| Path | Target |
|------|--------|
| `/api` | `http://127.0.0.1:3000` |
| `/` | `frontend/dist` |

SPA fallback: unknown non-file paths must serve `index.html` (React Router).

Example nginx:

```nginx
server {
  listen 80;
  server_name daws.example.com;
  root /var/www/daws/frontend/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

The API does not enable CORS. Serving the UI and `/api` on different hosts will fail in the browser.

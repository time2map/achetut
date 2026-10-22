# Archi2go Web

Archi2go is a web-only collection of curated city guides presented on an interactive Mapbox map.

## Stack

- React 18.3
- TypeScript 6
- Vite 7
- Tailwind CSS 4
- React Router 7
- Mapbox GL JS 3 + react-map-gl 8
- Zustand 5

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Set a public Mapbox token in `.env`:

```dotenv
VITE_MAPBOX_ACCESS_TOKEN=pk.etc
VITE_MAPBOX_STYLE=mapbox://styles/mapbox/standard
```

The previous `EXPO_PUBLIC_MAPBOX_*` names are temporarily supported so existing local environments continue to work.

## Routes

- `/design-1` — collapsible-panel concept
- `/design-1/cities` — city overview
- `/design-1/:cityId` — city guide
- `/design-1/:cityId/:placeId` — place detail
- `/design-2` — permanent-sidebar concept
- `/design-2/:cityId` — city guide
- `/design-2/:cityId/:placeId` — selected place and map popup

## Checks

```bash
npm run typecheck
npm run build
npm run preview
```

Vite outputs the production application to `dist/`.

## Source structure

```text
src/
  App.tsx                    # React Router routes
  main.tsx                   # browser entry point
  features/web-map/          # two map interface concepts
  shared/config/env.ts       # Vite environment adapter
  styles/index.css           # Tailwind and global document styles
  top/                       # curated city and place data
```

## Deployment

Production: <https://archi2go.time2map.com>, API: <https://archi2api.time2map.com>.

`.github/workflows/deploy.yml` builds the image and runs `docker compose up -d` on a self-hosted
GitHub runner installed on the server itself (labels `self-hosted,archi2go-web`), so no registry is
involved. It runs on every push to `web-version` and by hand via Actions → Deploy web → Run workflow.

One-time setup:

```bash
gh secret set VITE_MAPBOX_ACCESS_TOKEN -R time2map/achetut   # the map does not render without it
```

### Server setup (once, on 72.56.100.61)

The runner is a self-hosted GitHub Actions runner, so the image is built on the deploy server and no
registry is involved:

```bash
# runner user with docker access
useradd -m -s /bin/bash ghrunner && usermod -aG docker ghrunner
mkdir -p /opt/actions-runner && cd /opt/actions-runner
VER=2.338.0
curl -sSL -o runner.tar.gz \
  "https://github.com/actions/runner/releases/download/v${VER}/actions-runner-linux-x64-${VER}.tar.gz"
tar xzf runner.tar.gz && rm runner.tar.gz && chown -R ghrunner:ghrunner /opt/actions-runner
# token: gh api -X POST repos/time2map/achetut/actions/runners/registration-token --jq .token
sudo -u ghrunner ./config.sh --url https://github.com/time2map/achetut \
  --token <registration-token> --name ams-1-archi2go --labels archi2go-web --unattended
./svc.sh install ghrunner && ./svc.sh start
```

Host nginx terminates TLS and proxies to the containers; the API part is set up by the backend repo:

```nginx
# /etc/nginx/sites-available/archi2go.time2map.com
server {
    listen 80; listen [::]:80; server_name archi2go.time2map.com;
    location / { proxy_pass http://127.0.0.1:8081; proxy_http_version 1.1;
                 proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
}
```

```bash
certbot --nginx -d archi2go.time2map.com -d archi2api.time2map.com --non-interactive \
  --agree-tos --redirect
```

The API URL is baked into the bundle at build time (`VITE_ARCHI2GO_BACK_URL` in the workflow), so
the backend must allow the site origin in `CORS_ORIGINS`. The container `achetut-web` serves the SPA
on `127.0.0.1:8081` (nginx, SPA fallback, no-cache `index.html`); the host nginx terminates TLS for
`archi2go.time2map.com` and proxies to that port.

Verification after a deploy:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://archi2go.time2map.com/
curl -fsS https://archi2api.time2map.com/api/cities | head -c 120
docker logs achetut-web --tail 20    # on the server
```

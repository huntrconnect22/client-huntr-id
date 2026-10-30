# Self-hosted deployment: app.huntr.id

The frontend is built as a React Router SSR service, proxied through an Nginx
container on host port `5173`. The public HTTPS endpoint remains
`https://app.huntr.id`; the Nginx gateway that owns ports `80` and `443`
terminates TLS and proxies the hostname to the frontend stack.

## Server preparation

1. Point the DNS `A`/`AAAA` records for `app.huntr.id` to the server and remove
   the Vercel DNS target.
2. Clone this repository on the server, for example at `~/client-huntr-id`.
3. Create `.env.production` on the server with the existing production `VITE_*`
   values. Do not commit this file.
4. Create or renew the Let's Encrypt certificate for `app.huntr.id` before
   enabling the HTTPS server block.
5. Select the gateway template that matches the server:
   - Use `docker/nginx/app.huntr.id.proxy.conf.example` when Nginx runs on the
     host OS.
   - Use `docker/nginx/app.huntr.id.docker-gateway.conf.example` when the
     existing gateway is an Nginx Docker container. This is the current API
     server topology. Add the documented `extra_hosts` entry to the gateway
     service so that `host.docker.internal:5173` resolves from its container.
6. Validate and reload the gateway after the certificate and proxy server block
   are in place.

## Deploy or update

```sh
chmod +x deploy.sh
./deploy.sh
```

The deployment command uses `.env.production` only as build input. Vite embeds
the `VITE_*` values at build time, and the runtime container only receives its
host and port configuration.

## Verify

```sh
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl -I http://127.0.0.1:5173
```

The service should return an HTTP response from Nginx. The public URL should be
checked at `https://app.huntr.id` after the TLS gateway configuration is live.

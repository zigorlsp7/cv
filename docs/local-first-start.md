# Local First Start (cv)

Use this runbook for first local startup of `cv`, or after resetting local data/OpenBao.

## 1. Prerequisites

- `platform-ops` local stack is running.
- OpenBao is initialized and unsealed.
- `kv` secrets engine exists in OpenBao.

If OpenBao is not initialized yet, follow:

- `platform-ops/docs/local-first-start.md`

## 2. Create `kv/cv` Secret in OpenBao (UI)

Open:

- `http://localhost:8200/ui`

In OpenBao UI:

1. Go to secrets engines and open `kv`.
2. Create secret at path `cv`.
3. Add these keys:
- `AUTH_SESSION_SECRET`
  - generate with:
```bash
openssl rand -hex 32
```
- `TOLGEE_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_GOOGLE_EMAILS`
- `POSTGRES_PASSWORD`

`ADMIN_GOOGLE_EMAILS` example:

- `you@example.com,other@example.com`

## 3. Create a Read Policy for CV Token (UI)

In OpenBao UI:

1. Open top-level `Policies` from the left navigation.
2. Click create ACL policy.
3. Name: `cv-local-read`
4. Policy content:

```hcl
path "kv/data/cv" { capabilities = ["read"] }
path "kv/metadata/cv" { capabilities = ["read"] }
```

## 4. Create CV Read Token (CLI required in this UI version)

Your OpenBao UI shows this message for `token` auth method:

- `The OpenBao UI only supports configuration for this authentication method. For management, the API or CLI should be used.`

So create the token with CLI:

```bash
ROOT_TOKEN='paste_root_token_here'
docker compose --env-file docker/.env.ops.local -f docker/compose.ops.local.yml exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao bao token create -policy=cv-local-read -format=json \
  | jq -r '.auth.client_token'
```

Use the `ROOT_TOKEN` you got when initializing OpenBao.
Do not include angle brackets (`<` `>`) around the token value.

Do not use the root token in `cv` env except temporary debugging.

## 5. Prepare CV Local Env

Edit `docker/.env.app.local` and confirm at least:

- `OPENBAO_TOKEN=<client token from step 4>`
- `SWAGGER_ENABLED=true` (optional, for local docs)
- local domains/URLs are correct for your setup

## 6. Start CV Local Stack

From `cv` repo root:

```bash
npm run local:up
```

The script will:

- validate OpenBao readiness
- validate token access to `kv/cv`
- validate required keys
- start postgres, ensure DB exists
- start/rebuild app services

## 7. Validate

```bash
curl -fsS http://localhost:3000/v1/health/ready
curl -fsS http://localhost:3001
```

## 8. Troubleshooting

`403 permission denied` on `kv/cv`:

- token policy is missing/wrong
- token does not include `cv-local-read`
- `OPENBAO_TOKEN` in `docker/.env.app.local` is outdated

`OpenBao is uninitialized` or `sealed`:

- fix OpenBao state in `platform-ops` first

`missing required keys`:

- one or more required keys under `kv/cv` are empty/missing

## 9. CLI Fallback (Optional)

If you prefer CLI for policy/token creation:

```bash
docker compose --env-file docker/.env.ops.local -f docker/compose.ops.local.yml exec -T openbao bao policy write cv-local-read - <<'EOF'
path "kv/data/cv" { capabilities = ["read"] }
path "kv/metadata/cv" { capabilities = ["read"] }
EOF

docker compose --env-file docker/.env.ops.local -f docker/compose.ops.local.yml exec -T openbao bao token create -policy=cv-local-read
```

To print only the token value:

```bash
docker compose --env-file docker/.env.ops.local -f docker/compose.ops.local.yml exec -T openbao sh -lc 'bao token create -policy=cv-local-read -format=json | jq -r .auth.client_token'
```

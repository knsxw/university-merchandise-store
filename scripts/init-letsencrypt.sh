#!/usr/bin/env bash

set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

# Docker Compose reads .env automatically, but shell scripts do not. Read only
# these two non-secret values without evaluating the file as shell code.
read_dotenv_value() {
  local key="$1"
  [[ -f .env ]] || return 0
  sed -n "s/^${key}=//p" .env | tail -n 1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

CERTBOT_DOMAIN="${CERTBOT_DOMAIN:-$(read_dotenv_value CERTBOT_DOMAIN)}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-$(read_dotenv_value CERTBOT_EMAIL)}"

: "${CERTBOT_DOMAIN:?Set CERTBOT_DOMAIN to the public hostname, for example store.example.edu}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL to the certificate expiry contact address}"

if [[ "$CERTBOT_DOMAIN" == "localhost" || "$CERTBOT_DOMAIN" != *.* || "$CERTBOT_DOMAIN" == \** ]]; then
  echo "CERTBOT_DOMAIN must be a public hostname whose DNS points to this server." >&2
  exit 1
fi

compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "Checking the production Compose configuration..."
"${compose[@]}" config --quiet

echo "Starting the temporary HTTP endpoint for Let's Encrypt validation..."
NGINX_CONFIG_PATH=./nginx.bootstrap.conf "${compose[@]}" up -d nginx

certbot_args=(
  certonly
  --webroot
  --webroot-path /var/www/certbot
  --cert-name merch-store
  --domain "$CERTBOT_DOMAIN"
  --email "$CERTBOT_EMAIL"
  --agree-tos
  --no-eff-email
  --non-interactive
  --keep-until-expiring
)

echo "Requesting the certificate for $CERTBOT_DOMAIN..."
"${compose[@]}" run --rm --entrypoint certbot certbot "${certbot_args[@]}"

echo "Starting production HTTPS and automatic renewal..."
"${compose[@]}" up -d --force-recreate nginx certbot

echo "HTTPS is ready at https://$CERTBOT_DOMAIN"

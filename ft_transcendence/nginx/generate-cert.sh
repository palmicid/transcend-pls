#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
CERT="$CERT_DIR/localhost.pem"
KEY="$CERT_DIR/localhost-key.pem"

mkdir -p $CERT_DIR

if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  echo "Generating self-signed TLS certificate..."

  openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout $KEY \
  -out $CERT \
  -subj "/CN=localhost"

  echo "Certificate generated."
else
  echo "TLS certificate already exists."
fi

exec nginx -g "daemon off;"

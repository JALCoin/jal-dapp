#!/usr/bin/env bash
set -e

# Set the default release
RELEASE=${1:-stable}
URL="https://release.solana.com/${RELEASE}/solana-install-init"
INSTALL_DIR="$HOME/.local/share/solana/install"
mkdir -p "$INSTALL_DIR"

echo "Installing Solana from $URL"

curl -sSfL "$URL" -o "$INSTALL_DIR/init"
chmod +x "$INSTALL_DIR/init"
"$INSTALL_DIR/init" "$RELEASE"

echo "Solana CLI installed. Add to your PATH:"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"'

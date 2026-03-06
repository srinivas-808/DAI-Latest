#!/bin/bash
# Fix ALL platform-specific native binaries for WSL
set -e

FRONTEND_DIR="/mnt/c/Users/srini/Desktop/DAI-Latest/medical-ai-agent/frontend"
NODE_MODULES="$FRONTEND_DIR/node_modules"

echo "=== Fixing ALL native binaries for WSL (Linux x64) ==="

cd /tmp

# List of packages that need Linux native binaries
PACKAGES=(
    "@esbuild/linux-x64"
    "@rollup/rollup-linux-x64-gnu"
    "@tailwindcss/oxide-linux-x64-gnu"
    "@parcel/watcher-linux-x64-gnu"
    "lightningcss-linux-x64-gnu"
)

for PKG in "${PACKAGES[@]}"; do
    echo ""
    echo "--- $PKG ---"
    
    # Clean up any previous attempts
    rm -rf extract *.tgz
    
    # Download
    npm pack "$PKG" 2>/dev/null || { echo "SKIP: $PKG not found"; continue; }
    
    TARBALL=$(ls *.tgz 2>/dev/null | head -1)
    if [ -z "$TARBALL" ]; then
        echo "SKIP: No tarball for $PKG"
        continue
    fi
    
    # Extract
    mkdir -p extract
    tar -xzf "$TARBALL" -C extract
    
    # Install to node_modules
    TARGET="$NODE_MODULES/$PKG"
    mkdir -p "$TARGET"
    cp -r extract/package/* "$TARGET/"
    
    # Cleanup
    rm -rf extract "$TARBALL"
    echo "OK: $PKG installed"
done

echo ""
echo "=== Verification ==="
for PKG in "${PACKAGES[@]}"; do
    if [ -d "$NODE_MODULES/$PKG" ]; then
        FILES=$(ls "$NODE_MODULES/$PKG/" | tr '\n' ' ')
        echo "  ✅ $PKG  →  $FILES"
    else
        echo "  ⚠️  $PKG  →  NOT FOUND"
    fi
done

echo ""
echo "=== All fixes applied! ==="

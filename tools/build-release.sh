#!/bin/bash
# Xserver 用の公開フォルダ (release/) を作ります。
#   使い方:  ./tools/build-release.sh https://あなたのドメイン/
#   例:      ./tools/build-release.sh https://kotaki-motors.jp/
# 1) サイトに必要なファイルだけを release/ にコピー
# 2) 共有用アドレス(OGP・構造化データ)をあなたのドメインに書き換え
# 3) sitemap.xml / robots.txt を生成
# できあがった release/ の「中身」を、Xserver の public_html にアップロードしてください。
set -euo pipefail
DOMAIN="${1:-}"
[ -z "$DOMAIN" ] && { echo "ドメインを指定してください 例: $0 https://kotaki-motors.jp/"; exit 1; }
DOMAIN="${DOMAIN%/}/"
cd "$(dirname "$0")/.."
rm -rf release && mkdir release
cp index.html coating.html flow.html release/
cp -R css js assets release/
rm -rf release/assets/vendor/.DS_Store 2>/dev/null || true
OLD="https://inoueequip-ctrl.github.io/Private/"
for f in release/index.html release/coating.html release/flow.html; do
  sed -i "s#${OLD}#${DOMAIN}#g" "$f"
done
cat > release/robots.txt <<R
User-agent: *
Allow: /
Sitemap: ${DOMAIN}sitemap.xml
R
cat > release/sitemap.xml <<S
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${DOMAIN}</loc></url>
  <url><loc>${DOMAIN}coating.html</loc></url>
  <url><loc>${DOMAIN}flow.html</loc></url>
</urlset>
S
# Apache (Xserver): 圧縮とキャッシュ、動画の種類
cat > release/.htaccess <<'H'
AddType video/mp4 .mp4
AddType video/webm .webm
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType video/mp4 "access plus 1 month"
  ExpiresByType video/webm "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
# http -> https
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
H
echo "OK: release/ を作成しました ($(du -sh release | cut -f1))"
echo "次: release/ の中身を Xserver の public_html にアップロード"

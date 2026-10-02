# KOTAKI MOTORS 公式サイト

静的サイト（HTML / CSS / JS）。ビルド不要で、そのままホスティングできます。

- `index.html` — 本体
- `css/style.css`, `js/main.js` — スタイル・演出
- `assets/video` — 施工動画（mp4 + webm フォールバック、音声なし・軽量化済み）
- `assets/img` — ロゴ・ポスター画像・OGP
- `assets/vendor` — GSAP / ScrollTrigger / Lenis（ローカル同梱）

## ローカル確認
```
npx http-server -p 8123 .
```
## 備考
- 日本語フォント・欧文フォントは Google Fonts（Archivo / Zen Kaku Gothic New）を読み込みます。
- お問い合わせフォームはメールアプリを起動する方式（サーバー不要）です。
- 地図は Google マップの埋め込みです。

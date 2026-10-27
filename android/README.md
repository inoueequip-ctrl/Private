# ガードン Androidアプリ + ウィジェット

`../digipet/`(Web版)をWebViewで包んだアプリです。ゲーム本体はWeb版と共通で、
ビルド時に `digipet/` が assets として同梱されます(コピー不要)。

## ビルド手順(Android Studio)
1. Android Studio (Koala 以降推奨) で、このリポジトリの **`android/` フォルダ**を開く
2. Gradle Sync が終わるまで待つ(初回は SDK 34 のダウンロードを求められたら承認)
3. 端末をUSBデバッグで接続(またはエミュレータ)→ ▶ Run
4. APKだけ欲しい場合: `Build > Build Bundle(s) / APK(s) > Build APK(s)`

## ウィジェットの出し方
ホーム画面の空きスペースを長押し → 「ウィジェット」→「ガードン」→ 配置。
アプリを一度開くと、育てた状態がウィジェットに反映されます(タップでアプリが開きます)。

## 仕組み
- `index.html` の `save()` が `GuardonBridge.save(json)` を呼ぶ → `SharedPreferences` に保存 → ウィジェット更新
- ウィジェットはドット絵を `Pet.kt` で描画(Web版と同じ定義)。ごはんの減りも時間経過で計算
- 進化段階・ドット絵を変える場合は `digipet/index.html` と `Pet.kt` の両方を直す

# LM Studio Setup (Mac / Apple Silicon)

このドキュメントは、Mac (Apple Silicon) 上で LM Studio をローカル LLM / VLM サーバとして使うための固定手順です。

## 前提
- 用途: ローカル検証・開発用
- API 利用方式: OpenAI互換 API
- Base URL: `http://localhost:1234/v1`

## 1. インストール
1. LM Studio をインストールして起動する
2. 初回起動時の案内に従ってセットアップを完了する

補足:
- Apple Silicon (M-series) 環境では Metal 利用が有効な構成が基本です
- 初回起動直後はモデル一覧の読み込みに少し時間がかかることがあります

## 2. モデルを選ぶ
### テキスト用途
- Chat / Instruct 系モデルを選ぶ
- 例: Qwen 系、Llama 系、Mistral 系など（LM Studio 内で利用可能なもの）

### 画像+テキスト用途 (Vision)
- **Vision 対応モデルを選ぶこと**
- 例: **Qwen2.5-VL 7B** 系

注意:
- 画像推論をしたい場合、通常のテキスト専用モデルでは動きません
- モデル名に `VL` / `Vision` が含まれていても、実際に画像入力対応かを LM Studio 側の説明で確認してください

## 3. モデルをロード
1. 使いたいモデルを選択
2. `Load`（または同等操作）でメモリにロード
3. ロード完了を待つ

補足:
- メモリ不足時は、より小さいモデル/量子化版を選ぶ
- 画像対応モデルはテキスト専用モデルより重いことがあります

## 4. Local Server を起動
1. LM Studio の `Developer` / `Local Server` 相当の画面を開く
2. **OpenAI compatible API** を有効化
3. サーバを起動する

確認ポイント:
- ベースURLが **`http://localhost:1234/v1`** になっていること
- 利用するアプリの `BASE_URL` / `LMSTUDIO_BASE_URL` に同じ値を設定すること

## 5. 動作確認 (任意)
### モデル一覧
```bash
curl http://localhost:1234/v1/models
```

### チャット補完 (テキスト)
```bash
curl -X POST http://localhost:1234/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer lm-studio' \
  -d '{
    "model": "<model-id>",
    "messages": [
      {"role": "system", "content": "あなたは役に立つアシスタントです"},
      {"role": "user", "content": "こんにちは"}
    ]
  }'
```

## Vision 利用時の注意点
- Vision対応モデルをロードしてからリクエストする
- OpenAI互換形式では `messages[n].content` を配列にし、`text` と `image_url` を同居させる
- 画像は `data:<mime>;base64,<...>` の data URL 形式で送ると扱いやすい
- 画像サイズが大きすぎると遅延・メモリ使用量増加の原因になるため、必要に応じて縮小する

## トラブルシュート
### 1) `localhost:1234` に接続できない
- LM Studio の Local Server が起動しているか確認
- ポート番号が `1234` から変わっていないか確認
- 他プロセスがポートを使用していないか確認

ポート使用確認:
```bash
lsof -i :1234
```

### 2) `/v1/models` にモデルが出ない
- モデルがまだダウンロードされていない
- モデルがロード前の状態
- LM Studio 側でサーバ対象モデルが未選択

対処:
- モデルをダウンロード
- モデルをロード
- Local Server 画面で対象モデルを再確認

### 3) 推論が遅い
- 重いモデルを使っている（特に Vision）
- 同時に複数アプリから叩いている
- 長文/高解像度画像を送っている

対処:
- より小さいモデルや量子化版に変更
- 画像を縮小して送る
- 不要なアプリを停止

### 4) メモリ不足 / ロード失敗
- モデルサイズが端末メモリに対して大きい可能性

対処:
- より小さいモデルを使う
- 別の量子化版を選ぶ
- 同時起動中のアプリを閉じる

### 5) 画像推論がうまくいかない
- テキスト専用モデルを選んでいる
- `messages[].content` が文字列のままで `image_url` を送っていない
- `image_url.url` が data URL 形式になっていない

対処:
- Vision対応モデルへ切替
- OpenAI互換の content 配列形式に合わせる
- `data:image/png;base64,...` 形式を確認

## 運用メモ
- ローカル用途でも接続設定は `.env` にまとめる
- モデルIDは固定値でもよいが、`GET /v1/models` で取得できる実装にしておくと再利用しやすい
- 将来のアプリ向けに、接続定型は `docs/LMSTUDIO_API.md` を参照する

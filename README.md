# 📖 LifeLog AI Diary - AIつぶやき日記アプリ

日常の何気ない出来事や写真、ボイスメモを投稿するだけで、Gemini AI が自動的に心温まる日記やストーリー、挿絵（イラスト）、AIコメントを生成してくれるライフログ＆コミュニティ日記アプリケーションです。

初心者から開発者まで、**「誰でもすぐに使えて、自由にいじって改善できる」** オープンで柔軟な設計となっています。

---

## ✨ 主な機能

1. **日常のつぶやき（モーメント）投稿**
   - テキストメモ、写真添付、マイクを使った音声入力に対応。
   - 今日の出来事をリアルタイムに記録できます。

2. **Gemini AI による自動日記生成**
   - 1日のつぶやきを元に、Gemini AI が自動でタイトル、本文、要約、カバー画像プロンプト、AI振返りコメントを生成。
   - 「文学的」「ポップ」「感動的」「ほのぼの」など、好みの執筆スタイルを選択可能。

3. **タイムライン ＆ カレンダービュー**
   - **タイムライン（SNS）**: 他のユーザーの公開日記を閲覧し、リアクションやコメントで交流。
   - **カレンダー**: 過去の日記を日付ごとに美しくカレンダー形式で振り返り。

4. **マルチデバイス ＆ 誰でも使える柔軟設計**
   - **ゲストモード対応**: アカウント作成なしですぐにお試し利用可能。
   - **Google ログイン対応**: Firebase Auth による安全なサインイン。
   - **誰でも削除・編集可能**: トラブルなくスムーズに操作できるフレンドリーな仕様。

5. **AI音声読み上げ (TTS) ＆ 画像生成**
   - 日記の文章をブラウザの音声合成機能で情感豊かに読み上げ。
   - AIが作成したプロンプトで挿絵風のカバー画像を提示。

---

## 🛠️ 技術スタック

- **フロントエンド**: React 18 / Vite / TypeScript / Tailwind CSS / Lucide Icons / Canvas-Confetti
- **バックエンド (サーバー)**: Express (Node.js) + Google GenAI SDK (`@google/genai`)
- **データベース & 認証**: Firebase Firestore / Firebase Authentication
- **AI モデル**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)

---

## 📁 ディレクトリ構造

```text
├── src/
│   ├── components/            # UIコンポーネント群
│   │   ├── AuthModal.tsx       # ログイン・ゲスト認証モーダル
│   │   ├── CalendarView.tsx    # カレンダー表示コンポーネント
│   │   ├── DiaryCard.tsx       # 日記カード（詳細・音声再生・コメント）
│   │   ├── DiaryGeneratorModal.tsx # AI日記生成ダイアログ
│   │   ├── MomentPostForm.tsx  # つぶやき（モーメント）投稿フォーム
│   │   ├── MomentsList.tsx     # つぶやき一覧
│   │   ├── SnsTimeline.tsx     # 公開日記タイムライン
│   │   └── UserProfileModal.tsx# プロフィール・スタイル設定
│   ├── lib/
│   │   ├── firebase.ts         # Firebase初期化設定
│   │   └── geminiApi.ts        # AI日記生成API呼び出し
│   ├── App.tsx                 # メインアプリケーションコンポーネント
│   ├── main.tsx                # エントリポイント
│   └── types.ts                # TypeScript型定義
├── server.ts                   # Expressサーバー（Gemini APIプロキシ）
├── firestore.rules             # Firestoreセキュリティルール
├── firebase-blueprint.json     # データベースのデータモデル定義
└── README.md                   # 本ドキュメント
```

---

## 🚀 セットアップ ＆ 起動方法

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定 (`.env.example` 参照)
`.env` ファイルを作成し、Gemini APIキーを設定します：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスします。

---

## 🔧 Firebaseの設定と拡張・改善ガイド

### 誰でも使えるオープンなデータベース権限 (`firestore.rules`)
すべてのユーザーがストレスなく試せるよう、Firestoreのセキュリティルールは以下のようにアクセスを柔軟に許可しています：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> 💡 **プロダクション運用へ改善する場合のヒント:**  
> 本格的な本番運用に移行する際は、`request.auth != null` や `resource.data.userId == request.auth.uid` を組み合わせることで、所有者のみが編集・削除できるように制限をカスタマイズできます。

---

## 💡 今後の改善・カスタマイズ案

- [ ] **新しい日記スタイルの追加**: `server.ts` のプロンプトテンプレートに「SF風」「ミステリー風」などを追加。
- [ ] **画像生成エンジンの拡張**: Gemini の画像生成 API や Imagen 3 と連携してカバー画像を自動レンダリング。
- [ ] **エクスポート機能**: 作成した日記を PDF や Markdown 形式で一括ダウンロード。

---

## 📜 ライセンス

MIT License - 自由にフォーク、改変、再配布いただけます。

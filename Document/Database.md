# データベース設計書 (Supabase / PostgreSQL)

Re:Journal v2 で使用するデータベースの設計情報です。

## 接続情報
- **プラットフォーム**: Supabase
- **データベース**: PostgreSQL
- **管理ユーザー名**: ryotakiyama216's Project
- **管理パスワード**: `re-journal0217`
  - ※ セキュリティのため、実際の運用環境では環境変数（.env）で管理し、このドキュメントを公開リポジトリに含める場合はパスワードを削除してください。

## テーブル設計

### 1. `users` (ユーザー管理)
Supabase Auth と連携し、ユーザーの基本プロフィールを保持します。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Supabase Auth ID と同期 |
| `email` | string | ユーザーのメールアドレス |
| `display_name` | string | 表示名 |
| `avatar_url` | string | アバター画像のURL |
| `language_preference` | string | 言語設定 (default: 'ja') |
| `profile_data` | jsonb | 住所、職種、趣味、AI用コンテキスト等 |
| `stripe_customer_id` | string | Stripe の顧客ID |
| `subscription_status` | string | サブスク状態 ('active', 'canceled', etc.) |
| `subscription_plan` | string | プラン名 ('free', 'premium') |
| `created_at` | timestamp | 作成日時 |

### 2. `journals` (ジャーナル本体)
日々の投稿データを格納します。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | uuid (PK) | ジャーナルID |
| `user_id` | uuid (FK) | `users.id` への外部キー |
| `entry_date` | date | 投稿対象日 |
| `mood_score` | integer | AIが判定した感情スコア (1-100) |
| `overall_summary` | text | AIによるその日の総評 |
| `created_at` | timestamp | 作成日時 |

### 3. `journal_plans` (予定とAI対話)
1つのジャーナルに紐づく複数の予定と、それに対するAIとの対話履歴を格納します。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | uuid (PK) | 予定ID |
| `journal_id` | uuid (FK) | `journals.id` への外部キー |
| `plan_content` | text | ユーザーが入力した予定内容 |
| `deep_dive_history` | jsonb | AIの質問とユーザーの回答の配列 |
| `ai_advice` | text | その予定に対するAIの最終アドバイス |
| `status` | string | 'pending', 'completed' |
| `order_index` | integer | 表示順序 |

### 4. `insights` (分析データ)
統計情報を高速に取得するための集計テーブル。

| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `user_id` | uuid (PK) | `users.id` への外部キー |
| `total_posts` | integer | 累計投稿数 |
| `current_streak` | integer | 継続日数 |
| `focus_theme` | string | AIが抽出した最近の頻出テーマ |

## セキュリティ (RLS)
Supabase の **Row Level Security (RLS)** を有効にし、ユーザーが自分自身のデータのみを閲覧・編集できるように設定します。
- `auth.uid() = user_id` のポリシーを各テーブルに適用。

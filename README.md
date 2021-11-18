# NacPag - Notion Automatically Create Pages

## What you can do🙆‍♂️

- テンプレートページのプロパティのコピー
  - 参加者やタグ、その他諸々の設定を自動で設定できます
- 日次・週次でページを作成
  - ミーティングの頻度に合わせてページを作成できます

## What you can't do🙅‍♂️

- テンプレートページの中身をコピー
  - コピーできるのはプロパティのみです
  - 毎回作成されたページからテンプレートページを選択して雛形を流し込んでください
- 祝日のスキップ
  - そのうち対応します
- Settingsページの自動生成
  - 初回のみ必要なカラム・値を手動で生成してください
- We look forward to your contributions😉

## How to use

**Notion側の設定**
1. Settingsページを複製する
   1. https://tosite.notion.site/d9e882ac654a444ba550be32f8cdfd29?v=4d30c5a1ba1f4974a0d099044b5a4745
2. APIトークンを発行する
   1. https://www.notion.so/my-integrations
3. 自動生成したいページのプロパティにDatetimeカラムを追加する
4. 自動生成したいページのテンプレートページを作成する
5. テンプレートページのIDをSettingsページのカラムに記載する
6. Settingsページ・自動生成したい親ページにAPIからのアクセス許可設定を行う

**nacrep側の設定**
7. APIキーを `.env` の `NOTION_TOKEN` に記載する
8. SettingsページのIDを `.env` の `SETTING_DB_ID` に記載する
9. Slack Webhook URLを `.env` の `SLACK_WEBHOOK_URL` に記載する

**cronの設定**
10. GitHubActionsもしくはサーバーのcron設定から定期的に `yarn run start` を実行する設定を行う
    1. GitHubActionsから実行する場合はxxxを参照のこと

## Sequence

<details><summary>uml</summary><div>

```puml
@startuml
title Generate recurring pages in Notion

participant cron
control nacrep as s

database SettingPage as sp

database ParentPage as pp
participant "ParentPage->\nLatestPage" as lp
participant "ParentPage->\nTemplatePage" as tp
participant "ParentPage->\nNewPage" as np

participant Slack

cron->s: Run the script periodically. \n定期的にスクリプトを実行する
s->sp: Fetching information from the Settings page.\n設定ページから情報を取得する

alt loop
  s->lp: Fetch the event date from the Datetime column of the latest page.\n最新ページのDatetimeカラムから開催日を取得する
  s->s: Filter the creation targets from the settings page to only those for today and tomorrow.\n設定ページから作成対象が今日・明日のものだけをフィルタリングする
  s->s: Skip if the page has already been created before the event.\nすでに開催前のページが作成されている場合スキップ
  s->tp: Fetch properties and parent page IDs from template page.\nテンプレートページからプロパティ・親ページIDを取得
  s->np: Create a new page based on the fetched properties.\n取得したプロパティを元に新規ページを作成
  s->sp: Update previous_id with the ID of the latest page.\n最新ページのIDでprevious_idを更新
  s->Slack: Notify that page creation is complete.\nページ作成完了通知
end
s->cron:end of process\n処理終了
@enduml
```

</div></details>

![sequence](docs/sequence.svg)

## Pages information

### Settings page

A page to manage the settings for automatic generation.

自動生成する際の設定を管理するページ。

#### Columns

|column name|type|required|description|value|
| --- | --- | --- | --- | --- |
| title | Title | * | Used for the title of the page<br>ページのタイトルに使用 | - |
| template_id | Text | * | ID of the page duplicator<br>ページ複製元のID | - |
| enable | Checkbox | * | To be processed when checking<br>チェック時に処理対象となる | - |
| interval | Select | * | run interval<br>実行間隔 | daily, weekly |
| week | Select | * (interval=weekly) | Day of the week<br>開催曜日 | Sun, Mon, Tue, Wed, Thu, Fri, Sat |
| hour | Number | - | Opening time(hour)<br>開催時刻(時) | - |
| minute | Number | - | Opening time(minute)<br>開催時刻(分) | - |
| previous_id | Text | - | Previous page ID (used by the system)<br>前回ページID(システムで使用) | - |

### Template pages

A page that holds the properties of automatically generated pages.  
The template page ID is held in the configuration page.  
The page is automatically generated based on the properties of the template page.  
Note that the Datetime column is required.

自動で生成するページのプロパティを保持するページ。  
テンプレートページIDは設定ページに保持する。  
テンプレートページのプロパティを元にページを自動生成する。  
Datetimeカラムは必須となる点に留意。

### Columns

|column name|type|required|description|value|
| --- | --- | --- | --- | --- |
| Datetime | Date | * | Opening time<br>開催時刻 | - |

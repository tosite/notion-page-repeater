import { Client } from 'notion_sdk'
import dayjs from 'dayjs'
import { okMessage, ngMessage } from './util.ts'
import { Slack } from './slack.ts'
import { fetchSettings, fetchPage, createPage, updatePrevId } from './notion.ts'

const slack = new Slack({ url: Deno.env.get('SLACK_WEBHOOK_URL') })
const notion = new Client({ auth: Deno.env.get('NOTION_TOKEN') })
const settingDbId = Deno.env.get('SETTING_DB_ID')
if (!settingDbId) {
  throw 'SETTING_DB_ID is empty'
}

const main = async () => {
  const settings = await fetchSettings(notion, settingDbId)
  for (const setting of settings.entries) {
    console.log('==== start creating page ========')
    const prevPage = await fetchPage(notion, setting.prevId)
    let prevRunAt = null
    if (prevPage !== null) {
      const datetimeProperty = prevPage.properties['Datetime']
      if (datetimeProperty && datetimeProperty['date'] && datetimeProperty['date']['start']) {
        prevRunAt = dayjs(datetimeProperty['date']['start'])
      }
    }

    // 実行対象が今日・明日のものだけを取得
    if (
      setting.runAt.format('YYYYMMDD') !== dayjs().format('YYYYMMDD') &&
      setting.runAt.format('YYYYMMDD') !== dayjs().add(1, 'day').format('YYYYMMDD')
    ) {
      continue
    }
    console.log(
      !prevRunAt ? 'not set' : prevRunAt.format('YYYY-MM-DD HH:mm'),
      ' <=> ',
      setting.runAt.format('YYYY-MM-DD HH:mm'),
      'isSame = ',
      prevRunAt !== null && setting.runAt.format('YYYYMMDDHHmm') === prevRunAt.format('YYYYMMDDHHmm'),
    )
    // 日付と1つ前のIDから該当のページがすでに作成済みかどうか判定する
    if (prevRunAt !== null && setting.runAt.format('YYYYMMDDHHmm') === prevRunAt.format('YYYYMMDDHHmm')) {
      console.log('[SKIP]page is already exist.')
      continue
    }
    const title = `${setting.title} ${setting.runAt.format('YYYY-MM-DD')}`

    // テンプレートページを取得・整形
    if (setting.templateId === '') {
      await slack.send(ngMessage('テンプレートページが見つかりませんでした', title)).catch(() => {})
      console.log('[ERROR]template ID is empty.')
      continue
    }
    const templatePage = await fetchPage(notion, setting.templateId)
    if (!templatePage) {
      await slack.send(ngMessage('テンプレートページが見つかりませんでした', title)).catch(() => {})
      console.log('[ERROR]template ID is invalid.')
      continue
    }
    if (templatePage.parent.type !== 'database_id' || !templatePage.parent.database_id) {
      await slack.send(ngMessage('親データベースIDが見つかりませんでした', title)).catch(() => {})
      console.log('[ERROR]parent database ID is invalid.')
      continue
    }
    const parentDbId = templatePage.parent.database_id
    const templateParams = templatePage.properties

    if (!templateParams) {
      await slack.send(ngMessage('テンプレートページの取得に失敗しました', title)).catch(() => {})
      console.log('[ERROR]template-params parse error.')
      continue
    }

    // テンプレートページを元に新しいページを作成する
    const newPageId = await createPage(notion, setting, templateParams, parentDbId)
    if (newPageId === '') {
      await slack.send(ngMessage('新しいページが作成できませんでした', title)).catch(() => {})
      console.log('[ERROR]Failed creating new page.')
      continue
    }

    // 新しいページIDで設定を上書き
    await updatePrevId(notion, setting.id, newPageId)
    const uri = `${settings.domain}/${newPageId.replace(/-/g, '')}`
    await slack
      .send(
        okMessage(
          [
            `MTGノートを作成しました！`,
            `[ *title:${title}* ]`,
            `url 👉 https://${uri}`,
            `notion 👉 notion://${uri}`,
          ].join('\n'),
        ),
      )
      .catch(() => {})
    console.log('==== finish creating page =========')
  }
}

main().catch((e) => {
  console.error(e)
})

// deno-lint-ignore-file no-explicit-any camelcase ban-ts-comment
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts'
import dayjs from 'https://cdn.skypack.dev/dayjs?dts'

const notion = new Client({
  auth: Deno.env.get('NOTION_TOKEN'),
})

const url = Deno.env.get('SLACK_WEBHOOK_URL') || ''
const slack = {
  send: async (arg: { text?: string }) => {
    const payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: arg.text,
          },
        },
      ],
    }
    await fetch(url, {
      method: 'post',
      body: JSON.stringify(payload),
    })
  },
}

const settingDbId = Deno.env.get('SETTING_DB_ID') || ''
let domain = ''

const weekList = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

type Week = keyof typeof weekList
type Span = 'daily' | 'weekly'

interface SettingEntity {
  id: string
  runAt: any
  title: string
  prevId: string
  templateId: string
}

interface PageEntity {
  results: any
  next_cursor: string | null
  has_more: boolean
}

interface PageEntity {
  archived: boolean
  parent: {
    type: string
    database_id: string
  }
  properties: {
    Datetime: {
      date: {
        start: string
        end: string
      }
    }
    Members: {
      id: string
      type: string
      people: string[]
    }
    Tags: {
      id: string
      type: string
      multi_select: string[]
    }
  }
}

const main = async () => {
  const settings = await fetchSettings()
  for (const setting of settings) {
    console.log('==== start creating page ========')
    const prevPage = await fetchPage(setting.prevId)
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
      await notifyErrorToSlack('テンプレートページが見つかりませんでした', title)
      console.log('[ERROR]template ID is empty.')
      continue
    }
    const templatePage = await fetchPage(setting.templateId)
    if (!templatePage) {
      await notifyErrorToSlack('テンプレートページが見つかりませんでした', title)
      console.log('[ERROR]template ID is invalid.')
      continue
    }
    if (templatePage.parent.type !== 'database_id' || !templatePage.parent.database_id) {
      await notifyErrorToSlack('親データベースIDが見つかりませんでした', title)
      console.log('[ERROR]parent database ID is invalid.')
      continue
    }
    const parentDbId = templatePage.parent.database_id
    const templateParams = templatePage.properties

    if (!templateParams) {
      await notifyErrorToSlack('テンプレートページの取得に失敗しました', title)
      console.log('[ERROR]template-params parse error.')
      continue
    }

    // テンプレートページを元に新しいページを作成する
    const newPageId = await createPage(setting, templateParams, parentDbId)
    if (newPageId === '') {
      await notifyErrorToSlack('新しいページが作成できませんでした', title)
      console.log('[ERROR]Failed creating new page.')
      continue
    }

    // 新しいページIDで設定を上書き
    await updatePrevId(setting.id, newPageId)
    const uri = `${domain}/${newPageId.replace(/-/g, '')}`
    try {
      await slack.send({
        text: `MTGノートを作成しました！\n[ *title:${title}* ]\nurl :point_right: https://${uri}\nnotion :point_right: notion://${uri}`,
      })
    } catch {
      // noop
    }
    console.log('==== finish creating page =========')
  }
}

const createPage = async (setting: SettingEntity, templateParams: any, parentDbId: string) => {
  try {
    templateParams['Datetime'] = {
      date: {
        start: setting.runAt.format('YYYY-MM-DDTHH:mm:ss+0900'),
      },
    }
    const page: any = await notion.pages.create({
      parent: { database_id: parentDbId },
      properties: templateParams,
    })
    return !page || Object.keys(page).length === 0 || !page['id'] ? '' : page['id']
  } catch (e) {
    console.log(e)
    return ''
  }
}

const fetchSettings = async () => {
  const target: SettingEntity[] = []
  let nextCursor = undefined
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pages: any = await notion.databases.query({
      // @ts-ignore
      database_id: settingDbId,
      filter: {
        and: [{ property: 'enable', checkbox: { equals: true } }],
      },
      start_cursor: nextCursor,
      page_size: 100,
    })
    if (!pages || Object.keys(pages).length === 0 || !pages['results']) {
      continue
    }
    const pgs: PageEntity = pages
    for (const p of pgs.results) {
      const id: string = p['id']
      if (domain === '') {
        const d = p['url'].split('/')
        domain = d[2]
      }
      const setting: SettingEntity = parseSettingEntity(id, p.properties)
      if (setting.runAt !== null) {
        target.push(setting)
      }
    }
    nextCursor = pages['next_cursor']
    if (!nextCursor) {
      return target
    }
  }
}

const parseNextRunAt = (span: Span, week: Week | null, hour: number, min: number): any => {
  const now = dayjs()

  if (span === 'daily') {
    return now.add(1, 'day').hour(hour).minute(min)
  }

  if (span === 'weekly') {
    // @ts-ignore
    let dateDiff = weekList[week] ? weekList[week] - now.day() : 0
    if (dateDiff < 0) {
      dateDiff = 7 + dateDiff
    }
    return now.add(dateDiff, 'day').hour(hour).minute(min)
  }

  return null
}

const parseSettingEntity = (id: string, properties: any): SettingEntity => {
  const span = parseSelect<Span>(properties['interval']) || 'weekly'
  const week = parseSelect<Week>(properties['week'])
  const hour: number = parseNumber(properties['hour'], 12)
  const min: number = parseNumber(properties['minute'], 0)
  const title: string = parseTitle(properties['title'], '議事録タイトル')
  const prevId: string = parseText(properties['previous_id'])
  const templateId: string = parseText(properties['template_id'])
  return {
    id: id,
    runAt: parseNextRunAt(span, week, hour, min),
    title: title,
    prevId: prevId,
    templateId: templateId,
  }
}

const updatePrevId = async (id: string, prevId: string) => {
  if (!prevId) {
    return
  }
  try {
    // @ts-ignore
    const page: { properties: { previous_id: { rich_text: { type: string; text: { content: string } }[] } } } =
      await notion.pages.update({
        page_id: id,
        properties: {
          // @ts-ignore
          previous_id: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: prevId,
                },
              },
            ],
          },
        },
      })
    return page && page.properties['previous_id']['rich_text'][0]['text']['content'] === prevId
  } catch {
    return
  }
}

const parseSelect = <T>(property: any): T | null => {
  if (!property || !property['select'] || typeof property['select']['name'] === 'undefined') {
    return null
  }
  return property['select']['name']
}

const parseNumber = (property: any, defaultValue = 0): number => {
  if (!property || typeof property['number'] === 'undefined') {
    return defaultValue
  }
  return property['number']
}

const parseTitle = (property: any, defaultValue = ''): string => {
  if (
    !property ||
    !property['title'] ||
    !property['title'][0] ||
    typeof property['title'][0]['plain_text'] === 'undefined'
  ) {
    return defaultValue
  }
  const text: string = property['title'][0]['plain_text']
  return text || defaultValue
}

const parseText = (property: any, defaultValue = ''): string => {
  if (
    !property ||
    !property['rich_text'] ||
    !property['rich_text'][0] ||
    !property['rich_text'][0]['text'] ||
    typeof property['rich_text'][0]['text']['content'] === 'undefined'
  ) {
    return defaultValue
  }
  const text: string = property['rich_text'][0]['text']['content']
  return text || defaultValue
}

const fetchPage = async (id: string) => {
  let page: any = null
  try {
    page = await notion.pages.retrieve({
      page_id: id,
    })
  } catch {
    return null
  }
  if (!page || Object.keys(page).length === 0) {
    return null
  }
  const p: PageEntity = page
  if (p.archived) {
    return null
  }

  return p
}

const notifyErrorToSlack = async (text: string, title: string) => {
  try {
    await slack.send({ text: `${text}:cry:\n[ *title:${title}* ]` })
  } catch {
    // noop
  }
}

main().catch((e) => {
  console.log(e)
})

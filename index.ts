import dotenv from 'dotenv'
import { Client, LogLevel } from '@notionhq/client/build/src'
import dayjs from 'dayjs'
import { IncomingWebhook } from '@slack/webhook'

dotenv.config()

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  logLevel: LogLevel.INFO,
})
const url: string = process.env.SLACK_WEBHOOK_URL || ''
const slack = new IncomingWebhook(url, { icon_emoji: ':notion:' })

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
type Span = 'monthly' | 'daily' | 'weekly'

interface SettingEntity {
  id: string
  runAt: any
  title: string
  isCreateFromPrevious: boolean
  prevId: string
  templateId: string
}

interface PageEntity {
  results: any
  next_cursor: string | null
  has_more: boolean
}

interface MeetingPageEntity {
  archived: boolean
  properties: {
    Datetime: {
      date: {
        start: string
        end: string
      }
    },
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

const settingDbId = ''
const dbId = ''

const main = async () => {
  const settings = await fetchSettings()
  for (const setting of settings) {
    console.log('==== crating meeting note ========')
    const prevPage = await fetchMeetingPage(setting.prevId)
    let prevRunAt = null
    if (prevPage !== null) {
      const datetimeProperty = prevPage.properties['Datetime']
      if (datetimeProperty && datetimeProperty['date'] && datetimeProperty['date']['start']) {
        prevRunAt = dayjs(datetimeProperty['date']['start'])
      }
    }

    // 実行対象が今日・明日のものだけを取得
    if (
      setting.runAt.format('YYYYMMDD') !== dayjs().format('YYYYMMDD')
      && setting.runAt.format('YYYYMMDD') !== dayjs().add(1, 'day').format('YYYYMMDD')
    ) {
      continue
    }
    console.log((!prevRunAt ? 'not set' : prevRunAt.format('YYYY-MM-DD HH:mm')), ' <=> ', setting.runAt.format('YYYY-MM-DD HH:mm'), 'isSame = ', prevRunAt !== null && setting.runAt.format('YYYYMMDDHHmm') === prevRunAt.format('YYYYMMDDHHmm'))
    // 日付と1つ前のIDから該当のページがすでに作成済みかどうか判定する
    if (prevRunAt !== null && setting.runAt.format('YYYYMMDDHHmm') === prevRunAt.format('YYYYMMDDHHmm')) {
      continue
    }
    const title: string = `${setting.title} ${setting.runAt.format('YYYY-MM-DD')}`

    // テンプレートページを取得・整形
    if (setting.templateId === '') {
      notifyErrorToSlack('テンプレートページが見つかりませんでした', title)
      console.log('[ERROR]template ID is empty.')
      continue
    }
    const templatePage = await fetchMeetingPage(setting.templateId)
    if (!templatePage) {
      notifyErrorToSlack('テンプレートページが見つかりませんでした', title)
      console.log('[ERROR]template ID is invalid.')
      continue
    }

    const templateParams = await parseTempatePage(templatePage)
    if (!templateParams) {
      notifyErrorToSlack('テンプレートページの取得に失敗しました', title)
      console.log('[ERROR]template-params parse error.')
      continue
    }

    // テンプレートページを元に新しいページを作成する
    const newPageId = await createMeetingPage(setting, templateParams, title)
    if (newPageId === '') {
      notifyErrorToSlack('新しいページが作成できませんでした', title)
      console.log('[ERROR]Failed creating new page.')
      continue
    }

    // 前回のブロック要素もしくはテンプレートページのブロック要素を抜き出して複製
    const fromId = setting.isCreateFromPrevious ? setting.prevId : setting.templateId
    await copyPageBlocks(fromId, newPageId)

    // 新しいページIDで設定を上書き
    await updatePrevId(setting.id, newPageId)
    const uri = `www.notion.so/pepabo/${newPageId.replace(/-/g, '')}`
    try {
      await slack.send(
        {
          text: `MTGノートを作成しました！\n[ *title:${title}* ]\nurl :point_right: https://${uri}\nnotion :point_right: notion://${uri}`
        }
      )
    } catch (e) {
      // noop
    }
    console.log('==== finish meeting note =========')
  }
}

const createMeetingPage = async (setting: SettingEntity, templateParams: { tags: { name: string }[], memberIds: { id: string }[] }, title: string) => {
  try {
    const properties = {
      // @ts-ignore
      Name: {
        title: [
          {
            type: 'text',
            text: {
              content: title,
            },
          },
        ],
      },
      // @ts-ignore
      'Tags': {
        // @ts-ignore
        multi_select: templateParams.tags
      },
      // @ts-ignore
      'Datetime': {
        date: {
          start: setting.runAt.format('YYYY-MM-DDTHH:mm:ss+0900'),
        }
      },
      // @ts-ignore
      Members: {
        // @ts-ignore
        people: templateParams.memberIds
      },
    }
    const page: any = await notion.pages.create({
      parent: { database_id: dbId },
      // @ts-ignore
      properties: properties
    })
    return (!page || Object.keys(page).length === 0 || !page['id']) ? '' : page['id']
  } catch (e) {
    console.log(e)
    return ''
  }
}

const fetchSettings = async () => {
  const target: SettingEntity[] = []
  let nextCursor = undefined
  while (true) {
    const pages: any = await notion.databases.query({
      database_id: settingDbId,
      filter: {
        and: [{ property: '有効', checkbox: { equals: true } }],
      },
      start_cursor: nextCursor,
      page_size: 100
    })
    if (!pages || Object.keys(pages).length === 0 || !pages['results']) {
      continue
    }
    const pgs: PageEntity = pages
    for (const p of pgs.results) {
      const id: string = p['id']
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

const parseNextRunAt = (span: Span, week: Week | null, day: number, hour: number, min: number): any => {
  const now = dayjs()

  if (span === 'monthly' && day > 0) {
    let target = dayjs().date(day)
    if (target <= now) {
      target = now.add(1, 'month').date(day)
    }
    return target.hour(hour).minute(min)
  }

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
  const span =  parseSelect<Span>(properties['実行間隔']) || 'monthly'
  const week = parseSelect<Week>(properties['曜日'])
  const day: number = parseNumber(properties['実行日'])
  const hour: number = parseNumber(properties['時間(時)'], 12)
  const min: number = parseNumber(properties['時間(分)'], 0)
  const title: string = parseTitle(properties['Meetingタイトル'], '議事録タイトル')
  const isCreateFromPrevious: boolean = parseBoolean(properties['前回の内容をコピー'], false)
  const prevId: string = parseText(properties['前回ID(システムで使用)'])
  const templateId: string = parseText(properties['テンプレートID'])
  return {
    id: id,
    runAt: parseNextRunAt(span, week, day, hour, min),
    title: title,
    isCreateFromPrevious: isCreateFromPrevious,
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
    const page: { properties: { '前回ID(システムで使用)': { rich_text: { type: string, text: { content: string } }[] } } } = await notion.pages.update({
      page_id: id,
      properties: {
        // @ts-ignore
        '前回ID(システムで使用)': {
          rich_text: [
            {
              type: 'text',
              text: {
                content: prevId,
              }
            }
          ]
        }
      }
    })
    return page && page.properties['前回ID(システムで使用)']['rich_text'][0]['text']['content'] === prevId
  } catch (e) {
    return
  }
}

const parseMultiSelect = (property: any): { name: string }[] => {
  if (!property || typeof property['multi_select'] === 'undefined') {
    return []
  }
  const tags = []
  const multiSelect: { name: string }[] = property['multi_select']
  for (const p of multiSelect) {
    tags.push({ name: p.name })
  }
  return tags
}

const parsePerson = (property: any): { id: string }[] => {
  if (!property || typeof property['people'] === 'undefined') {
    return []
  }
  const memberIds = []
  const person: { id: string }[] = property['people']
  for (const p of person) {
    memberIds.push({ id: p.id })
  }
  return memberIds
}

const parseSelect = <T>(property: any): T | null => {
  if (!property || !property['select'] || typeof property['select']['name'] === 'undefined') {
    return null
  }
  const text = property['select']['name']
  return text
}

const parseNumber = (property: any, defaultValue: number = 0): number => {
  if (!property || typeof property['number'] === 'undefined') {
    return defaultValue
  }
  return property['number']
}

const parseTitle = (property: any, defaultValue: string = ''): string => {
  if (!property || !property['title'] || !property['title'][0] || typeof property['title'][0]['plain_text'] === 'undefined') {
    return defaultValue
  }
  const text: string = property['title'][0]['plain_text']
  return text || defaultValue
}

const parseText = (property: any, defaultValue: string = ''): string => {
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

const parseBoolean = (property: any, defaultValue: boolean = false): boolean => {
  if (!property || typeof property['checkbox'] === 'undefined') {
    return defaultValue
  }
  return property['checkbox']
}

const fetchMeetingPage = async (id: string) => {
  let page: any = null
  try {
    page = await notion.pages.retrieve({
      page_id: id,
    })
  } catch (e) {
    return null
  }
  if (!page || Object.keys(page).length === 0) {
    return null
  }
  const p: MeetingPageEntity = page
  if (p.archived) {
    return null
  }

  return p
}

const parseTempatePage = async (templatePage: any) => {
  if (!templatePage) {
    return null
  }
  const t: { properties: { Tags: any, Members: any } } = templatePage
  const tags: { name: string }[] = parseMultiSelect(t.properties['Tags'])
  const memberIds: { id: string }[] = parsePerson(t.properties['Members'])
  return {
    tags: tags,
    memberIds: memberIds,
  }
}

const copyPageBlocks = async (fromId: string, toId: string) => {
  let nextCursor = undefined
  while (true) {
    let blocks: any = null
    try {
      blocks = await notion.blocks.children.list({
        block_id: fromId,
        page_size: 100,
        start_cursor: nextCursor,
      })
    } catch (e) {
      return
    }
    if (!blocks || Object.keys(blocks).length === 0 || !blocks['results']) {
      return
    }
    const blks: PageEntity = blocks
    const params = []

    // unsupportedなブロックは複製しない
    for (const b of blocks['results']) {
      if (b['type'] === 'unsupported') {
        continue
      }
      params.push(b)
    }

    try {
      await notion.blocks.children.append({
        block_id: toId,
        children: params,
      })
    } catch (e) {
      console.log(e)
      // noop
    }

    nextCursor = blks['next_cursor']
    if (!nextCursor) {
      return
    }
  }
}

const notifyErrorToSlack = async (text: string, title: string) => {
  try {
    await slack.send(
      {
        text: `${text}:cry:\n[ *title:${title}* ]`
      }
    )
  } catch (e) {
    // noop
  }
}

main()

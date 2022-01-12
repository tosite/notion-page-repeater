import { Client } from 'notion_sdk'
import { parseSettingEntry } from './parser.ts'
import { SettingEntity, SettingEntry, PageEntity } from './interface.ts'

export const createPage = async (notion: Client, setting: SettingEntry, templateParams: any, parentDbId: string) => {
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
    console.log(`[ERROR]createPage - code: ${e.code}, message: ${e.message}`)
    throw e
  }
}

export const fetchSettings = async (notion: Client, databaseId: string): Promise<SettingEntity> => {
  const target: SettingEntry[] = []
  let nextCursor = undefined
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pages: any = await notion.databases.query({
      database_id: databaseId,
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
    let domain = ''
    for (const p of pgs.results) {
      const id: string = p['id']
      if (domain === '') {
        domain = new URL(p['url']).host
      }
      const setting = parseSettingEntry(id, p.properties)
      if (setting.runAt !== null) {
        target.push(setting)
      }
    }
    nextCursor = pages['next_cursor']
    if (!nextCursor) {
      return {
        domain,
        entries: target,
      }
    }
  }
}

export const updatePrevId = async (notion: Client, id: string, prevId: string) => {
  if (!prevId) {
    return
  }
  try {
    // @ts-ignore
    const page: {
      properties: {
        previous_id: {
          rich_text: { type: string; text: { content: string } }[]
        }
      }
    } = await notion.pages.update({
      page_id: id,
      properties: {
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

export const fetchPage = async (notion: Client, id: string) => {
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

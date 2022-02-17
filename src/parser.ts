import dayjs from 'dayjs'
import {Span, Week, weekList} from './interface.ts'
import {SettingEntry} from './interface.ts'

export const parseNextRunAt = (span: Span, week: Week | null, hour: number, min: number, now?: string): any => {
  const n = now ? dayjs(now) : dayjs()

  if (span === 'daily') {
    return n.add(1, 'day').hour(hour).minute(min)
  }

  // weekly
  let dateDiff = week && weekList[week] ? weekList[week] - n.day() : 0
  if (dateDiff < 0) {
    dateDiff = 7 + dateDiff
  }
  return n.add(dateDiff, 'day').hour(hour).minute(min)
}

export const parseSelect = <T>(property: any): T | null => {
  if (!property || !property['select'] || typeof property['select']['name'] === 'undefined') {
    return null
  }
  return property['select']['name']
}

export const parseNumber = (property: any, defaultValue = 0): number => {
  if (!property || typeof property['number'] === 'undefined') {
    return defaultValue
  }
  return property['number']
}

export const parseTitle = (property: any, defaultValue = ''): string => {
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

export const parseText = (property: any, defaultValue = ''): string => {
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

export const parseSettingEntry = (id: string, properties: any): SettingEntry => {
  const span = parseSelect<Span>(properties['interval']) || 'weekly'
  const week = parseSelect<Week>(properties['week'])
  const hour: number = parseNumber(properties['hour'], 12)
  const min: number = parseNumber(properties['minute'], 0)
  const title: string = parseTitle(properties['title'], '議事録タイトル')
  const prevId: string = parseText(properties['previous_id'])
  const templateId: string = parseText(properties['template_id'])

  return {
    id,
    runAt: parseNextRunAt(span, week, hour, min),
    title: title,
    prevId: prevId,
    templateId: templateId,
  }
}

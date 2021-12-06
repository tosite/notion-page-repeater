export const weekList = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}
export type Week = keyof typeof weekList
export type Span = 'daily' | 'weekly'

export interface SettingEntry {
  id: string
  runAt: any
  title: string
  prevId: string
  templateId: string
}

export interface SettingEntity {
  domain: string
  entries: SettingEntry[]
}

export interface PageEntity {
  results: any
  // deno-lint-ignore camelcase
  next_cursor: string | null
  // deno-lint-ignore camelcase
  has_more: boolean
}

export interface PageEntity {
  archived: boolean
  parent: {
    type: string
    // deno-lint-ignore camelcase
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
      // deno-lint-ignore camelcase
      multi_select: string[]
    }
  }
}

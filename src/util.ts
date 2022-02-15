import dayjs from 'dayjs'

export const okMessage = (text: string) => ({text: `✅ ${text}`})
export const ngMessage = (text: string, title: string) => ({
  text: [`⛔ ${text}`, `[ *title:${title}* ]`].join('\n'),
})

export const isTarget = (target: string, now: string, previous: string|null|undefined, skipHoliday: boolean): boolean => {
  const t = dayjs(target)
  const n = dayjs(now)
  const p = !previous ? null : dayjs(previous)

  if (skipHoliday && ([0, 6].includes(t.day()) || [0, 6].includes(n.day()))) {
    console.log('[SKIP]today is holiday.')
    return false
  }

  if (
    t.format('YYYYMMDD') !== n.format('YYYYMMDD') &&
    t.format('YYYYMMDD') !== n.add(1, 'day').format('YYYYMMDD')
  ) {
    console.log('[SKIP]day has not come yet.')
    return false
  }

  if (p !== null && t.format('YYYYMMDD') === p.format('YYYYMMDD')) {
    console.log('[SKIP]page is already exist.')
    return false
  }
  return true
}

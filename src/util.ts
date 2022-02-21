import dayjs from 'dayjs'

export const okMessage = (text: string) => ({text: `✅ ${text}`})
export const ngMessage = (text: string, title: string) => ({
  text: [`⛔ ${text}`, `[ *title:${title}* ]`].join('\n'),
})

export const isTarget = (target: string, now: string, previous: string | null | undefined, skipHoliday: boolean): boolean => {
  const t = dayjs(target)
  const n = dayjs(now)
  const p = !previous ? null : dayjs(previous)

  const f = 'YYYY-MM-DD HH:mm:ss'
  console.log(`  isTarget: today = ${n.format(f)}, target = ${t.format(f)}, previous = ${!p ? 'null' : p.format(f)}`)

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

export const sanitizeProperties = (templateParams: { [index: string]: any }, title: string): { [index: string]: any } => {
  const unsafeTypes = [
    'created_time',
    'last_edited_time',
    'created_by',
    'last_edited_by',
    'formula',
    'rollup',
    'relation',
  ]
  let safeParams: { [index: string]: any } = {}
  let rawKeys = []
  let safeKeys = []
  for (const [key, value] of Object.entries(templateParams)) {
    const property: { type: string } = value
    rawKeys.push(`${key} => ${property?.type}`)
    if (!unsafeTypes.includes(property?.type)) {
      safeKeys.push(`${key} => ${property?.type}`)
      safeParams[key] = property
      if (property?.type === 'title') {
        safeParams[key]['title'][0]['plain_text'] = title
        safeParams[key]['title'][0]['text']['content'] = title
      }
    }
  }
  console.log(`  raw keys = ${rawKeys.join(', ')}, safe keys = ${safeKeys.join(', ')}`)
  return safeParams
}

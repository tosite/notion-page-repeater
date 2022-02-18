import {assertEquals} from 'testing/asserts.ts'
import {parseNextRunAt, parseNumber, parseSelect, parseTitle} from './parser.ts';

Deno.test('parseNextRunAt dailyの場合 1日後の日付が返ってくること', () => {
  const res = parseNextRunAt('daily', null, 14, 30, '20220101')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-02 14:30')
})

// weekly 単数
Deno.test('parseNextRunAt weeklyの場合 まだ対象曜日を迎えていない場合 今週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', ['Fri'], 14, 30, '20220103')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 対象曜日が当日の場合 今週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', ['Fri'], 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 すでに対象曜日を迎えた場合 来週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', ['Mon'], 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-10 14:30')
})

// weekly 複数
Deno.test('parseNextRunAt weeklyの場合 まだ対象曜日を迎えていない場合 今週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', ['Wed', 'Fri'], 14, 30, '20220103')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-05 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 対象曜日が当日の場合 今週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', ['Wed', 'Fri'], 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 すでに対象曜日を迎えた場合 来週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', ['Mon', 'Wed'], 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-10 14:30')
})

Deno.test('parseSelect パースに失敗した場合 nullが返ってくること', () => {
  const testCases = [
    undefined,
    null,
    {select: null},
    {select: {undefined: ''}},
  ]
  for (const testCase of testCases) {
    const res = parseSelect(testCase)
    assertEquals(res, null)
  }
})

Deno.test('parseSelect パースに成功した場合 値が返ってくること', () => {
  const res = parseSelect({select: {name: 'select'}})
  assertEquals(res, 'select')
})

Deno.test('parseNumber パースに失敗した場合 デフォルト値を指定しない場合 デフォルト値が返ってくること', () => {
  const testCases = [
    undefined,
    null,
    {undefined: null},
  ]
  for (const testCase of testCases) {
    const res = parseNumber(testCase)
    assertEquals(res, 0)
  }
})

Deno.test('parseNumber パースに失敗した場合 デフォルト値を指定する場合 デフォルト値が返ってくること', () => {
  const testCases = [
    undefined,
    null,
    {undefined: null},
  ]
  for (const testCase of testCases) {
    const res = parseNumber(testCase, 10)
    assertEquals(res, 10)
  }
})

Deno.test('parseNumber パースに成功した場合 値が返ってくること', () => {
  const res = parseNumber({number: 100})
  assertEquals(res, 100)
})

Deno.test('parseTitle パースに失敗した場合 デフォルト値を指定しない場合 デフォルト値が返ってくること', () => {
  const testCases = [
    undefined,
    null,
    {title: null},
    {title: []},
    {title: [{undefined: ''}]},
  ]
  for (const testCase of testCases) {
    const res = parseTitle(testCase)
    assertEquals(res, '')
  }
})

Deno.test('parseTitle パースに失敗した場合 デフォルト値を指定した場合 デフォルト値が返ってくること', () => {
  const testCases = [
    undefined,
    null,
    {title: null},
    {title: []},
    {title: [{undefined: ''}]},
  ]
  for (const testCase of testCases) {
    const res = parseTitle(testCase, 'default')
    assertEquals(res, 'default')
  }
})

Deno.test('parseTitle パースに失敗した場合 デフォルト値を指定した場合 デフォルト値が返ってくること', () => {
  const res = parseTitle({title: [{plain_text: 'title text'}]})
  assertEquals(res, 'title text')
})

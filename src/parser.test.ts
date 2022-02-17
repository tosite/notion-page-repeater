import {assertEquals} from 'testing/asserts.ts'
import {parseNextRunAt} from './parser.ts';

Deno.test('parseNextRunAt dailyの場合 1日後の日付が返ってくること', () => {
  const res = parseNextRunAt('daily', null, 14, 30, '20220101')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-02 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 まだ対象曜日を迎えていない場合 今週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', 'Fri', 14, 30, '20220103')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 対象曜日が当日の場合 今週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', 'Fri', 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 すでに対象曜日を迎えた場合 来週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', 'Mon', 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-10 14:30')
})

Deno.test('parseNextRunAt weeklyの場合 すでに対象曜日を迎えた場合 来週の日付が返ってくること', () => {
  const res = parseNextRunAt('weekly', 'Mon', 14, 30, '20220107')
  assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-10 14:30')
})

import {assertEquals} from 'testing/asserts.ts'
import {parseNextRunAt, parseNumber, parseSelect, parseTitle} from './parser.ts';
import {describe, it} from 'TestSuite'

describe("parseNextRunAt#daily", () => {
  it("1日後の日付が返ってくること", () => {
    const res = parseNextRunAt('daily', null, 14, 30, '20220101')
    assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-02 14:30')
  })
})

//  Sun  Mon  Tue  Wed  Thu  Fri  Sat
//  1/2  1/3  1/4  1/5  1/6  1/7  1/8
//  1/9 1/10 1/11 1/12 1/13 1/14 1/15
// 1/16  ...  ...  ...  ...  ...  ...
describe("parseNextRunAt#weekly 単数曜日を指定した場合", () => {
  describe("まだ対象日を迎えていない場合", () => {
    it("今週の日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', ['Fri'], 14, 30, '20220103')
      assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
    })
  })

  describe("対象曜日が当日の場合", () => {
    it("今週の日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', ['Fri'], 14, 30, '20220107')
      assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
    })
  })

  describe("すでに対象曜日を迎えた場合", () => {
    it("来週の日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', ['Mon'], 14, 30, '20220107')
      assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-10 14:30')
    })
  })

  describe("対象曜日にnullが渡された場合", () => {
    it("来週の日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', null, 14, 30, '20220107')
      assertEquals(res, null)
    })
  })
})

describe("parseNextRunAt#weekly 複数曜日を指定した場合", () => {
  describe("開催予定日が全て未来日である場合", () => {
    it("一番近い今週の日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', ['Wed', 'Fri'], 14, 30, '20220103')
      assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-05 14:30')
    })
  })

  describe("開催予定日のうち過去日が含まれる場合", () => {
    it("未来の開催日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', ['Wed', 'Fri'], 14, 30, '20220107')
      assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-07 14:30')
    })
  })

  describe("開催予定日が全て過去日である場合", () => {
    it("一番近い来週の日付が返ってくること", () => {
      const res = parseNextRunAt('weekly', ['Mon', 'Wed'], 14, 30, '20220107')
      assertEquals(res.format('YYYY-MM-DD HH:mm'), '2022-01-10 14:30')
    })
  })
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

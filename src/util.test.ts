import { assertEquals } from 'testing/asserts.ts'
import {okMessage, ngMessage, isTarget} from './util.ts'

Deno.test('okMessage', () => {
  const res = okMessage('dummy')
  assertEquals(res.text, '✅ dummy')
})

Deno.test('ngMessage', () => {
  const res = ngMessage('dummyMsg', 'dummyTitle')
  assertEquals(res.text, '⛔ dummyMsg\n[ *title:dummyTitle* ]')
})

// 休日スキップフラグON
Deno.test('休日スキップフラグがON 実行日が休日 作成予定日が休日 処理がスキップされること', () => {
  const res = isTarget('20220101', '20220101', null, true)
  assertEquals(res, false)
})

Deno.test('休日スキップフラグがON 実行日が平日 作成予定日が平日 作成予定日の2日前 処理がスキップされること', () => {
  const res = isTarget('20220107', '20220105', null, true)
  assertEquals(res, false)
})

Deno.test('休日スキップフラグがON 実行日が平日 作成予定日が平日 作成予定日の1日前 処理がスキップされないこと', () => {
  const res = isTarget('20220107', '20220106', null, true)
  assertEquals(res, true)
})

Deno.test('休日スキップフラグがON 実行日が平日 作成予定日が休日 作成予定日の1日後 処理がスキップされること', () => {
  const res = isTarget('20220107', '20220108', null, true)
  assertEquals(res, false)
})

// 休日スキップフラグOFF
Deno.test('休日スキップフラグがOFF 実行日が休日 作成予定日が平日 作成予定日の1日前 処理がスキップされないこと', () => {
  const res = isTarget('20220110', '20220109', null, false)
  assertEquals(res, true)
})

Deno.test('休日スキップフラグがOFF 実行日が休日 作成予定日が休日 処理がスキップされないこと', () => {
  const res = isTarget('20220101', '20220101', null, false)
  assertEquals(res, true)
})

Deno.test('休日スキップフラグがOFF 実行日が平日 作成予定日が平日 作成予定日の2日前 処理がスキップされること', () => {
  const res = isTarget('20220107', '20220105', null, false)
  assertEquals(res, false)
})

Deno.test('休日スキップフラグがOFF 実行日が平日 作成予定日が平日 作成予定日の1日前 処理がスキップされないこと', () => {
  const res = isTarget('20220107', '20220106', null, false)
  assertEquals(res, true)
})

Deno.test('休日スキップフラグがOFF 実行日が平日 作成予定日が休日 作成予定日の1日後 処理がスキップされること', () => {
  const res = isTarget('20220107', '20220108', null, false)
  assertEquals(res, false)
})

Deno.test('休日スキップフラグがOFF 実行日が休日 作成予定日が平日 作成予定日の1日前 処理がスキップされないこと', () => {
  const res = isTarget('20220110', '20220109', null, false)
  assertEquals(res, true)
})

// その他テスト
Deno.test('前回実行日と次回実行日が同じ場合 作成予定日の1日前 処理がスキップされること', () => {
  const res = isTarget('20220107', '20220106', '20220107', false)
  assertEquals(res, false)
})

Deno.test('前回実行日がundefinedの場合 作成予定日の1日前 処理がスキップされないこと', () => {
  const res = isTarget('20220107', '20220106', undefined, false)
  assertEquals(res, true)
})

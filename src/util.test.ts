import {assertEquals} from 'testing/asserts.ts'
import {okMessage, ngMessage, isTarget, sanitizeProperties} from './util.ts'

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

Deno.test('コピーできないパラメータが含まれる場合 サニタイズされること', () => {
  const params = {
    "created time": {type: 'created_time', created_time: '2022-01-01T00:00:00:00.000Z'},
    "last edited time": {type: 'last_edited_time', last_edited_time: '2022-01-01T00:00:00:00.000Z'},
    "created by": {type: 'created_by', created_by: {object: 'user', name: 'user'}},
    "last edited by": {type: 'last_edited_by', last_edited_by: {object: 'user', name: 'user'}},
    "formula": {type: 'formula', formula: {type: 'string', string: 'test'}},
    "rollup": {type: 'rollup', rollup: {type: 'date', date: 'null', function: 'earliest_date'}},
    "relation": {type: 'relation', relation: []},
  }
  const rawKeys = [
    '',
    'created time => created_time',
    'last edited time => last_edited_time',
    'created by => created_by',
    'last edited by => last_edited_by',
    'formula => formula',
    'rollup => rollup',
    'relation => relation',
  ].join("\n")
  const safeKeys = [].join("\n")

  const res = sanitizeProperties(params, 'page title')

  assertEquals(res.safeParams, {})
  assertEquals(res.rawKeys, rawKeys)
  assertEquals(res.safeKeys, safeKeys)
})

Deno.test('コピーできるパラメータが含まれる場合 サニタイズされること', () => {
  const params = {
    "created time": {type: 'created_time', created_time: '2022-01-01T00:00:00:00.000Z'},
    "last edited time": {type: 'last_edited_time', last_edited_time: '2022-01-01T00:00:00:00.000Z'},
    "created by": {type: 'created_by', created_by: {object: 'user', name: 'user'}},
    "last edited by": {type: 'last_edited_by', last_edited_by: {object: 'user', name: 'user'}},
    "formula": {type: 'formula', formula: {type: 'string', string: 'test'}},
    "rollup": {type: 'rollup', rollup: {type: 'date', date: 'null', function: 'earliest_date'}},
    "relation": {type: 'relation', relation: []},
    "safe param": {type: 'multi_select', multi_select: [{name: 'select', color: 'orange'}]},
    "title": {type: 'title', title: [{type: 'text', text: {'content': 'meeting title'}, plain_text: 'meeting title'}]},
  }
  const rawKeys = [
    '',
    'created time => created_time',
    'last edited time => last_edited_time',
    'created by => created_by',
    'last edited by => last_edited_by',
    'formula => formula',
    'rollup => rollup',
    'relation => relation',
    'safe param => multi_select',
    'title => title',
  ].join("\n")
  const safeKeys = ['', 'safe param => multi_select', 'title => title'].join("\n")
  const expect = {
    "safe param": {type: 'multi_select', multi_select: [{name: 'select', color: 'orange'}]},
    "title": {type: 'title', title: [{type: 'text', text: {'content': 'page title'}, plain_text: 'page title'}]}  }

  const res = sanitizeProperties(params, 'page title')

  assertEquals(res.safeParams, expect)
  assertEquals(res.rawKeys, rawKeys)
  assertEquals(res.safeKeys, safeKeys)
})

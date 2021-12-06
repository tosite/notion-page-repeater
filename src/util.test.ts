import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { okMessage, ngMessage } from './util.ts'

Deno.test('okMessage', () => {
  const res = okMessage('dummy')
  assertEquals(res.text, '✅ dummy')
})

Deno.test('ngMessage', () => {
  const res = ngMessage('dummyMsg', 'dummyTitle')
  assertEquals(res.text, '⛔ dummyMsg\n[ *title:dummyTitle* ]')
})

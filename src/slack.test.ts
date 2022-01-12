import { assertThrows } from 'testing/asserts.ts'
import { spy, assertSpyCall } from 'mock'
import { Slack } from './slack.ts'
Deno.test('throws error, when webhook url is empty', () => {
  assertThrows(() => new Slack({ url: '' }), Error, 'Slack Incoming Webhook URL is empty')
})
Deno.test('send, calls fetch API', () => {
  const mock = spy()
  const slack = new Slack({ url: 'dummy', fetcher: mock })
  slack.send({ text: 'dummy' })
  assertSpyCall(mock, 0, {
    args: [
      'dummy',
      {
        method: 'post',
        body: '{"blocks":[{"type":"section","text":{"type":"mrkdwn","text":"dummy"}}]}',
      },
    ],
  })
})

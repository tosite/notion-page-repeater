export class Slack {
  private webhookUrl: string
  private fetcher = fetch

  constructor(arg: { url?: string; fetcher?: typeof fetch }) {
    if (!arg.url) {
      throw Error('Slack Incoming Webhook URL is empty')
    }
    this.webhookUrl = arg.url

    if (arg.fetcher) {
      this.fetcher = arg.fetcher
    }
  }

  async send(arg: { text?: string }) {
    const payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: arg.text,
          },
        },
      ],
    }
    await this.fetcher(this.webhookUrl, {
      method: 'post',
      body: JSON.stringify(payload),
    })
  }
}

export class Slack {
  private webhookUrl: string

  constructor(url?: string) {
    if (!url) {
      throw 'Slack Incoming Webhook URL is empty'
    }
    this.webhookUrl = url
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
    await fetch(this.webhookUrl, {
      method: 'post',
      body: JSON.stringify(payload),
    })
  }
}

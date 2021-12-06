export const okMessage = (text: string) => ({ text: `✅ ${text}` })
export const ngMessage = (text: string, title: string) => ({
  text: [`⛔ ${text}`, `[ *title:${title}* ]`].join('\n'),
})

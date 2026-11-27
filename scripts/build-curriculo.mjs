/*
  Gera o PDF do currículo a partir de curriculo/curriculo.html, com o Chrome em
  modo headless (DevTools Protocol → Page.printToPDF, A4, com fundo).

  uso: node scripts/build-curriculo.mjs [saida.pdf] [--png previa.png]
       padrão: public/curriculo-heitor-mota.pdf (o que os botões do site baixam)
  Chrome: procura nos caminhos comuns; ou defina CHROME_PATH.
*/
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const pngAt = args.indexOf('--png')
const png = pngAt >= 0 ? resolve(args[pngAt + 1]) : null
const out = resolve(args.find((a, i) => !a.startsWith('--') && i !== pngAt + 1) ?? join(ROOT, 'public', 'curriculo-heitor-mota.pdf'))
const html = pathToFileURL(join(ROOT, 'curriculo', 'curriculo.html')).href

const chromePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p))
if (!chromePath) throw new Error('Chrome não encontrado — defina CHROME_PATH')

const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cv-'))}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  let ws
  for (let i = 0; i < 60 && !ws; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      ws = pages.find((p) => p.type === 'page')?.webSocketDebuggerUrl
    } catch {}
    if (!ws) await sleep(250)
  }
  const sock = new WebSocket(ws)
  await new Promise((r) => (sock.onopen = r))
  let id = 0
  const pending = new Map()
  sock.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) pending.get(m.id)(m)
  }
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id
      pending.set(i, r)
      sock.send(JSON.stringify({ id: i, method, params }))
    })

  // A4 a 96 dpi: 794 × 1123 px
  await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 2, mobile: false })
  await send('Page.navigate', { url: html })
  for (let i = 0; i < 80; i++) {
    const r = await send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true })
    if (r.result?.result?.value) break
    await sleep(250)
  }
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 })
  writeFileSync(out, Buffer.from(pdf.result.data, 'base64'))
  console.log('PDF:', out)
  if (png) {
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(png, Buffer.from(shot.result.data, 'base64'))
    console.log('prévia:', png)
  }
  sock.close()
} finally {
  chrome.kill()
}

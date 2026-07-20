import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const base = process.env.PROMPTOPS_URL || 'http://127.0.0.1:18182'
let server
const available = async () => { try { return (await fetch(base)).ok } catch { return false } }
if (!await available()) {
  const port = new URL(base).port || '18182'
  server = spawn('pnpm', ['-F', '@prompt-optimizer/web', 'dev', '--port', port, '--force'], { stdio: 'ignore', shell: true })
  for (let index = 0; index < 60 && !await available(); index += 1) await new Promise(resolve => setTimeout(resolve, 500))
  if (!await available()) throw new Error('Web server did not start')
}

const browser = await chromium.launch({ headless: true })
let page
try {
  page = await browser.newPage()
  await page.addInitScript(() => sessionStorage.setItem('promptops.e2e.mock', 'success'))
  for (const [name, path, expected] of [['Playground','/#/playground','Prompt Playground'],['History','/#/invocations','Invocation History'],['Not Found','/#/invocations/not-found','Invocation not found']]) {
    await page.goto(base + path)
    await page.getByText(expected, { exact: false }).first().waitFor()
    console.log(`[PASS] ${name}`)
  }
  await page.goto(base + '/#/playground')
  await page.locator('.selectors select').first().selectOption({ index: 1 })
  await page.locator('.selectors select').nth(1).waitFor()
  for (const input of await page.locator('.stack').first().locator('input[type=text],textarea').all()) await input.fill('E2E value')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await page.getByText('{"mock":true}', { exact: true }).waitFor()
  await page.getByText('12', { exact: true }).waitFor()
  console.log('[PASS] Mock invocation output, tokens and persistence')
  await page.getByText('Open Invocation Detail').click()
  await page.getByText('Raw Output').waitFor()
  await page.reload()
  await page.getByText('Raw Output').waitFor()
  console.log('[PASS] Invocation detail survives reload')
  await page.goto(base + '/#/playground')
  await page.locator('.selectors select').first().selectOption({ index: 1 })
  await page.getByText('is required', { exact: false }).first().waitFor()
  for (const input of await page.locator('.stack').first().locator('input[type=text],textarea').all()) await input.fill('Failure value')
  await page.getByText('is required', { exact: false }).first().waitFor({ state: 'hidden' })
  await page.evaluate(() => sessionStorage.setItem('promptops.e2e.mock', 'failure'))
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await page.getByText('Mock provider failure', { exact: false }).first().waitFor()
  await page.goto(base + '/#/invocations')
  await page.getByText('failed', { exact: true }).first().waitFor()
  console.log('[PASS] Mock failure persisted')
  console.log('[PromptOps E2E] Phase 3 invocation checks passed. Real paid APIs were not called.')
} catch (error) {
  if (page) await page.screenshot({ path: 'test-results/promptops-phase3-failure.png', fullPage: true })
  throw error
} finally {
  await browser.close()
  if (server) server.kill()
}

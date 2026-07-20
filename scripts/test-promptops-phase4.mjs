import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const base = process.env.PROMPTOPS_URL || 'http://127.0.0.1:18185'
let server
const available = async () => { try { return (await fetch(base)).ok } catch { return false } }
if (!await available()) {
  const port = new URL(base).port || '18185'
  server = spawn('pnpm', ['-F', '@prompt-optimizer/web', 'dev', '--port', port, '--force'], { stdio: 'ignore', shell: true })
  for (let index = 0; index < 90 && !await available(); index++) await new Promise(resolve => setTimeout(resolve, 500))
  if (!await available()) throw new Error('Phase 4 E2E web server did not start')
}
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'en-US' })
await context.addInitScript(() => sessionStorage.setItem('promptops.e2e.mock', 'batch'))
const page = await context.newPage()
page.on('dialog', dialog => dialog.accept())
const button = name => page.getByRole('button', { name: new RegExp(name, 'i') })
const addCase = async (name, variables, required = '') => {
  await button('Add Test Case').click()
  await page.getByLabel('Dataset Name').fill(name)
  await page.getByLabel(/Variables/).fill(JSON.stringify(variables))
  if (required) await page.getByLabel('Required Keywords').fill(required)
  await button('Save').click()
  await page.getByText(name, { exact: true }).waitFor()
}
try {
  const datasetName = `Phase 4 Batch ${Date.now()}`
  await page.goto(`${base}/#/datasets`)
  await button('Create Dataset').click()
  await page.getByLabel('Dataset Name').fill(datasetName)
  await button('Save').click()
  await addCase('Successful case', { customer_name: 'Ada', complaint_content: 'hello' }, 'mock')
  await addCase('Provider failure', { customer_name: 'Ada', complaint_content: 'MOCK_PROVIDER_FAILURE' })
  await addCase('Skipped input', { customer_name: 'Ada' })
  await button('Run Evaluation').click()
  const promptSelect = page.getByLabel('Select Prompt')
  const promptValue = await promptSelect.locator('option', { hasText: 'Customer Complaint Response' }).getAttribute('value')
  if (!promptValue) throw new Error('Customer Complaint Response prompt option was not found')
  await promptSelect.selectOption(promptValue)
  await page.getByLabel('Select Version').waitFor()
  await page.waitForTimeout(100)
  if (await promptSelect.inputValue() !== promptValue) throw new Error('Prompt selection did not persist')
  await page.getByLabel('Concurrency').fill('2')
  await button('Start Evaluation').click()
  await page.waitForURL(/#\/evaluations\/[^/]+$/)
  await page.getByText(/Completed with Errors/, { exact: true }).waitFor({ timeout: 20000 })
  await page.getByText('Successful case', { exact: true }).waitFor()
  await page.getByText('Provider failure', { exact: true }).waitFor()
  await page.getByText('Skipped input', { exact: true }).waitFor()
  const originalUrl = page.url()
  await page.reload()
  await page.getByText(/Completed with Errors/, { exact: true }).waitFor()
  if (page.url() !== originalUrl) throw new Error('Evaluation detail was not preserved after reload')
  await page.locator('tbody tr', { hasText: 'Successful case' }).getByRole('button', { name: 'View' }).click()
  await page.getByText('Open Invocation Detail').waitFor()
  await page.getByRole('button', { name: '×' }).click()
  await button('Retry Failed').click()
  await page.waitForURL(url => url.toString() !== originalUrl)
  await page.goto(`${base}/#/evaluations`)
  await page.getByRole('heading', { name: 'Evaluation History' }).waitFor()
  await page.getByText(datasetName).first().waitFor()
  if (await page.locator('tbody tr').count() < 2) throw new Error('Retry did not create a new run')
  console.log('[PromptOps E2E] Phase 4 mock batch evaluation checks passed. No real model API was called.')
} catch (error) {
  console.error('[Phase 4 E2E URL]', page.url())
  console.error('[Phase 4 E2E body]', (await page.locator('body').innerText().catch(() => '')).slice(0, 3000))
  await page.screenshot({ path: 'test-results/promptops-phase4-failure.png', fullPage: true }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
  if (server) server.kill()
}

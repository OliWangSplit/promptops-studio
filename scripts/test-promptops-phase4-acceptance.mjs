import { spawn, spawnSync } from 'node:child_process'
import { chromium } from 'playwright'

const base = process.env.PROMPTOPS_URL || 'http://127.0.0.1:18181'
let server
const available = async () => { try { return (await fetch(base)).ok } catch { return false } }
if (!await available()) {
  const port = new URL(base).port || '18181'
  server = spawn('pnpm', ['-F', '@prompt-optimizer/web', 'dev', '--port', port, '--force'], { stdio: 'ignore', shell: true })
  for (let index = 0; index < 90 && !await available(); index++) await new Promise(resolve => setTimeout(resolve, 500))
  if (!await available()) throw new Error('Phase 4 acceptance web server did not start')
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'en-US' })
await context.addInitScript(() => sessionStorage.setItem('promptops.e2e.mock', 'acceptance'))
const page = await context.newPage()
page.on('dialog', dialog => dialog.accept())
const button = name => page.getByRole('button', { name: new RegExp(name, 'i') })
const row = name => page.locator('tbody tr', { hasText: name })
const addCase = async (name, variables, required = '') => {
  await button('Add Test Case').click()
  await page.getByLabel('Dataset Name').fill(name)
  await page.getByLabel(/Variables/).fill(JSON.stringify(variables))
  if (required) await page.getByLabel('Required Keywords').fill(required)
  await button('Save').click()
  await page.getByText(name, { exact: true }).waitFor()
}
const selectCustomerPrompt = async () => {
  const select = page.getByLabel('Select Prompt')
  const value = await select.locator('option', { hasText: 'Customer Complaint Response' }).getAttribute('value')
  if (!value) throw new Error('Customer Complaint Response prompt was not found')
  await select.selectOption(value)
  await page.waitForTimeout(100)
}
const waitCompleted = async () => page.getByText('Completed with Errors', { exact: true }).waitFor({ timeout: 30000 })

try {
  const datasetName = `Phase 4 Acceptance ${Date.now()}`
  await page.goto(`${base}/#/datasets`)
  await button('Create Dataset').click()
  await page.getByLabel('Dataset Name').fill(datasetName)
  await button('Save').click()

  await addCase('Normal success', { customer_name: 'Ada', complaint_content: 'normal request' }, 'mock')
  await addCase('Missing required variable', { customer_name: 'Ada' })
  await addCase('Rule validation failure', { customer_name: 'Ada', complaint_content: 'MOCK_CONTAINS_FAIL' }, 'required-never-returned')
  await addCase('Provider failure', { customer_name: 'Ada', complaint_content: 'MOCK_PROVIDER_FAILURE' })
  await addCase('Token unavailable', { customer_name: 'Ada', complaint_content: 'MOCK_TOKEN_UNAVAILABLE' }, 'mock')
  await addCase('Delayed case', { customer_name: 'Ada', complaint_content: 'MOCK_DELAY' }, 'mock')

  await button('Run Evaluation').click()
  await selectCustomerPrompt()
  await page.getByLabel('Concurrency').fill('2')
  await button('Start Evaluation').click()
  await page.waitForURL(/#\/evaluations\/[^/]+$/)
  const originalRunUrl = page.url()
  await waitCompleted()

  await row('Normal success').getByText('Succeeded', { exact: true }).waitFor()
  await row('Rule validation failure').getByText('Succeeded', { exact: true }).waitFor()
  await row('Rule validation failure').getByText(/✕/).waitFor()
  await row('Provider failure').getByText('Failed', { exact: true }).waitFor()
  await row('Missing required variable').getByText('Skipped', { exact: true }).waitFor()
  await row('Token unavailable').getByText('—', { exact: true }).last().waitFor()
  await page.getByText('Total Cost: —', { exact: true }).waitFor()

  await row('Normal success').getByRole('button', { name: 'View' }).click()
  const invocationLink = page.getByText('Open Invocation Detail', { exact: true })
  await invocationLink.waitFor()
  await invocationLink.click()
  await page.getByText('Raw Output').waitFor()
  await page.goto(originalRunUrl)
  await waitCompleted()

  await row('Delayed case').getByRole('button', { name: 'View' }).click()
  await button('Retry Case').click()
  await page.waitForURL(url => url.toString() !== originalRunUrl)
  const interruptedRunUrl = page.url()
  await page.getByText('Running', { exact: true }).first().waitFor({ timeout: 10000 })
  await page.reload()
  await page.getByText('Completed with Errors', { exact: true }).waitFor({ timeout: 15000 })
  await row('Delayed case').getByText('Failed', { exact: true }).waitFor()

  await page.goto(originalRunUrl)
  await waitCompleted()
  await button('Retry Failed').click()
  await page.waitForURL(url => ![originalRunUrl, interruptedRunUrl].includes(url.toString()))
  const failedRetryUrl = page.url()
  if (failedRetryUrl === originalRunUrl) throw new Error('Retry Failed overwrote the source run')

  await page.goto(`${base}/#/evaluations`)
  await page.getByRole('heading', { name: 'Evaluation History' }).waitFor()
  await page.reload()
  await page.getByText(datasetName).first().waitFor()
  if (await page.locator('tbody tr').count() < 3) throw new Error('Evaluation History did not retain source and retry runs')

  console.log('[PASS] Created Dataset with 6 acceptance cases')
  console.log('[PASS] succeeded / failed / skipped are separated')
  console.log('[PASS] validation failure remains succeeded invocation')
  console.log('[PASS] unavailable Token/Cost render as em dash')
  console.log('[PASS] Result and Invocation details open')
  console.log('[PASS] Retry Failed and Retry Case create new runs')
  console.log('[PASS] reload interruption recovery and persisted History verified')
  console.log('[PromptOps E2E] Phase 4 acceptance passed without real API calls.')
} catch (error) {
  console.error('[Acceptance URL]', page.url())
  console.error('[Acceptance body]', (await page.locator('body').innerText().catch(() => '')).slice(0, 4000))
  await page.screenshot({ path: 'test-results/promptops-phase4-acceptance-failure.png', fullPage: true }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
  if (server) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
    else server.kill('SIGTERM')
  }
}

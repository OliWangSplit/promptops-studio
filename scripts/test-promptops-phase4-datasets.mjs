import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const base = process.env.PROMPTOPS_URL || 'http://127.0.0.1:18183'
let server
const available = async () => { try { return (await fetch(base)).ok } catch { return false } }
if (!await available()) {
  const port = new URL(base).port || '18183'
  server = spawn('pnpm', ['-F', '@prompt-optimizer/web', 'dev', '--port', port, '--force'], { stdio: 'ignore', shell: true })
  for (let index = 0; index < 90 && !await available(); index += 1) await new Promise(resolve => setTimeout(resolve, 500))
  if (!await available()) throw new Error('Dataset E2E web server did not start')
}
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'en-US' })
const page = await context.newPage()
const button = (english, chinese) => page.getByRole('button', { name: new RegExp(`${english}|${chinese}`) })
page.on('dialog', dialog => dialog.accept())
page.on('console', message => { if (message.type() === 'error') console.error('[browser]', message.text()) })
page.on('pageerror', error => console.error('[pageerror]', error.message))
try {
  const name = `Dataset E2E ${Date.now()}`
  await page.goto(`${base}/#/datasets`)
  await page.getByRole('heading', { name: /Dataset Library|数据集资产库/ }).waitFor()
  await button('Create Dataset','创建数据集').click()
  await page.getByLabel(/Dataset Name|数据集名称/).fill(name)
  await page.getByLabel(/Description|描述/).fill('Persistent dataset acceptance test')
  await button('Save','保存').click()
  await page.waitForURL(/#\/datasets\/[^/]+$/)
  await button('Add Test Case','新增测试用例').click()
  await page.getByLabel(/Dataset Name|数据集名称/).fill('Case A')
  await page.getByLabel(/Variables \(JSON\)|变量（JSON）/).fill('{"topic":"AI"}')
  await page.getByLabel(/Expected Output|预期输出/).fill('summary')
  await page.getByLabel(/Required Keywords|必含关键词/).fill('summary')
  await button('Save','保存').click()
  await page.getByText('Case A', { exact: true }).waitFor()
  await button('Duplicate','复制').last().click()
  await page.getByText('Case A (Copy)', { exact: true }).waitFor()
  await page.reload()
  await page.getByText('Case A', { exact: true }).waitFor()
  await page.locator('tbody input[type=checkbox]').last().check()
  await button('Batch Delete','批量删除').click()
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1)
  await button('Archive Dataset','归档数据集').click()
  await page.getByText(/Archived datasets are read only|已归档数据集为只读状态/).waitFor()
  await button('Restore Dataset','恢复数据集').click()
  await button('Add Test Case','新增测试用例').waitFor()
  await page.goto(`${base}/#/datasets`)
  await button('Import Dataset','导入数据集').click()
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') })
  await button('Confirm Import','确认导入').waitFor({ state: 'visible' })
  if (await button('Confirm Import','确认导入').isEnabled()) throw new Error('Invalid JSON import must be disabled')
  await button('Close','关闭').click()
  await button('Import Dataset','导入数据集').click()
  await page.locator('input[type=file]').setInputFiles({ name: 'dataset.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion:1,dataset:{name:'Imported E2E'},testCases:[{name:'Imported Case',variables:{ok:true}}] })) })
  await button('Confirm Import','确认导入').click()
  await page.getByText('Imported Case', { exact: true }).waitFor()
  console.log('[PromptOps E2E] Phase 4 Dataset UI checks passed. No model API was called.')
} catch (error) {
  console.error('[Dataset E2E URL]', page.url())
  console.error('[Dataset E2E body]', (await page.locator('body').innerText().catch(() => '')).slice(0, 2000))
  await page.screenshot({ path: 'test-results/promptops-datasets-failure.png', fullPage: true }).catch(() => undefined)
  throw error
} finally {
  await browser.close()
  if (server) server.kill()
}

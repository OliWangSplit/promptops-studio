#!/usr/bin/env node
import { chromium } from '@playwright/test'
import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'

const baseUrl = process.env.PROMPTOPS_URL || 'http://127.0.0.1:18181'
const uniqueName = `Phase 2 E2E ${Date.now()}`
let ownedServer

const isReachable = async () => {
  try { return (await fetch(baseUrl)).ok } catch { return false }
}

const ensureServer = async () => {
  if (await isReachable()) return
  const port = new URL(baseUrl).port || '18181'
  console.log(`[PromptOps E2E] Starting isolated web server on ${port}...`)
  ownedServer = spawn('pnpm', ['-F', '@prompt-optimizer/web', 'dev', '--port', port, '--force'], {
    cwd: process.cwd(), shell: true, stdio: 'ignore', windowsHide: true,
  })
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    if (await isReachable()) return
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Web server did not become ready at ${baseUrl}`)
}

const stopOwnedServer = () => {
  if (!ownedServer?.pid) return
  if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(ownedServer.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
  else ownedServer.kill('SIGTERM')
}

const button = (page, english, chinese) => page.getByRole('button', { name: new RegExp(`${english}|${chinese}`) })
const link = (scope, english, chinese) => scope.getByRole('link', { name: new RegExp(`${english}|${chinese}`) })

await ensureServer()
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'zh-CN' })
const page = await context.newPage()
page.on('dialog', async dialog => {
  if (dialog.type() === 'alert') await dialog.accept()
  else await dialog.accept()
})

try {
  console.log(`[PromptOps E2E] Target: ${baseUrl}`)
  await page.goto(`${baseUrl}/#/prompts/new`, { waitUntil: 'networkidle' })
  await page.getByLabel('Name').fill(uniqueName)
  await page.getByLabel('Description').fill('Automated Phase 2 browser acceptance test')
  await page.getByLabel('Business Scenario').fill('Automated regression testing')
  await page.getByLabel('Category').selectOption({ label: 'Customer Service' })
  await page.getByLabel('Department').selectOption({ label: 'Sales' })

  const editors = page.locator('.codemirror-editor .cm-content')
  await editors.nth(0).fill('You are a support assistant for {{customer_name}}.')
  await editors.nth(1).fill('Reply to order {{order_id}} with a concise update.')
  await page.getByText('{{customer_name}}', { exact: false }).last().waitFor()
  await page.getByText('{{order_id}}', { exact: false }).last().waitFor()

  await button(page, 'Save Draft', '保存草稿').click()
  await page.waitForURL(/#\/prompts\/[^/]+$/)
  await page.getByRole('heading', { name: uniqueName }).waitFor()
  const createdUrl = page.url()
  const promptId = createdUrl.match(/#\/prompts\/([^/]+)$/)?.[1]
  if (!promptId) throw new Error(`Unable to read created prompt id from ${createdUrl}`)
  console.log(`[PASS] Created ${promptId} with V1.0 and navigated to detail`)

  await link(page, 'Edit', '编辑').first().click()
  await page.waitForURL(new RegExp(`#\/prompts\/${promptId}\/edit$`))
  await page.locator('.fields').getByLabel('Description').fill('Saved working-copy change')
  await button(page, 'Save Changes', '保存修改').click()
  await page.waitForURL(/#\/prompts$/)
  const createdRow = page.locator('tr', { hasText: uniqueName })
  await createdRow.waitFor()
  await createdRow.getByText('V1.0', { exact: true }).waitFor()
  console.log('[PASS] Save Changes returned to library without creating a version')

  await link(createdRow, 'Edit', '编辑').click()
  await page.waitForURL(new RegExp(`#\/prompts\/${promptId}\/edit$`))
  await page.locator('.fields').getByLabel('Description').fill('Immutable V1.1 snapshot')
  await button(page, 'Save as New Version', '保存为新版本').click()
  const modal = page.locator('.modal')
  await modal.waitFor()
  await modal.getByLabel(/Change Summary|变更摘要|變更摘要/).fill('Automated minor version')
  await modal.getByLabel(/Version Type|版本类型|版本類型/).selectOption('minor')
  await modal.getByRole('button', { name: /Save as New Version|保存为新版本|儲存為新版本/ }).click()
  await page.waitForURL(/#\/prompts$/)
  const versionedRow = page.locator('tr', { hasText: uniqueName })
  await versionedRow.getByText('V1.1', { exact: true }).waitFor()
  console.log('[PASS] Save New Version created V1.1 and returned to library')

  const otherRow = page.locator('tr', { hasText: 'Customer Complaint Response' })
  await link(otherRow, 'Edit', '编辑').click()
  await page.waitForURL(/#\/prompts\/prompt-seed-1\/edit$/)
  await page.getByLabel('Name', { exact: true }).waitFor()
  if (await page.getByLabel('Name', { exact: true }).inputValue() !== 'Customer Complaint Response') {
    throw new Error('Editor route reused stale data from the previously edited prompt')
  }
  console.log('[PASS] Editing another prompt reloads the correct entity')

  await page.goto(`${baseUrl}/#/prompts/${promptId}`, { waitUntil: 'networkidle' })
  await link(page, 'Version History', '版本历史').click()
  await page.waitForURL(new RegExp(`#\/prompts\/${promptId}\/versions$`))
  await page.getByText('V1.1', { exact: true }).waitFor()
  await page.getByText('V1.0', { exact: true }).waitFor()
  console.log('[PASS] Version history contains V1.1 and V1.0')

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('V1.1', { exact: true }).waitFor()
  console.log('[PASS] IndexedDB data survives page reload')
  console.log('\n[PromptOps E2E] All Phase 2 browser checks passed.')
} catch (error) {
  await page.screenshot({ path: 'test-results/promptops-phase2-failure.png', fullPage: true }).catch(() => undefined)
  console.error('\n[PromptOps E2E] FAILED')
  console.error(error)
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
  stopOwnedServer()
}

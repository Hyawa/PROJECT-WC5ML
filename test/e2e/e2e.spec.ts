import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  type ElectronApplication,
  type Page,
  type JSHandle,
  expect,
  test,
  _electron as electron,
} from '@playwright/test'
import type { BrowserWindow } from 'electron'

const root = path.resolve(import.meta.dirname, '..', '..')
let electronApp: ElectronApplication
let page: Page
let xvfbProcess: ChildProcess | undefined

function startXvfbOnLinux(): Promise<void> {
  if (process.platform !== 'linux' || process.env.DISPLAY) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    xvfbProcess = spawn('Xvfb', [':99', '-screen', '0', '1280x720x24', '-ac'], {
      stdio: 'ignore',
      detached: true,
    })

    xvfbProcess.once('error', reject)

    setTimeout(() => {
      process.env.DISPLAY = ':99'
      resolve()
    }, 500)
  })
}

test.beforeAll(async () => {
  test.setTimeout(60000)
  await startXvfbOnLinux()

  electronApp = await electron.launch({
    args: ['.', '--no-sandbox'],
    cwd: root,
    env: { ...process.env, NODE_ENV: 'development' },
  })
  page = await electronApp.firstWindow()

  const mainWin: JSHandle<BrowserWindow> = await electronApp.browserWindow(page)
  await mainWin.evaluate(async (win) => {
    win.webContents.executeJavaScript('console.log("Execute JavaScript with e2e testing.")')
  })

  // Dados determinísticos: limpa legado localStorage + zera o SQLite (op dev/teste)
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(async () => {
    await (window as unknown as { forja: { db: { execute: (req: unknown) => Promise<unknown> } } }).forja.db.execute({ op: 'reset' })
  })
  await page.reload()
})

test.afterAll(async () => {
  if (page) {
    await page.screenshot({ path: 'test/screenshots/e2e.png' })
    await page.close()
  }

  if (electronApp) {
    await electronApp.close()
  }

  if (xvfbProcess?.pid) {
    process.kill(-xvfbProcess.pid)
    xvfbProcess = undefined
  }
})

test.describe('[forja-calistenia] e2e tests', () => {
  test('startup', async () => {
    const title = await page.title()
    expect(title).toBe('FORJA — Treinos de Calistenia')
  })

  test('should be home page is load correctly', async () => {
    await expect(page.locator('h1')).toHaveText('FORJA')
    // Sem treinos: estado vazio visível
    await expect(page.getByText('Nenhum treino por aqui')).toBeVisible()
  })

  test('should create a workout with a library exercise', async () => {
    await page.click('button:has-text("Criar treino")')
    await page.click('button:has-text("Adicionar exercício")')
    // Aba Treinos → picker da biblioteca; busca e escolhe um exercício
    await page.fill('input[placeholder*="Buscar"]', 'Abdominal')
    await page.click('button:has-text("Abdominal")')
    await page.fill('input[placeholder*="Nome do treino"]', 'Treino A')
    await page.click('button:has-text("Salvar")')

    await expect(page.getByText('Treino A')).toBeVisible()
    await expect(page.locator('button:has-text("Treinar")')).toBeVisible()
  })

  test('should complete a full session and record history', async () => {
    await page.click('button:has-text("Treinar")')

    // 3 séries de abdominal (15 reps), pulando os descansos entre elas
    for (let i = 0; i < 3; i += 1) {
      await page.click('button:has-text("Série feita")')
      if (i < 2) await page.click('button:has-text("Pular descanso")')
    }

    await expect(page.getByText('Treino concluído!')).toBeVisible()
    await page.click('button:has-text("Salvar no histórico")')

    await page.click('button:has-text("Histórico")')
    await expect(page.locator('section').first()).toContainText('Treino A')
    await expect(page.getByText('3 séries')).toBeVisible()
  })

  test('should create, edit and delete a library exercise (CRUD)', async () => {
    await page.click('button:has-text("Exercícios")')

    // CREATE
    await page.click('button:has-text("Novo exercício")')
    await page.fill('input[placeholder*="Nome do exercício"]', 'Exercício Teste')
    await page.click('button:has-text("Salvar")')
    await expect(page.getByText('Exercício Teste')).toBeVisible()

    // UPDATE
    await page.click('[aria-label="Editar exercício Exercício Teste"]')
    await page.fill('input[placeholder*="Nome do exercício"]', 'Exercício Editado')
    await page.click('button:has-text("Salvar")')
    await expect(page.getByText('Exercício Editado')).toBeVisible()

    // DELETE (dois toques no botão de lixeira)
    const deleteButton = page.locator('[aria-label="Excluir exercício Exercício Editado"]')
    await deleteButton.click() // arma
    await deleteButton.click() // confirma
    await expect(page.getByText('Exercício Editado')).toHaveCount(0)
  })
})

import { isElectronBridge, createElectronAdapter } from './adapters/electron'
import { isCapacitorNative, createCapacitorAdapter } from './adapters/capacitor'
import { createLocalAdapter } from './adapters/local'
import type { DbApi } from './api'

/**
 * Detecta o ambiente (uma única vez) e devolve o adaptador adequado:
 * Electron → SQLite via IPC · Capacitor → SQLite nativo · Navegador → localStorage.
 */
let cached: Promise<DbApi> | null = null

export function getDb(): Promise<DbApi> {
  cached ??= detectDb()
  return cached
}

function detectDb(): Promise<DbApi> {
  if (isElectronBridge()) {
    return Promise.resolve(createElectronAdapter())
  }
  if (isCapacitorNative()) {
    return createCapacitorAdapter()
  }
  return Promise.resolve(createLocalAdapter())
}

# FORJA 💪🔒

**Aplicativo de treinos de calistenia / treino "militar" para treinar em casa** — com peso do corpo e, no máximo, uma barra fixa.

Monte seus próprios treinos, execute-os com cronômetro de séries e descanso, acompanhe seu progresso (streak, sessões da semana, registros históricos) — tudo 100% offline, sem servidores e sem contas.

> Interface mobile-first em português, tema escuro "militar". O mesmo código roda como **app desktop no Windows (Electron)** e pode ser empacotado **como APK no Android (Capacitor)**.

---

## ✨ Funcionalidades (MVP)

### Treinos (CRUD)
- Criar, editar, executar e excluir treinos
- Composição por **exercícios da biblioteca** (com busca) — cada treino guarda uma cópia ajustável do exercício
- Por exercício: séries, **repetições ou tempo** (prancha, corrida no lugar…), descanso em segundos, marcação de uso da barra fixa
- Reordenação (↑/↓), duração estimada exibida no card

### Biblioteca de exercícios (CRUD)
- Aba dedicada: criar, editar, buscar e excluir seus exercícios
- 16 exercícios padrão já semeados (flexões, barra fixa, abdominal, prancha, agachamento, burpee…)
- Excluir um exercício da biblioteca **não quebra** treinos existentes (eles guardam snapshot)

### Modo treino
- Botão grande "Série feita ✅" com progresso visual (barra + posição atual)
- **Descanso automático** após cada série, com anel de countdown, bipes nos últimos 3 segundos e vibração (no aparelho)
- Séries por **tempo** contam regressivamente durante a execução ("Agora!") e registram sozinhas ao zerar
- Pular descanso ou adicionar +15 s
- Resumo final com séries/reps/duração antes de salvar no histórico

### Histórico e progresso
- 🔥 **Streak** (dias consecutivos treinando)
- 📅 Sessões na semana (semana começa segunda) e 🏆 total de treinos
- Sessões agrupadas por dia ("Hoje", "Ontem", …) e deletáveis
- Duração ± estimada de cada treino

---

## 🗄️ Armazenamento: SQLite em todas as plataformas

O formato e o schema SQL são compartilhados por três adaptadores, detectados automaticamente na inicialização:

| Plataforma | Implementação |
|---|---|
| **Desktop (Electron/Windows)** | SQLite no processo **main** via módulo built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) (sem dependência nativa), acessado pelo renderer por um único canal IPC (`forja:db`) exposto no preload (`window.forja`) |
| **Mobile (Android/iOS via Capacitor)** | Plugin nativo [`@capacitor-community/sqlite`](https://github.com/capacitor-community/sqlite) executando o mesmo schema |
| **Navegador (desenvolvimento web)** | Adaptador `localStorage` com semântica idêntica |

Schema (arquivo `src/db/schema.ts`):

- `exercises` — biblioteca de exercícios do usuário
- `workouts` + `workout_exercises` — treinos e seus exercícios (snapshots com ordem)
- `sessions` — treinos concluídos (carga completa em JSON no registro)

Banco no desktop: `%APPDATA%/electron-vite-react/forja.db`. Dados antigos da era localStorage são **migrados automaticamente** na primeira execução.

---

## 🚀 Começando

Requisitos: Node.js ≥ 20.19 e [pnpm](https://pnpm.io).

```sh
# instalar dependências
pnpm install

# rodar o app (janela Electron)
pnpm dev
```

### Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Desenvolvimento (renderer + Electron) |
| `pnpm build` | Build do renderer + empacotar instalador com electron-builder |
| `pnpm test` | Testes unitários (Vitest) |
| `pnpm test:e2e` | Testes e2e (Playwright + Electron) — cobrem criar treino, executar sessão completa, salvar no histórico e o CRUD da biblioteca |
| `pnpm typecheck` | Checagem de tipos |

O app funciona 100% offline; o banco SQLite fica no diretório de dados do usuário.

> **Android (futuro):** o Capacitor já está configurado. Para gerar o APK rode `npx cap sync android` e depois `npx cap open android` (build pelo Android Studio).

---

## 🧱 Stack

- [Electron](https://www.electronjs.org/) + [Vite](https://vitejs.dev) + [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com) + ícones [lucide-react](https://lucide.dev)
- SQLite (`node:sqlite` no desktop, `@capacitor-community/sqlite` no mobile)
- [Capacitor 8](https://capacitorjs.com) (empacotamento mobile) + [electron-builder](https://www.electron.build) (desktop)
- Testes: [Playwright](https://playwright.dev) (e2e) e [Vitest](https://vitest.dev)

## 🗂️ Estrutura principal

```
src/
  App.tsx                     # navegação por abas (Treinos / Exercícios / Histórico)
  db/                         # camada de dados
    api.ts                    # contrato único (DbApi) entre adaptadores
    schema.ts                 # schema SQL compartilhado + biblioteca padrão
    client.ts                 # detecção de plataforma (Electron/Capacitor/web)
    adapters/                 # electron (IPC) · capacitor (nativo) · local (web dev)
  lib/
    store.tsx                 # DataProvider (estado global + recarga após mutações)
    types.ts                  # Exercise, Workout, Session…
    format.ts · audio.ts · storage.ts
    hooks/useCountdown.ts     # cronômetro robusto a perda de foco
  components/
    layout/BottomNav.tsx      # navegação inferior mobile
    workout/                  # WorkoutList · WorkoutEditor
    library/                  # LibraryPage · ExerciseEditor · ExercisePicker
    session/                  # SessionRunner · RingTimer
    history/                  # HistoryPage · StatsBar
electron/main/db.ts           # SQLite (node:sqlite) + handlers IPC
```

## 🗺️ Roadmap (Fase 2)

- [ ] Treinos "militares" prontos com escala progressiva (iniciante → avançado)
- [ ] Gráficos de evolução por exercício
- [ ] Export/import de dados (backup do SQLite)
- [ ] Empacotar APK Android e instalador Windows
- [ ] Peso corporal ajustável em exercícios (ex.: mochila com carga leve)

## 📄 Licença

[MIT](LICENSE)

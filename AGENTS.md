# Repository Guidelines

## Project Structure & Module Organization
- Root contains two runnable examples: `npm/` and `pnpm-esbuild/`.
- Source code lives in `<variant>/src/functions/` (entry: `index.mts|ts`).
- Build output goes to `<variant>/dist/` (Azure Functions reads `dist/src/functions/*.mjs`).
- Azure Functions host config is `<variant>/host.json`.
- Assets for docs and screenshots live in `assets/` and `<variant>/assets/>`.

## Build, Test, and Development Commands
- npm variant:
  - `cd npm && npm ci && npm run build` — TypeScript compile to `dist/`.
  - `cd npm && npm run start` — run locally with `func start`.
  - `cd npm && ./run.sh` — build and publish to Azure (also sets node args).
- pnpm + esbuild variant:
  - `cd pnpm-esbuild && pnpm install && pnpm build` — bundle via esbuild to `dist/`.
  - `cd pnpm-esbuild && pnpm start` — build then `func start`.
  - `cd pnpm-esbuild && ./run.sh` — bundle and publish from `dist/`.

## Coding Style & Naming Conventions
- Language: TypeScript, ESM (`"type": "module"`, Node ≥ 22).
- Modules: `nodenext` resolution; prefer ESM imports (`import … from '…'`).
- Indentation: 2 spaces; no semicolons preference enforced—match existing files.
- Files: handlers in `src/functions/`; name queue triggers `serviceBusTrigger*.ts`.
- Keep handlers small; extract helpers if logic grows.

## Testing Guidelines
- Current `test` scripts are placeholders. If adding tests:
  - Framework: Vitest or Jest.
  - Location: `<variant>/test/**/*.test.ts`.
  - Run: `cd <variant> && npm test | pnpm test`.
  - Aim for basic handler invocation and message processing unit tests.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject (e.g., `build(npm): compile with tsc`).
- Scope by variant when relevant: `npm`, `pnpm-esbuild`, or `docs`.
- PRs: include a short description, screenshots for runtime errors, and link issues.
- Keep changes minimal; avoid cross-variant edits unless intentional.

## Security & Configuration Tips
- Do not commit secrets. Use Azure App Settings and local `AzureWebJobsServiceBus` connection.
- For better stack traces, the publish scripts set `languageWorkers__node__arguments=--enable-source-maps`.
- OTEL is enabled via `host.json` (`telemetryMode: OpenTelemetry`). Verify App Insights as needed.

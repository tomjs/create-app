# AGENTS.md

Interactive project scaffolder (create-vite/create-vue style) for node/web/electron/vscode/hbuilderx/crx apps, published as the `@tomjs/create-app` bin. ESM-only, pnpm v10 (`packageManager: pnpm@10.28.2`), Node >= 18. Source in `src/`, built to `dist/index.mjs` with tsdown.

## Commands

- `pnpm debug` — run the CLI from source (`tsx src/index.ts`, loads `.env` via dotenv). Use this to test prompts; `CLI_CWD` env var overrides cwd
- `pnpm dev` / `pnpm build` — tsdown watch / production build
- `pnpm file` — **regenerates `templates/config/package.json`** by aggregating all `templates/**/package.json` deps. Run after changing any template dependency; that generated file is used at runtime to version-sync deps in generated projects (`updatePackageJsonVersion`, src/app.ts). Never hand-edit it
- `pnpm lint` — runs `eslint --fix` (fixes in place!) then `stylelint "templates/**/*.{css,scss,vue,html}" --fix --cache`. No test suite exists; verify with `pnpm build` + `pnpm lint`
- Git hooks via `pnpm prepare` (simple-git-hooks): pre-commit = lint-staged, commit-msg = commitlint (conventional commits)

## How templates assemble

- `templates/<name>/` (e.g. `web-vue/`) = full project template; `templates/config/<group>/` = reusable fragments
- `createProject` (src/app.ts) copies in this order into a temp dir: `base` → `style` (if `hasStyle`) → `public`/`npm` (if `public`) → web framework (`vue`/`react`) → `commonTemplates` (e.g. `electron`, `vscode`, `hbuilderx`) → then the template dir itself. package.json fields are deep-merged (template dir wins); for non-vue templates the `style` config is stripped of `vue`
- Final package.json is rewritten with a fixed field order (`sortPackageJson`), so field order in template package.json doesn't matter

## Template conventions

- Hidden files use a `_` prefix (npm excludes dotfiles from the published tarball); they're renamed at generation time: `_eslint.config.mjs` → `eslint.config.mjs`, `_.gitignore` → `.gitignore`. Never add leading-dot files inside templates
- Template registry is `projectTemplates` in src/constants.ts. Adding a template = create `templates/<name>/`, register it in constants.ts (with `public`, `hasStyle`, `commonTemplates`, `value` as needed), and list it in README.md
- `node-vite` is special: package name defaults to `vite-plugin-xxx` and `updateWorkspacePackageName` replaces `xxx`/`Xxx` placeholders across `src` and `examples`
- i18n: every user-facing string goes through `t()` (src/utils/lang.ts), loading `locales/<locale>.json` with en-US fallback. Add new prompt strings to **both** `locales/en-US.json` and `locales/zh-CN.json`

## Gotchas

- CLI flags are declared in src/index.ts via meow; `--verbose` defaults to `NODE_ENV=development`
- Public projects pull `author` from git `user.name`/`user.email`; if git email is `tom@tomgao.cn`, npm scope defaults to `tomjs`
- `git init` runs in the target dir unless `--package` (workspace mode, which strips lint/hook files via `handlePackageTypeProject`)

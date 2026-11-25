# AGENTS.md — Provash Shield

Instructions for AI coding agents and for teammates. Read this file before changing anything.
If anything here conflicts with a request, say so and ask before proceeding.

## 1. What this project is
Provash Shield helps Bangladeshi migrant workers check a recruiting agency, a job offer and a
Schengen visa sticker before paying. Bangla is the default language, English is the toggle.
Frontend: React + TypeScript + Vite. Backend: Python + FastAPI. Data: SQLite (`shield.db`).

## 2. Non-negotiable rules
- The visa check finds anomalies. It never proves a visa is genuine. Never use the word "genuine".
  Clean results say: "No problems found by this check. Not proof. Confirm with the embassy or visa center."
- Never store visa photos, passport data or voice recordings. Process in memory only. No personal data in logs.
- Never commit secrets (`.env`), `shield.db`, real datasets, or `node_modules` / `.venv`.
- Test data must be obviously fake (agencies RL9001 to RL9003, images labelled TEST SAMPLE).
- Do not invent agency data, statistics or legal limits. Cite the source and its date.
- Every result shows its source and date. Do not show numeric risk scores or internal thresholds.
- Do not build anything that helps create forged documents.

## 3. Repository layout (target)
```
frontend/src/
  api/            network calls only (fetch wrappers, types)
  i18n/           en.ts and bn.ts dictionaries; no text inside components
  components/     small reusable UI pieces (Button, Badge, Page, Icon, InputField)
  screens/        one folder per screen; UI only
  hooks/          controllers: state and orchestration (useAgencyCheck, useVisaCheck)
  styles/         tokens.css plus one css file per component or screen
  App.tsx         routing and layout only
backend/
  main.py         app setup and routes only (thin)
  schemas.py      request and response models
  services/       business logic (registry, mrz, ocr, image_checks, visa_pipeline)
  data/           private snapshots (gitignored)
  tests/
scripts/          helper scripts (file length check)
```

## 4. Architecture rules: keep UI and control separate
Frontend:
- UI components only render props. They never call `fetch`, never hold business rules.
- Controllers (hooks) own state, call `api/`, and decide the next screen.
- `api/` contains no React. Components never import from `api/` directly; hooks do.
- All user-facing text lives in `i18n/`. Every string needs both `en` and `bn`.
- Status colour is never the only signal: always icon + text + colour.
- Accessibility: 18px minimum Bangla text, 56px minimum touch targets.
Backend:
- Routes in `main.py` parse input, call one service function, return the result. No logic there.
- Services hold the logic and have no FastAPI imports.
- Reason texts live in data tables (dictionaries), separate from the code that picks them.
- One shared `Result` shape for agency, offer and visa checks (`schemas.py`).

## 5. Code quality limits
- **No file may exceed 250 lines.** Check with `python scripts/check_file_length.py`.
  Split files before they reach the limit. Generated files may be listed in the script allowlist.
- Functions: aim for 40 lines or fewer, one job each. One React component per file.
- No duplicated blocks: extract and reuse. No dead code, no commented-out code.
- Names say what things are. Comments explain why, not what.
- TypeScript: strict mode, no `any`. Python: type hints on public functions.
- Keep the existing formatter: `pnpm format` (frontend).

## 6. Environment and versions
Keep every teammate on the same versions. Update this section when a version changes.
| Tool | Version | Check |
|---|---|---|
| Node.js | 22 LTS (20.19 or newer works) | `node -v` |
| pnpm | the version in `frontend/package.json` ("packageManager"), else latest 9+ | `pnpm -v` |
| Python | 3.12 (3.10 to 3.12 works) | `python --version` |
| Tesseract OCR | any recent 5.x | `tesseract --version` |
Rules for dependencies:
- Frontend: commit `pnpm-lock.yaml`. Add packages with `pnpm add <pkg>`.
- Backend: pin versions. After adding a package run `python -m pip freeze > requirements.lock.txt` and commit it.
- Ask before adding a new dependency. Prefer the standard library or what is installed.
- After any version or dependency change: update this section, add a line to `CHANGELOG.md`, and tell the team to
  re-run `pnpm install` and `python -m pip install -r requirements.txt`.

## 7. Setup and run (Windows PowerShell)
Backend (from `backend/`):
```
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python seed_demo.py
python -m pytest -v
python -m uvicorn main:app --reload --port 8000
```
Frontend (from `frontend/`):
```
pnpm install
pnpm dev        # http://localhost:8443 (port is fixed); /api is proxied to port 8000
pnpm build
```
Notes:
- If Windows Smart App Control blocks `pytest.exe` or `uvicorn.exe`, run them through Python as shown above.
- Do not edit or delete the `.figma/` folder; `vite.config.ts` reads `.figma/make/site.json`.
- The tab title and icon come from `.figma/make/site.json`.
- Real agency data: `python scraper.py --inspect`, then `python scraper.py` (backend folder).

## 8. Known violations to fix first (refactor plan)
`App.tsx` (about 630 lines) and `styles` in `index.css` (about 370 lines) exceed the limit.
Refactor in small steps with NO behaviour change. Run `pnpm build` and the app after each step. One commit per step.
1. Move text into `i18n/en.ts` and `i18n/bn.ts`.
2. Move shared UI pieces into `components/` (Button, Badge, Page, Icon, InputField, ResultShell).
3. Move each screen into `screens/` (Home, Voice, Confirm, Verified, NotFound, Warning, Offer, Report, Help).
4. Split the visa flow into stage components (intro, sticker, confirm, physical, behavior, result) plus `useVisaCheck`.
5. Add `useAgencyCheck` and make `App.tsx` routing only.
6. Split `index.css` into `styles/tokens.css` plus per-component files.

## 9. Workflow for agents
1. Read this file and the files you will touch. Make the smallest change that works.
2. Add or update tests for backend changes (`python -m pytest -v`).
3. Before finishing run: backend tests, `pnpm build`, `python scripts/check_file_length.py`.
4. Do not change behaviour while refactoring. Do not reformat unrelated code.
5. Commit with a clear message: `type: what changed` (feat, fix, refactor, test, docs, chore).
6. Update `README.md` or this file when commands, structure or versions change.
7. If you cannot run something (blocked tool, missing network), say so. Never claim it passed.

## 10. Definition of done
- Tests and build pass; no file over 250 lines; no secrets or data files staged.
- UI and control are separate; all text is in both Bangla and English.
- Results show source, date and the "not proof" wording where required.
- Docs and version table are up to date.
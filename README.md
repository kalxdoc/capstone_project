# Provash Shield (প্রবাস শিল্ড)

A Bangla and English mobile web app that helps Bangladeshi migrant workers and their families check a recruiting
agency, a job offer and a Schengen visa sticker before paying any money. Capstone project.

> The visa check looks for warning signs. It never proves a visa is genuine. Always confirm with the embassy or visa center.

## Status (update this table every week)
| Feature | Status |
|---|---|
| Agency check (name and license number against a registry) | Working with test data; real OEP data loading in progress |
| Visa sticker check (code-line validation and photo reading) | Working; tested with synthetic lines |
| Offer red-flag check (fees, contract terms) | Prototype screen only |
| Agent behavior quiz | Prototype in the app |
| Community scam reports and moderation | Prototype screen only |
| Bangla voice input and read-aloud | Prototype only |
| Hosting (HTTPS) | Not started |

Daily progress: see [JOURNAL.md](JOURNAL.md). Task board: see the project board linked by your team.

## How it works
1. The user enters (or photographs) the agency details or the two code lines on a visa sticker.
2. The backend matches the agency against the registry, or validates the code lines (structure, check digits, dates).
3. The app shows a clear result with the reason, the data source and its date, and a "not proof" note.

## Tech stack
- Frontend: React, TypeScript, Vite, Tailwind (exported from Figma Make)
- Backend: Python, FastAPI, SQLite, OpenCV, Tesseract OCR
- Tests: pytest

## Repository layout
```
frontend/   React app (UI, screens, api calls)
backend/    FastAPI app: main.py, schemas.py, services/, tests/, scraper.py
scripts/    helper scripts (file length check)
AGENTS.md   rules for AI agents and teammates
JOURNAL.md  day-by-day work log
```

## Requirements
Node.js 22 LTS, pnpm, Python 3.12, Tesseract OCR. See AGENTS.md for versions and update rules.

## Run it (Windows PowerShell)
Backend, from `backend/`:
```
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python seed_demo.py
python -m pytest -v
python -m uvicorn main:app --reload --port 8000


#if not work then this 



python -m venv .venv
.venv\Scripts\Activate.ps1

python -m pytest -v
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Frontend, from `frontend/`:
```

$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
pnpm install
pnpm dev
```
Open http://localhost:8443. API docs: http://localhost:8000/docs.

## Test data
Fake agencies only: RL9001 (active), RL9002 (cancelled), RL9003 (expired). Any other number returns not found
until the real list is loaded. Generate sample code lines with `python make_test_image.py` and the helpers in `tests/test_mrz.py`.

## API summary
| Endpoint | Purpose |
|---|---|
| GET /api/v1/health | Server check |
| POST /api/v1/agency/verify | Check agency name and license number |
| POST /api/v1/visa/mrz | Validate the two typed code lines |
| POST /api/v1/visa/analyze | Read the code lines from a photo |

## Data sources
Public sources only: the OEP agency list (license status and validity date), BMET published lists and ministry
announcements. Every result shows its source and date. The registry is a dated snapshot, not live data.

## Privacy and limits
- Photos, passport details and voice are processed in memory and never saved.
- Results are guidance, not a guarantee. The visa check cannot verify holograms, paper or official records.
- The repository is private. Do not commit `.env`, `shield.db` or real datasets.

## Team
Member Fahim Morshed: frontend and UX. Member Md Shafin Ahmed: backend, api and DATA. Member Rakibul Hasan: Teating.

## Roadmap
Real agency data and daily refresh, offer check, community reports, Bangla voice input, evaluation on a test set,
deployment, final report and demo.

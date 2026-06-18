# PrivateGPT Desktop — Codebase Setup

## What This Repo Is

PrivateGPT Desktop is an Electron desktop wrapper around:

- a React frontend in `frontend/`
- a Flask backend in `backend/`
- a packaged backend executable plus SQLite database staged into `appdist/`

The Electron app serves the prebuilt React bundle from `frontend/build` and spawns the bundled backend executable from `appdist/`.

## Current Architecture

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron Forge |
| Local web server | Express in `main.js` |
| Frontend UI | React 18 |
| Backend API | Flask on `127.0.0.1:5000` |
| Local storage | SQLite database bundled into `appdist/database.db` |

## Prerequisites

- Node.js 18+
- npm
- Python 3.11+ recommended
- pip
- Ollama installed locally if you want local-model flows

## Development Modes

### Backend only

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

The Flask API runs on `http://127.0.0.1:5000`.

### Frontend only

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

This starts the React dev server on `http://localhost:3000`.

### Desktop shell / packaging flow

The root Electron app does not boot the raw Python source tree. It expects built assets:

1. Install root dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Build the frontend bundle:
   ```bash
   npm run build:frontend
   ```
3. Build the backend executable:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pyinstaller app.spec
   cd ..
   ```
4. Stage runtime artifacts into `appdist/`:
   ```bash
   npm run stage:appdist
   ```
   The staging script copies the backend executable plus the first non-empty database seed it finds.
5. Start Electron or package installers:
   ```bash
   npm start
   npm run make
   ```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` when you need cloud-backed integrations:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Used for OpenAI embeddings / cloud-backed flows |
| `SEC_API_KEY` | Used for EDGAR / SEC API requests |
| `DB_PATH` | Optional override for the local SQLite database path |

`backend/app.py` now loads `backend/.env` automatically. Some legacy fallbacks are still present in source and should be cleaned up in a later security pass.

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|---------------|
| `ci.yml` | PRs and pushes to `main` | Installs backend deps, lints + imports the Flask app, then runs frontend tests and a production build |
| `release.yml` | Tag push matching `v*` | Builds the React bundle, packages the backend with PyInstaller, stages `appdist/`, and runs `electron-forge make` on macOS, Windows, and Linux |

## Current Operational Notes

- `main.js` expects `appdist/app` on macOS/Linux and `appdist/app.exe` on Windows.
- `npm start` from the repo root is only valid after `frontend/build` and `appdist/` have been prepared.
- `npm run stage:appdist` falls back to `backend/database/database_template.db` when `backend/database.db` is empty.
- The repo still carries legacy credentials/config that should be moved fully to environment variables before any public release.

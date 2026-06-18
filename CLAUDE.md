# CLAUDE.md - PrivateGPT Codebase Guide

This file gives AI assistants a practical overview of the current repository state.

## Project Overview

PrivateGPT Desktop is an Electron application for local financial-document chat workflows.

Core capabilities today:

- local model flows through Ollama (`llama2`, `mistral`)
- OpenAI-backed embedding and cloud-assisted flows
- PDF upload, chunking, retrieval, and chat over documents
- SEC / EDGAR filing ingestion for ticker-based chats
- legacy auth / subscription codepaths that still exist in the repo

The app is split into three layers:

- Electron desktop shell in `main.js`
- React frontend in `frontend/`
- Flask backend in `backend/`

## Repository Structure

```text
PrivateGPT/
|- backend/                    # Flask app, data layer, PyInstaller spec
|  |- app.py                   # Main Flask routes
|  |- app.spec                 # PyInstaller config
|  |- api_endpoints/           # Chat, login, payments, user handlers
|  |- constants/               # Global config and pricing constants
|  |- database/                # SQLite / MySQL helpers and schema
|  |- db/                      # Local vector-store parquet files
|  |- requirements.txt
|  `- .env.example
|- frontend/                   # React application
|  |- src/
|  `- package.json
|- appdist/                    # Staged runtime artifacts for Electron
|- scripts/
|  `- stage-appdist.js         # Copies built backend assets into appdist/
|- forge.config.js             # Electron Forge config
|- main.js                     # Electron entry point
`- package.json                # Root scripts for Electron + shared workflows
```

## Technology Stack

### Backend

| Layer | Technology |
|-------|------------|
| Framework | Flask 2.0.3 + Flask-CORS |
| Language | Python 3 |
| Local DB | SQLite |
| Vector storage | Chroma parquet files in `backend/db/` |
| Local LLM | Ollama |
| Cloud services | OpenAI, SEC API |

### Frontend

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| State | Redux Toolkit + Redux Persist |
| Styling | Tailwind CSS + MUI |
| HTTP | custom `fetcher()` in `frontend/src/http/RequestConfig.js` |

### Desktop Shell

| Layer | Technology |
|-------|------------|
| Shell | Electron 28 |
| Packaging | Electron Forge |
| Installer targets | Windows, macOS, Linux |

## Development Workflow

### Backend only

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

The Flask backend listens on `http://127.0.0.1:5000`.

### Frontend only

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

The React dev server listens on `http://localhost:3000`.

### Electron desktop app

Important: the root Electron app does not start `backend/app.py` directly. It expects built artifacts.

```bash
npm install --legacy-peer-deps
npm run build:frontend

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pyinstaller app.spec
cd ..

npm run stage:appdist
npm start
```

### Packaging a distributable

```bash
npm run build:frontend
cd backend && pyinstaller app.spec && cd ..
npm run stage:appdist
npm run make
```

## Runtime Notes

- `main.js` serves static files from `frontend/build`.
- `main.js` spawns the backend executable from `appdist/app` on macOS/Linux and `appdist/app.exe` on Windows.
- `npm run stage:appdist` falls back to `backend/database/database_template.db` when `backend/database.db` is empty.
- `backend/app.py` now loads `backend/.env` automatically if present.
- `npm start` from the repo root is only valid after `frontend/build` and `appdist/` have been prepared.

## Key API Endpoints

These are the current route names in `backend/app.py`:

| Method | Route | Description |
|-------|-------|-------------|
| POST | `/check-models` | Check whether Ollama models are installed |
| POST | `/install-llama` | Trigger `ollama run llama2` |
| POST | `/install-mistral` | Trigger `ollama run mistral` |
| POST | `/create-new-chat` | Create a new chat |
| POST | `/retrieve-all-chats` | Load chat list |
| POST | `/retrieve-messages-from-chat` | Load messages for a chat |
| POST | `/update-chat-name` | Rename a chat |
| POST | `/delete-chat` | Delete a chat |
| POST | `/find-most-recent-chat` | Fetch the latest chat |
| POST | `/ingest-metadata` | Create upload metadata and token |
| POST | `/ingest-files/<chat_id>/<upload_token>` | Upload PDF files |
| POST | `/retrieve-current-docs` | List documents for the selected chat |
| POST | `/delete-doc` | Delete a document |
| POST | `/change-chat-mode` | Switch task / mode |
| POST | `/reset-chat` | Clear messages for a chat |
| POST | `/process-message-pdf` | Chat over uploaded documents |
| POST | `/add-model-key` | Store a custom model key |
| POST | `/check-valid-ticker` | Validate ticker symbol |
| POST | `/add-ticker-to-chat` | Associate ticker with chat |
| POST | `/process-ticker-info` | Pull and ingest EDGAR data |

## Important Code Locations

| What | Where |
|------|-------|
| Flask app and routes | `backend/app.py` |
| PDF / EDGAR chat logic | `backend/api_endpoints/financeGPT/chatbot_endpoints.py` |
| SQL schema | `backend/database/schema.sql` |
| Runtime desktop DB | `appdist/database.db` |
| Seed desktop DB | `backend/database/database_template.db` |
| Electron entry point | `main.js` |
| Frontend router | `frontend/src/App.js` |
| Main chat UI | `frontend/src/financeGPT/components/Home.js` |
| API helper | `frontend/src/http/RequestConfig.js` |

## Testing

Current automated coverage is still light:

- frontend smoke tests live in `frontend/src/App.test.js`
- there are no committed Python unit tests yet

Useful commands:

```bash
npm test
npm run build:frontend
python3 -m compileall backend
```

## Security Notes

There are still legacy secrets and environment fallbacks in the repository:

- `backend/constants/global_constants.py` contains credential-like configuration
- `backend/api_endpoints/financeGPT/chatbot_endpoints.py` still includes a committed SEC API fallback key
- `USER_ID = 1` is hardcoded for local single-user behavior

Preferred direction:

- move all secrets to `backend/.env`
- revoke and remove committed fallback credentials
- replace hardcoded user identity with session-derived user IDs

## Common Gotchas

1. `npm install --legacy-peer-deps` is the safest install path in both the repo root and `frontend/`.
2. Electron depends on built artifacts, not live source-only backend startup.
3. Ollama must be installed locally for private-model flows.
4. The frontend currently builds with warnings; CI now treats build/test failures as real failures.
5. Packaging on Windows needs `app.exe`, which `main.js` now resolves explicitly.

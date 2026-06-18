# PrivateGPT Desktop

PrivateGPT Desktop is an Electron app that wraps a React frontend and a Flask backend for local financial-document chat workflows.

## Current repo shape

- `frontend/` contains the React app.
- `backend/` contains the Flask API and PyInstaller spec.
- `main.js` serves the prebuilt frontend bundle and spawns the packaged backend from `appdist/`.

Because of that last point, running the desktop app from the repo root requires built artifacts first.

## Run the backend only

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

The API listens on `http://127.0.0.1:5000`.

## Run the frontend only

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

The React dev server listens on `http://localhost:3000`.

## Run the Electron desktop app

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
4. Stage the runtime assets into `appdist/`:
   ```bash
   npm run stage:appdist
   ```
   This copies the backend executable and the first non-empty database seed it finds.
5. Launch Electron:
   ```bash
   npm start
   ```

## Package installers

After the frontend bundle and backend executable have been staged:

```bash
npm run make
```

## Environment variables

Copy `backend/.env.example` to `backend/.env` if you need cloud-backed integrations such as OpenAI embeddings or SEC API access.

## Ollama

Install Ollama from https://ollama.com/download and download the local models you want to use, for example:

```bash
ollama run llama2
ollama run mistral
```

# RUN.md — LoanIQ Complete Run Guide

> Step-by-step guide to install, configure, run, build, and safely deploy LoanIQ.

---

## 📋 Prerequisites

| Tool | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | 18.x LTS | `node --version` |
| **npm** | 9.x | `npm --version` |
| **Git** | any | `git --version` |
| **Browser** | Chrome 90+ / Edge 90+ | (for MediaPipe FaceMesh support) |

> [!IMPORTANT]
> Node.js 18+ is required. MediaPipe Face Mesh requires a modern Chromium-based browser. Safari has limited WebRTC support.

---

## 📦 Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/LoanIQ.git
cd LoanIQ
```

### Step 2 — Install frontend dependencies

```bash
npm install
```

### Step 3 — Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4 — Download Tesseract OCR model (required for PAN OCR)

```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata" -OutFile "backend\eng.traineddata"

# macOS / Linux
curl -L https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata -o backend/eng.traineddata
```

---

## ⚙️ Environment Variable Setup

### Frontend (`.env` in root directory)

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000
```

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
PORT=5000

# CORS — for local dev, leave empty or set:
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# OpenAI (optional)
OPENAI_API_KEY=sk-...your-key-here...

# Firebase
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Admin registration protection (use a strong random secret)
ADMIN_REGISTRATION_SECRET=replace-this-with-a-strong-random-string
```

> [!CAUTION]
> Never commit `backend/.env` or `.env` to git. These files are already excluded by `.gitignore`.

---

## ▶️ Running the Project

### Option A — Run both frontend + backend together (recommended)

```bash
npm run dev
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:8080 |
| **Backend** | http://localhost:5000 |
| **Health Check** | http://localhost:5000/health |

### Option B — Run separately

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
```

---

## 🧪 Running Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 🔍 Linting

```bash
npm run lint
```

---

## 🏗️ Building for Production

```bash
npm run build
```

Output: `dist/` directory — deploy this to any static host.

### Preview the production build locally

```bash
npm run preview
```

---

## 🚀 Deployment

### Frontend — Vercel

1. Connect your GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in Vercel dashboard:
   - `VITE_API_URL` = your backend URL (e.g., `https://your-backend.railway.app`)
5. Deploy

### Backend — Railway / Render / Fly.io

1. Deploy the `backend/` directory as a Node.js app
2. Set start command: `node server.js`
3. Add all environment variables:
   - `NODE_ENV=production`
   - `PORT=5000` (or let platform assign)
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - All `FIREBASE_*` variables
   - `OPENAI_API_KEY` (if using AI explanations)
   - `ADMIN_REGISTRATION_SECRET`
4. Add `eng.traineddata` file — either:
   - Include in deployment (not gitignored at platform level), or
   - Use a startup script to download it:
     ```bash
     curl -L https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata -o eng.traineddata && node server.js
     ```

---

## 🔐 GitHub Push Safety Checklist

Run through this checklist **before every `git push`**:

- [ ] `git status` — no `.env` files staged
- [ ] `git status` — no `backend/eng.traineddata` staged
- [ ] `git status` — no `fake_pan_card.*` files staged
- [ ] `git status` — no `public/test_pan_card.png` staged
- [ ] `git status` — no `tmp/`, `debug_db.cjs`, `test_api.*` staged
- [ ] No hardcoded API keys in any modified files
- [ ] No hardcoded passwords or credentials in any modified files
- [ ] `README.md` doesn't contain real credentials
- [ ] `RUN.md` doesn't contain real credentials

**Quick check command:**

```bash
# Check if any sensitive files are staged
git status --short | grep -E "\.env|traineddata|fake_pan|test_pan|debug_db|test_api"
```

If any of the above appear in staged files, run:
```bash
git restore --staged <filename>
```

---

## 🌐 Public Deployment Safety Checklist

Before making the project publicly accessible:

- [ ] `NODE_ENV=production` set in backend
- [ ] `ALLOWED_ORIGINS` set to exact frontend URL(s) only
- [ ] `ADMIN_REGISTRATION_SECRET` is a strong random value (not default)
- [ ] Firebase credentials are real and properly restricted in Firebase console
- [ ] Firebase Security Rules are configured (deny all by default, allow only what's needed)
- [ ] No debug routes are accessible (e.g., remove or protect `/api/admin/register` in production)
- [ ] Rate limiting added to auth endpoints
- [ ] `npm audit` run and no high/critical vulnerabilities found
- [ ] `cd backend && npm audit` run
- [ ] HTTPS is enforced (handled by Vercel/Railway)
- [ ] Admin password has been set to a strong password (not `123456`)
- [ ] All test/demo admin accounts removed from Firebase

---

## 🔧 Troubleshooting

<details>
<summary><strong>Backend crashes on startup</strong></summary>

**Likely cause:** Missing `backend/.env` file.

**Fix:**
```bash
cp backend/.env.example backend/.env
# Then fill in your Firebase credentials
```

</details>

<details>
<summary><strong>Camera/microphone permission denied</strong></summary>

**Cause:** Browser requires HTTPS or localhost for camera access.

**Fix:** Always run on `http://localhost:8080`. If testing on a LAN IP (e.g., `192.168.x.x`), use a tool like `ngrok` to get an HTTPS tunnel.

</details>

<details>
<summary><strong>OCR doesn't work / PAN not detected</strong></summary>

**Cause:** `backend/eng.traineddata` is missing.

**Fix:** Download it (see Installation Step 4 above).

</details>

<details>
<summary><strong>Frontend shows "Network error" or "Failed to fetch"</strong></summary>

**Cause:** Frontend can't reach the backend.

**Checks:**
1. Is the backend running? Visit `http://localhost:5000/health`
2. Is `VITE_API_URL` set correctly in `.env`?
3. Is there a CORS error in the browser console?

</details>

<details>
<summary><strong>Admin dashboard shows "Live stream connection lost"</strong></summary>

**Cause:** Firebase SSE stream disconnected (common with network changes).

**Fix:** The SSE auto-reconnects. If it persists, check that Firebase is configured correctly and refresh the page.

</details>

<details>
<summary><strong>concurrently: command not found</strong></summary>

**Fix:**
```bash
npm install  # installs concurrently as a dev dependency
```

</details>

<details>
<summary><strong>Port 8080 already in use</strong></summary>

**Fix:**

```bash
# Find what's using port 8080
netstat -ano | findstr :8080   # Windows
lsof -i :8080                  # macOS/Linux

# Or change the port in vite.config.ts
# server: { port: 3000 }
```

</details>

---

## ✅ Final Checklist — Confirm Project is Running

- [ ] `http://localhost:5000/health` returns `{ "status": "ok" }`
- [ ] `http://localhost:8080` loads the PreCheck screen
- [ ] Camera + microphone checks turn green
- [ ] Video KYC liveness detection activates the camera
- [ ] PAN card upload and OCR complete without error
- [ ] Voice questions can be answered and recorded
- [ ] Processing page shows progress animation and navigates to Result
- [ ] Result page shows credit score and decision
- [ ] PDF report downloads successfully
- [ ] Admin dashboard at `/admin/auth` → `/admin` shows applications table
- [ ] User dashboard at `/user/auth` → `/user/dashboard` shows loan history

---

*LoanIQ — Built by Team LoanIQ *

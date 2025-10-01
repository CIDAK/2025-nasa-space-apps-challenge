# Project Setup Guide (Updated for WebXR / Three.js team)

This guide helps get your local dev environment running and test the WebXR experience on desktop and VR headsets (Windows / PowerShell).

## Required software (minimal)

- Node.js (LTS) — https://nodejs.org/ (includes npm)
- Git — https://git-scm.com/
- Visual Studio Code (recommended)

Verify stuff is working:

```powershell
node -v
npm -v
git --version
```

## first time setup 

```powershell
# Open PowerShell in project root
cd <to where you need to be>

# install dependencies already defined (three, webxr-polyfill, vite, etc.)
npm install

# if vite is not yet a devDependency:
npm install --save-dev vite
```

Add helpful npm scripts (run once):

```powershell
npm set-script dev "vite"
npm set-script build "vite build"
npm set-script preview "vite preview"
```

## Run dev server (local)

```powershell
# start vite (default port 5173)
npm run dev

# or directly via npx
npx vite --port 5173
```
Open `localhost` in your browser.

## Where to put assets (RADARSAT images) @DylanPrinsloo (Still busy)

<!-- Place preprocessed image frames and other static assets under:
- project-root/assets/
Vite serves `/assets/` at the site root (e.g. /assets/data_processed/frames/...) -->

<!-- Example file layout:
- /index.html
- /src/main.js
- /assets/data_processed/frames/video_frame_00000.png -->

## Test on headset (Meta Quest / Android-based browsers) @DylanPrinsloo (Still busy)

<!-- Option A — same Wi‑Fi:
1. Find your workstation IP:
```powershell
ipconfig | Select-String -Pattern "IPv4"
```
2. Run vite and bind to host:
```powershell
npx vite --host
# opens on: http://<your-ip>:5173
```
3. On headset browser, navigate to http://<your-ip>:5173

Option B — use ngrok (if network blocks direct access):
```powershell
# install ngrok and expose port 5173
ngrok http 5173
# open the provided https://...ngrok.io URL in headset browser
``` -->

<!-- Notes:
- Use HTTPS (ngrok) if required by headset browser for immersive features. -->

## Build & deploy

Build for production:
```powershell
npm run build
```

Deploy options:

- GitHub Pages: build output -> branch or use GH Pages workflow (**Ideal**)
- <span style="color: grey;">Vercel: connect repo and use npm run build as build command (deploys static output)</span>






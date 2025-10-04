# Project Setup Guide (Updated for WebXR / Three.js team)

This guide helps get your local dev environment running and test the WebXR experience on desktop and VR headsets (Windows / PowerShell).

## Required software (minimal)

- Node.js (LTS) — https://nodejs.org/ (includes npm)
- Git — https://git-scm.com/
- Visual Studio Code (recommended)
- Python 3.x — https://www.python.org/downloads/ (for NASA data downloader)

Verify stuff is working:

```powershell
node -v
npm -v
git --version
python --version
pip --version
```

## First time setup 

```powershell
# Open PowerShell in project root
cd <to where you need to be>

# Install Node.js dependencies (three, webxr-polyfill, vite, etc.)
npm install

# WebXR Setup

- Ensure your browser supports WebXR.
- For Chrome, enable the WebXR extension:
  1. Go to `chrome://flags`
  2. Search for "WebXR"
  3. Enable relevant WebXR flags
  4. Restart the browser
  5. In extensions, find and *install the extension: immersive web emulator*


# Install `iwer` - Device Simulator for Orbital Controls

- Install the `iwer` package:
  ```bash
  npm install iwer
  ```

# If vite is not yet a devDependency:
npm install --save-dev vite
```

Add helpful npm scripts (run once):

```powershell
npm set-script dev "vite"
npm set-script build "vite build"
npm set-script preview "vite preview"
npm set-script fetch-nasa "node src/fetchNasaData.js"
```

## NASA Data Setup

### Install PO.DAAC Data Subscriber

```powershell
# Install NASA's data downloader tool
pip install podaac-data-subscriber

# Add Python Scripts to PATH for current session
$env:Path += ";C:\Users\$env:USERNAME\AppData\Roaming\Python\Python313\Scripts"

# Verify installation
podaac-data-downloader --version
```

### Configure NASA Earthdata credentials

1. Create an account at https://urs.earthdata.nasa.gov/
2. Generate an access token
3. Create a `.env` file in project root:

```env
# See .env.example
```

### Download NASA ocean data

```powershell
# Fetch ocean data for your specified date range
npm run fetch-nasa

# Or use podaac-data-downloader directly
podaac-data-downloader -c MODIS_A-JPL-L2P-v2019.0 -d ./data --start-date 2020-06-10T11:52:20Z --end-date 2020-06-17T11:52:20Z -e .nc
```

Available ocean datasets:
- `MODIS_A-JPL-L2P-v2019.0` - MODIS Aqua Sea Surface Temperature
- `VIIRS_NPP-OSPO-L2P-v2.61` - VIIRS Sea Surface Temperature
- `AVHRRMTC_G-NAVO-L2P-v2.0` - AVHRR Sea Surface Temperature
- `SMAP_RSS_L3_SSS_SMI_8DAY-RUNNINGMEAN_V5` - SMAP Sea Surface Salinity

Downloaded data will be saved to `./data/` directory.

## Run dev server (local)

```powershell
# Start vite (default port 5173)
npm run dev

# Or directly via npx
npx vite --port 5173
```
Open `localhost:5173` in your browser.

## Project Structure

```
project-root/
├── data/                          # NASA ocean data (NetCDF files & metadata)
│   ├── MODIS_A-JPL-L2P-v2019.0_metadata.json
│   ├── VIIRS_NPP-OSPO-L2P-v2.61_metadata.json
│   └── *.nc                       # NetCDF data files
├── assets/                        # Static assets for VR experience
│   └── data_processed/            # Preprocessed ocean visualization frames
├── src/
│   ├── main.js                    # Three.js VR scene
│   ├── fetchNasaData.js           # NASA data fetcher
│   └── components/                # VR components
├── index.html
├── .env                           # NASA API credentials (DO NOT COMMIT)
└── package.json
```

## Where to put assets (Ocean data visualization)

Place preprocessed image frames and other static assets under:
- `project-root/assets/data_processed/frames/`

Vite serves `/assets/` at the site root (e.g. `/assets/data_processed/frames/...`)

Example file layout:
```
/index.html
/src/main.js
/assets/data_processed/frames/ocean_sst_00000.png
/data/MODIS_A-JPL-L2P-v2019.0.nc
```

## Test on headset (Meta Quest / Android-based browsers)

### Option A — Same Wi‑Fi network:

1. Find your workstation IP:
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

2. Run vite and bind to host:
```powershell
npx vite --host
# Opens on: http://<your-ip>:5173
```

3. On headset browser, navigate to `http://<your-ip>:5173`

### Option B — Use ngrok (if network blocks direct access):

```powershell
# Install ngrok: https://ngrok.com/download
# Expose port 5173
ngrok http 5173

# Open the provided https://...ngrok.io URL in headset browser
```

**Notes:**
- Use HTTPS (ngrok) if required by headset browser for immersive WebXR features
- Ensure firewall allows connections on port 5173

## Build & deploy

Build for production:
```powershell
npm run build
```

Deploy options:

- **GitHub Pages** (Recommended): 
  - Build output -> `gh-pages` branch
  - Or use GitHub Actions workflow for automatic deployment
  
- Vercel: 
  - Connect repo and use `npm run build` as build command
  - Deploys static output automatically

## Troubleshooting

### Python scripts not found
If `podaac-data-downloader` is not recognized:
```powershell
# Add to PATH permanently (Run PowerShell as Administrator)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\$env:USERNAME\AppData\Roaming\Python\Python313\Scripts", [EnvironmentVariableTarget]::User)

# Restart PowerShell
```

### No data downloaded
- Verify your `.env` file has a valid `EARTHDATA_TOKEN`
- Check that the date range has available data for the dataset
- Review `./data/*_metadata.json` files to see what's available

### VR not working in browser
- Ensure you're using HTTPS (required for WebXR)
- Check browser compatibility: Chrome, Edge, or Meta Quest Browser
- Enable WebXR flags if needed in `chrome://flags`

## NASA Data Resources

- **NASA Earthdata**: https://urs.earthdata.nasa.gov/
- **PO.DAAC Data Catalog**: https://podaac.jpl.nasa.gov/
- **NASA Worldview**: https://worldview.earthdata.nasa.gov/ (for visual data exploration)
- **CMR API Docs**: https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html




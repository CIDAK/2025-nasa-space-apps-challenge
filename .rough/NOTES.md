# OpenXR project (C#, C++, CMake, .NET SDK)

> Purpose: a single-page setup guide for the team — what to install, how to get a minimal C++ and C# project building in VS Code, platform notes and quick troubleshooting.

# Create immersive spaces (might be useful for a first-experience with VR)
Create your own demo space with Wonda Spaces, a browser-based VR creation platform that lets you craft immersive environments without needing advanced technical skills.
### Multimedia Integration (2D, 3D, 360° Media)
Add interactive 2D images, video, 3D objects, and 360° media into your immersive space. All these media types are accessible across VR headsets, desktops, tablets, and mobile devices.

### Flexible Templates for Quick Setups
Jumpstart your project using ready-made templates like 3D rooms (e.g., meeting spaces, art galleries), a 360° virtual tour, or a blank canvas for custom layouts.

> https://spaces.wondavr.com/

---

## Project overview

* Languages: **C#**, **C++**
* Build tools: **CMake**, **.NET SDK**
* Target: native OpenXR runtime on the developer machine (SteamVR, Windows Mixed Reality, vendor runtimes) and the OpenXR loader from the Khronos SDK. ([The Khronos Group][1], [GitHub][2])

---

## Key downloads / references (authoritative)

* **OpenXR SDK (headers, loader, samples, validation layers)** — Khronos OpenXR SDK repo. ([GitHub][2])
* **OpenXR runtime / getting started (Windows Mixed Reality + tools)** — Microsoft OpenXR Getting Started. (Use this to install the runtime & tools on Windows). ([Microsoft Learn][3])
* **CMake** — official download and docs. ([CMake][4])
* **.NET SDK** — official download / install page for SDK (Windows / Linux / macOS). ([Microsoft][5])
* **Visual Studio Code** — download and setup instructions. ([Visual Studio Code][6])
* **C# OpenXR bindings** — popular choice: **Silk.NET.OpenXR** (NuGet) and other OpenXR .NET bindings; use NuGet to add a binding for managed development. ([NuGet][7], [dotnet.github.io][8])

---

## Prerequisites — per platform

### Windows

1. Install **VS Code**. ([Visual Studio Code][6])
2. Install **.NET SDK** (choose the LTS/latest SDK you’ll target). See Microsoft download. ([Microsoft][5])
3. Install **Visual Studio Build Tools** (C++ workload) if you want MSVC for C++ builds (or install full Visual Studio). This gives cl.exe and the MSVC toolchain. ([Visual Studio][9])
4. Install **CMake** (official installer or via package manager). ([CMake][4])
5. Install an **OpenXR runtime**:

   * Windows Mixed Reality: install **OpenXR Tools for Windows Mixed Reality** from Microsoft Store and set the runtime per Microsoft docs. ([Microsoft Learn][3])
   * Or: install **SteamVR** and set SteamVR as the system OpenXR runtime (SteamVR settings). ([flightsimulator.zendesk.com][10])
6. Optional: install Git, and any GPU drivers required by your headset.

### Linux (Ubuntu example)

```bash
sudo apt update
sudo apt install -y build-essential git cmake
# For .NET follow distro-specific MS docs (link above) for the right repo/package.
````

* Install .NET SDK per Microsoft docs for your distro. (\[Microsoft]\[5])
* Install an OpenXR runtime supported on your distro (e.g., SteamVR on Linux, vendor runtimes). Follow runtime vendor docs.

### macOS

* Install Xcode command line tools:

```bash
xcode-select --install
```

* Install Homebrew if desired then:

```bash
brew install cmake git
```

* Install .NET SDK from the .NET download page or via brew cask. (\[Microsoft]\[5])

---

## Quick setup — repo + VS Code (team template)

1. Create repo skeleton:

```
/MyOpenXRApp
  /cpp          # native C++ code + CMakeLists.txt
  /csharp       # .NET console / library projects
  NOTES.md
```

2. Recommended VS Code extensions: C/C++ (Microsoft), CMake Tools, C# (OmniSharp / .NET), ms-vscode.cpptools, and GitLens.

---

## C++ quickstart (CMake)

**Goal:** build a tiny app that creates an OpenXR instance.

1. Clone the Khronos SDK or at least get the headers/loader (you can either build the loader from source or use platform-packaged loader). (\[GitHub]\[2])

2. Minimal `CMakeLists.txt` (place in `/cpp`):

```cmake
cmake_minimum_required(VERSION 3.15)
project(MyOpenXRApp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)

# Prefer a system-installed OpenXR; otherwise point CMake at the loader/headers.
find_package(OpenXR REQUIRED)        # requires an OpenXR package/config on the system

add_executable(MyOpenXRApp main.cpp)
target_link_libraries(MyOpenXRApp PRIVATE OpenXR::openxr_loader)
```

3. `main.cpp` (very small smoke-test):

```cpp
#include <openxr/openxr.h>
#include <iostream>
#include <cstring>

int main() {
    XrInstance instance = XR_NULL_HANDLE;
    XrInstanceCreateInfo createInfo{XR_TYPE_INSTANCE_CREATE_INFO};
    strncpy(createInfo.applicationInfo.applicationName, "MyOpenXRApp", XR_MAX_APPLICATION_NAME_SIZE);
    createInfo.applicationInfo.applicationVersion = 1;
    strncpy(createInfo.applicationInfo.engineName, "TeamEngine", XR_MAX_ENGINE_NAME_SIZE);
    createInfo.applicationInfo.engineVersion = 1;
    createInfo.applicationInfo.apiVersion = XR_CURRENT_API_VERSION;

    XrResult res = xrCreateInstance(&createInfo, &instance);
    if (XR_FAILED(res)) {
        std::cerr << "xrCreateInstance failed: " << res << '\n';
        return -1;
    }
    std::cout << "OpenXR instance created\n";
    xrDestroyInstance(instance);
    return 0;
}
```

4. Build (generic):

```bash
cd cpp
mkdir build && cd build
cmake ..      # optionally: -G "Visual Studio 17 2022" -A x64 on Windows
cmake --build .
```

**Notes**

* On Windows you can also reference the prebuilt OpenXR loader via the `OpenXR.Loader` NuGet for Visual Studio C++ scenarios. (\[Microsoft Learn]\[3])
* If `find_package(OpenXR)` fails, point CMake at the loader include/lib from the Khronos SDK or install the OS-provided package.

---

## C# quickstart (.NET) — managed bindings

**Option:** use a maintained NuGet binding such as **Silk.NET.OpenXR** or other OpenXR C# bindings. Silk.NET provides high-performance bindings and is commonly used. (\[NuGet]\[7], \[dotnet.github.io]\[8])

1. Create project:

```bash
dotnet new console -n MyOpenXRAppCSharp
cd MyOpenXRAppCSharp
```

2. Add a managed OpenXR binding (example: Silk.NET.OpenXR):

```bash
dotnet add package Silk.NET.OpenXR
```

3. Build & run:

```bash
dotnet build
dotnet run
```

4. Next steps in C#:

* Read Silk.NET OpenXR docs/examples for instance creation and session management. (\[dotnet.github.io]\[8], \[NuGet]\[7])

---

# High-level & Low-level — to append to `NOTES.md`

> Add the sections below to the end of `NOTES.md`. They give (1) a **high-level** conceptual summary for quick team onboarding and (2) a **low-level** walkthrough & checklist that a developer can follow to get the Win32 + D3D11 + OpenXR flow running (emulator-friendly).

---

# High-level understanding

## Goal

Build an XR application **without an engine** using **OpenXR** for XR system/api calls and a **Win32 + D3D11** mirror window for desktop debug/display. The app talks to the OpenXR *runtime* (real headset runtime or emulator) to create sessions, submit frames and read input.

## Core idea

* Your app implements the rendering and app logic.
* OpenXR is the middleware between your app and the runtime (runtime manages headset, tracking, compositor).
* Graphics resources are shared with the runtime via a *graphics binding* (D3D11/D3D12/Vulkan).
* The mirror window is just a normal Win32 window; each frame you copy/blit the XR swapchain image(s) into that window’s backbuffer to show what the runtime/HMD would see.

## Why do this?

* No engine dependency → full control and smaller runtime footprint.
* Easier to debug platform-specific code and integrate into existing native apps.
* Works with headless development using vendor simulators, SteamVR null driver, or mock runtimes.

---

# Low-level architecture & setup

## Components (what you must implement)

1. **Win32 window** — a standard desktop window for the mirror output and UI.
2. **D3D11 device & DXGI swapchain** — for the mirror window presentation.
3. **OpenXR instance** — `xrCreateInstance(...)` (application info, enabled extensions).
4. **OpenXR system** — `xrGetSystem(...)` to obtain `XrSystemId` for HMD form factor.
5. **Graphics binding** — pass `XrGraphicsBindingD3D11KHR` in the `pNext` chain of `XrSessionCreateInfo`.
6. **OpenXR session** — `xrCreateSession(...)`.
7. **OpenXR swapchains** — create textures the runtime will present; get `ID3D11Texture2D*` handles to render into.
8. **Frame loop** — `xrWaitFrame` → `xrBeginFrame` → acquire/ wait/ render/ release swapchain images → `xrEndFrame`.
9. **Mirror logic** — copy XR swapchain textures into your window backbuffer and present with DXGI.

## Minimal Windows/D3D11 wiring (concise checklist + snippets)

### Prereqs (developer machine)

* Windows SDK, GPU drivers up-to-date.
* Visual Studio Build Tools or same compilers for CMake.
* CMake (≥3.15 recommended).
* .NET SDK only if you need managed projects; core flow below is C++/native.
* An OpenXR runtime or emulator installed (SteamVR, Meta XR Simulator, Microsoft OpenXR Tools, or a mock runtime).

### Basic steps to implement

1. Create Win32 window and message loop.
2. Create D3D11 device + immediate context + DXGI swapchain for the mirror.
3. Create OpenXR Instance:

```cpp
XrInstanceCreateInfo ic{XR_TYPE_INSTANCE_CREATE_INFO};
strncpy(ic.applicationInfo.applicationName, "MyApp", XR_MAX_APPLICATION_NAME_SIZE);
ic.applicationInfo.apiVersion = XR_CURRENT_API_VERSION;
xrCreateInstance(&ic, &instance);
```

4. Query system:

```cpp
XrSystemGetInfo sgi{XR_TYPE_SYSTEM_GET_INFO};
sgi.formFactor = XR_FORM_FACTOR_HEAD_MOUNTED_DISPLAY;
xrGetSystem(instance, &sgi, &systemId);
```

5. Create session with D3D11 binding:

```cpp
XrGraphicsBindingD3D11KHR d3dBinding{XR_TYPE_GRAPHICS_BINDING_D3D11_KHR};
d3dBinding.device = d3dDevice; // ID3D11Device*
XrSessionCreateInfo sci{XR_TYPE_SESSION_CREATE_INFO};
sci.next = &d3dBinding;
sci.systemId = systemId;
xrCreateSession(instance, &sci, &session);
```

6. Create swapchain(s) from recommended view sizes (use `xrEnumerateViewConfigurationViews`), then call `xrEnumerateSwapchainImages` and keep the `ID3D11Texture2D*` objects for rendering.
7. Enter frame loop:

   * `xrWaitFrame` → `xrBeginFrame`
   * `xrAcquireSwapchainImage` → `xrWaitSwapchainImage`
   * Render into `ID3D11Texture2D*` provided by the swapchain image array.
   * `xrReleaseSwapchainImage`
   * Build `XrCompositionLayerProjection` and `xrEndFrame`
   * Mirror: copy XR texture to DXGI back buffer and `Present()`

### CMake (minimal)

```cmake
cmake_minimum_required(VERSION 3.15)
project(MyXRWin32 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)

find_package(OpenXR REQUIRED)

add_executable(MyXRWin32 main.cpp Win32Helpers.cpp ...)
target_link_libraries(MyXRWin32 PRIVATE OpenXR::openxr_loader d3d11 dxgi user32)
```

### Useful helper notes

* Always query runtime for **recommended formats and sizes**. Don’t hardcode a resolution.
* Use `XrSwapchainImageD3D11KHR` array returned by `xrEnumerateSwapchainImages` — that gives the D3D textures to render into.
* Keep error checks and logging on every `XrResult`.
* Use Khronos validation layers during development for helpful runtime warnings/errors.
* For mirror, you may `CopyResource` from the XR texture to your DXGI back buffer (ensure the formats match or perform a shader blit if needed).

## Emulator / simulator specifics (no headset)

* Use a vendor simulator (Meta XR Simulator, Microsoft WMR simulator) or SteamVR null driver. These register as the system OpenXR runtime and will accept your same OpenXR calls.
* Emulators generally provide a mirror window showing headset output and UI to manipulate simulated HMD/controller poses.
* You still need a GPU and D3D device — emulators simulate the headset but not the GPU.

---

# Example developer checklist (ready-to-run)

* [ ] Install CMake and Visual Studio Build Tools (Windows SDK).
* [ ] Install an OpenXR runtime or simulator (SteamVR or Meta/Microsoft simulator).
* [ ] Clone repo skeleton: `/cpp` for native code, `/csharp` for managed (if needed).
* [ ] Build and run the smoke-test that:

  * creates an OpenXR instance;
  * calls `xrGetSystem` and logs the `XrSystemId`;
  * creates a session with the D3D11 binding; then exits.
* [ ] If smoke-test succeeds, create swapchain and run single-frame rendering that copies to a Win32 mirror window.
* [ ] Enable validation layers and test on an emulator, then test on hardware when available.

---

# Troubleshooting quick hits

* `xrCreateInstance` fails → check the active runtime; ensure a runtime is installed and selected.
* `xrGetSystem` fails → runtime may not expose HMD form factor; verify runtime settings or simulator type.
* `xrCreateSession` fails → verify graphics binding type, D3D device compatibility, and that the binding pNext was set properly.
* Mirror shows black → ensure swapchain images are rendered and `CopyResource` uses the right resource states and formats.

---

# Next deliverables I can generate for you (pick any)

* Full `cpp/` starter project: `CMakeLists.txt`, `main.cpp` — implementing Win32 + D3D11 + OpenXR minimal loop (create instance → session → single swapchain → render+mirror).
* A compact README with build & run commands for Windows + emulator steps.
* A C# equivalent skeleton using Silk.NET (if you want managed tooling).

If you want those starter files, tell me “generate the Windows starter project (D3D11)” and I’ll produce the files (CMake + source + README) ready to copy into your repo.

```

Want me to drop the Windows D3D11 starter project into this chat now?
::contentReference[oaicite:0]{index=0}
```

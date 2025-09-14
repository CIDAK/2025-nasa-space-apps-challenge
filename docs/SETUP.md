# Project Setup Guide

### Required Software
1. **Visual Studio Code** - [Download here](https://code.visualstudio.com/)
2. **Visual Studio Build Tools** (C++ workload) - [Download here](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
3. **CMake** - [Download here](https://cmake.org/download/)
4. **.NET SDK** (Latest LTS) - [Download here](https://dotnet.microsoft.com/download)
5. **Git** - [Download here](https://git-scm.com/downloads)

### OpenXR Runtime
- **Windows Mixed Reality** - Install "OpenXR Tools for Windows Mixed Reality" from Microsoft Store

## Step-by-Step Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-repo/2025-nasa-space-apps-challenge.git
cd 2025-nasa-space-apps-challenge
```

### Step 2: Install VS Code Extensions
Open VS Code and install these extensions:
- **C/C++** (Microsoft)
- **CMake Tools** (Microsoft)
- **C# Dev Kit** (Microsoft)
- **GitLens** (GitKraken)

### Step 3: Verify Installations
Open terminal in VS Code and run:
```bash
# Check CMake
cmake --version

# Check .NET SDK
dotnet --version

# Check Git
git --version
```

### Step 4: Build C++ Project
```bash
cd cpp
mkdir build
cd build
cmake ..
cmake --build .
```

### Step 5: Build C# Project
```bash
cd csharp
dotnet restore
dotnet build
```

### Step 6: Test OpenXR Runtime
Run the smoke test:
```bash
# From cpp/build directory
./MyOpenXRApp.exe
```

You should see: `OpenXR instance created`




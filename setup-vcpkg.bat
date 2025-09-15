@echo off
echo Setting up vcpkg and dependencies...

REM Clean previous build
if exist "src\build" (
    echo Cleaning previous build...
    rmdir /s /q "src\build"
)

REM Clone vcpkg if not exists
if not exist "vcpkg" (
    echo Cloning vcpkg...
    git clone https://github.com/Microsoft/vcpkg.git
)

cd vcpkg

REM Bootstrap vcpkg
if not exist "vcpkg.exe" (
    echo Bootstrapping vcpkg...
    call bootstrap-vcpkg.bat
)

REM Integrate vcpkg with Visual Studio
vcpkg integrate install

echo.
echo Installing dependencies...
vcpkg install openxr-loader:x64-windows
vcpkg install glfw3:x64-windows

echo.
echo vcpkg setup complete!
cd ..

echo.
echo Building project with vcpkg...
cmake -S . -B src/build -DCMAKE_TOOLCHAIN_FILE=vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build src/build --config Release

echo.
echo Build complete! Testing...
if exist "src\build\bin\Release\OceanVRTest.exe" (
    echo Running test mode...
    src\build\bin\Release\OceanVRTest.exe --test-mode
    echo.
    echo Running window test...
    src\build\bin\Release\OceanVRTest.exe --window-test
) else (
    echo Build failed - executable not found
    dir src\build\bin /s
)

pause
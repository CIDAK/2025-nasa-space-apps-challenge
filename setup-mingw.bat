@echo off
echo Installing MinGW via Chocolatey...

REM Install chocolatey if not present
where choco >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Chocolatey...
    @"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
)

REM Install MinGW
choco install mingw -y

REM Refresh PATH
refreshenv

echo.
echo Building with MinGW...
cmake -S . -B src/build -G "MinGW Makefiles"
cmake --build src/build

echo.
echo Testing build...
src\build\bin\OceanVRTest.exe --test-mode

pause
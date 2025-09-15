#include <iostream>
#include <windows.h>
#include "OpenXRManager.h"
#include <GL/gl.h>

int main(int argc, char* argv[]) {
    std::cout << "Ocean VR Experience - OpenXR Integration Test" << std::endl;
    std::cout << "=============================================" << std::endl;
    
    // Check command line arguments
    bool testMode = false;
    bool windowTest = false;
    
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--test-mode") testMode = true;
        if (arg == "--window-test") windowTest = true;
    }
    
    if (testMode) {
        std::cout << "Running setup verification..." << std::endl;
        
        // Test 1: C++ compiler
        std::cout << "✓ C++ compiler working" << std::endl;
        
        // Test 2: Windows API access
        DWORD version = GetVersion();
        std::cout << "✓ Windows API accessible" << std::endl;
        
        // Test 3: Check for OpenXR registry entries (FIXED Unicode issue)
        HKEY hKey;
        LONG result = RegOpenKeyExA(HKEY_LOCAL_MACHINE, 
                                    "SOFTWARE\\Khronos\\OpenXR\\1",  // Use ANSI string (no L prefix)
                                    0, KEY_READ, &hKey);
        
        if (result == ERROR_SUCCESS) {
            std::cout << "✓ OpenXR runtime detected" << std::endl;
            RegCloseKey(hKey);
        } else {
            std::cout << "⚠ OpenXR runtime not found - install Windows Mixed Reality" << std::endl;
        }
        
        std::cout << "\nSetup verification complete!" << std::endl;
        return 0;
    }
    
    if (windowTest) {
        std::cout << "Running window test..." << std::endl;
        
        // Create OpenXR manager
        OpenXRManager xrManager;
        
        // Test 1: Create window
        if (!xrManager.CreateVRWindow(1280, 720)) {
            std::cerr << "Failed to create window" << std::endl;
            return 1;
        }
        
        // Test 2: Initialize OpenXR
        if (!xrManager.Initialize()) {
            std::cerr << "Failed to initialize OpenXR" << std::endl;
            return 1;
        }
        
        std::cout << "\n🌊 Ocean VR Experience Window Test" << std::endl;
        std::cout << "Window should appear with ocean blue background" << std::endl;
        std::cout << "Close the window to exit..." << std::endl;
        
        // Main loop
        while (!xrManager.WindowShouldClose() && !xrManager.ShouldExit()) {
            // Poll window events
            xrManager.PollWindowEvents();
            
            // Poll OpenXR events
            xrManager.PollEvents();
            
            // Clear screen with ocean blue
            glClearColor(0.1f, 0.3f, 0.6f, 1.0f); // Ocean blue
            glClear(GL_COLOR_BUFFER_BIT);
            
            // Swap buffers
            xrManager.SwapBuffers();
        }
        
        std::cout << "Window test completed successfully!" << std::endl;
        return 0;
    }
    
    std::cout << "Ocean VR Experience ready!" << std::endl;
    std::cout << "Available test modes:" << std::endl;
    std::cout << "  --test-mode     : Run setup verification" << std::endl;
    std::cout << "  --window-test   : Test window creation" << std::endl;
    
    return 0;
}
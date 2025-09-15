#pragma once

#include <iostream>
#include <string>

// Forward declarations to avoid heavy includes in header
struct GLFWwindow;

class OpenXRManager {
public:
    OpenXRManager();
    ~OpenXRManager();

    // Core functionality
    bool Initialize();
    void Shutdown();
    
    // Window management (renamed to avoid Windows API macro conflicts)
    bool CreateVRWindow(int width = 1280, int height = 720);  
    void DestroyVRWindow();                                   
    bool WindowShouldClose() const;
    void SwapBuffers();
    void PollWindowEvents();
    
    // Event handling
    bool PollEvents();
    bool IsSessionActive() const { return m_sessionRunning; }
    bool ShouldExit() const { return m_exitRequested; }

private:
    GLFWwindow* m_window = nullptr;
    bool m_sessionRunning = false;
    bool m_exitRequested = false;
};
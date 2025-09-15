#include <iostream>
#include <windows.h>
#include "OpenXRManager.h"
#include <GLFW/glfw3.h>

OpenXRManager::OpenXRManager() {
    std::cout << "OpenXR Manager initialized" << std::endl;
}

OpenXRManager::~OpenXRManager() {
    Shutdown();
    DestroyVRWindow();
}

bool OpenXRManager::CreateVRWindow(int width, int height) {
    std::cout << "Creating GLFW window..." << std::endl;
    
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return false;
    }
    
    // Set window hints for OpenGL context
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    
    m_window = glfwCreateWindow(width, height, "Ocean VR Experience - Test Window", nullptr, nullptr);
    if (!m_window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return false;
    }
    
    glfwMakeContextCurrent(m_window);
    glfwSwapInterval(1); // Enable vsync
    
    std::cout << "✓ GLFW window created successfully (" << width << "x" << height << ")" << std::endl;
    return true;
}

void OpenXRManager::DestroyVRWindow() {
    if (m_window) {
        glfwDestroyWindow(m_window);
        m_window = nullptr;
        glfwTerminate();
        std::cout << "✓ Window destroyed" << std::endl;
    }
}

bool OpenXRManager::WindowShouldClose() const {
    return m_window ? glfwWindowShouldClose(m_window) : true;
}

void OpenXRManager::SwapBuffers() {
    if (m_window) {
        glfwSwapBuffers(m_window);
    }
}

void OpenXRManager::PollWindowEvents() {
    glfwPollEvents();
}

bool OpenXRManager::Initialize() {
    std::cout << "Initializing OpenXR (basic mode)..." << std::endl;
    
    // For now, just basic initialization
    // We'll add full OpenXR integration once window works
    m_sessionRunning = true;
    
    std::cout << "✓ OpenXR basic initialization complete" << std::endl;
    std::cout << "  Note: Full VR features will be added after window test" << std::endl;
    return true;
}

bool OpenXRManager::PollEvents() {
    // Basic event polling - no actual OpenXR events yet
    // This will be expanded when we add real OpenXR integration
    return !m_exitRequested;
}

void OpenXRManager::Shutdown() {
    if (m_sessionRunning) {
        m_sessionRunning = false;
        std::cout << "✓ OpenXR shutdown complete" << std::endl;
    }
}
# Find required packages
find_package(OpenGL REQUIRED)

# Find vcpkg packages
find_package(PkgConfig QUIET)
find_package(openxr CONFIG REQUIRED)
find_package(glfw3 CONFIG REQUIRED)

# Source files (use actual file locations)
set(SOURCES
    main.cpp
    OpenXRManager.cpp
)

# Header files
set(HEADERS
    OpenXRManager.h
)

# Create executable
add_executable(OceanVRTest ${SOURCES} ${HEADERS})

# Include directories
target_include_directories(OceanVRTest PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)

# Link libraries using vcpkg targets
target_link_libraries(OceanVRTest PRIVATE
    OpenXR::openxr_loader
    glfw
    OpenGL::GL
)

# Set output directory
set_target_properties(OceanVRTest PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)
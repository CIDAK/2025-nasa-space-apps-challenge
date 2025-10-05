import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRDevice, metaQuest3 } from 'iwer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export default function NASAOceanVR() {
  const containerRef = useRef(null);
  const astronautSceneRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomMode, setZoomMode] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null); // Add this new state
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // RADARSAT frame states
  const [radarsatFrames, setRadarsatFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [radarsatPanel, setRadarsatPanel] = useState(null);
  const [showRadarsatPanel, setShowRadarsatPanel] = useState(false);

  // Movement/Teleport states
  const [teleportPoints, setTeleportPoints] = useState([]);
  const [currentTeleportIndex, setCurrentTeleportIndex] = useState(0);
  const [isTeleporting, setIsTeleporting] = useState(false);

  // Add refs to track current state for event handlers
  const zoomModeRef = useRef(false);
  const targetObjectRef = useRef(null);

  // Astronaut scene refs
  const astronautRendererRef = useRef(null);
  const astronautCameraRef = useRef(null);
  const astronautRef = useRef(null);

  // Main scene refs for teleportation
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const isTeleportingRef = useRef(false);

  // ===============================
  // ASTRONAUT MINI SCENE SETUP
  // ===============================
  useEffect(() => {
    if (!selectedObject || !astronautSceneRef.current) return;

    // Clear previous scene if it exists
    if (astronautRendererRef.current) {
      // Check if the DOM element exists and is a child before removing
      if (
        astronautRendererRef.current.domElement &&
        astronautSceneRef.current &&
        astronautSceneRef.current.contains(
          astronautRendererRef.current.domElement,
        )
      ) {
        astronautSceneRef.current.removeChild(
          astronautRendererRef.current.domElement,
        );
      }
      astronautRendererRef.current.dispose();
      astronautRendererRef.current = null;
    }

    // Create mini scene for astronaut
    const astronautScene = new THREE.Scene();
    astronautScene.background = new THREE.Color(0x000000); // Pure black background

    // Create camera for astronaut scene
    const astronautCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);

    astronautCamera.position.set(0, 0, 12); // Moved closer for larger astronaut
    astronautCameraRef.current = astronautCamera;

    // Create renderer for astronaut scene
    const astronautRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    astronautRenderer.setSize(120, 120);
    astronautRenderer.setPixelRatio(window.devicePixelRatio);
    astronautRenderer.outputColorSpace = THREE.SRGBColorSpace;
    astronautRenderer.setClearColor(0x000000, 1); // Pure black background
    astronautRendererRef.current = astronautRenderer;

    // Enhanced lighting for astronaut scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Increased ambient light
    astronautScene.add(ambientLight);

    // Multiple directional lights for better illumination
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 5, 5);
    astronautScene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, -5, 5);
    astronautScene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(0, -5, -5);
    astronautScene.add(directionalLight3);

    // Add rim lighting for better definition
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    rimLight.position.set(-10, 0, -10);
    astronautScene.add(rimLight);

    // Create orbit controls for astronaut scene
    let astronautControls = null;

    // Store animation frame ID for cleanup
    let animationFrameId = null;

    // Mouse interaction variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = new THREE.Spherical();
    spherical.setFromVector3(astronautCamera.position);

    // Mouse event handlers for 360 view
    function onMouseDown(event) {
      isDragging = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
      event.preventDefault();
    }

    function onMouseMove(event) {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      // Update spherical coordinates
      spherical.theta -= deltaMove.x * 0.01; // Horizontal rotation
      spherical.phi += deltaMove.y * 0.01; // Vertical rotation

      // Limit vertical rotation
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      // Update camera position
      astronautCamera.position.setFromSpherical(spherical);
      astronautCamera.lookAt(0, 0, 0);

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    function onMouseUp() {
      isDragging = false;
    }

    // Mouse wheel for zoom in astronaut scene
    function onWheel(event) {
      event.preventDefault();

      const delta = event.deltaY * 0.01;
      spherical.radius += delta;
      spherical.radius = Math.max(8, Math.min(20, spherical.radius)); // Limit zoom range

      astronautCamera.position.setFromSpherical(spherical);
      astronautCamera.lookAt(0, 0, 0);
    }

    // Load astronaut model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/assets/3Dmodels/cute_astronaut.glb',
      (gltf) => {
        const astronaut = gltf.scene;
        astronautRef.current = astronaut;

        // Enhance astronaut materials with better lighting response
        astronaut.traverse((child) => {
          if (child.isMesh) {
            if (child.material) {
              // Remove emissive for more realistic lighting
              child.material.emissive = new THREE.Color(0x000000);
              child.material.emissiveIntensity = 0;
              child.material.needsUpdate = true;

              // Enhance material properties for better lighting
              if (child.material.color) {
                child.material.color.multiplyScalar(1.8); // Brighter base color
              }

              // Add roughness and metalness for better material response
              if (child.material.roughness !== undefined) {
                child.material.roughness = 0.7;
              }
              if (child.material.metalness !== undefined) {
                child.material.metalness = 0.1;
              }
            }
          }
        });

        // Center and scale the astronaut to be larger
        const box = new THREE.Box3().setFromObject(astronaut);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the astronaut at origin (0, 0, 0)
        astronaut.position.set(-1, -3, -center.z);

        // Scale to be larger - fill more of the scene
        const maxDimension = Math.max(size.x, size.y, size.z);
        const targetSize = 10; // Increased from 8 to make astronaut larger
        const scale = targetSize / maxDimension;
        astronaut.scale.set(scale, scale, scale);

        astronautScene.add(astronaut);
      },
      undefined,
      (error) => {
        console.error('Failed to load astronaut for mini scene:', error);
        // Create larger fallback astronaut
        const fallbackGeometry = new THREE.BoxGeometry(8, 10, 5); // Larger fallback
        const fallbackMaterial = new THREE.MeshLambertMaterial({
          color: 0xffffff,
        });
        const astronaut = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        astronautRef.current = astronaut;
        astronautScene.add(astronaut);
      },
    );

    // Add renderer to DOM and attach event listeners
    if (astronautSceneRef.current && astronautRenderer.domElement) {
      astronautSceneRef.current.appendChild(astronautRenderer.domElement);

      // Add mouse event listeners to the astronaut renderer canvas
      const canvas = astronautRenderer.domElement;
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseUp);
      canvas.addEventListener('wheel', onWheel);

      // Set cursor style
      canvas.style.cursor = 'grab';
      canvas.addEventListener('mousedown', () => {
        canvas.style.cursor = 'grabbing';
      });
      canvas.addEventListener('mouseup', () => {
        canvas.style.cursor = 'grab';
      });
    }

    // Animation loop for astronaut scene
    function animateAstronaut() {
      if (!astronautRendererRef.current || !selectedObject) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        return;
      }

      animationFrameId = requestAnimationFrame(animateAstronaut);

      // Optional: Add subtle rotation when not being dragged
      if (!isDragging && astronautRef.current) {
        astronautRef.current.rotation.y += 0.005; // Slow auto-rotation
      }

      astronautRenderer.render(astronautScene, astronautCamera);
    }

    animateAstronaut();

    // Cleanup function
    return () => {
      // Cancel animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Remove event listeners
      if (astronautRendererRef.current?.domElement) {
        const canvas = astronautRendererRef.current.domElement;
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
        canvas.removeEventListener('wheel', onWheel);
      }

      // Clean up renderer
      if (astronautRendererRef.current) {
        // Check if the DOM element exists and is a child before removing
        if (
          astronautRendererRef.current.domElement &&
          astronautSceneRef.current &&
          astronautSceneRef.current.contains(
            astronautRendererRef.current.domElement,
          )
        ) {
          try {
            astronautSceneRef.current.removeChild(
              astronautRendererRef.current.domElement,
            );
          } catch (error) {
            console.warn(
              'Could not remove astronaut renderer DOM element:',
              error,
            );
          }
        }

        // Dispose of renderer
        try {
          astronautRendererRef.current.dispose();
        } catch (error) {
          console.warn('Could not dispose astronaut renderer:', error);
        }

        astronautRendererRef.current = null;
      }

      // Clear astronaut reference
      astronautRef.current = null;
    };
  }, [selectedObject]);
  // End astronaut scene setup useEffect

  // ===============================
  // RADARSAT FRAME LOADING FUNCTIONALITY
  // ===============================

  // Function to load RADARSAT frames
  const loadRadarsatFrames = () => {
    const framePaths = [
      '/assets/data_processed/frames/radarsat_frame_001.png',
      '/assets/data_processed/frames/radarsat_frame_002.png',
      '/assets/data_processed/frames/radarsat_frame_003.png',
    ];

    const textureLoader = new THREE.TextureLoader();
    const loadedFrames = [];

    framePaths.forEach((path, index) => {
      textureLoader.load(
        path,
        (texture) => {
          loadedFrames[index] = {
            texture: texture,
            path: path,
            index: index,
          };

          // Check if all frames are loaded
          if (
            loadedFrames.filter((frame) => frame !== undefined).length ===
            framePaths.length
          ) {
            setRadarsatFrames(loadedFrames);
            console.log('All RADARSAT frames loaded successfully');
          }
        },
        undefined,
        (error) => {
          console.warn(`Failed to load RADARSAT frame ${index + 1}:`, error);
          // Create fallback texture
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');

          // Create a gradient representing ocean data
          const gradient = ctx.createLinearGradient(0, 0, 512, 512);
          gradient.addColorStop(0, '#001122'); // Deep blue
          gradient.addColorStop(0.5, '#003366'); // Medium blue
          gradient.addColorStop(1, '#0066aa'); // Light blue

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 512, 512);

          // Add some text
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`RADARSAT Frame ${index + 1}`, 256, 256);
          ctx.fillText('Ocean Data Visualization', 256, 300);

          const fallbackTexture = new THREE.CanvasTexture(canvas);
          loadedFrames[index] = {
            texture: fallbackTexture,
            path: path,
            index: index,
          };

          // Check if all frames are loaded (including fallbacks)
          if (
            loadedFrames.filter((frame) => frame !== undefined).length ===
            framePaths.length
          ) {
            setRadarsatFrames(loadedFrames);
            console.log('All RADARSAT frames loaded (with fallbacks)');
          }
        },
      );
    });
  };

  // Function to create RADARSAT display panel with smooth appearance
  const createRadarsatPanel = (scene, camera) => {
    if (radarsatFrames.length === 0) return null;

    const currentFrame = radarsatFrames[currentFrameIndex];
    if (!currentFrame) return null;

    // Create panel geometry
    const panelGeometry = new THREE.PlaneGeometry(8, 6);
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: currentFrame.texture,
      transparent: true,
      opacity: 0, // Start invisible for fade-in effect
    });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);

    // Position panel in front of camera
    const panelPosition = camera.position.clone();
    panelPosition.add(
      camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(5),
    );
    panelPosition.y -= 1; // Lower the panel slightly
    panel.position.copy(panelPosition);

    // Make panel face the camera
    panel.lookAt(camera.position);

    // Add frame information
    panel.userData = {
      name: 'RadarsatPanel',
      frameIndex: currentFrameIndex,
      totalFrames: radarsatFrames.length,
      isRadarsatPanel: true,
    };

    scene.add(panel);

    // Smooth fade-in effect
    let fadeProgress = 0;
    const fadeDuration = 800; // 0.8 seconds
    const startTime = Date.now();

    function fadeIn() {
      const elapsed = Date.now() - startTime;
      fadeProgress = Math.min(elapsed / fadeDuration, 1);

      // Smooth easing
      const easedProgress = 1 - Math.pow(1 - fadeProgress, 3);

      // Fade in
      panel.material.opacity = easedProgress * 0.9;
      panel.material.needsUpdate = true;

      if (fadeProgress < 1) {
        requestAnimationFrame(fadeIn);
      }
    }

    fadeIn();

    return panel;
  };

  // Function to cycle through RADARSAT frames with smooth transitions
  const cycleRadarsatFrame = (direction = 1) => {
    if (radarsatFrames.length === 0) return;

    const newIndex =
      (currentFrameIndex + direction + radarsatFrames.length) %
      radarsatFrames.length;

    // Smooth transition between frames
    if (radarsatPanel && radarsatPanel.material) {
      const currentMaterial = radarsatPanel.material;
      const currentTexture = currentMaterial.map;
      const newTexture = radarsatFrames[newIndex].texture;

      // Create fade transition
      let fadeProgress = 0;
      const fadeDuration = 500; // 0.5 seconds
      const startTime = Date.now();

      function fadeTransition() {
        const elapsed = Date.now() - startTime;
        fadeProgress = Math.min(elapsed / fadeDuration, 1);

        // Smooth easing
        const easedProgress = 1 - Math.pow(1 - fadeProgress, 2);

        // Crossfade between textures
        if (fadeProgress < 0.5) {
          // Fade out current texture
          currentMaterial.opacity = 1 - easedProgress * 2;
        } else {
          // Switch to new texture and fade in
          currentMaterial.map = newTexture;
          currentMaterial.opacity = (easedProgress - 0.5) * 2;
        }

        currentMaterial.needsUpdate = true;

        if (fadeProgress < 1) {
          requestAnimationFrame(fadeTransition);
        } else {
          // Ensure final state
          currentMaterial.map = newTexture;
          currentMaterial.opacity = 0.9;
          currentMaterial.needsUpdate = true;
          setCurrentFrameIndex(newIndex);
        }
      }

      fadeTransition();
    } else {
      // Fallback: immediate switch
      setCurrentFrameIndex(newIndex);
    }
  };

  // Load RADARSAT frames on component mount
  useEffect(() => {
    loadRadarsatFrames();
  }, []);

  // ===============================
  // MOVEMENT/TELEPORT FUNCTIONALITY
  // ===============================

  // Define teleportation points around the solar system
  const initializeTeleportPoints = () => {
    const points = [
      {
        name: 'Solar System Overview',
        position: [0, 1, 150],
        description: 'Overview of entire solar system',
      },
      {
        name: 'Near Earth',
        position: [0, 1, 60],
        description: 'Close view of Earth and Aqua satellite',
      },
      {
        name: 'Near Sun',
        position: [0, 1, 20],
        description: 'Close view of the Sun',
      },
      {
        name: 'Jupiter View',
        position: [-70, 1, -70],
        description: 'Close view of Jupiter',
      },
      {
        name: 'Saturn View',
        position: [100, 1, 90],
        description: 'Close view of Saturn with rings',
      },
      {
        name: 'Mars View',
        position: [50, 1, -50],
        description: 'Close view of Mars',
      },
    ];

    setTeleportPoints(points);
    return points;
  };

  // Function to teleport to a specific point
  const teleportToPoint = (pointIndex) => {
    console.log('teleportToPoint called with:', {
      pointIndex,
      isTeleporting,
      teleportPointsLength: teleportPoints.length,
    });

    if (
      isTeleportingRef.current ||
      !teleportPoints[pointIndex] ||
      !cameraRef.current ||
      !controlsRef.current
    ) {
      console.log('Teleportation blocked:', {
        isTeleporting: isTeleportingRef.current,
        pointExists: !!teleportPoints[pointIndex],
        cameraExists: !!cameraRef.current,
        controlsExists: !!controlsRef.current,
      });
      return;
    }

    console.log('Starting teleportation to:', teleportPoints[pointIndex].name);
    isTeleportingRef.current = true;
    setIsTeleporting(true);
    const targetPoint = teleportPoints[pointIndex];
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Temporarily disable controls during teleportation
    controls.enabled = false;

    // Smooth teleportation animation
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const targetPosition = new THREE.Vector3(...targetPoint.position);
    const targetLookAt = new THREE.Vector3(0, 0, 0); // Look at center

    // Update OrbitControls target immediately to prevent conflicts
    controls.target.copy(targetLookAt);

    console.log('Teleportation details:', {
      startPosition: startPosition.toArray(),
      targetPosition: targetPosition.toArray(),
      targetName: targetPoint.name,
      cameraPosition: camera.position.toArray(),
      controlsTarget: controls.target.toArray(),
    });

    let progress = 0;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    function animateTeleport() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);

      // Smooth easing
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);
      controls.update();

      // Don't manually render - let the main animation loop handle it

      // Debug every 10% progress
      if (Math.floor(progress * 10) !== Math.floor((progress - 0.01) * 10)) {
        console.log(`Teleport progress: ${Math.floor(progress * 100)}%`, {
          currentPosition: camera.position.toArray(),
          targetPosition: targetPosition.toArray(),
          easedProgress: easedProgress,
        });
      }

      if (progress < 1) {
        requestAnimationFrame(animateTeleport);
      } else {
        console.log('Teleportation completed to:', targetPoint.name);
        console.log('Final camera position:', camera.position.toArray());
        console.log('Final controls target:', controls.target.toArray());

        // Re-enable controls
        controls.enabled = true;

        isTeleportingRef.current = false;
        setIsTeleporting(false);
        setCurrentTeleportIndex(pointIndex);
      }
    }

    animateTeleport();
  };

  // Function to cycle through teleport points
  const cycleTeleportPoint = (direction = 1) => {
    if (teleportPoints.length === 0) return;

    const newIndex =
      (currentTeleportIndex + direction + teleportPoints.length) %
      teleportPoints.length;
    return newIndex;
  };

  // Initialize teleport points on component mount
  useEffect(() => {
    console.log('Initializing teleport points...');
    const points = initializeTeleportPoints();
    console.log('Teleport points initialized:', points);
  }, []);

  // API function to call Azure OpenAI
  const callAzureOpenAI = async (userInput) => {
    const apiKey =
      '5Om697To2BJ3g1oVDXiNpEpP0IfO6WwEcojJ4W6Hyms1FR5fYnaAJQQJ99BFACYeBjFXJ3w3AAAAACOG9UkB'; // Replace with your actual API key
    const endpoint =
      'https://thinkerforai-azureaifoundry.cognitiveservices.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview'; // Replace with your actual endpoint

    const messages = [
      {
        role: 'system',
        content: `
         1. You are CIDAK Space Explorer, a space explorer on a mission to gather information about the solar system and the satellite Aqua.
          2. Your task is to ask the user insightful questions about various celestial bodies, the solar system, and Aqua. You may also inquire about the environment, scientific phenomena, and discoveries related to Aqua.
          3. When responding, you will always include at least one element of curiosity or exploration. You may focus on topics like the nature of distant planets, the technology used for space exploration, or the mysteries surrounding Aqua.
          4. You must ensure your responses are scientifically accurate and reflect the context of space exploration and satellite data collection. 
          5. Always engage the user in a way that sparks further discussion about space, the solar system, and Aqua's role in Earth's climate and ocean monitoring.
          8. If no valid continuation or question is possible, respond with: "I'm currently analyzing more data; let's return to the wonders of space exploration soon."`,
      },
      { role: 'user', content: `${userInput} about ${selectedObject}` },
    ];

    try {
      setIsLoading(true);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: 800,
          temperature: 1,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || 'API Error');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No response';

      // Update the content response div
      const outputDiv = document.getElementById('contentResponse');
      if (outputDiv) {
        outputDiv.innerHTML = `<strong>Generated with Microsoft Azure AI Studio</strong><br>${content}`;
      }
    } catch (err) {
      console.error('Error:', err);
      const outputDiv = document.getElementById('contentResponse');
      if (outputDiv) {
        outputDiv.innerHTML = `<strong>Error:</strong> ${err.message}`;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Emulate Meta Quest 3 device
    const xrDevice = new XRDevice(metaQuest3);
    xrDevice.installRuntime();
    xrDevice.position.set(0, 1.8, 0);

    let scene, camera, renderer, controls;
    let earth, aquaSat, particles;
    let planets = {}; // Store all planets
    let labels = []; // Store all labels
    let clickableObjects = []; // Store all clickable objects
    let hoveredObject = null; // Track currently hovered object
    let originalMaterials = new Map(); // Store original materials for glow effect

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Darker background for better contrast

    // Store scene reference
    sceneRef.current = scene;

    // Camera positioned at the center (user position)
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1, 150); // User at center point

    // Store camera reference
    cameraRef.current = camera;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // Reduced from 1.5
    containerRef.current.appendChild(renderer.domElement);

    // Store renderer reference
    rendererRef.current = renderer;

    // OrbitControls - configure to rotate around user position (0,0,0)
    controls = new OrbitControls(camera, renderer.domElement);

    controls.target.set(0, 0, 0); // Target is the user position
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 0.1; // Allow very close zoom
    controls.maxDistance = 200; // Increased for solar system
    controls.enablePan = false; // Disable panning to keep user at center
    controls.update();

    let fpControls = null;
    if (!fpControls) {
      fpControls = new PointerLockControls(camera, renderer.domElement);
    }

    // ===============================
    // CAMERA MOVEMENT (WASD CONTROLS)
    // ===============================
    let manualMovement = false; // toggled with 'M' key
    let savedCameraPosition, savedCameraQuaternion;
    const movementSpeed = 1.0;
    const keysPressed = {};

    document.addEventListener('keydown', (event) => {
      keysPressed[event.key.toLowerCase()] = true;

      // Toggle free movement mode with 'M'
      if (event.key.toLowerCase() === 'm') {
        manualMovement = !manualMovement;

        if (manualMovement) {
          controls.enabled = false;
          fpControls.lock();
          console.log('Manual movement: ON');
        } else {
          fpControls.unlock();
          controls.enabled = true;

          // 🧠 Sync OrbitControls with the camera's current position and rotation
          controls.object.position.copy(camera.position);
          controls.target.copy(
            camera.position
              .clone()
              .add(
                camera
                  .getWorldDirection(new THREE.Vector3())
                  .multiplyScalar(10),
              ),
          );
          controls.update();
          controls.saveState(); // make this the new baseline

          console.log('Manual movement: OFF');
        }
      }
    });

    document.addEventListener('keyup', (event) => {
      keysPressed[event.key.toLowerCase()] = false;
    });

    function updateCameraMovement() {
      if (!manualMovement || !camera) return;

      const direction = new THREE.Vector3();

      if (keysPressed['w'] || keysPressed['arrowup']) direction.z -= 1;
      if (keysPressed['s'] || keysPressed['arrowdown']) direction.z += 1;
      if (keysPressed['a'] || keysPressed['arrowleft']) direction.x -= 1;
      if (keysPressed['d'] || keysPressed['arrowright']) direction.x += 1;

      direction.normalize();
      // move relative to camera orientation (look direction)
      fpControls.moveRight(direction.x * movementSpeed);
      fpControls.moveForward(-direction.z * movementSpeed);
    }
    // Store controls reference
    controlsRef.current = controls;

    // ===============================
    // RAYCASTER SETUP FOR OBJECT INTERACTIONS
    // ===============================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Function to add object to clickable objects array
    function addClickableObject(object) {
      clickableObjects.push(object);
    }

    // Function to handle mouse position calculation
    function updateMousePosition(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    // Function to get intersected objects
    function getIntersectedObjects() {
      raycaster.setFromCamera(mouse, camera);

      // Create array of all objects to check (including child meshes)
      const objectsToCheck = [];

      clickableObjects.forEach((obj) => {
        if (obj.isMesh) {
          objectsToCheck.push(obj);
        } else {
          // If it's a group (like the satellite), add all child meshes
          obj.traverse((child) => {
            if (child.isMesh) {
              objectsToCheck.push(child);
            }
          });
        }
      });

      const intersects = raycaster.intersectObjects(objectsToCheck, false);
      return intersects;
    }

    // Function to add glow effect to object
    function addGlowEffect(object) {
      // Find the main mesh to apply glow to
      let targetMesh = object;
      if (!object.isMesh && object.children.length > 0) {
        // For groups, find the first mesh
        object.traverse((child) => {
          if (child.isMesh && !targetMesh.isMesh) {
            targetMesh = child;
          }
        });
      }

      if (targetMesh.isMesh && targetMesh.material) {
        // Store original material if not already stored
        if (!originalMaterials.has(targetMesh)) {
          originalMaterials.set(targetMesh, targetMesh.material.clone());
        }

        // Apply glow effect
        if (targetMesh.material.emissive) {
          targetMesh.material.emissive.setHex(0x444444);
          targetMesh.material.emissiveIntensity = 0.5;
        }

        // Add subtle scale effect
        if (!targetMesh.userData.originalScale) {
          targetMesh.userData.originalScale = targetMesh.scale.clone();
        }
        targetMesh.scale.multiplyScalar(1.05);
      }
    }

    // Function to remove glow effect from object
    function removeGlowEffect(object) {
      // Find the main mesh to remove glow from
      let targetMesh = object;
      if (!object.isMesh && object.children.length > 0) {
        // For groups, find the first mesh
        object.traverse((child) => {
          if (child.isMesh && !targetMesh.isMesh) {
            targetMesh = child;
          }
        });
      }

      if (targetMesh.isMesh && originalMaterials.has(targetMesh)) {
        // Restore original material properties
        const originalMaterial = originalMaterials.get(targetMesh);
        if (targetMesh.material.emissive && originalMaterial.emissive) {
          targetMesh.material.emissive.copy(originalMaterial.emissive);
          targetMesh.material.emissiveIntensity =
            originalMaterial.emissiveIntensity || 0;
        }

        // Restore original scale
        if (targetMesh.userData.originalScale) {
          targetMesh.scale.copy(targetMesh.userData.originalScale);
        }
      }
    }

    // Function to handle object clicks
    function handleObjectClick(intersectedObject) {
      // Find the parent object (in case we clicked a child mesh)
      let targetObj = intersectedObject;

      // Check if this is a child of a clickable object
      clickableObjects.forEach((clickableObj) => {
        if (
          clickableObj.children.includes(intersectedObject) ||
          clickableObj === intersectedObject
        ) {
          targetObj = clickableObj;
        }
      });

      console.log('Clicked object:', targetObj.userData?.name || 'Unknown');

      // Set the selected object for the AI functionality (instead of overlay)
      setSelectedObject(targetObj.userData?.name || 'Unknown Object');

      // Custom click handlers for specific objects
      // Earth
      if (targetObj.userData?.name === 'Earth') {
        restoreEarthTexture();
      }
      if (targetObj.userData?.name === 'Sun') {
        // DO SOMETHING
      }
      // Satellite
      if (targetObj.userData?.name.startsWith('Object_')) {
        // DO SOMETHING FOR SATELLITE
        // Change Earth Texture for Ocean temperature
        // ecco2_and_grid_web.png
        changeEarthTexture('/assets/imgs/ecco2_and_grid_web.png');
      }
    }

    // Mouse hover effects
    function handleMouseMove(event) {
      updateMousePosition(event);
      const intersects = getIntersectedObjects();

      // Reset cursor
      document.body.style.cursor = 'default';

      // Remove glow from previously hovered object
      if (hoveredObject) {
        removeGlowEffect(hoveredObject);
        hoveredObject = null;
      }

      if (intersects.length > 0) {
        // Change cursor to pointer when hovering over clickable objects
        document.body.style.cursor = 'pointer';

        // Find the parent clickable object
        let targetObj = intersects[0].object;
        clickableObjects.forEach((clickableObj) => {
          if (
            clickableObj.children.includes(intersects[0].object) ||
            clickableObj === intersects[0].object
          ) {
            targetObj = clickableObj;
          }
        });

        // Apply glow effect to hovered object
        hoveredObject = targetObj;
        addGlowEffect(hoveredObject);
      }
    }

    // Click event handler
    function handleClick(event) {
      updateMousePosition(event);
      const intersects = getIntersectedObjects();

      if (intersects.length > 0) {
        handleObjectClick(intersects[0].object);
      } else {
        // Clicked on empty space - exit zoom mode and clear selected object
        if (zoomModeRef.current) {
          zoomOutOfObject();
        }
        setSelectedObject(null); // Clear the selected object when clicking empty space
      }
    }

    // ===============================
    // LABEL CREATION FUNCTION
    // ===============================
    function createLabel(text, position, color = '#ffffff') {
      // Create canvas for text texture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Set canvas size (larger for better visibility)
      canvas.width = 512;
      canvas.height = 128;

      // Set font and measure text
      context.font = 'Bold 32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      // Clear canvas with transparent background
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background rectangle
      context.fillStyle = 'rgba(0, 0, 0, 1)'; // Slightly more opaque background

      context.roundRect = function (x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
      };

      const padding = 15;
      context.roundRect(
        padding,
        padding,
        canvas.width - padding * 2,
        canvas.height - padding * 2,
        15,
      );
      context.fill();

      // Draw text
      context.fillStyle = color;
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      // Create sprite material with proper depth testing
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        depthTest: true, // Enable depth testing so labels respect object depth
        depthWrite: false, // Don't write to depth buffer to avoid interfering with other objects
      });

      // Create sprite
      const sprite = new THREE.Sprite(spriteMaterial);

      // Position label above the object with better offset
      const labelPosition = position.clone();
      labelPosition.y += 5; // Higher offset above the object
      sprite.position.copy(labelPosition);

      sprite.scale.set(15, 4, 1); // Slightly larger scale for better visibility

      // Store reference to original position for updates
      sprite.userData = {
        originalPosition: position.clone(),
        text: text,
        isLabel: true, // Mark as label for identification
      };

      // Lower render order so objects can appear in front of labels when appropriate
      sprite.renderOrder = 100;

      scene.add(sprite);
      labels.push(sprite);

      return sprite;
    }

    // ===============================
    // UPDATE LABELS FUNCTION
    // ===============================
    function updateLabels() {
      labels.forEach((label) => {
        // Make labels always face the camera
        label.lookAt(camera.position);

        // Update position to stay above the object with dynamic offset
        const originalPos = label.userData.originalPosition;
        const newPosition = originalPos.clone();

        // Calculate distance from camera to adjust label offset
        const distanceToCamera = camera.position.distanceTo(originalPos);

        // Dynamic offset based on distance (closer = smaller offset, farther = larger offset)
        const dynamicOffset = Math.max(3, distanceToCamera * 0.1);
        newPosition.y += dynamicOffset;

        label.position.copy(newPosition);

        // Scale labels based on distance for better readability
        const baseScale = Math.max(8, distanceToCamera * 0.08);
        label.scale.set(baseScale, baseScale * 0.25, 1);

        // Hide labels when zoomed very close to avoid overlap issues
        if (distanceToCamera < 5) {
          label.visible = false;
        } else {
          label.visible = true;
        }

        // Adjust opacity based on distance to make labels fade when very close
        const minDistance = 15;
        const maxDistance = 100;
        if (distanceToCamera < maxDistance) {
          const fadeDistance = Math.max(minDistance, distanceToCamera);
          const opacity =
            (fadeDistance - minDistance) / (maxDistance - minDistance);
          label.material.opacity = Math.max(0.3, Math.min(1.0, opacity));
        } else {
          label.material.opacity = 1.0;
        }
      });
    }

    // ===============================
    // ZOOM FUNCTIONALITY
    // ===============================
    let originalCameraPosition = new THREE.Vector3();
    let originalControlsTarget = new THREE.Vector3();
    let originalMinDistance = 0.1;
    let originalMaxDistance = 200;

    // Function to zoom into object - FIXED VERSION
    function zoomIntoObject(object) {
      if (!object || zoomModeRef.current) return;

      // Store original camera settings
      originalCameraPosition.copy(camera.position);
      originalControlsTarget.copy(controls.target);
      originalMinDistance = controls.minDistance;
      originalMaxDistance = controls.maxDistance;

      // Update refs first
      zoomModeRef.current = true;
      targetObjectRef.current = object;

      // Then update React state for UI
      setZoomMode(true);
      setTargetObject(object);

      // Get object position - handle both single meshes and groups
      let objectPosition = object.position.clone();
      let objectSize = 1; // Default size

      // Calculate bounding box more reliably
      try {
        const boundingBox = new THREE.Box3();

        // For groups (like satellite), we need to update world matrix first
        if (object.children && object.children.length > 0) {
          object.updateMatrixWorld(true);
          boundingBox.setFromObject(object);
        } else {
          // For single meshes
          object.updateMatrixWorld(true);
          boundingBox.setFromObject(object);
        }

        const size = boundingBox.getSize(new THREE.Vector3());
        objectSize = Math.max(size.x, size.y, size.z);

        // If bounding box calculation failed or returned invalid size
        if (!isFinite(objectSize) || objectSize <= 0) {
          // Fallback based on object type
          if (object.userData?.name === 'Sun') {
            objectSize = 24; // Sun diameter
          } else if (object.userData?.name === 'AquaSat') {
            objectSize = 4; // Satellite approximate size
          } else if (object.userData?.name === 'Jupiter') {
            objectSize = 16; // Jupiter diameter
          } else if (object.userData?.name === 'Saturn') {
            objectSize = 14; // Saturn diameter
          } else {
            objectSize = 5; // Default planet size
          }
        }
      } catch (error) {
        console.warn(
          'Bounding box calculation failed, using fallback size',
          error,
        );
        // Fallback sizes based on object name
        if (object.userData?.name === 'Sun') {
          objectSize = 24;
        } else if (object.userData?.name === 'AquaSat') {
          objectSize = 4;
        } else if (object.userData?.name === 'Jupiter') {
          objectSize = 16;
        } else if (object.userData?.name === 'Saturn') {
          objectSize = 14;
        } else {
          objectSize = 5;
        }
      }

      // Calculate new camera position with better distance calculation
      const distance = Math.max(objectSize * 2.5, 10); // Minimum distance of 10

      // Position camera in front of object (along Z-axis from object's perspective)
      const cameraOffset = new THREE.Vector3(0, 0, distance);

      // If object is very far from origin, approach from current camera direction
      const objectDistanceFromOrigin = objectPosition.length();
      if (objectDistanceFromOrigin > 50) {
        // Calculate direction from camera to object
        const directionToObject = objectPosition
          .clone()
          .sub(camera.position)
          .normalize();
        const newCameraPosition = objectPosition
          .clone()
          .sub(directionToObject.multiplyScalar(distance));

        // Animate camera to new position
        animateCamera(
          newCameraPosition,
          objectPosition,
          distance * 0.3,
          distance * 3,
        );
      } else {
        // For objects closer to origin, use standard offset
        const newCameraPosition = objectPosition.clone().add(cameraOffset);

        // Animate camera to new position
        animateCamera(
          newCameraPosition,
          objectPosition,
          distance * 0.3,
          distance * 3,
        );
      }
    }

    // Function to zoom out of object
    function zoomOutOfObject() {
      if (!zoomModeRef.current) return;

      // Update refs first
      zoomModeRef.current = false;
      targetObjectRef.current = null;

      // Then update React state for UI
      setZoomMode(false);
      setTargetObject(null);

      // Animate back to original position
      animateCamera(
        originalCameraPosition,
        originalControlsTarget,
        originalMinDistance,
        originalMaxDistance,
      );
    }

    // Camera animation function
    function animateCamera(targetPosition, targetLookAt, minDist, maxDist) {
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      const startMinDistance = controls.minDistance;
      const startMaxDistance = controls.maxDistance;

      let progress = 0;
      const duration = 800; // 0.8 seconds
      const startTime = Date.now();

      function animate() {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);

        // Smooth easing
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        // Interpolate camera position
        camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easedProgress,
        );
        controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);

        // Interpolate zoom limits
        controls.minDistance = THREE.MathUtils.lerp(
          startMinDistance,
          minDist,
          easedProgress,
        );
        controls.maxDistance = THREE.MathUtils.lerp(
          startMaxDistance,
          maxDist,
          easedProgress,
        );

        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      animate();
    }

    function changeEarthTexture(newTexturePath) {
      if (!planets.Earth) {
        console.warn('Earth not found');
        return;
      }

      const textureLoader = new THREE.TextureLoader();

      textureLoader.load(
        newTexturePath,
        (newTexture) => {
          // Successfully loaded new texture
          const newMaterial = new THREE.MeshLambertMaterial({
            map: newTexture,
          });

          // Store original material if not already stored
          if (!planets.Earth.userData.originalMaterial) {
            planets.Earth.userData.originalMaterial =
              planets.Earth.material.clone();
          }

          // Apply new material
          planets.Earth.material = newMaterial;
          planets.Earth.material.needsUpdate = true;

          console.log('Earth texture changed to ocean temperature data');
        },
        undefined,
        (error) => {
          console.error('Failed to load ocean temperature texture:', error);
          // Optionally fallback to a colored material representing ocean temperature
          const fallbackMaterial = new THREE.MeshLambertMaterial({
            color: 0x4169e1, // Royal blue for ocean
            emissive: 0x001122,
            emissiveIntensity: 0.3,
          });

          if (!planets.Earth.userData.originalMaterial) {
            planets.Earth.userData.originalMaterial =
              planets.Earth.material.clone();
          }

          planets.Earth.material = fallbackMaterial;
          planets.Earth.material.needsUpdate = true;

          console.log('Applied fallback ocean temperature visualization');
        },
      );
    }

    // Optional: Function to restore original Earth texture
    function restoreEarthTexture() {
      if (planets.Earth && planets.Earth.userData.originalMaterial) {
        planets.Earth.material = planets.Earth.userData.originalMaterial;
        planets.Earth.material.needsUpdate = true;
        console.log('Earth texture restored to original');
      }
    }
    // ===============================
    // BALANCED LIGHTING SETUP
    // ===============================

    // Moderate ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Primary sun light - moderate intensity
    const sunLight = new THREE.PointLight(0xffffff, 1.0, 2000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Single directional light to simulate distant sun illumination
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // ===============================
    // COLORFUL PARTICLES BACKGROUND (FAR AWAY)
    // ===============================
    function createParticles() {
      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 800; // Reduced from 2000
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        // Position particles much farther away from solar system
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 1600; // Much larger spread (1600 vs 400)
        positions[i3 + 1] = (Math.random() - 0.5) * 1600;
        positions[i3 + 2] = (Math.random() - 0.5) * 1600;

        // Ensure particles are far from the solar system center
        const distance = Math.sqrt(
          positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2,
        );
        if (distance < 300) {
          // If too close to solar system
          // Push particle farther away
          const factor = 300 / distance;
          positions[i3] *= factor;
          positions[i3 + 1] *= factor;
          positions[i3 + 2] *= factor;
        }

        // Random colors for each particle
        colors[i3] = Math.random(); // Red component
        colors[i3 + 1] = Math.random(); // Green component
        colors[i3 + 2] = Math.random(); // Blue component
      }

      particlesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      particlesGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3),
      );

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.3, // Smaller size (was 1.0)
        transparent: true,
        opacity: 0.7, // Slightly more transparent
        vertexColors: true, // Enable vertex colors for random colors
        sizeAttenuation: true, // Make particles smaller when farther away
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    }

    createParticles();

    // ===============================
    // SOLAR SYSTEM PLANETS WITH TEXTURES
    // ===============================
    const planetData = [
      {
        name: 'Mercury',
        radius: 1.5,
        position: [35, 0, 0],
        texture: '/assets/imgs/mercury.jpg',
      },
      {
        name: 'Venus',
        radius: 2.3,
        position: [-45, 10, 15],
        texture: '/assets/imgs/venus.jpg',
      },
      {
        name: 'Earth',
        radius: 2.5,
        position: [0, 0, 55],
        texture: '/assets/imgs/earth.jpg',
      },
      {
        name: 'Mars',
        radius: 2.0,
        position: [50, -15, -50],
        texture: '/assets/imgs/mars.jpg',
      },
      {
        name: 'Jupiter',
        radius: 8,
        position: [-70, 20, -70],
        texture: '/assets/imgs/jupiter.jpg',
      },
      {
        name: 'Saturn',
        radius: 7,
        position: [100, -10, 90],
        texture: '/assets/imgs/saturn.jpg',
        hasRings: true,
      },
      {
        name: 'Uranus',
        radius: 4,
        position: [-120, 25, 100],
        texture: '/assets/imgs/uranus.jpg',
      },
      {
        name: 'Neptune',
        radius: 4,
        position: [140, -20, -140],
        texture: '/assets/imgs/neptune.jpg',
      },
    ];

    const textureLoader = new THREE.TextureLoader();

    // Add Sun at center with texture
    const sunGeometry = new THREE.SphereGeometry(12, 64, 64);

    // Load sun texture
    textureLoader.load(
      '/assets/imgs/sun.jpg',
      (sunTexture) => {
        const sunMaterial = new THREE.MeshBasicMaterial({
          map: sunTexture,
          emissive: 0xffd700,
          emissiveIntensity: 0.8,
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0);
        sun.userData = { name: 'Sun', rotationSpeed: 0.001 };
        scene.add(sun);
        planets.Sun = sun;

        // Add to clickable objects
        addClickableObject(sun);

        // Create label for Sun
        createLabel('Sun', sun.position, '#FFD700');
      },
      undefined,
      (error) => {
        // Fallback sun material without texture
        const sunMaterial = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 1.0,
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0);
        sun.userData = { name: 'Sun', rotationSpeed: 0.001 };
        scene.add(sun);
        planets.Sun = sun;

        // Add to clickable objects
        addClickableObject(sun);

        // Create label for Sun
        createLabel('Sun', sun.position, '#FFD700');
      },
    );

    // Create planets with textures
    planetData.forEach((planetInfo) => {
      const geometry = new THREE.SphereGeometry(planetInfo.radius, 32, 32);

      // Planet color mapping for labels
      const planetColors = {
        Mercury: '#8C7853',
        Venus: '#FFC649',
        Earth: '#6B93D6',
        Mars: '#CD5C5C',
        Jupiter: '#D8CA9D',
        Saturn: '#FAD5A5',
        Uranus: '#4FD0E7',
        Neptune: '#4B70DD',
      };

      // Load planet texture
      textureLoader.load(
        planetInfo.texture,
        (texture) => {
          const material = new THREE.MeshLambertMaterial({
            map: texture,
          });

          const planet = new THREE.Mesh(geometry, material);
          planet.position.set(
            planetInfo.position[0],
            planetInfo.position[1],
            planetInfo.position[2],
          );
          planet.userData = {
            name: planetInfo.name,
            rotationSpeed: Math.random() * 0.01 + 0.002,
          };

          scene.add(planet);
          planets[planetInfo.name] = planet;

          // Add to clickable objects
          addClickableObject(planet);

          // Store Earth reference
          if (planetInfo.name === 'Earth') {
            earth = planet;
            // Load satellite after Earth is created
            loadSatelliteNearEarth();
          }

          // Create label for planet
          const color = planetColors[planetInfo.name] || '#ffffff';
          createLabel(`${planetInfo.name}`, planet.position, color);

          // Add rings to Saturn
          if (planetInfo.hasRings && planetInfo.name === 'Saturn') {
            // Load Saturn rings texture
            textureLoader.load(
              '/assets/imgs/saturn_rings.png',
              (ringTexture) => {
                const ringGeometry = new THREE.RingGeometry(
                  planetInfo.radius + 1,
                  planetInfo.radius + 3,
                  64,
                );
                const ringMaterial = new THREE.MeshBasicMaterial({
                  map: ringTexture,
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.8,
                });
                const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.rotation.x = Math.PI / 2;
                planet.add(rings);
              },
              undefined,
              (error) => {
                // Fallback rings without texture
                const ringGeometry = new THREE.RingGeometry(
                  planetInfo.radius + 1,
                  planetInfo.radius + 3,
                  64,
                );
                const ringMaterial = new THREE.MeshBasicMaterial({
                  color: 0xc4a484,
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.6,
                });
                const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.rotation.x = Math.PI / 2;
                planet.add(rings);
              },
            );
          }
        },
        undefined,
        (error) => {
          // Fallback to colored material
          const fallbackColors = {
            Mercury: 0x8c7853,
            Venus: 0xffc649,
            Earth: 0x6b93d6,
            Mars: 0xcd5c5c,
            Jupiter: 0xd8ca9d,
            Saturn: 0xfad5a5,
            Uranus: 0x4fd0e7,
            Neptune: 0x4b70dd,
          };

          const material = new THREE.MeshLambertMaterial({
            color: fallbackColors[planetInfo.name] || 0x888888,
          });

          const planet = new THREE.Mesh(geometry, material);
          planet.position.set(
            planetInfo.position[0],
            planetInfo.position[1],
            planetInfo.position[2],
          );
          planet.userData = {
            name: planetInfo.name,
            rotationSpeed: Math.random() * 0.01 + 0.002,
          };

          scene.add(planet);
          planets[planetInfo.name] = planet;

          // Add to clickable objects
          addClickableObject(planet);

          // Store Earth reference
          if (planetInfo.name === 'Earth') {
            earth = planet;
            loadSatelliteNearEarth();
          }

          // Create label for planet
          const color = planetColors[planetInfo.name] || '#ffffff';
          createLabel(`${planetInfo.name}`, planet.position, color);

          // Add fallback rings to Saturn
          if (planetInfo.hasRings && planetInfo.name === 'Saturn') {
            const ringGeometry = new THREE.RingGeometry(
              planetInfo.radius + 1,
              planetInfo.radius + 3,
              64,
            );
            const ringMaterial = new THREE.MeshBasicMaterial({
              color: 0xc4a484,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.6,
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            planet.add(rings);
          }
        },
      );
    });

    // ===============================
    // SATELLITE 3D MODEL (NEAR EARTH)
    // ===============================
    function loadSatelliteNearEarth() {
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        '/assets/3Dmodels/nasa_aqua_eos_pm-1_satellite.glb',
        (gltf) => {
          aquaSat = gltf.scene;

          // Enhanced satellite material for better visibility
          aquaSat.traverse((child) => {
            if (child.isMesh) {
              if (child.material) {
                // Brighter enhancement for satellite
                child.material.emissive = new THREE.Color(0x333333);
                child.material.emissiveIntensity = 0.6;
                child.material.needsUpdate = true;

                // Higher brightness enhancement
                if (child.material.color) {
                  child.material.color.multiplyScalar(2.0);
                }
              }
            }
          });

          // Center the model
          const box = new THREE.Box3().setFromObject(aquaSat);
          const center = box.getCenter(new THREE.Vector3());
          aquaSat.position.sub(center);

          // Position near Earth
          if (earth) {
            const earthPos = earth.position.clone();
            aquaSat.position.set(
              earthPos.x + 8,
              earthPos.y + 3,
              earthPos.z + 5,
            );
          } else {
            aquaSat.position.set(8, 3, 60);
          }

          // Scale the model
          aquaSat.scale.set(2, 2, 2);

          aquaSat.userData = {
            name: 'AquaSat',
            rotationSpeed: 0.002,
            isSatellite: true,
          };

          scene.add(aquaSat);

          // Add to clickable objects
          addClickableObject(aquaSat);

          // Create label for satellite
          createLabel('Aqua Satellite', aquaSat.position, '#00aaff');

          setLoading(false);
        },
        (progress) => {
          // Loading progress removed
        },
        (error) => {
          // Create brighter fallback satellite
          const fallbackGeometry = new THREE.SphereGeometry(1, 16, 16);
          const fallbackMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            emissive: 0x0066aa,
            emissiveIntensity: 0.8,
          });
          aquaSat = new THREE.Mesh(fallbackGeometry, fallbackMaterial);

          if (earth) {
            const earthPos = earth.position.clone();
            aquaSat.position.set(
              earthPos.x + 8,
              earthPos.y + 3,
              earthPos.z + 5,
            );
          } else {
            aquaSat.position.set(8, 3, 60);
          }

          aquaSat.userData = {
            name: 'AquaSat',
            rotationSpeed: 0.002,
            isSatellite: true,
          };

          scene.add(aquaSat);

          // Add to clickable objects
          addClickableObject(aquaSat);

          // Create label for fallback satellite
          createLabel('Aqua Satellite', aquaSat.position, '#00aaff');

          setLoading(false);
        },
      );
    }

    // ADD EVENT LISTENERS AFTER A DELAY TO ENSURE OBJECTS ARE LOADED
    setTimeout(() => {
      // Add event listeners
      renderer.domElement.addEventListener('click', handleClick);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);

      // Add keyboard controls for RADARSAT frames
      document.addEventListener('keydown', (event) => {
        switch (event.key) {
          case 'r':
          case 'R':
            // Toggle RADARSAT panel
            if (radarsatFrames.length > 0) {
              if (showRadarsatPanel) {
                // Hide panel
                if (radarsatPanel) {
                  scene.remove(radarsatPanel);
                  setRadarsatPanel(null);
                }
                setShowRadarsatPanel(false);
              } else {
                // Show panel
                const panel = createRadarsatPanel(scene, camera);
                setRadarsatPanel(panel);
                setShowRadarsatPanel(true);
              }
            }
            break;
          case 'ArrowLeft':
            // Previous frame
            cycleRadarsatFrame(-1);
            break;
          case 'ArrowRight':
            // Next frame
            cycleRadarsatFrame(1);
            break;
          case 't':
          case 'T':
            // Teleport to next point
            console.log('T key pressed, teleporting...');
            if (!isTeleporting && teleportPoints.length > 0) {
              const nextIndex = cycleTeleportPoint(1);
              console.log('Teleporting to index:', nextIndex);
              teleportToPoint(nextIndex);
            }
            break;
          case 'Tab':
            // Teleport to previous point
            event.preventDefault();
            console.log('Tab key pressed, teleporting...');
            if (!isTeleporting && teleportPoints.length > 0) {
              const prevIndex = cycleTeleportPoint(-1);
              console.log('Teleporting to index:', prevIndex);
              teleportToPoint(prevIndex);
            }
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
            // Direct teleport to specific point
            const pointIndex = parseInt(event.key) - 1;
            console.log(
              `Number ${event.key} pressed, teleporting to point ${pointIndex}`,
            );
            if (!isTeleporting && teleportPoints[pointIndex]) {
              teleportToPoint(pointIndex);
            }
            break;
        }
      });
    }, 2000); // Wait 2 seconds for objects to load

    // ===============================
    // ANIMATION LOOP
    // ===============================
    function animate() {
      requestAnimationFrame(animate);

      // Update labels to face camera
      updateLabels();

      // Rotate Sun
      if (planets.Sun) {
        planets.Sun.rotation.y += planets.Sun.userData.rotationSpeed;
      }

      // Animate planets (only rotation, no orbital movement)
      Object.values(planets).forEach((planet) => {
        if (planet.userData && planet.userData.rotationSpeed) {
          planet.rotation.y += planet.userData.rotationSpeed;
        }
      });

      // Rotate satellite slowly
      if (aquaSat && aquaSat.userData) {
        aquaSat.rotation.y += aquaSat.userData.rotationSpeed;
      }

      // Subtle particle movement
      if (particles) {
        particles.rotation.y += 0.0002;
      }

      // Update controls (only if not teleporting or manual movement)
      if (!isTeleportingRef.current) {
        if (manualMovement && fpControls) {
          updateCameraMovement();
          fpControls.update(); // update camera rotation from mouse
        } else {
          controls.update();
        }
      }
      // Render scene
      renderer.render(scene, camera);
    }

    animate();

    // ===============================
    // WINDOW RESIZE HANDLER
    // ===============================
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // ===============================
    // CLEANUP
    // ===============================
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'default'; // Reset cursor

      // Remove glow effect from any currently hovered object
      if (hoveredObject) {
        removeGlowEffect(hoveredObject);
      }

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '24px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.8)',
            padding: '20px 40px',
            borderRadius: '10px',
          }}
        >
          Loading Solar System Experience...
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ff4444',
            fontSize: '20px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.9)',
            padding: '20px 40px',
            borderRadius: '10px',
          }}
        >
          {error}
        </div>
      )}

      {/* REMOVED: Selected Object Overlay */}

      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          maxWidth: '300px',
        }}
      >
        <strong>
          {zoomMode
            ? `Zoomed: ${targetObject?.userData?.name || 'Object'}`
            : 'Solar System Explorer'}
          :
        </strong>
        <br />
        🖱️ Mouse: Look around (rotate view)
        <br />
        🔄 Mouse wheel: Zoom in/out
        <br />
        🖱️ Click: Zoom into planets/objects
        <br />
        💫 Hover: Objects glow when selectable
        <br />
        <br />
        <strong>RADARSAT Controls:</strong>
        <br />
        ⌨️ R: Toggle RADARSAT panel
        <br />
        ⬅️➡️ Arrow keys: Cycle frames
        <br />
        📊 {radarsatFrames.length} frames loaded
        <br />
        <br />
        <strong>Movement Controls:</strong>
        <br />
        ⌨️ T: Teleport to next point
        <br />
        ⌨️ Tab: Teleport to previous point
        <br />
        ⌨️ 1-6: Direct teleport to point
        <br />
        🚀 {teleportPoints.length} teleport points
        <br />
        <br />
        <strong>Quick Teleport Buttons:</strong>
        <br />
        {teleportPoints.map((point, index) => (
          <button
            key={index}
            onClick={() => {
              console.log(`Button clicked for point ${index}:`, point.name);
              teleportToPoint(index);
            }}
            style={{
              margin: '2px',
              padding: '4px 8px',
              fontSize: '10px',
              backgroundColor: 'rgba(0,150,255,0.3)',
              border: '1px solid rgba(0,150,255,0.5)',
              borderRadius: '3px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {index + 1}
          </button>
        ))}
        <br />
        <button
          onClick={() => {
            console.log('Testing immediate teleportation to Earth...');
            if (
              cameraRef.current &&
              controlsRef.current &&
              rendererRef.current &&
              sceneRef.current
            ) {
              const camera = cameraRef.current;
              const controls = controlsRef.current;
              const renderer = rendererRef.current;
              const scene = sceneRef.current;
              const earthPoint = teleportPoints[1]; // Near Earth
              console.log('Before teleport:', camera.position.toArray());

              // Set teleporting state
              isTeleportingRef.current = true;
              setIsTeleporting(true);

              // Set camera position and controls target
              camera.position.set(...earthPoint.position);
              controls.target.set(0, 0, 0);

              // Wait a moment then reset state
              setTimeout(() => {
                isTeleportingRef.current = false;
                setIsTeleporting(false);
                console.log(
                  'After immediate teleport:',
                  camera.position.toArray(),
                );
              }, 100);
            }
          }}
          style={{
            margin: '2px',
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: 'rgba(255,100,100,0.3)',
            border: '1px solid rgba(255,100,100,0.5)',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Test Earth
        </button>
        <br />
        <button
          onClick={() => {
            if (cameraRef.current) {
              console.log(
                'Current camera position:',
                cameraRef.current.position.toArray(),
              );
              console.log(
                'Current controls target:',
                controlsRef.current?.target.toArray(),
              );
              console.log('Is teleporting:', isTeleporting);

              // Test dramatic teleportation
              const camera = cameraRef.current;
              const controls = controlsRef.current;

              // Teleport to a very different position
              isTeleportingRef.current = true;
              setIsTeleporting(true);

              // Move to Jupiter position (very far away)
              camera.position.set(-70, 1, -70);
              controls.target.set(0, 0, 0);

              setTimeout(() => {
                isTeleportingRef.current = false;
                setIsTeleporting(false);
                console.log(
                  'After dramatic teleport:',
                  camera.position.toArray(),
                );
              }, 200);
            }
          }}
          style={{
            margin: '2px',
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: 'rgba(100,255,100,0.3)',
            border: '1px solid rgba(100,255,100,0.5)',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Debug Camera
        </button>
        <br />
        <button
          onClick={() => {
            if (cameraRef.current) {
              const camera = cameraRef.current;
              const controls = controlsRef.current;

              console.log('DISABLING CONTROLS COMPLETELY');
              // Completely disable controls
              controls.enabled = false;

              // Move back to original position
              camera.position.set(0, 1, 150);
              camera.lookAt(0, 0, 0);

              console.log('Camera moved to:', camera.position.toArray());
              console.log(
                'Camera looking at:',
                camera.getWorldDirection(new THREE.Vector3()).toArray(),
              );

              // Don't re-enable controls - keep them disabled
            }
          }}
          style={{
            margin: '2px',
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: 'rgba(255,255,100,0.3)',
            border: '1px solid rgba(255,255,100,0.5)',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Back to Start
        </button>
        <br />
        <button
          onClick={() => {
            console.log('SIMPLE CAMERA TEST - NO CONTROLS');
            if (cameraRef.current) {
              const camera = cameraRef.current;

              // Just move the camera directly - no controls, no refs, no state
              camera.position.x = 100;
              camera.position.y = 50;
              camera.position.z = 100;
              camera.lookAt(0, 0, 0);

              console.log('Camera position set to:', camera.position.toArray());

              // Force a render
              if (rendererRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, camera);
                console.log('Forced render');
              }
            }
          }}
          style={{
            margin: '2px',
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: 'rgba(255,0,255,0.3)',
            border: '1px solid rgba(255,0,255,0.5)',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          SIMPLE TEST
        </button>
        <br />
        <button
          onClick={() => {
            console.log('DISABLING ORBIT CONTROLS PERMANENTLY');
            if (controlsRef.current) {
              controlsRef.current.enabled = false;
              console.log('OrbitControls disabled');
            }
          }}
          style={{
            margin: '2px',
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: 'rgba(255,100,0,0.3)',
            border: '1px solid rgba(255,100,0,0.5)',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          DISABLE CONTROLS
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          maxWidth: '250px',
        }}
      >
        <strong>CIDAK Credits</strong>
        <br />
        Add about us section 2025
        <br />
      </div>
      {/* User Input and AI Response Section with Astronaut Scene */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          color: 'white',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '10px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          maxWidth: '400px',
          width: '380px',
          height: selectedObject ? '400px' : '10px',
          border: '2px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '14px' }}>
              {selectedObject
                ? `Ask about ${selectedObject}`
                : 'Select an object first, then ask CIDAK Space Explorer'}
            </strong>
          </div>

          {/* Astronaut Scene in AI Panel */}
          {selectedObject && (
            <div
              ref={astronautSceneRef}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                marginLeft: '10px',
              }}
            />
          )}
        </div>

        {selectedObject && (
          <div
            style={{
              fontSize: '11px',
              opacity: 0.9,
              lineHeight: '1.3',
              marginBottom: '10px',
            }}
          >
            <strong>Selected:</strong> {selectedObject}
            {selectedObject === 'Earth' && (
              <div
                style={{
                  marginTop: '5px',
                  padding: '5px',
                  backgroundColor: 'rgba(0,100,200,0.2)',
                  borderRadius: '3px',
                  fontSize: '10px',
                }}
              >
                🌍 Third planet • Only known planet with life • 71% water
                coverage
              </div>
            )}
            {selectedObject === 'AquaSat' && (
              <div
                style={{
                  marginTop: '5px',
                  padding: '5px',
                  backgroundColor: 'rgba(0,170,255,0.2)',
                  borderRadius: '3px',
                  fontSize: '10px',
                }}
              >
                🛰️ Monitors Earth's water cycle • Launched 2002 • Studies ocean
                temperature
              </div>
            )}
            {selectedObject === 'Sun' && (
              <div
                style={{
                  marginTop: '5px',
                  padding: '5px',
                  backgroundColor: 'rgba(255,215,0,0.2)',
                  borderRadius: '3px',
                  fontSize: '10px',
                }}
              >
                ☀️ Center of solar system • 99.86% of system's mass • Powers
                life on Earth
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={
            selectedObject
              ? `Ask about ${selectedObject}...`
              : 'Select an object first, then ask...'
          }
          disabled={!selectedObject}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.3)',
            background: selectedObject
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(100,100,100,0.1)',
            color: selectedObject ? 'white' : 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            outline: 'none',
            marginBottom: '8px',
          }}
        />

        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <button
            onClick={() => {
              if (selectedObject && userInput.trim()) {
                callAzureOpenAI(userInput);
              }
            }}
            disabled={!selectedObject || !userInput.trim() || isLoading}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor:
                selectedObject && userInput.trim()
                  ? 'rgba(0,100,200,0.8)'
                  : 'rgba(100,100,100,0.3)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor:
                selectedObject && userInput.trim() ? 'pointer' : 'not-allowed',
              fontSize: '11px',
              marginRight: '5px',
            }}
          >
            {isLoading ? 'Asking...' : 'Ask'}
          </button>

          <button
            onClick={() => setUserInput('')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              marginLeft: '5px',
            }}
          >
            Clear
          </button>
        </div>

        <div
          id="contentResponse"
          style={{
            padding: '8px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '10px',
            height: '120px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {selectedObject
            ? 'Select an object and ask a question to chat with the astronaut!'
            : 'Click on any celestial object first to start a conversation!'}
        </div>

        {selectedObject && (
          <button
            onClick={() => setSelectedObject(null)}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255,100,100,0.2)',
              border: '1px solid rgba(255,100,100,0.3)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '10px',
              width: '100%',
            }}
          >
            Clear Selection
          </button>
        )}

        {/* RADARSAT Panel Status */}
        {showRadarsatPanel && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(0,150,255,0.2)',
              border: '1px solid rgba(0,150,255,0.3)',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'white',
            }}
          >
            <strong>RADARSAT Panel Active</strong>
            <br />
            Frame {currentFrameIndex + 1} of {radarsatFrames.length}
            <br />
            Press R to hide, arrows to cycle
          </div>
        )}

        {/* Teleportation Status */}
        {isTeleporting && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(255,150,0,0.2)',
              border: '1px solid rgba(255,150,0,0.3)',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'white',
            }}
          >
            <strong>🚀 Teleporting...</strong>
            <br />
            Moving to{' '}
            {teleportPoints[currentTeleportIndex]?.name || 'Unknown Location'}
          </div>
        )}

        {/* Current Location Status */}
        {!isTeleporting && teleportPoints.length > 0 && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(0,200,100,0.2)',
              border: '1px solid rgba(0,200,100,0.3)',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'white',
            }}
          >
            <strong>📍 Current Location</strong>
            <br />
            {teleportPoints[currentTeleportIndex]?.name ||
              'Solar System Overview'}
            <br />
            Press T/Tab to move, 1-6 for direct teleport
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRDevice, metaQuest3 } from 'iwer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { callAzureOpenAI, updateResponseDiv } from './api/AzureOpenAI.jsx';
import { createEarth, changeEarthTexture, restoreEarthTexture, animateEarth, EARTH_CONFIG } from './planets/earth.jsx';
import { createMoon, animateMoon, MOON_CONFIG } from './moon/Moon.jsx';
import { createJupiter, animateJupiter, JUPITER_CONFIG } from './planets/Jupiter.jsx';
import { createVenus, animateVenus, VENUS_CONFIG } from './planets/Venus.jsx';
import { createUranus, animateUranus, URANUS_CONFIG } from './planets/Uranus.jsx';
import { createMercury, animateMercury, MERCURY_CONFIG } from './planets/Mercury.jsx';
import { createNeptune, animateNeptune, NEPTUNE_CONFIG } from './planets/Neptune.jsx';
import { createSaturn, animateSaturn, SATURN_CONFIG } from './planets/Saturn.jsx';
import { createMars, animateMars, MARS_CONFIG } from './planets/Mars.jsx';
import { loadAquaSatellite, animateAquaSatellite, AQUA_SAT_CONFIG } from './satellite/Satellite.jsx';

export default function NASAOceanVR() {
  const containerRef = useRef(null);
  const astronautSceneRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomMode, setZoomMode] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Add refs to track current state for event handlers
  const zoomModeRef = useRef(false);
  const targetObjectRef = useRef(null);
  
  // Astronaut scene refs
  const astronautRendererRef = useRef(null);
  const astronautCameraRef = useRef(null);
  const astronautRef = useRef(null);
  
  // ===============================
  // API CALL HANDLER
  // ===============================
  const handleAzureOpenAICall = async (userInput) => {
    if (!selectedObject || !userInput.trim()) return;
    
    try {
      setIsLoading(true);
      const content = await callAzureOpenAI(userInput, selectedObject);
      updateResponseDiv(content, false);
    } catch (err) {
      updateResponseDiv(err.message, true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ===============================
  // ASTRONAUT MINI SCENE SETUP
  // ===============================
  useEffect(() => {
    if (!selectedObject || !astronautSceneRef.current) return;
    
    // Clear previous scene if it exists
    if (astronautRendererRef.current) {
      // Check if the DOM element exists and is a child before removing
      if (astronautRendererRef.current.domElement && 
          astronautSceneRef.current && 
          astronautSceneRef.current.contains(astronautRendererRef.current.domElement)) {
        astronautSceneRef.current.removeChild(astronautRendererRef.current.domElement);
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
    const astronautRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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
        y: event.clientY
      };
      event.preventDefault();
    }
    
    function onMouseMove(event) {
      if (!isDragging) return;
      
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };
      
      // Update spherical coordinates
      spherical.theta -= deltaMove.x * 0.01; // Horizontal rotation
      spherical.phi += deltaMove.y * 0.01;   // Vertical rotation
      
      // Limit vertical rotation
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      // Update camera position
      astronautCamera.position.setFromSpherical(spherical);
      astronautCamera.lookAt(0, 0, 0);
      
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
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
          color: 0xFFFFFF
        });
        const astronaut = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        astronautRef.current = astronaut;
        astronautScene.add(astronaut);
      }
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
        if (astronautRendererRef.current.domElement && 
            astronautSceneRef.current && 
            astronautSceneRef.current.contains(astronautRendererRef.current.domElement)) {
          try {
            astronautSceneRef.current.removeChild(astronautRendererRef.current.domElement);
          } catch (error) {
            console.warn('Could not remove astronaut renderer DOM element:', error);
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

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Emulate Meta Quest 3 device
    const xrDevice = new XRDevice(metaQuest3);
    xrDevice.installRuntime();
    xrDevice.position.set(0, 1.8, 0);
    
    let scene, camera, renderer, controls;
    let earth, moon, aquaSat, particles;
    let jupiter, venus, uranus, mercury, neptune, saturn, mars; // Add mars ref
    let planets = {}; // Store all planets
    let labels = []; // Store all labels
    let clickableObjects = []; // Store all clickable objects
    let hoveredObject = null; // Track currently hovered object
    let originalMaterials = new Map(); // Store original materials for glow effect
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Darker background for better contrast
    
    // Camera positioned at the center (user position)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 150); // User at center point
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // Reduced from 1.5
    containerRef.current.appendChild(renderer.domElement);
    
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
      
      clickableObjects.forEach(obj => {
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
          targetMesh.material.emissiveIntensity = originalMaterial.emissiveIntensity || 0;
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
      clickableObjects.forEach(clickableObj => {
        if (clickableObj.children.includes(intersectedObject) || clickableObj === intersectedObject) {
          targetObj = clickableObj;
        }
      });
      
      console.log('Clicked object:', targetObj.userData?.name || 'Unknown');
      
      // Set the selected object for the AI functionality (instead of overlay)
      setSelectedObject(targetObj.userData?.name || 'Unknown Object');
      
      // Custom click handlers for specific objects
      // Earth
      if (targetObj.userData?.name === 'Earth') {
        restoreEarthTexture(earth);
      }
      if (targetObj.userData?.name === 'Sun') {
        // DO SOMETHING
        
      }
      // Satellite
      if (targetObj.userData?.name.startsWith('Object_')) {
        // DO SOMETHING FOR SATELLITE
        // Change Earth Texture for Ocean temperature
        // ecco2_and_grid_web.png
        changeEarthTexture(earth, '/assets/imgs/ecco2_and_grid_web.png', textureLoader);
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
        clickableObjects.forEach(clickableObj => {
          if (clickableObj.children.includes(intersects[0].object) || clickableObj === intersects[0].object) {
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
      
      context.roundRect = function(x, y, w, h, r) {
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
      context.roundRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2, 15);
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
        depthWrite: false // Don't write to depth buffer to avoid interfering with other objects
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
        isLabel: true // Mark as label for identification
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
      labels.forEach(label => {
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
          const opacity = (fadeDistance - minDistance) / (maxDistance - minDistance);
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
        console.warn('Bounding box calculation failed, using fallback size', error);
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
        const directionToObject = objectPosition.clone().sub(camera.position).normalize();
        const newCameraPosition = objectPosition.clone().sub(directionToObject.multiplyScalar(distance));
        
        // Animate camera to new position
        animateCamera(newCameraPosition, objectPosition, distance * 0.3, distance * 3);
      } else {
        // For objects closer to origin, use standard offset
        const newCameraPosition = objectPosition.clone().add(cameraOffset);
        
        // Animate camera to new position
        animateCamera(newCameraPosition, objectPosition, distance * 0.3, distance * 3);
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
      animateCamera(originalCameraPosition, originalControlsTarget, originalMinDistance, originalMaxDistance);
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
        camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
        controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);
        
        // Interpolate zoom limits
        controls.minDistance = THREE.MathUtils.lerp(startMinDistance, minDist, easedProgress);
        controls.maxDistance = THREE.MathUtils.lerp(startMaxDistance, maxDist, easedProgress);
        
        controls.update();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      animate();
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
        positions[i3] = (Math.random() - 0.5) * 1600;     // Much larger spread (1600 vs 400)
        positions[i3 + 1] = (Math.random() - 0.5) * 1600;
        positions[i3 + 2] = (Math.random() - 0.5) * 1600;
        
        // Ensure particles are far from the solar system center
        const distance = Math.sqrt(positions[i3]**2 + positions[i3 + 1]**2 + positions[i3 + 2]**2);
        if (distance < 300) { // If too close to solar system
          // Push particle farther away
          const factor = 300 / distance;
          positions[i3] *= factor;
          positions[i3 + 1] *= factor;
          positions[i3 + 2] *= factor;
        }
        
        // Random colors for each particle
        colors[i3] = Math.random();     // Red component
        colors[i3 + 1] = Math.random(); // Green component
        colors[i3 + 2] = Math.random(); // Blue component
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.3, // Smaller size (was 1.0)
        transparent: true,
        opacity: 0.7, // Slightly more transparent
        vertexColors: true, // Enable vertex colors for random colors
        sizeAttenuation: true // Make particles smaller when farther away
      });
      
      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    }
    
    createParticles();
    
    // ===============================
    // SOLAR SYSTEM PLANETS WITH TEXTURES
    // ===============================
    const textureLoader = new THREE.TextureLoader();
    const sunGeometry = new THREE.SphereGeometry(12, 32, 32);

    // Load sun texture
    textureLoader.load(
      '/assets/imgs/sun.jpg',
      (sunTexture) => {
        const sunMaterial = new THREE.MeshBasicMaterial({ 
          map: sunTexture,
          emissive: 0xFFD700,
          emissiveIntensity: 0.8
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
          color: 0xFFD700,
          emissive: 0xFFD700,
          emissiveIntensity: 1.0
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
      }
    );
    
    // Create Earth and Moon
    createEarth(textureLoader, scene, addClickableObject, createLabel)
      .then((earthMesh) => {
        earth = earthMesh;
        planets.Earth = earth;
        
        return createMoon(textureLoader, scene, earth, addClickableObject, createLabel);
      })
      .then((moonMesh) => {
        moon = moonMesh;
        if (moon) {
          planets.Moon = moon;
        }
        
        // Load satellite after Earth and Moon are created
        return loadAquaSatellite(scene, earth, addClickableObject, createLabel, setLoading);
      })
      .then((satelliteMesh) => {
        aquaSat = satelliteMesh;
        planets.AquaSat = aquaSat;
      })
      .catch((error) => {
        console.error('Error creating Earth, Moon, or Satellite:', error);
      });

    // Create Mercury
    createMercury(textureLoader, scene, addClickableObject, createLabel)
      .then((mercuryMesh) => {
        mercury = mercuryMesh;
        planets.Mercury = mercury;
      })
      .catch((error) => {
        console.error('Error creating Mercury:', error);
      });

    // Create Venus
    createVenus(textureLoader, scene, addClickableObject, createLabel)
      .then((venusMesh) => {
        venus = venusMesh;
        planets.Venus = venus;
      })
      .catch((error) => {
        console.error('Error creating Venus:', error);
      });

    // Create Mars
    createMars(textureLoader, scene, addClickableObject, createLabel)
      .then((marsMesh) => {
        mars = marsMesh;
        planets.Mars = mars;
      })
      .catch((error) => {
        console.error('Error creating Mars:', error);
      });

    // Create Jupiter
    createJupiter(textureLoader, scene, addClickableObject, createLabel)
      .then((jupiterMesh) => {
        jupiter = jupiterMesh;
        planets.Jupiter = jupiter;
      })
      .catch((error) => {
        console.error('Error creating Jupiter:', error);
      });

    // Create Saturn
    createSaturn(textureLoader, scene, addClickableObject, createLabel)
      .then((saturnMesh) => {
        saturn = saturnMesh;
        planets.Saturn = saturn;
      })
      .catch((error) => {
        console.error('Error creating Saturn:', error);
      });

    // Create Uranus
    createUranus(textureLoader, scene, addClickableObject, createLabel)
      .then((uranusMesh) => {
        uranus = uranusMesh;
        planets.Uranus = uranus;
      })
      .catch((error) => {
        console.error('Error creating Uranus:', error);
      });

    // Create Neptune
    createNeptune(textureLoader, scene, addClickableObject, createLabel)
      .then((neptuneMesh) => {
        neptune = neptuneMesh;
        planets.Neptune = neptune;
      })
      .catch((error) => {
        console.error('Error creating Neptune:', error);
      });

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
      
      // Animate all modular planets
      if (earth) animateEarth(earth);
      if (moon) animateMoon(moon);
      if (mercury) animateMercury(mercury);
      if (venus) animateVenus(venus);
      if (mars) animateMars(mars);
      if (jupiter) animateJupiter(jupiter);
      if (saturn) animateSaturn(saturn);
      if (uranus) animateUranus(uranus);
      if (neptune) animateNeptune(neptune);
      
      // Animate satellite
      if (aquaSat) {
        animateAquaSatellite(aquaSat);
      }
      
      // Subtle particle movement
      if (particles) {
        particles.rotation.y += 0.0002;
      }
      
      // Update controls
      controls.update();
      
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '24px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px 40px',
          borderRadius: '10px'
        }}>
          Loading Solar System Experience...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4444',
          fontSize: '20px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.9)',
          padding: '20px 40px',
          borderRadius: '10px'
        }}>
          {error}
        </div>
      )}
      
      {/* REMOVED: Selected Object Overlay */}
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        <strong>{zoomMode ? `Zoomed: ${targetObject?.userData?.name || 'Object'}` : 'Solar System Explorer'}:</strong><br/>
        🖱️ Mouse: Look around (rotate view)<br/>
        🔄 Mouse wheel: Zoom in/out<br/>
        🖱️ Click: Zoom into planets/objects<br/>
        💫 Hover: Objects glow when selectable<br/>
        
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        maxWidth: '250px'
      }}>
        <strong>CIDAK Credits</strong><br/>
        Add about us section 2025<br/>
      </div>
      {/* User Input and AI Response Section with Astronaut Scene */}
      <div style={{
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
        border: '2px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '14px' }}>
              {selectedObject ? `Ask about ${selectedObject}` : 'Select an object first, then ask CIDAK Space Explorer'}
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
                marginLeft: '10px'
              }}
            />
          )}
        </div>
        
        {selectedObject && (
          <div style={{ fontSize: '11px', opacity: 0.9, lineHeight: '1.3', marginBottom: '10px' }}>
            <strong>Selected:</strong> {selectedObject}
            
            {selectedObject === 'Earth' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(0,100,200,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {EARTH_CONFIG.info.emoji} {EARTH_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Moon' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(200,200,200,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {MOON_CONFIG.info.emoji} {MOON_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Jupiter' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(216,202,157,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {JUPITER_CONFIG.info.emoji} {JUPITER_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Venus' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(255,198,73,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {VENUS_CONFIG.info.emoji} {VENUS_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Uranus' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(79,208,231,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {URANUS_CONFIG.info.emoji} {URANUS_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Saturn' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(250,213,165,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {SATURN_CONFIG.info.emoji} {SATURN_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Neptune' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(75,112,221,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {NEPTUNE_CONFIG.info.emoji} {NEPTUNE_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Sun' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                ☀️ Center of solar system • 99.86% of system's mass • Powers life on Earth
              </div>
            )}
            
            {selectedObject === 'Mercury' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(140,120,83,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {MERCURY_CONFIG.info.emoji} {MERCURY_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'Mars' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(205,92,92,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {MARS_CONFIG.info.emoji} {MARS_CONFIG.info.description}
              </div>
            )}
            
            {selectedObject === 'AquaSat' && (
              <div style={{ marginTop: '5px', padding: '5px', backgroundColor: 'rgba(0,170,255,0.2)', borderRadius: '3px', fontSize: '10px' }}>
                {AQUA_SAT_CONFIG.info.emoji} {AQUA_SAT_CONFIG.info.description}
              </div>
            )}
          </div>
        )}
        
        <input 
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={selectedObject ? `Ask about ${selectedObject}...` : "Select an object first, then ask..."}
          disabled={!selectedObject}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.3)',
            background: selectedObject ? 'rgba(255,255,255,0.1)' : 'rgba(100,100,100,0.1)',
            color: selectedObject ? 'white' : 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            outline: 'none',
            marginBottom: '8px'
          }}
        />
        
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <button 
            onClick={() => {
              if (selectedObject && userInput.trim()) {
                handleAzureOpenAICall(userInput);
              }
            }}
            disabled={!selectedObject || !userInput.trim() || isLoading}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: selectedObject && userInput.trim() ? 'rgba(0,100,200,0.8)' : 'rgba(100,100,100,0.3)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: selectedObject && userInput.trim() ? 'pointer' : 'not-allowed',
              fontSize: '11px',
              marginRight: '5px'
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
              marginLeft: '5px'
            }}
          >
            Clear
          </button>
        </div>
        
        <div id="contentResponse" style={{
          padding: '8px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.05)',
          color: 'white',
          fontSize: '10px',
          height: '120px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {selectedObject 
            ? "Select an object and ask a question to chat with the astronaut!" 
            : "Click on any celestial object first to start a conversation!"
          }
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
              width: '100%'
            }}
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
  
  
}
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRDevice, metaQuest3 } from 'iwer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function NASAOceanVR() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomMode, setZoomMode] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  
  // Add refs to track current state for event handlers
  const zoomModeRef = useRef(false);
  const targetObjectRef = useRef(null);
  
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
      console.log(`Added ${object.userData?.name || 'Unknown'} to clickable objects. Total: ${clickableObjects.length}`);
    }
    
    // Function to handle mouse position calculation
    function updateMousePosition(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      console.log('Mouse position updated:', mouse.x, mouse.y);
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
      
      console.log(`Checking ${objectsToCheck.length} objects for intersection`);
      const intersects = raycaster.intersectObjects(objectsToCheck, false);
      console.log(`Found ${intersects.length} intersections`);
      return intersects;
    }
    
    // Function to handle object clicks
    function handleObjectClick(intersectedObject) {
      console.log('handleObjectClick called with:', intersectedObject);
      
      // Find the parent object (in case we clicked a child mesh)
      let targetObj = intersectedObject;
      
      // Check if this is a child of a clickable object
      clickableObjects.forEach(clickableObj => {
        if (clickableObj.children.includes(intersectedObject) || clickableObj === intersectedObject) {
          targetObj = clickableObj;
        }
      });
      
      console.log('Clicked object:', targetObj.userData?.name || 'Unknown');
      // Add a condition to check THE OBJECT clicked
      
      // Custom click handlers for specific objects
      if (targetObj.userData?.name === 'Sun') {
        console.log("Sun clicked - DO SOMETHING SPECIAL");
        // Example: change emission for feedback
      }
    }
    
    // Mouse hover effects
    function handleMouseMove(event) {
      updateMousePosition(event);
      const intersects = getIntersectedObjects();
      
      // Reset cursor
      document.body.style.cursor = 'default';
      
      if (intersects.length > 0) {
        // Change cursor to pointer when hovering over clickable objects
        document.body.style.cursor = 'pointer';
        console.log('Hovering over:', intersects[0].object.userData?.name || 'Unknown object');
        
        // Optional: Add hover effects here
        const hoveredObject = intersects[0].object;
        // You could add glow effects, scale changes, etc.
      }
    }
    
    // Click event handler
    function handleClick(event) {
      console.log('Click event triggered');
      console.log('Clickable objects array length:', clickableObjects.length);
      
      updateMousePosition(event);
      const intersects = getIntersectedObjects();
      
      if (intersects.length > 0) {
        console.log('Click intersected with object');
        handleObjectClick(intersects[0].object);
      } else {
        console.log('Click on empty space');
        // Clicked on empty space - exit zoom mode
        if (zoomModeRef.current) {
          zoomOutOfObject();
        }
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
      context.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Slightly more opaque background
      
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
      
      // Create sprite material
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 1.0, // Full opacity
        depthTest: false, // Don't hide behind objects
        depthWrite: false // Don't write to depth buffer
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
      
      // Render order to ensure labels appear on top
      sprite.renderOrder = 1000;
      
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
      });
    }
    
    // ===============================
    // ZOOM FUNCTIONALITY
    // ===============================
    let originalCameraPosition = new THREE.Vector3();
    let originalControlsTarget = new THREE.Vector3();
    let originalMinDistance = 0.1;
    let originalMaxDistance = 200;

    // Function to zoom into object
    function zoomIntoObject(object) {
      if (!object || zoomModeRef.current) return;
      
      console.log('Zooming into object:', object.userData?.name || 'Unknown');
      
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
      
      // Calculate new camera position
      const objectPosition = object.position.clone();
      const boundingBox = new THREE.Box3().setFromObject(object);
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      // Position camera in front of object
      const distance = maxDimension * 3; // 3x the object size
      const newCameraPosition = objectPosition.clone();
      newCameraPosition.z += distance;
      
      // Animate camera to new position
      animateCamera(newCameraPosition, objectPosition, distance * 0.5, distance * 5);
    }

    // Function to zoom out of object
    function zoomOutOfObject() {
      if (!zoomModeRef.current) return;
      
      console.log('Zooming out of object');
      
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
    const planetData = [
      { name: 'Mercury', radius: 1.5, position: [35, 0, 0], texture: '/assets/imgs/mercury.jpg' },
      { name: 'Venus', radius: 2.3, position: [-45, 10, 15], texture: '/assets/imgs/venus.jpg' },
      { name: 'Earth', radius: 2.5, position: [0, 0, 55], texture: '/assets/imgs/earth.jpg' },
      { name: 'Mars', radius: 2.0, position: [50, -15, -50], texture: '/assets/imgs/mars.jpg' },
      { name: 'Jupiter', radius: 8, position: [-70, 20, -70], texture: '/assets/imgs/jupiter.jpg' },
      { name: 'Saturn', radius: 7, position: [100, -10, 90], texture: '/assets/imgs/saturn.jpg', hasRings: true },
      { name: 'Uranus', radius: 4, position: [-120, 25, 100], texture: '/assets/imgs/uranus.jpg' },
      { name: 'Neptune', radius: 4, position: [140, -20, -140], texture: '/assets/imgs/neptune.jpg' }
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
        createLabel('☀️ Sun', sun.position, '#FFD700');
      },
      undefined,
      (error) => {
        console.error('Error loading sun texture:', error);
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
        createLabel('☀️ Sun', sun.position, '#FFD700');
      }
    );
    
    // Create planets with textures
    planetData.forEach((planetInfo) => {
      const geometry = new THREE.SphereGeometry(planetInfo.radius, 32, 32);
      
      // Planet color mapping for labels
      const planetColors = {
        'Mercury': '#8C7853',
        'Venus': '#FFC649',
        'Earth': '#6B93D6',
        'Mars': '#CD5C5C',
        'Jupiter': '#D8CA9D',
        'Saturn': '#FAD5A5',
        'Uranus': '#4FD0E7',
        'Neptune': '#4B70DD'
      };
      
      // Load planet texture
      textureLoader.load(
        planetInfo.texture,
        (texture) => {
          const material = new THREE.MeshLambertMaterial({ 
            map: texture
          });
          
          const planet = new THREE.Mesh(geometry, material);
          planet.position.set(planetInfo.position[0], planetInfo.position[1], planetInfo.position[2]);
          planet.userData = { 
            name: planetInfo.name, 
            rotationSpeed: Math.random() * 0.01 + 0.002
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
          createLabel(`🪐 ${planetInfo.name}`, planet.position, color);
          
          // Add rings to Saturn
          if (planetInfo.hasRings && planetInfo.name === 'Saturn') {
            // Load Saturn rings texture
            textureLoader.load(
              '/assets/imgs/saturn_rings.png',
              (ringTexture) => {
                const ringGeometry = new THREE.RingGeometry(planetInfo.radius + 1, planetInfo.radius + 3, 64);
                const ringMaterial = new THREE.MeshBasicMaterial({ 
                  map: ringTexture,
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.8
                });
                const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.rotation.x = Math.PI / 2;
                planet.add(rings);
              },
              undefined,
              (error) => {
                console.error('Error loading Saturn rings texture:', error);
                // Fallback rings without texture
                const ringGeometry = new THREE.RingGeometry(planetInfo.radius + 1, planetInfo.radius + 3, 64);
                const ringMaterial = new THREE.MeshBasicMaterial({ 
                  color: 0xC4A484, 
                  side: THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.6
                });
                const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.rotation.x = Math.PI / 2;
                planet.add(rings);
              }
            );
          }
        },
        undefined,
        (error) => {
          console.error(`Error loading texture for ${planetInfo.name}:`, error);
          // Fallback to colored material
          const fallbackColors = {
            'Mercury': 0x8C7853,
            'Venus': 0xFFC649,
            'Earth': 0x6B93D6,
            'Mars': 0xCD5C5C,
            'Jupiter': 0xD8CA9D,
            'Saturn': 0xFAD5A5,
            'Uranus': 0x4FD0E7,
            'Neptune': 0x4B70DD
          };
          
          const material = new THREE.MeshLambertMaterial({ 
            color: fallbackColors[planetInfo.name] || 0x888888
          });
          
          const planet = new THREE.Mesh(geometry, material);
          planet.position.set(planetInfo.position[0], planetInfo.position[1], planetInfo.position[2]);
          planet.userData = { 
            name: planetInfo.name, 
            rotationSpeed: Math.random() * 0.01 + 0.002
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
          createLabel(`🪐 ${planetInfo.name}`, planet.position, color);
          
          // Add fallback rings to Saturn
          if (planetInfo.hasRings && planetInfo.name === 'Saturn') {
            const ringGeometry = new THREE.RingGeometry(planetInfo.radius + 1, planetInfo.radius + 3, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({ 
              color: 0xC4A484, 
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.6
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            planet.add(rings);
          }
        }
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
          console.log('Satellite model loaded successfully:', gltf);
          
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
              earthPos.z + 5
            );
          } else {
            aquaSat.position.set(8, 3, 60);
          }
          
          // Scale the model
          aquaSat.scale.set(2, 2, 2);
          
          aquaSat.userData = { 
            name: 'AquaSat',
            rotationSpeed: 0.002,
            isSatellite: true
          };
          
          scene.add(aquaSat);
          
          // Add to clickable objects
          addClickableObject(aquaSat);
          
          console.log('Satellite added near Earth at position:', aquaSat.position);
          
          // Create label for satellite
          createLabel('🛰️ Aqua Satellite', aquaSat.position, '#00aaff');
          
          setLoading(false);
        },
        (progress) => {
          console.log('Loading satellite model:', Math.round(progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading satellite model:', error);
          console.log('Creating fallback satellite near Earth...');
          
          // Create brighter fallback satellite
          const fallbackGeometry = new THREE.SphereGeometry(1, 16, 16);
          const fallbackMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            emissive: 0x0066aa,
            emissiveIntensity: 0.8
          });
          aquaSat = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
          
          if (earth) {
            const earthPos = earth.position.clone();
            aquaSat.position.set(earthPos.x + 8, earthPos.y + 3, earthPos.z + 5);
          } else {
            aquaSat.position.set(8, 3, 60);
          }
          
          aquaSat.userData = { 
            name: 'AquaSat',
            rotationSpeed: 0.002,
            isSatellite: true
          };
          
          scene.add(aquaSat);
          
          // Add to clickable objects
          addClickableObject(aquaSat);
          
          // Create label for fallback satellite
          createLabel('🛰️ Aqua Satellite', aquaSat.position, '#00aaff');
          
          setLoading(false);
        }
      );
    }
    
    // ADD EVENT LISTENERS AFTER A DELAY TO ENSURE OBJECTS ARE LOADED
    setTimeout(() => {
      console.log('Setting up event listeners...');
      console.log('Current clickable objects count:', clickableObjects.length);
      
      // Add event listeners
      renderer.domElement.addEventListener('click', handleClick);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      
      console.log('Event listeners added!');
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
      Object.values(planets).forEach(planet => {
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
        {zoomMode ? 
          '🔍 In zoom mode - click object again to exit or click empty space' : 
          '☀️ Bright Sun at center, 🪐 Textured planets, 🛰️ Satellite near Earth, ✨ Colorful distant stars'
        }
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
        <strong>Clickable Objects:</strong><br/>
        ☀️ Sun (center) | 🪐 Mercury | 🪐 Venus | 🌍 Earth + Aqua satellite<br/>
        🪐 Mars | 🪐 Jupiter | 🪐 Saturn + Rings | 🪐 Uranus | 🪐 Neptune<br/>
        Click any object to zoom in and explore!
      </div>
    </div>
  );
}
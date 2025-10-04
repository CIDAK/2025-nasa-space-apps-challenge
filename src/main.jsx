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
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Darker background for better contrast
    
    // Camera positioned at the center (user position)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0); // User at center point
    
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
    // LABEL CREATION FUNCTION
    // ===============================
    function createLabel(text, position, color = '#ffffff') {
      // Create canvas for text texture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 256;
      canvas.height = 64;
      
      // Set font and measure text
      context.font = 'Bold 24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Clear canvas with transparent background
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background rectangle
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
      context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 10);
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
        opacity: 0.9
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(8, 2, 1); // Adjust scale as needed
      
      // Store reference to original position for updates
      sprite.userData = { 
        originalPosition: position.clone(),
        text: text
      };
      
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
        
        // Update position to stay above the object
        const originalPos = label.userData.originalPosition;
        label.position.copy(originalPos);
        label.position.y += 3; // Offset above the object
      });
    }
    
    // ===============================
    // ZOOM FUNCTIONALITY
    // ===============================
    let originalCameraPosition = new THREE.Vector3();
    let originalControlsTarget = new THREE.Vector3();
    let originalMinDistance = 0.1;
    let originalMaxDistance = 200;

    // Function to detect object in front of user
    function getObjectInFront() {
      const raycaster = new THREE.Raycaster();
      const direction = new THREE.Vector3(0, 0, -1); // Forward direction
      
      raycaster.set(camera.position, direction);
      
      const objectsToCheck = [];
      if (earth) objectsToCheck.push(earth);
      if (aquaSat) objectsToCheck.push(aquaSat);
      Object.values(planets).forEach(planet => objectsToCheck.push(planet));
      
      const intersects = raycaster.intersectObjects(objectsToCheck);
      
      if (intersects.length > 0) {
        return intersects[0].object;
      }
      return null;
    }

    // Function to zoom into object
    function zoomIntoObject(object) {
      if (!object || zoomMode) return;
      
      // Store original camera settings
      originalCameraPosition.copy(camera.position);
      originalControlsTarget.copy(controls.target);
      originalMinDistance = controls.minDistance;
      originalMaxDistance = controls.maxDistance;
      
      // Set zoom mode
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
      if (!zoomMode) return;
      
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
      const duration = 800; // 1.5 seconds
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
      { name: 'Earth', radius: 2.5, position: [0, 0, 55], texture: '/assets/imgs/ecco2_and_grid_web.png' },
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
            // Removed emissive properties to show natural texture colors
          });
          
          const planet = new THREE.Mesh(geometry, material);
          planet.position.set(planetInfo.position[0], planetInfo.position[1], planetInfo.position[2]);
          planet.userData = { 
            name: planetInfo.name, 
            rotationSpeed: Math.random() * 0.01 + 0.002
          };
          
          scene.add(planet);
          planets[planetInfo.name] = planet;
          
          // Create label for planet
          const color = planetColors[planetInfo.name] || '#ffffff';
          createLabel(` ${planetInfo.name}`, planet.position, color);
          
          // Special handling for Earth and Saturn
          if (planetInfo.name === 'Earth') {
            earth = planet;
            // Load satellite near Earth after Earth is created
            loadSatelliteNearEarth();
          }
          
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
                  // Removed emissive properties
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
            // Removed emissive properties for natural colors
          });
          
          const planet = new THREE.Mesh(geometry, material);
          planet.position.set(planetInfo.position[0], planetInfo.position[1], planetInfo.position[2]);
          planet.userData = { 
            name: planetInfo.name, 
            rotationSpeed: Math.random() * 0.01 + 0.002
          };
          
          scene.add(planet);
          planets[planetInfo.name] = planet;
          
          // Create label for planet
        
          const color = planetColors[planetInfo.name] || '#ffffff';
          createLabel(` ${planetInfo.name}`, planet.position, color);
          
          if (planetInfo.name === 'Earth') {
            earth = planet;
            loadSatelliteNearEarth();
          }
          
          // Add fallback rings to Saturn
          if (planetInfo.hasRings && planetInfo.name === 'Saturn') {
            const ringGeometry = new THREE.RingGeometry(planetInfo.radius + 1, planetInfo.radius + 3, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({ 
              color: 0xC4A484, 
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.6
              // Removed emissive properties
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
                child.material.emissiveIntensity = 0.6; // Increased from 0.2
                child.material.needsUpdate = true;
                
                // Higher brightness enhancement
                if (child.material.color) {
                  child.material.color.multiplyScalar(2.0); // Increased from 1.3
                }
              }
            }
          });
          
          // Center the model
          const box = new THREE.Box3().setFromObject(aquaSat);
          const center = box.getCenter(new THREE.Vector3());
          aquaSat.position.sub(center); // Center the model
          
          // Position near Earth
          if (earth) {
            const earthPos = earth.position.clone();
            aquaSat.position.set(
              earthPos.x + 8,  // 8 units away from Earth
              earthPos.y + 3,  // Slightly above
              earthPos.z + 5   // Slightly forward
            );
          } else {
            // Fallback position if Earth not loaded yet
            aquaSat.position.set(8, 3, 60);
          }
          
          // Scale the model
          aquaSat.scale.set(2, 2, 2);
          
          aquaSat.userData = { 
            name: 'AquaSat',
            rotationSpeed: 0.002
          };
          
          scene.add(aquaSat);
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
            emissive: 0x0066aa, // Increased emissive
            emissiveIntensity: 0.8 // Increased from 0.3
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
            rotationSpeed: 0.002
          };
          
          scene.add(aquaSat);
          
          // Create label for fallback satellite
          createLabel('🛰️ Aqua Satellite', aquaSat.position, '#00aaff');
          
          setLoading(false);
        }
      );
    }

    // ===============================
    // CLICK FUNCTIONALITY
    // ===============================
    const handleClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Create raycaster
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      // Check for intersections
      const objectsToCheck = [];
      if (earth) objectsToCheck.push(earth);
      if (aquaSat) objectsToCheck.push(aquaSat);
      Object.values(planets).forEach(planet => objectsToCheck.push(planet));
      
      const intersects = raycaster.intersectObjects(objectsToCheck);
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        if (!zoomMode) {
          zoomIntoObject(clickedObject);
        } else if (targetObject === clickedObject) {
          zoomOutOfObject();
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // ===============================
    // KEYBOARD CONTROLS
    // ===============================
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'KeyZ':
          if (!zoomMode) {
            const objectInFront = getObjectInFront();
            if (objectInFront) {
              zoomIntoObject(objectInFront);
            }
          } else {
            zoomOutOfObject();
          }
          break;
        case 'Escape':
          if (zoomMode) {
            zoomOutOfObject();
          }
          break;
        case 'KeyL':
          // Toggle labels visibility
          labels.forEach(label => {
            label.visible = !label.visible;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
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
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('click', handleClick);
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
        ⌨️ Z: Zoom into object in front<br/>
        ⌨️ L: Toggle labels on/off<br/>
        ⌨️ Esc: Exit zoom mode<br/>
        {zoomMode ? 
          '🔍 In zoom mode - click object or press Esc to exit' : 
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
        <strong>Objects with Labels:</strong><br/>
         Sun (center) |  Mercury |  Venus |  Earth + Aqua satellite<br/>
         Mars |  Jupiter |  Saturn + Rings |  Uranus |  Neptune<br/>
        Colorful stars in far background<br/>
      </div>
    </div>
  );
}
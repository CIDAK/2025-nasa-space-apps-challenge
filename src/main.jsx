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
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181818); // Light black background
    
    // Camera positioned at the center (user position)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0); // User at center point
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // OrbitControls - configure to rotate around user position (0,0,0)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0); // Target is the user position
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 0.1; // Allow very close zoom
    controls.maxDistance = 50;
    controls.enablePan = false; // Disable panning to keep user at center
    controls.update();
    
    // ===============================
    // ZOOM FUNCTIONALITY
    // ===============================
    let originalCameraPosition = new THREE.Vector3();
    let originalControlsTarget = new THREE.Vector3();
    let originalMinDistance = 0.1;
    let originalMaxDistance = 50;

    // Function to detect object in front of user
    function getObjectInFront() {
      const raycaster = new THREE.Raycaster();
      const direction = new THREE.Vector3(0, 0, -1); // Forward direction
      
      raycaster.set(camera.position, direction);
      
      const objectsToCheck = [];
      if (earth) objectsToCheck.push(earth);
      if (aquaSat) objectsToCheck.push(aquaSat);
      
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
    // WHITE PARTICLES BACKGROUND
    // ===============================
    function createParticles() {
      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 1000;
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 200; // Spread particles in space
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.8
      });
      
      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    }
    
    createParticles();
    
    // ===============================
    // EARTH WITH TEXTURE (IN FRONT)
    // ===============================
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/imgs/ecco2_and_grid_web.png',
      (texture) => {
        // Create Earth positioned in front of user
        const earthGeometry = new THREE.SphereGeometry(8, 64, 64);
        const earthMaterial = new THREE.MeshBasicMaterial({ 
          map: texture 
        });
        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(0, 0, -25); // In front of user (negative Z)
        scene.add(earth);
        
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading Earth texture:', err);
        setError('Failed to load Earth texture');
        setLoading(false);
      }
    );
    
    // ===============================
    // SATELLITE 3D MODEL (BEHIND USER)
    // ===============================
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/assets/3Dmodels/nasa_aqua_eos_pm-1_satellite.glb',
      (gltf) => {
        console.log('Satellite model loaded successfully:', gltf);
        
        aquaSat = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(aquaSat);
        const center = box.getCenter(new THREE.Vector3());
        aquaSat.position.sub(center); // Center the model
        
        // Position behind user
        aquaSat.position.set(0, 0, 25);
        
        // Scale the model (adjust as needed)
        aquaSat.scale.set(5, 5, 5);
        
        // Add lighting for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);
        
        scene.add(aquaSat);
        console.log('Satellite added to scene at position:', aquaSat.position);
        
        // Add button above
        const buttonGeometry = new THREE.BoxGeometry(2.5, 0.7, 0.3);
        const buttonMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(aquaSat.position.x - 5, aquaSat.position.y / 2, aquaSat.position.z); // Position above the satellite
        scene.add(button);
      },
      (progress) => {
        console.log('Loading satellite model:', Math.round(progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading satellite model:', error);
        console.log('Creating fallback blue sphere...');
      }
    );

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // ===============================
    // ANIMATION LOOP
    // ===============================
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate Earth
      if (earth) {
        earth.rotation.y += 0.005;
      }
      
      // Rotate satellite slowly
      if (aquaSat) {
        aquaSat.rotation.y += 0.002;
      }
      
      // Subtle particle movement
      if (particles) {
        particles.rotation.y += 0.0005;
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
          Loading Space Experience...
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
        <strong>{zoomMode ? `Zoomed: ${targetObject === earth ? 'Earth' : 'Satellite'}` : 'Space Explorer'}:</strong><br/>
        🖱️ Mouse: Look around (rotate view)<br/>
        🔄 Mouse wheel: Zoom in/out<br/>
        🖱️ Click: Zoom into object<br/>
        ⌨️ Z: Zoom into object in front<br/>
        ⌨️ Esc: Exit zoom mode<br/>
        {zoomMode ? 
          '🔍 In zoom mode - click object or press Esc to exit' : 
          '🌍 Earth is in front, 🛰️ Satellite behind'
        }
      </div>
    </div>
  );
}
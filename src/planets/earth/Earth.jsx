import * as THREE from 'three';

/**
 * Earth Planet Configuration and Creation
 */
export const EARTH_CONFIG = {
  name: 'Earth',
  radius: 2.5,
  position: [0, 0, 55],
  texture: '/assets/imgs/earth.jpg',
  color: 0x6B93D6,
  labelColor: '#6B93D6',
  rotationSpeed: 0.005,
  info: {
    emoji: '🌍',
    description: 'Third planet • Only known planet with life • 71% water coverage'
  },
  // Ocean data visualization textures
  oceanTemperature: {
    standardMap: '/assets/imgs/ocean_temp_map.jpg',
    anomalyMap: '/assets/imgs/ocean_temp_anomaly.jpg',
    chlorophyllMap: '/assets/imgs/ocean_chlorophyll.jpg',
    dayNightMap: '/assets/imgs/earth_day_night.jpg'
  },
  // Real scale in km
  realRadius: 6371,
  realOrbitDistance: 149600000 // Earth to sun
};

/**
 * Create Earth mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Earth to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {THREE.Mesh} - The created Earth mesh
 */
export function createEarth(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(EARTH_CONFIG.radius, 64, 64); // Increased segment count for better look
  
  return new Promise((resolve, reject) => {
    // Try to load texture
    textureLoader.load(
      EARTH_CONFIG.texture,
      (texture) => {
        // Create Earth surface material with better shading
        const material = new THREE.MeshPhongMaterial({ 
          map: texture,
          bumpMap: texture, // Simple bump mapping for terrain
          bumpScale: 0.05,
          specularMap: texture,
          specular: new THREE.Color(0x333333),
          shininess: 15
        });
        
        const earth = new THREE.Mesh(geometry, material);
        earth.position.set(
          EARTH_CONFIG.position[0],
          EARTH_CONFIG.position[1],
          EARTH_CONFIG.position[2]
        );
        earth.userData = { 
          name: EARTH_CONFIG.name,
          rotationSpeed: EARTH_CONFIG.rotationSpeed,
          realRadius: EARTH_CONFIG.realRadius,
          currentView: 'standard'
        };
        
        // Add clouds layer
        addCloudsLayer(earth, textureLoader, scene);
        
        // Add to scene
        scene.add(earth);
        
        // Add to clickable objects
        addClickableObject(earth);
        
        // Create label
        createLabel(EARTH_CONFIG.name, earth.position, EARTH_CONFIG.labelColor);
        
        resolve(earth);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Earth texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshPhongMaterial({ 
          color: EARTH_CONFIG.color,
          shininess: 25
        });
        
        const earth = new THREE.Mesh(geometry, material);
        earth.position.set(
          EARTH_CONFIG.position[0],
          EARTH_CONFIG.position[1],
          EARTH_CONFIG.position[2]
        );
        earth.userData = { 
          name: EARTH_CONFIG.name,
          rotationSpeed: EARTH_CONFIG.rotationSpeed,
          realRadius: EARTH_CONFIG.realRadius,
          currentView: 'standard'
        };
        
        scene.add(earth);
        
        // Add to clickable objects
        addClickableObject(earth);
        
        // Create label
        createLabel(EARTH_CONFIG.name, earth.position, EARTH_CONFIG.labelColor);
        
        resolve(earth);
      }
    );
  });
}

/**
 * Add cloud layer to Earth
 * @param {THREE.Mesh} earthMesh - The Earth mesh
 * @param {THREE.TextureLoader} textureLoader - Texture loader
 * @param {THREE.Scene} scene - Scene to add cloud layer to
 */
function addCloudsLayer(earthMesh, textureLoader, scene) {
  textureLoader.load(
    '/assets/imgs/earth_clouds.png',
    (cloudsTexture) => {
      const cloudsMaterial = new THREE.MeshLambertMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.8
      });
      
      const cloudsGeometry = new THREE.SphereGeometry(
        EARTH_CONFIG.radius * 1.02, 
        64, 
        64
      );
      
      const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
      clouds.name = 'earth_clouds';
      
      earthMesh.add(clouds);
      earthMesh.userData.cloudsLayer = clouds;
      
      console.log('☁️ Earth clouds layer added');
    },
    undefined,
    (error) => console.warn('Failed to load clouds texture:', error)
  );
}

/**
 * Change Earth's texture for ocean temperature visualization
 * @param {THREE.Mesh} earthMesh - The Earth mesh object
 * @param {string} newTexturePath - Path to the new texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {string} mode - Visualization mode (standard, temperature, anomaly, etc)
 */
export function changeEarthTexture(earthMesh, newTexturePath, textureLoader, mode = 'temperature') {
  if (!earthMesh) {
    console.warn('Earth mesh not found');
    return;
  }
  
  // Store original material if not already stored
  if (!earthMesh.userData.originalMaterial) {
    earthMesh.userData.originalMaterial = earthMesh.material.clone();
  }
  
  // Update current view mode
  earthMesh.userData.currentView = mode;
  
  // Hide clouds for temperature visualization
  if (earthMesh.userData.cloudsLayer) {
    earthMesh.userData.cloudsLayer.visible = (mode === 'standard');
  }
  
  textureLoader.load(
    newTexturePath,
    (newTexture) => {
      // Successfully loaded new texture
      const newMaterial = new THREE.MeshPhongMaterial({ 
        map: newTexture,
        bumpMap: newTexture,
        bumpScale: 0.02,
        specular: new THREE.Color(0x222222),
        shininess: 15
      });
      
      // Apply new material
      earthMesh.material = newMaterial;
      earthMesh.material.needsUpdate = true;
      
      console.log(`🌡️ Earth visualization changed to ${mode} mode:`, newTexturePath);
    },
    undefined,
    (error) => {
      console.error('Failed to load new Earth texture:', error);
      
      // Fallback to a colored material representing ocean temperature
      let color;
      switch (mode) {
        case 'temperature':
          color = 0x4169E1; // Royal blue for ocean temperature
          break;
        case 'anomaly':
          color = 0xFF6347; // Tomato red for anomalies
          break;
        default:
          color = 0x6B93D6; // Default Earth blue
      }
      
      const fallbackMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: 0x001122,
        emissiveIntensity: 0.3
      });
      
      earthMesh.material = fallbackMaterial;
      earthMesh.material.needsUpdate = true;
      
      console.log(`Applied fallback ${mode} visualization`);
    }
  );
}

/**
 * Show ocean temperature visualization
 * @param {THREE.Mesh} earthMesh - The Earth mesh object
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {string} mode - Visualization mode (temperature, anomaly, chlorophyll)
 */
export function showOceanTemperature(earthMesh, textureLoader, mode = 'temperature') {
  if (!earthMesh) {
    console.warn('Earth mesh not found');
    return;
  }
  
  let texturePath;
  switch (mode) {
    case 'temperature':
      texturePath = EARTH_CONFIG.oceanTemperature.standardMap;
      break;
    case 'anomaly':
      texturePath = EARTH_CONFIG.oceanTemperature.anomalyMap;
      break;
    case 'chlorophyll':
      texturePath = EARTH_CONFIG.oceanTemperature.chlorophyllMap;
      break;
    case 'day-night':
      texturePath = EARTH_CONFIG.oceanTemperature.dayNightMap;
      break;
    default:
      texturePath = EARTH_CONFIG.oceanTemperature.standardMap;
  }
  
  changeEarthTexture(earthMesh, texturePath, textureLoader, mode);
  
  return {
    mode: mode,
    description: getVisualizationDescription(mode)
  };
}

/**
 * Get description for the current visualization mode
 * @param {string} mode - Visualization mode
 * @returns {string} Description text
 */
function getVisualizationDescription(mode) {
  switch (mode) {
    case 'temperature':
      return 'Sea Surface Temperature (SST) showing absolute ocean temperatures';
    case 'anomaly':
      return 'Temperature anomalies showing deviations from historical averages';
    case 'chlorophyll':
      return 'Ocean chlorophyll concentrations indicating phytoplankton activity';
    case 'day-night':
      return 'Day/night visualization of Earth with city lights visible on night side';
    default:
      return 'Standard Earth visualization';
  }
}

/**
 * Restore Earth's original texture
 * @param {THREE.Mesh} earthMesh - The Earth mesh object
 */
export function restoreEarthTexture(earthMesh) {
  if (earthMesh && earthMesh.userData.originalMaterial) {
    earthMesh.material = earthMesh.userData.originalMaterial;
    earthMesh.material.needsUpdate = true;
    
    // Show clouds again
    if (earthMesh.userData.cloudsLayer) {
      earthMesh.userData.cloudsLayer.visible = true;
    }
    
    earthMesh.userData.currentView = 'standard';
    console.log('Earth texture restored to original');
  }
}

/**
 * Animate Earth rotation
 * @param {THREE.Mesh} earthMesh - The Earth mesh object
 */
export function animateEarth(earthMesh) {
  if (earthMesh && earthMesh.userData && earthMesh.userData.rotationSpeed) {
    earthMesh.rotation.y += earthMesh.userData.rotationSpeed;
  }
}

/**
 * View Earth at 1:1 scale from space
 * @param {THREE.Mesh} earthMesh - The Earth mesh
 * @param {THREE.Camera} camera - The camera
 * @param {THREE.OrbitControls} controls - OrbitControls
 */
export function viewEarthFromSpace(earthMesh, camera, controls) {
  if (!earthMesh || !camera || !controls) {
    console.warn('Missing required parameters for 1:1 scale view');
    return;
  }
  
  // Store current camera settings for restoration
  const currentPosition = camera.position.clone();
  const currentTarget = controls.target.clone();
  
  // Real Earth has 6371km radius
  // Low Earth orbit is ~400km above surface
  // We'll set camera at "500km" above surface in our scale
  
  // Calculate scale factor between our model and real Earth
  const scaleFactor = EARTH_CONFIG.realRadius / EARTH_CONFIG.radius;
  
  // Distance from Earth center to camera in our scale units
  // 6371 + 500 = 6871km in real life
  const distanceFromCenter = (EARTH_CONFIG.realRadius + 500) / scaleFactor;
  
  // Place camera above North pole for dramatic effect
  const newPosition = earthMesh.position.clone().add(new THREE.Vector3(0, distanceFromCenter, 0));
  
  // Animate transition
  const duration = 2000; // ms
  const startTime = Date.now();
  
  function animateCamera() {
    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Ease in-out transition
    const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    camera.position.lerpVectors(currentPosition, newPosition, easeProgress);
    controls.target.lerpVectors(currentTarget, earthMesh.position, easeProgress);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      console.log('🌏 Now viewing Earth at approximate 1:1 scale from 500km');
      
      // Adjust controls to allow close inspection
      controls.minDistance = EARTH_CONFIG.radius * 1.02; // Just above surface
      controls.maxDistance = distanceFromCenter * 5; // Allow zooming out
    }
  }
  
  // Begin animation
  animateCamera();
  
  return {
    // Return a function to restore original view
    restore: function() {
      const restoreStartTime = Date.now();
      
      function animateRestore() {
        const elapsedTime = Date.now() - restoreStartTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        camera.position.lerpVectors(newPosition, currentPosition, easeProgress);
        controls.target.lerpVectors(earthMesh.position, currentTarget, easeProgress);
        controls.update();
        
        if (progress < 1) {
          requestAnimationFrame(animateRestore);
        } else {
          console.log('🌍 Restored standard view of Earth');
          controls.minDistance = 0.1;
          controls.maxDistance = 200;
        }
      }
      
      animateRestore();
    }
  };
}
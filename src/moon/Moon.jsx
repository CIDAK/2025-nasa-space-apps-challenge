import * as THREE from 'three';

/**
 * Moon Configuration
 */
export const MOON_CONFIG = {
  name: 'Moon',
  radius: 0.7,
  distanceFromEarth: 5,
  texture: '/assets/imgs/moon.jpg',
  color: 0xAAAAAA,
  labelColor: '#CCCCCC',
  orbitSpeed: 0.001,
  rotationSpeed: 0.002,
  info: {
    emoji: '🌙',
    description: "Earth's only natural satellite • Affects tides • No atmosphere"
  }
};

/**
 * Create Moon mesh
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Mesh} earthMesh - Earth mesh to orbit around
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create label
 * @returns {Promise<THREE.Mesh>} - The created Moon mesh
 */
export function createMoon(textureLoader, scene, earthMesh, addClickableObject, createLabel) {
  if (!earthMesh) {
    console.warn('Earth mesh required to create Moon');
    return Promise.resolve(null);
  }

  const geometry = new THREE.SphereGeometry(MOON_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    textureLoader.load(
      MOON_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const moon = new THREE.Mesh(geometry, material);
        
        // Position moon relative to Earth
        const earthPos = earthMesh.position.clone();
        moon.position.set(
          earthPos.x + MOON_CONFIG.distanceFromEarth,
          earthPos.y,
          earthPos.z
        );
        
        moon.userData = { 
          name: MOON_CONFIG.name,
          rotationSpeed: MOON_CONFIG.rotationSpeed,
          orbitSpeed: MOON_CONFIG.orbitSpeed,
          orbitRadius: MOON_CONFIG.distanceFromEarth,
          orbitAngle: 0,
          earthPosition: earthMesh.position
        };
        
        scene.add(moon);
        addClickableObject(moon);
        createLabel(MOON_CONFIG.name, moon.position, MOON_CONFIG.labelColor);
        
        resolve(moon);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Moon texture, using fallback:', error);
        
        const material = new THREE.MeshLambertMaterial({ 
          color: MOON_CONFIG.color
        });
        
        const moon = new THREE.Mesh(geometry, material);
        
        const earthPos = earthMesh.position.clone();
        moon.position.set(
          earthPos.x + MOON_CONFIG.distanceFromEarth,
          earthPos.y,
          earthPos.z
        );
        
        moon.userData = { 
          name: MOON_CONFIG.name,
          rotationSpeed: MOON_CONFIG.rotationSpeed,
          orbitSpeed: MOON_CONFIG.orbitSpeed,
          orbitRadius: MOON_CONFIG.distanceFromEarth,
          orbitAngle: 0,
          earthPosition: earthMesh.position
        };
        
        scene.add(moon);
        addClickableObject(moon);
        createLabel(MOON_CONFIG.name, moon.position, MOON_CONFIG.labelColor);
        
        resolve(moon);
      }
    );
  });
}

/**
 * Animate Moon - rotation and orbit around Earth
 * @param {THREE.Mesh} moonMesh - The Moon mesh object
 */
export function animateMoon(moonMesh) {
  if (!moonMesh || !moonMesh.userData) return;
  
  // Rotate moon on its axis
  if (moonMesh.userData.rotationSpeed) {
    moonMesh.rotation.y += moonMesh.userData.rotationSpeed;
  }
  
  // Orbit around Earth
  if (moonMesh.userData.orbitSpeed && moonMesh.userData.earthPosition) {
    moonMesh.userData.orbitAngle += moonMesh.userData.orbitSpeed;
    
    const earthPos = moonMesh.userData.earthPosition;
    const radius = moonMesh.userData.orbitRadius;
    
    moonMesh.position.x = earthPos.x + Math.cos(moonMesh.userData.orbitAngle) * radius;
    moonMesh.position.z = earthPos.z + Math.sin(moonMesh.userData.orbitAngle) * radius;
  }
}
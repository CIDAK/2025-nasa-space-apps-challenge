import * as THREE from 'three';

/**
 * Mars Planet Configuration and Creation
 */
export const MARS_CONFIG = {
  name: 'Mars',
  radius: 2.0,
  position: [50, -15, -50],
  texture: '/assets/imgs/mars.jpg',
  color: 0xCD5C5C,
  labelColor: '#CD5C5C',
  rotationSpeed: 0.005,
  info: {
    emoji: '🔴',
    description: 'Red planet • Iron oxide surface • Two moons • Possible past water'
  }
};

/**
 * Create Mars mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Mars to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Mars mesh
 */
export function createMars(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(MARS_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load texture
    textureLoader.load(
      MARS_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const mars = new THREE.Mesh(geometry, material);
        mars.position.set(
          MARS_CONFIG.position[0],
          MARS_CONFIG.position[1],
          MARS_CONFIG.position[2]
        );
        mars.userData = { 
          name: MARS_CONFIG.name,
          rotationSpeed: MARS_CONFIG.rotationSpeed
        };
        
        scene.add(mars);
        
        // Add to clickable objects
        addClickableObject(mars);
        
        // Create label
        createLabel(MARS_CONFIG.name, mars.position, MARS_CONFIG.labelColor);
        
        resolve(mars);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Mars texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: MARS_CONFIG.color
        });
        
        const mars = new THREE.Mesh(geometry, material);
        mars.position.set(
          MARS_CONFIG.position[0],
          MARS_CONFIG.position[1],
          MARS_CONFIG.position[2]
        );
        mars.userData = { 
          name: MARS_CONFIG.name,
          rotationSpeed: MARS_CONFIG.rotationSpeed
        };
        
        scene.add(mars);
        
        // Add to clickable objects
        addClickableObject(mars);
        
        // Create label
        createLabel(MARS_CONFIG.name, mars.position, MARS_CONFIG.labelColor);
        
        resolve(mars);
      }
    );
  });
}

/**
 * Animate Mars rotation
 * @param {THREE.Mesh} marsMesh - The Mars mesh object
 */
export function animateMars(marsMesh) {
  if (marsMesh && marsMesh.userData && marsMesh.userData.rotationSpeed) {
    marsMesh.rotation.y += marsMesh.userData.rotationSpeed;
  }
}
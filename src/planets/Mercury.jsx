import * as THREE from 'three';

/**
 * Mercury Planet Configuration and Creation
 */
export const MERCURY_CONFIG = {
  name: 'Mercury',
  radius: 1.5,
  position: [35, 0, 0],
  texture: '/assets/imgs/mercury.jpg',
  color: 0x8C7853,
  labelColor: '#8C7853',
  rotationSpeed: 0.004,
  info: {
    emoji: '☿️',
    description: 'Smallest planet • Closest to Sun • No atmosphere • Extreme temperatures'
  }
};

/**
 * Create Mercury mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Mercury to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Mercury mesh
 */
export function createMercury(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(MERCURY_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load texture
    textureLoader.load(
      MERCURY_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const mercury = new THREE.Mesh(geometry, material);
        mercury.position.set(
          MERCURY_CONFIG.position[0],
          MERCURY_CONFIG.position[1],
          MERCURY_CONFIG.position[2]
        );
        mercury.userData = { 
          name: MERCURY_CONFIG.name,
          rotationSpeed: MERCURY_CONFIG.rotationSpeed
        };
        
        scene.add(mercury);
        
        // Add to clickable objects
        addClickableObject(mercury);
        
        // Create label
        createLabel(MERCURY_CONFIG.name, mercury.position, MERCURY_CONFIG.labelColor);
        
        resolve(mercury);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Mercury texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: MERCURY_CONFIG.color
        });
        
        const mercury = new THREE.Mesh(geometry, material);
        mercury.position.set(
          MERCURY_CONFIG.position[0],
          MERCURY_CONFIG.position[1],
          MERCURY_CONFIG.position[2]
        );
        mercury.userData = { 
          name: MERCURY_CONFIG.name,
          rotationSpeed: MERCURY_CONFIG.rotationSpeed
        };
        
        scene.add(mercury);
        
        // Add to clickable objects
        addClickableObject(mercury);
        
        // Create label
        createLabel(MERCURY_CONFIG.name, mercury.position, MERCURY_CONFIG.labelColor);
        
        resolve(mercury);
      }
    );
  });
}

/**
 * Animate Mercury rotation
 * @param {THREE.Mesh} mercuryMesh - The Mercury mesh object
 */
export function animateMercury(mercuryMesh) {
  if (mercuryMesh && mercuryMesh.userData && mercuryMesh.userData.rotationSpeed) {
    mercuryMesh.rotation.y += mercuryMesh.userData.rotationSpeed;
  }
}
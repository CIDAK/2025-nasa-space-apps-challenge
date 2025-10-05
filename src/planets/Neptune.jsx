import * as THREE from 'three';

/**
 * Neptune Planet Configuration and Creation
 */
export const NEPTUNE_CONFIG = {
  name: 'Neptune',
  radius: 4,
  position: [140, -20, -140],
  texture: '/assets/imgs/neptune.jpg',
  color: 0x4B70DD,
  labelColor: '#4B70DD',
  rotationSpeed: 0.007,
  info: {
    emoji: '🔵',
    description: 'Farthest planet • Ice giant • Fastest winds • 14 known moons'
  }
};

/**
 * Create Neptune mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Neptune to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Neptune mesh
 */
export function createNeptune(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(NEPTUNE_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load texture
    textureLoader.load(
      NEPTUNE_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const neptune = new THREE.Mesh(geometry, material);
        neptune.position.set(
          NEPTUNE_CONFIG.position[0],
          NEPTUNE_CONFIG.position[1],
          NEPTUNE_CONFIG.position[2]
        );
        neptune.userData = { 
          name: NEPTUNE_CONFIG.name,
          rotationSpeed: NEPTUNE_CONFIG.rotationSpeed
        };
        
        scene.add(neptune);
        
        // Add to clickable objects
        addClickableObject(neptune);
        
        // Create label
        createLabel(NEPTUNE_CONFIG.name, neptune.position, NEPTUNE_CONFIG.labelColor);
        
        resolve(neptune);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Neptune texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: NEPTUNE_CONFIG.color
        });
        
        const neptune = new THREE.Mesh(geometry, material);
        neptune.position.set(
          NEPTUNE_CONFIG.position[0],
          NEPTUNE_CONFIG.position[1],
          NEPTUNE_CONFIG.position[2]
        );
        neptune.userData = { 
          name: NEPTUNE_CONFIG.name,
          rotationSpeed: NEPTUNE_CONFIG.rotationSpeed
        };
        
        scene.add(neptune);
        
        // Add to clickable objects
        addClickableObject(neptune);
        
        // Create label
        createLabel(NEPTUNE_CONFIG.name, neptune.position, NEPTUNE_CONFIG.labelColor);
        
        resolve(neptune);
      }
    );
  });
}

/**
 * Animate Neptune rotation
 * @param {THREE.Mesh} neptuneMesh - The Neptune mesh object
 */
export function animateNeptune(neptuneMesh) {
  if (neptuneMesh && neptuneMesh.userData && neptuneMesh.userData.rotationSpeed) {
    neptuneMesh.rotation.y += neptuneMesh.userData.rotationSpeed;
  }
}
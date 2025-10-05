import * as THREE from 'three';

/**
 * Jupiter Planet Configuration and Creation
 */
export const JUPITER_CONFIG = {
  name: 'Jupiter',
  radius: 8,
  position: [-70, 20, -70],
  texture: '/assets/imgs/jupiter.jpg',
  color: 0xD8CA9D,
  labelColor: '#D8CA9D',
  rotationSpeed: 0.008,
  info: {
    emoji: '🪐',
    description: 'Largest planet • Gas giant • Great Red Spot storm • 79 known moons'
  }
};

/**
 * Create Jupiter mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Jupiter to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Jupiter mesh
 */
export function createJupiter(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(JUPITER_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load texture
    textureLoader.load(
      JUPITER_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const jupiter = new THREE.Mesh(geometry, material);
        jupiter.position.set(
          JUPITER_CONFIG.position[0],
          JUPITER_CONFIG.position[1],
          JUPITER_CONFIG.position[2]
        );
        jupiter.userData = { 
          name: JUPITER_CONFIG.name,
          rotationSpeed: JUPITER_CONFIG.rotationSpeed
        };
        
        scene.add(jupiter);
        
        // Add to clickable objects
        addClickableObject(jupiter);
        
        // Create label
        createLabel(JUPITER_CONFIG.name, jupiter.position, JUPITER_CONFIG.labelColor);
        
        resolve(jupiter);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Jupiter texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: JUPITER_CONFIG.color
        });
        
        const jupiter = new THREE.Mesh(geometry, material);
        jupiter.position.set(
          JUPITER_CONFIG.position[0],
          JUPITER_CONFIG.position[1],
          JUPITER_CONFIG.position[2]
        );
        jupiter.userData = { 
          name: JUPITER_CONFIG.name,
          rotationSpeed: JUPITER_CONFIG.rotationSpeed
        };
        
        scene.add(jupiter);
        
        // Add to clickable objects
        addClickableObject(jupiter);
        
        // Create label
        createLabel(JUPITER_CONFIG.name, jupiter.position, JUPITER_CONFIG.labelColor);
        
        resolve(jupiter);
      }
    );
  });
}

/**
 * Animate Jupiter rotation
 * @param {THREE.Mesh} jupiterMesh - The Jupiter mesh object
 */
export function animateJupiter(jupiterMesh) {
  if (jupiterMesh && jupiterMesh.userData && jupiterMesh.userData.rotationSpeed) {
    jupiterMesh.rotation.y += jupiterMesh.userData.rotationSpeed;
  }
}
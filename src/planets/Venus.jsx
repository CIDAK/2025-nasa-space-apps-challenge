import * as THREE from 'three';

/**
 * Venus Planet Configuration and Creation
 */
export const VENUS_CONFIG = {
  name: 'Venus',
  radius: 2.3,
  position: [-45, 10, 15],
  texture: '/assets/imgs/venus.jpg',
  color: 0xFFC649,
  labelColor: '#FFC649',
  rotationSpeed: 0.003,
  info: {
    emoji: '♀️',
    description: 'Hottest planet • Thick atmosphere • Retrograde rotation • Similar size to Earth'
  }
};

/**
 * Create Venus mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Venus to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Venus mesh
 */
export function createVenus(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(VENUS_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load texture
    textureLoader.load(
      VENUS_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const venus = new THREE.Mesh(geometry, material);
        venus.position.set(
          VENUS_CONFIG.position[0],
          VENUS_CONFIG.position[1],
          VENUS_CONFIG.position[2]
        );
        venus.userData = { 
          name: VENUS_CONFIG.name,
          rotationSpeed: VENUS_CONFIG.rotationSpeed
        };
        
        scene.add(venus);
        
        // Add to clickable objects
        addClickableObject(venus);
        
        // Create label
        createLabel(VENUS_CONFIG.name, venus.position, VENUS_CONFIG.labelColor);
        
        resolve(venus);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Venus texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: VENUS_CONFIG.color
        });
        
        const venus = new THREE.Mesh(geometry, material);
        venus.position.set(
          VENUS_CONFIG.position[0],
          VENUS_CONFIG.position[1],
          VENUS_CONFIG.position[2]
        );
        venus.userData = { 
          name: VENUS_CONFIG.name,
          rotationSpeed: VENUS_CONFIG.rotationSpeed
        };
        
        scene.add(venus);
        
        // Add to clickable objects
        addClickableObject(venus);
        
        // Create label
        createLabel(VENUS_CONFIG.name, venus.position, VENUS_CONFIG.labelColor);
        
        resolve(venus);
      }
    );
  });
}

/**
 * Animate Venus rotation (retrograde - opposite direction)
 * @param {THREE.Mesh} venusMesh - The Venus mesh object
 */
export function animateVenus(venusMesh) {
  if (venusMesh && venusMesh.userData && venusMesh.userData.rotationSpeed) {
    // Venus rotates retrograde (opposite direction), so we subtract
    venusMesh.rotation.y -= venusMesh.userData.rotationSpeed;
  }
}
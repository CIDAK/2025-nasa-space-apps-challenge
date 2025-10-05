import * as THREE from 'three';

/**
 * Uranus Planet Configuration and Creation
 */
export const URANUS_CONFIG = {
  name: 'Uranus',
  radius: 4,
  position: [-120, 25, 100],
  texture: '/assets/imgs/uranus.jpg',
  color: 0x4FD0E7,
  labelColor: '#4FD0E7',
  rotationSpeed: 0.006,
  tilt: Math.PI / 2, // Uranus is tilted on its side (97.77 degrees)
  info: {
    emoji: '🔵',
    description: 'Ice giant • Tilted on its side • Coldest atmosphere • 27 known moons'
  }
};

/**
 * Create Uranus mesh with texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Uranus to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Uranus mesh
 */
export function createUranus(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(URANUS_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load texture
    textureLoader.load(
      URANUS_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const uranus = new THREE.Mesh(geometry, material);
        uranus.position.set(
          URANUS_CONFIG.position[0],
          URANUS_CONFIG.position[1],
          URANUS_CONFIG.position[2]
        );
        
        // Tilt Uranus on its side (unique characteristic)
        uranus.rotation.z = URANUS_CONFIG.tilt;
        
        uranus.userData = { 
          name: URANUS_CONFIG.name,
          rotationSpeed: URANUS_CONFIG.rotationSpeed,
          isTilted: true
        };
        
        scene.add(uranus);
        
        // Add to clickable objects
        addClickableObject(uranus);
        
        // Create label
        createLabel(URANUS_CONFIG.name, uranus.position, URANUS_CONFIG.labelColor);
        
        resolve(uranus);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Uranus texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: URANUS_CONFIG.color
        });
        
        const uranus = new THREE.Mesh(geometry, material);
        uranus.position.set(
          URANUS_CONFIG.position[0],
          URANUS_CONFIG.position[1],
          URANUS_CONFIG.position[2]
        );
        
        // Tilt Uranus on its side
        uranus.rotation.z = URANUS_CONFIG.tilt;
        
        uranus.userData = { 
          name: URANUS_CONFIG.name,
          rotationSpeed: URANUS_CONFIG.rotationSpeed,
          isTilted: true
        };
        
        scene.add(uranus);
        
        // Add to clickable objects
        addClickableObject(uranus);
        
        // Create label
        createLabel(URANUS_CONFIG.name, uranus.position, URANUS_CONFIG.labelColor);
        
        resolve(uranus);
      }
    );
  });
}

/**
 * Animate Uranus rotation (tilted on its side)
 * @param {THREE.Mesh} uranusMesh - The Uranus mesh object
 */
export function animateUranus(uranusMesh) {
  if (uranusMesh && uranusMesh.userData && uranusMesh.userData.rotationSpeed) {
    // Rotate around Y axis, but since it's tilted, it appears to roll
    uranusMesh.rotation.y += uranusMesh.userData.rotationSpeed;
  }
}
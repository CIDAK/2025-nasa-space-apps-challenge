import * as THREE from 'three';

/**
 * Saturn Planet Configuration and Creation
 */
export const SATURN_CONFIG = {
  name: 'Saturn',
  radius: 7,
  position: [100, -10, 90],
  texture: '/assets/imgs/saturn.jpg',
  ringsTexture: '/assets/imgs/saturn_rings.png',
  color: 0xFAD5A5,
  labelColor: '#FAD5A5',
  rotationSpeed: 0.009,
  hasRings: true,
  ringsInnerRadius: 8,
  ringsOuterRadius: 10,
  info: {
    emoji: '🪐',
    description: 'Gas giant • Famous rings • 83 known moons • Second largest planet'
  }
};

/**
 * Create Saturn mesh with texture and rings
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 * @param {THREE.Scene} scene - Three.js scene to add Saturn to
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create planet label
 * @returns {Promise<THREE.Mesh>} - The created Saturn mesh
 */
export function createSaturn(textureLoader, scene, addClickableObject, createLabel) {
  const geometry = new THREE.SphereGeometry(SATURN_CONFIG.radius, 32, 32);
  
  return new Promise((resolve) => {
    // Try to load Saturn texture
    textureLoader.load(
      SATURN_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const saturn = new THREE.Mesh(geometry, material);
        saturn.position.set(
          SATURN_CONFIG.position[0],
          SATURN_CONFIG.position[1],
          SATURN_CONFIG.position[2]
        );
        saturn.userData = { 
          name: SATURN_CONFIG.name,
          rotationSpeed: SATURN_CONFIG.rotationSpeed
        };
        
        scene.add(saturn);
        
        // Add to clickable objects
        addClickableObject(saturn);
        
        // Create label
        createLabel(SATURN_CONFIG.name, saturn.position, SATURN_CONFIG.labelColor);
        
        // Add rings to Saturn
        addRingsToSaturn(saturn, textureLoader);
        
        resolve(saturn);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Saturn texture, using fallback:', error);
        
        // Fallback to colored material
        const material = new THREE.MeshLambertMaterial({ 
          color: SATURN_CONFIG.color
        });
        
        const saturn = new THREE.Mesh(geometry, material);
        saturn.position.set(
          SATURN_CONFIG.position[0],
          SATURN_CONFIG.position[1],
          SATURN_CONFIG.position[2]
        );
        saturn.userData = { 
          name: SATURN_CONFIG.name,
          rotationSpeed: SATURN_CONFIG.rotationSpeed
        };
        
        scene.add(saturn);
        
        // Add to clickable objects
        addClickableObject(saturn);
        
        // Create label
        createLabel(SATURN_CONFIG.name, saturn.position, SATURN_CONFIG.labelColor);
        
        // Add fallback rings
        addRingsToSaturn(saturn, textureLoader);
        
        resolve(saturn);
      }
    );
  });
}

/**
 * Add rings to Saturn
 * @param {THREE.Mesh} saturnMesh - The Saturn mesh object
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 */
function addRingsToSaturn(saturnMesh, textureLoader) {
  // Try to load rings texture
  textureLoader.load(
    SATURN_CONFIG.ringsTexture,
    (ringTexture) => {
      const ringGeometry = new THREE.RingGeometry(
        SATURN_CONFIG.ringsInnerRadius,
        SATURN_CONFIG.ringsOuterRadius,
        64
      );
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const rings = new THREE.Mesh(ringGeometry, ringMaterial);
      rings.rotation.x = Math.PI / 2; // Rotate rings to be horizontal
      saturnMesh.add(rings);
      
      console.log('Saturn rings with texture added');
    },
    undefined,
    (error) => {
      console.warn('Failed to load Saturn rings texture, using fallback:', error);
      
      // Fallback rings without texture
      const ringGeometry = new THREE.RingGeometry(
        SATURN_CONFIG.ringsInnerRadius,
        SATURN_CONFIG.ringsOuterRadius,
        64
      );
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xC4A484, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const rings = new THREE.Mesh(ringGeometry, ringMaterial);
      rings.rotation.x = Math.PI / 2;
      saturnMesh.add(rings);
      
      console.log('Saturn rings with fallback color added');
    }
  );
}

/**
 * Animate Saturn rotation (including rings)
 * @param {THREE.Mesh} saturnMesh - The Saturn mesh object
 */
export function animateSaturn(saturnMesh) {
  if (saturnMesh && saturnMesh.userData && saturnMesh.userData.rotationSpeed) {
    saturnMesh.rotation.y += saturnMesh.userData.rotationSpeed;
  }
}
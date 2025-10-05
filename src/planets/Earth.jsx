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
  }
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
  const geometry = new THREE.SphereGeometry(EARTH_CONFIG.radius, 32, 32);
  
  return new Promise((resolve, reject) => {
    // Try to load texture
    textureLoader.load(
      EARTH_CONFIG.texture,
      (texture) => {
        const material = new THREE.MeshLambertMaterial({ 
          map: texture
        });
        
        const earth = new THREE.Mesh(geometry, material);
        earth.position.set(
          EARTH_CONFIG.position[0],
          EARTH_CONFIG.position[1],
          EARTH_CONFIG.position[2]
        );
        earth.userData = { 
          name: EARTH_CONFIG.name,
          rotationSpeed: EARTH_CONFIG.rotationSpeed
        };
        
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
        const material = new THREE.MeshLambertMaterial({ 
          color: EARTH_CONFIG.color
        });
        
        const earth = new THREE.Mesh(geometry, material);
        earth.position.set(
          EARTH_CONFIG.position[0],
          EARTH_CONFIG.position[1],
          EARTH_CONFIG.position[2]
        );
        earth.userData = { 
          name: EARTH_CONFIG.name,
          rotationSpeed: EARTH_CONFIG.rotationSpeed
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
 * Change Earth's texture (e.g., for ocean temperature visualization)
 * @param {THREE.Mesh} earthMesh - The Earth mesh object
 * @param {string} newTexturePath - Path to the new texture
 * @param {THREE.TextureLoader} textureLoader - Three.js texture loader
 */
export function changeEarthTexture(earthMesh, newTexturePath, textureLoader) {
  if (!earthMesh) {
    console.warn('Earth mesh not found');
    return;
  }
  
  textureLoader.load(
    newTexturePath,
    (newTexture) => {
      // Successfully loaded new texture
      const newMaterial = new THREE.MeshLambertMaterial({ 
        map: newTexture
      });
      
      // Store original material if not already stored
      if (!earthMesh.userData.originalMaterial) {
        earthMesh.userData.originalMaterial = earthMesh.material.clone();
      }
      
      // Apply new material
      earthMesh.material = newMaterial;
      earthMesh.material.needsUpdate = true;
      
      console.log('Earth texture changed to:', newTexturePath);
    },
    undefined,
    (error) => {
      console.error('Failed to load new Earth texture:', error);
      
      // Fallback to a colored material representing ocean temperature
      const fallbackMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4169E1, // Royal blue for ocean
        emissive: 0x001122,
        emissiveIntensity: 0.3
      });
      
      if (!earthMesh.userData.originalMaterial) {
        earthMesh.userData.originalMaterial = earthMesh.material.clone();
      }
      
      earthMesh.material = fallbackMaterial;
      earthMesh.material.needsUpdate = true;
      
      console.log('Applied fallback ocean temperature visualization');
    }
  );
}

/**
 * Restore Earth's original texture
 * @param {THREE.Mesh} earthMesh - The Earth mesh object
 */
export function restoreEarthTexture(earthMesh) {
  if (earthMesh && earthMesh.userData.originalMaterial) {
    earthMesh.material = earthMesh.userData.originalMaterial;
    earthMesh.material.needsUpdate = true;
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
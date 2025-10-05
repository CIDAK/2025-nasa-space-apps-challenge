import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Aqua Satellite Configuration
 */
export const AQUA_SAT_CONFIG = {
  name: 'AquaSat',
  modelPath: '/assets/3Dmodels/nasa_aqua_eos_pm-1_satellite.glb',
  scale: 2,
  labelColor: '#00aaff',
  rotationSpeed: 0.002,
  offsetFromEarth: {
    x: 8,
    y: 3,
    z: 5
  },
  fallbackPosition: {
    x: 8,
    y: 3,
    z: 60
  },
  info: {
    emoji: '🛰️',
    description: 'Monitors Earth\'s water cycle • Launched 2002 • Studies ocean temperature'
  }
};

/**
 * Load and create Aqua Satellite near Earth
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Mesh} earthMesh - Earth mesh to position satellite near
 * @param {Function} addClickableObject - Function to register clickable objects
 * @param {Function} createLabel - Function to create label
 * @param {Function} setLoading - React setState function to update loading state
 * @returns {Promise<THREE.Group>} - The created satellite group
 */
export function loadAquaSatellite(scene, earthMesh, addClickableObject, createLabel, setLoading) {
  return new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    
    gltfLoader.load(
      AQUA_SAT_CONFIG.modelPath,
      (gltf) => {
        const aquaSat = gltf.scene;
        
        // Enhanced satellite material for better visibility
        aquaSat.traverse((child) => {
          if (child.isMesh) {
            if (child.material) {
              // Brighter enhancement for satellite
              child.material.emissive = new THREE.Color(0x333333);
              child.material.emissiveIntensity = 0.6;
              child.material.needsUpdate = true;
              
              // Higher brightness enhancement
              if (child.material.color) {
                child.material.color.multiplyScalar(2.0);
              }
            }
          }
        });
        
        // Center the model
        const box = new THREE.Box3().setFromObject(aquaSat);
        const center = box.getCenter(new THREE.Vector3());
        aquaSat.position.sub(center);
        
        // Position near Earth
        if (earthMesh) {
          const earthPos = earthMesh.position.clone();
          aquaSat.position.set(
            earthPos.x + AQUA_SAT_CONFIG.offsetFromEarth.x,
            earthPos.y + AQUA_SAT_CONFIG.offsetFromEarth.y,
            earthPos.z + AQUA_SAT_CONFIG.offsetFromEarth.z
          );
        } else {
          aquaSat.position.set(
            AQUA_SAT_CONFIG.fallbackPosition.x,
            AQUA_SAT_CONFIG.fallbackPosition.y,
            AQUA_SAT_CONFIG.fallbackPosition.z
          );
        }
        
        // Scale the model
        aquaSat.scale.set(
          AQUA_SAT_CONFIG.scale,
          AQUA_SAT_CONFIG.scale,
          AQUA_SAT_CONFIG.scale
        );
        
        aquaSat.userData = { 
          name: AQUA_SAT_CONFIG.name,
          rotationSpeed: AQUA_SAT_CONFIG.rotationSpeed,
          isSatellite: true
        };
        
        scene.add(aquaSat);
        
        // Add to clickable objects
        addClickableObject(aquaSat);
        
        // Create label for satellite
        createLabel('Aqua Satellite', aquaSat.position, AQUA_SAT_CONFIG.labelColor);
        
        if (setLoading) {
          setLoading(false);
        }
        
        resolve(aquaSat);
      },
      undefined,
      (error) => {
        console.error('Failed to load Aqua satellite model:', error);
        
        // Create brighter fallback satellite
        const fallbackGeometry = new THREE.SphereGeometry(1, 16, 16);
        const fallbackMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00aaff,
          emissive: 0x0066aa,
          emissiveIntensity: 0.8
        });
        const aquaSat = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        
        if (earthMesh) {
          const earthPos = earthMesh.position.clone();
          aquaSat.position.set(
            earthPos.x + AQUA_SAT_CONFIG.offsetFromEarth.x,
            earthPos.y + AQUA_SAT_CONFIG.offsetFromEarth.y,
            earthPos.z + AQUA_SAT_CONFIG.offsetFromEarth.z
          );
        } else {
          aquaSat.position.set(
            AQUA_SAT_CONFIG.fallbackPosition.x,
            AQUA_SAT_CONFIG.fallbackPosition.y,
            AQUA_SAT_CONFIG.fallbackPosition.z
          );
        }
        
        aquaSat.userData = { 
          name: AQUA_SAT_CONFIG.name,
          rotationSpeed: AQUA_SAT_CONFIG.rotationSpeed,
          isSatellite: true
        };
        
        scene.add(aquaSat);
        
        // Add to clickable objects
        addClickableObject(aquaSat);
        
        // Create label for fallback satellite
        createLabel('Aqua-MODIS', aquaSat.position, AQUA_SAT_CONFIG.labelColor);
        
        if (setLoading) {
          setLoading(false);
        }
        
        resolve(aquaSat);
      }
    );
  });
}

/**
 * Animate Aqua Satellite rotation
 * @param {THREE.Group|THREE.Mesh} satelliteMesh - The satellite object
 */
export function animateAquaSatellite(satelliteMesh) {
  if (satelliteMesh && satelliteMesh.userData && satelliteMesh.userData.rotationSpeed) {
    satelliteMesh.rotation.y += satelliteMesh.userData.rotationSpeed;
  }
}
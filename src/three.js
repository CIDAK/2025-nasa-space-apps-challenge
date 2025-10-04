// import * as THREE from 'three';
// import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// // Scene setup
// const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000033); // Deep ocean blue

// // Camera
// const camera = new THREE.PerspectiveCamera(
//   75,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   1000
// );
// camera.position.set(0, 1.6, 3); // VR eye level

// // Renderer with WebXR
// const renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.xr.enabled = true;
// document.body.appendChild(renderer.domElement);

// // Add VR button
// document.body.appendChild(VRButton.createButton(renderer));

// // Lighting
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
// scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// directionalLight.position.set(5, 10, 5);
// scene.add(directionalLight);

// // Load NASA ocean data metadata
// let oceanDataFrames = [];
// let currentFrameIndex = 0;

// async function loadOceanData() {
//   try {
//     const response = await fetch('/data/MODIS_A-JPL-L2P-v2019.0_metadata.json');
//     const metadata = await response.json();
    
//     // Extract browse image URLs
//     oceanDataFrames = metadata
//       .filter(entry => entry.links)
//       .flatMap(entry => 
//         entry.links
//           .filter(link => link.href && link.href.includes('.sea_surface_temperature.png'))
//           .map(link => ({
//             url: link.href,
//             time: entry.time_start,
//             title: entry.title,
//           }))
//       );
    
//     console.log(`Loaded ${oceanDataFrames.length} ocean temperature frames`);
    
//     if (oceanDataFrames.length > 0) {
//       createOceanVisualization();
//     }
//   } catch (error) {
//     console.error('Error loading ocean data:', error);
//   }
// }

// // Ocean visualization mesh
// let oceanMesh;
// const textureLoader = new THREE.TextureLoader();

// function createOceanVisualization() {
//   // Create a large plane for the ocean surface
//   const geometry = new THREE.PlaneGeometry(10, 6, 32, 32);
  
//   // Load first frame as texture
//   const texture = textureLoader.load(
//     oceanDataFrames[0].url,
//     () => {
//       console.log('First ocean frame loaded:', oceanDataFrames[0].title);
//     },
//     undefined,
//     (error) => {
//       console.error('Error loading texture:', error);
//     }
//   );
  
//   const material = new THREE.MeshStandardMaterial({
//     map: texture,
//     side: THREE.DoubleSide,
//     metalness: 0.3,
//     roughness: 0.7,
//   });
  
//   oceanMesh = new THREE.Mesh(geometry, material);
//   oceanMesh.position.set(0, 1, -5);
//   scene.add(oceanMesh);
  
//   // Add frame info text
//   createInfoPanel();
// }

// // Info panel to display current frame info
// let infoPanel;

// function createInfoPanel() {
//   const canvas = document.createElement('canvas');
//   canvas.width = 512;
//   canvas.height = 128;
//   const ctx = canvas.getContext('2d');
  
//   ctx.fillStyle = '#000000';
//   ctx.fillRect(0, 0, canvas.width, canvas.height);
  
//   ctx.fillStyle = '#00ff00';
//   ctx.font = '20px monospace';
//   ctx.fillText('NASA MODIS Ocean Temperature', 10, 30);
//   ctx.fillText(oceanDataFrames[0].title, 10, 60);
//   ctx.fillText(`Frame 1/${oceanDataFrames.length}`, 10, 90);
  
//   const texture = new THREE.CanvasTexture(canvas);
//   const material = new THREE.MeshBasicMaterial({ map: texture });
//   const geometry = new THREE.PlaneGeometry(2, 0.5);
  
//   infoPanel = new THREE.Mesh(geometry, material);
//   infoPanel.position.set(0, 2.5, -4);
//   scene.add(infoPanel);
// }

// function updateInfoPanel() {
//   if (!infoPanel) return;
  
//   const canvas = infoPanel.material.map.image;
//   const ctx = canvas.getContext('2d');
  
//   ctx.fillStyle = '#000000';
//   ctx.fillRect(0, 0, canvas.width, canvas.height);
  
//   ctx.fillStyle = '#00ff00';
//   ctx.font = '20px monospace';
//   ctx.fillText('NASA MODIS Ocean Temperature', 10, 30);
//   ctx.fillText(oceanDataFrames[currentFrameIndex].title.substring(0, 50), 10, 60);
//   ctx.fillText(`Frame ${currentFrameIndex + 1}/${oceanDataFrames.length}`, 10, 90);
//   ctx.fillText(new Date(oceanDataFrames[currentFrameIndex].time).toLocaleString(), 10, 120);
  
//   infoPanel.material.map.needsUpdate = true;
// }

// // Frame navigation
// function nextFrame() {
//   if (oceanDataFrames.length === 0) return;
  
//   currentFrameIndex = (currentFrameIndex + 1) % oceanDataFrames.length;
//   loadFrame(currentFrameIndex);
// }

// function previousFrame() {
//   if (oceanDataFrames.length === 0) return;
  
//   currentFrameIndex = (currentFrameIndex - 1 + oceanDataFrames.length) % oceanDataFrames.length;
//   loadFrame(currentFrameIndex);
// }

// function loadFrame(index) {
//   if (!oceanMesh || !oceanDataFrames[index]) return;
  
//   const texture = textureLoader.load(
//     oceanDataFrames[index].url,
//     () => {
//       console.log('Loaded frame:', oceanDataFrames[index].title);
//       updateInfoPanel();
//     }
//   );
  
//   oceanMesh.material.map = texture;
//   oceanMesh.material.needsUpdate = true;
// }

// // Keyboard controls for desktop testing
// window.addEventListener('keydown', (event) => {
//   switch(event.key) {
//     case 'ArrowRight':
//       nextFrame();
//       break;
//     case 'ArrowLeft':
//       previousFrame();
//       break;
//     case ' ':
//       // Toggle auto-play
//       autoPlay = !autoPlay;
//       console.log('Auto-play:', autoPlay);
//       break;
//   }
// });

// // Auto-play animation
// let autoPlay = false;
// let lastFrameChange = 0;
// const frameDelay = 2000; // 2 seconds per frame

// // VR controllers
// const controllers = [];

// function setupVRControllers() {
//   for (let i = 0; i < 2; i++) {
//     const controller = renderer.xr.getController(i);
//     controller.addEventListener('selectstart', () => {
//       if (i === 0) {
//         previousFrame();
//       } else {
//         nextFrame();
//       }
//     });
//     scene.add(controller);
//     controllers.push(controller);
    
//     // Add controller visual
//     const geometry = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(0, 0, 0),
//       new THREE.Vector3(0, 0, -1),
//     ]);
//     const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
//     const line = new THREE.Line(geometry, material);
//     controller.add(line);
//   }
// }

// setupVRControllers();

// // Animation loop
// function animate() {
//   renderer.setAnimationLoop(() => {
//     const currentTime = Date.now();
    
//     // Auto-play frames
//     if (autoPlay && currentTime - lastFrameChange > frameDelay) {
//       nextFrame();
//       lastFrameChange = currentTime;
//     }
    
//     // Gentle ocean mesh animation
//     if (oceanMesh) {
//       oceanMesh.rotation.x = Math.sin(currentTime * 0.0001) * 0.05;
//     }
    
//     renderer.render(scene, camera);
//   });
// }

// // Handle window resize
// window.addEventListener('resize', () => {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });

// // Initialize
// loadOceanData();
// animate();

// console.log('NASA Ocean VR Experience initialized');
// console.log('Controls: Arrow Left/Right = Navigate frames, Space = Toggle auto-play');
// console.log('VR: Left controller = Previous, Right controller = Next');
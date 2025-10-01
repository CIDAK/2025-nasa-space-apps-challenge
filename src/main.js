import 'webxr-polyfill'; // optional polyfill if needed
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b263b);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// VR button
document.body.appendChild(VRButton.createButton(renderer));

// desktop controls fallback
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.update();

// lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemi.position.set(0, 20, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-3, 10, -10);
scene.add(dir);

// simple "platform" under the user
const platformGeo = new THREE.CircleGeometry(2.5, 32);
const platformMat = new THREE.MeshStandardMaterial({ color: 0x0a4b7c, roughness: 0.8 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.rotation.x = -Math.PI / 2;
platform.position.y = 0;
scene.add(platform);

// sample RADARSAT panel (load your preprocessed PNG/JPG from assets)
const loader = new THREE.TextureLoader();
const samplePath = '/assets/data_processed/frames/video_frame_00000.png'; // adjust path/filename
loader.load(samplePath,
  (tex) => {
    tex.encoding = THREE.sRGBEncoding;
    const panelGeo = new THREE.PlaneGeometry(2.4, 1.35);
    const panelMat = new THREE.MeshBasicMaterial({ map: tex });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.6, -2.2);
    scene.add(panel);
  },
  undefined,
  (err) => {
    console.warn('Texture load failed:', err);
  }
);

// simple animation loop
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

renderer.setAnimationLoop(() => {
  // any VR or desktop updates here
  renderer.render(scene, camera);
});
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { XRDevice, metaQuest3 } from 'iwer';


export default function NASAOceanVR() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [frameCount, setFrameCount] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Emulate Meta Quest 3 device
    const xrDevice = new XRDevice(metaQuest3);
    xrDevice.installRuntime();

    // Set the xrDevice's position
    xrDevice.position.set(0, 1.8, 0);
    
    let scene, camera, renderer, oceanMesh, infoPanel;
    let oceanFrames = [];
    let animationId;
    let lastFrameChange = 0;
    const frameDelay = 2000;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000033);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 3);
    
    // Renderer with WebXR
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // Load ocean data
    const metadata = [
      {
        "time_start": "2020-06-10T11:50:01.000Z",
        "title": "20200610115001-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610115001-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T11:55:01.000Z",
        "title": "20200610115501-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610115501-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T12:00:01.000Z",
        "title": "20200610120001-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610120001-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T12:05:01.000Z",
        "title": "20200610120501-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610120501-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T12:10:01.000Z",
        "title": "20200610121001-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610121001-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T12:15:01.000Z",
        "title": "20200610121501-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610121501-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T12:20:00.000Z",
        "title": "20200610122000-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610122000-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      },
      {
        "time_start": "2020-06-10T12:25:00.000Z",
        "title": "20200610122500-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0",
        "links": [
          {
            "rel": "http://esipfed.org/ns/fedsearch/1.1/browse#",
            "type": "image/png",
            "href": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-public/MODIS_A-JPL-L2P-v2019.0/20200610122500-JPL-L2P_GHRSST-SSTskin-MODIS_A-N-v02.0-fv01.0.sea_surface_temperature.png"
          }
        ]
      }
    ];
    
    // Extract temperature image URLs
    oceanFrames = metadata
      .filter(entry => entry.links)
      .flatMap(entry => 
        entry.links
          .filter(link => link.href && link.href.includes('.sea_surface_temperature.png'))
          .map(link => ({
            url: link.href,
            time: entry.time_start,
            title: entry.title,
          }))
      );
    
    setFrameCount(oceanFrames.length);
    setLoading(false);
    
    if (oceanFrames.length === 0) {
      setError('No ocean temperature frames found');
      return;
    }
    
    // Create ocean visualization
    const geometry = new THREE.PlaneGeometry(10, 6, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      oceanFrames[0].url,
      (texture) => {
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          metalness: 0.3,
          roughness: 0.7,
        });
        
        oceanMesh = new THREE.Mesh(geometry, material);
        oceanMesh.position.set(0, 1, -5);
        scene.add(oceanMesh);
        
        createInfoPanel();
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
        setError('Failed to load ocean data texture');
      }
    );
    
    // Info panel
    function createInfoPanel() {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('NASA MODIS Ocean Temperature', 20, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(oceanFrames[0].title.substring(0, 60), 20, 100);
      ctx.fillText(`Frame 1/${oceanFrames.length}`, 20, 140);
      ctx.fillText(new Date(oceanFrames[0].time).toUTCString(), 20, 180);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = '20px monospace';
      ctx.fillText('Controls: ← → arrows or VR controllers to navigate', 20, 220);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const panelGeometry = new THREE.PlaneGeometry(4, 1);
      
      infoPanel = new THREE.Mesh(panelGeometry, material);
      infoPanel.position.set(0, 2.8, -4);
      scene.add(infoPanel);
    }
    
    function updateInfoPanel(index) {
      if (!infoPanel) return;
      
      const canvas = infoPanel.material.map.image;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('NASA MODIS Ocean Temperature', 20, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText(oceanFrames[index].title.substring(0, 60), 20, 100);
      ctx.fillText(`Frame ${index + 1}/${oceanFrames.length}`, 20, 140);
      ctx.fillText(new Date(oceanFrames[index].time).toUTCString(), 20, 180);
      
      ctx.fillStyle = autoPlay ? '#ffff00' : '#00ff00';
      ctx.font = '20px monospace';
      ctx.fillText(autoPlay ? '▶ AUTO-PLAY (Space to pause)' : 'Controls: ← → arrows | Space for auto-play', 20, 220);
      
      infoPanel.material.map.needsUpdate = true;
    }
    
    // Frame navigation
    function loadFrame(index) {
      if (!oceanMesh || !oceanFrames[index]) return;
      
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(oceanFrames[index].url, (texture) => {
        oceanMesh.material.map = texture;
        oceanMesh.material.needsUpdate = true;
        updateInfoPanel(index);
        setCurrentFrame(index);
      });
    }
    
    function nextFrame() {
      const newIndex = (currentFrame + 1) % oceanFrames.length;
      loadFrame(newIndex);
    }
    
    function previousFrame() {
      const newIndex = (currentFrame - 1 + oceanFrames.length) % oceanFrames.length;
      loadFrame(newIndex);
    }
    
    // Keyboard controls
    const handleKeyDown = (event) => {
      switch(event.key) {
        case 'ArrowRight':
          nextFrame();
          break;
        case 'ArrowLeft':
          previousFrame();
          break;
        case ' ':
          setAutoPlay(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // VR controllers
    const controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', previousFrame);
    scene.add(controller1);
    
    const controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', nextFrame);
    scene.add(controller2);
    
    // Controller visuals
    [controller1, controller2].forEach(controller => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
      ]);
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const line = new THREE.Line(geometry, material);
      controller.add(line);
    });
    
    // Add VR button
    const vrButton = document.createElement('button');
    vrButton.textContent = 'ENTER VR';
    vrButton.style.position = 'absolute';
    vrButton.style.bottom = '20px';
    vrButton.style.left = '50%';
    vrButton.style.transform = 'translateX(-50%)';
    vrButton.style.padding = '12px 24px';
    vrButton.style.fontSize = '16px';
    vrButton.style.background = '#0066ff';
    vrButton.style.color = 'white';
    vrButton.style.border = 'none';
    vrButton.style.borderRadius = '8px';
    vrButton.style.cursor = 'pointer';
    vrButton.style.zIndex = '1000';
    
    /*vrButton.onclick = async () => {
      if (navigator.xr) {
        const session = await navigator.xr.requestSession('immersive-vr');
        renderer.xr.setSession(session);
      }
    };*/
    
    // Check VR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          containerRef.current.appendChild(vrButton);
        }
      });
    }
    
    // Animation loop
    function animate() {
      const currentTime = Date.now();
      
      if (autoPlay && currentTime - lastFrameChange > frameDelay) {
        nextFrame();
        lastFrameChange = currentTime;
      }
      
      if (oceanMesh) {
        oceanMesh.rotation.x = Math.sin(currentTime * 0.0001) * 0.05;
      }
      
      renderer.render(scene, camera);
    }
    
    renderer.setAnimationLoop(animate);
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (vrButton && vrButton.parentNode) {
        vrButton.parentNode.removeChild(vrButton);
      }
    };
  }, [currentFrame, autoPlay]);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '24px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px 40px',
          borderRadius: '10px'
        }}>
          Loading NASA Ocean Data...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4444',
          fontSize: '20px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.9)',
          padding: '20px 40px',
          borderRadius: '10px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <div><strong>NASA MODIS Ocean Temperature VR</strong></div>
        <div>Frame: {currentFrame + 1} / {frameCount}</div>
        <div>Auto-play: {autoPlay ? 'ON ▶' : 'OFF'}</div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          ← → : Navigate frames<br/>
          Space : Toggle auto-play<br/>
          VR: Left/Right controllers
        </div>
      </div>
    </div>
  );
}
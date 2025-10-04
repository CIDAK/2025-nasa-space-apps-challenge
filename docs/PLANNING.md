## ALEX (@Alexsandra-m-silva)

### Assigned Tasks
- [ ] Desktop fallback controls (OrbitControls) - Phase 2
- [ ] Subtitles/narration playback sync (assets/audio/) - Phase 3
- [ ] Smooth transitions between frames (fade/crossfade) - Phase 4
- [ ] Credits and data attribution (ASC-CSA) - Phase 4
- [ ] Deploy to GitHub Pages (optional) - Phase 5

### Notes
- Focus on UX/UI elements and audio integration
- Ensure smooth desktop experience as fallback
- Handle credits and documentation

---

## DYLAN (@DylanPrinsloo)

### Assigned Tasks
- [x] NASA data fetching and API integration
- [x] Setup documentation
- [ ] Load preprocessed RADARSAT frames from /assets/data_processed/frames/ - Phase 2
- [ ] Simple platform / placeholder ocean (CircleGeometry or Water shader) - Phase 2
- [ ] Gaze/click to open info panels (raycast) - Phase 3
- [ ] Texture size optimization and sRGB encoding - Phase 4
- [ ] Smooth transitions between frames (fade/crossfade) - Phase 4
- [ ] Credits and data attribution (ASC-CSA) - Phase 4
- [ ] Deploy to GitHub Pages (optional) - Phase 5

### Notes
- Lead on data integration and Three.js scene setup
- Handle NASA ocean data visualization
- Performance optimization focus

---

## IAN (@ianthehamster)

### Assigned Tasks
- [ ] Load preprocessed RADARSAT frames from /assets/data_processed/frames/ - Phase 2
- [ ] Display one RADARSAT frame on an in-scene panel - Phase 2
- [ ] Basic movement/teleport (controller + desktop) - Phase 3
- [ ] Smooth transitions between frames (fade/crossfade) - Phase 4
- [ ] Test on Meta Quest browser and desktop Chrome/Edge - Phase 5
- [ ] Deploy to GitHub Pages (optional) - Phase 5

### Notes
- Focus on RADARSAT data integration
- VR interaction and movement mechanics
- Testing lead for VR devices

---

## Development Phases

### <span style="color: blue;">Phase 2: Data + Scene</span>

- [ ] Load preprocessed RADARSAT frames from /assets/data_processed/frames/ → **@ianthehamster, @DylanPrinsloo**
- [ ] Display one RADARSAT frame on an in-scene panel → **@ianthehamster**
- [ ] Desktop fallback controls (OrbitControls) → **@Alexsandra-m-silva**
- [ ] Simple platform / placeholder ocean (CircleGeometry or Water shader) → **@DylanPrinsloo**

### <span style="color: orange;">Phase 3: Interaction & UX</span>

- [ ] Gaze/click to open info panels (raycast) → **@DylanPrinsloo**
- [ ] Basic movement/teleport (controller + desktop) → **@ianthehamster**
- [ ] Subtitles/narration playback sync (assets/audio/) → **@Alexsandra-m-silva**

### <span style="color: lightblue;">Phase 4: Polish & Performance</span>

- [ ] Texture size optimization and sRGB encoding → **@DylanPrinsloo**
- [ ] Smooth transitions between frames (fade/crossfade) → **@ianthehamster, @Alexsandra-m-silva, @DylanPrinsloo**
- [ ] Credits and data attribution (ASC-CSA) → **@Alexsandra-m-silva, @DylanPrinsloo**

### <span style="color: orangered;">Phase 5: Testing & Deploy</span>

- [ ] Test on Meta Quest browser and desktop Chrome/Edge → **@ianthehamster**
- [ ] Ensure headset access: run `npx vite --host` or use ngrok → **All**
- [ ] Deploy to GitHub Pages → **@DylanPrinsloo or @Alexsandra-m-silva or @ianthehamster**

---

## Documentation & Deliverables

- [x] **Setup instructions** (docs/SETUP.md) → **@DylanPrinsloo** ✓
- [ ] Document RADARSAT data sources → **@ianthehamster**
- [ ] Create 1-page project description → **@Alexsandra-m-silva**
- [ ] Take screenshots/screen recording for demo → **All**
- [ ] Prepare 5-minute pitch presentation → **All**
- [ ] QR code for easy access to WebXR experience → **@DylanPrinsloo**

---

## MINIMUM VIABLE PRODUCT (MVP) Checklist

**Must-haves to complete the challenge:**

- [ ] Runs locally
- [ ] On Headset or Web-experience
- [ ] Uses RADARSAT RCM data visualizations
- [ ] 5 minute ocean-related story
- [ ] Basic 3D ocean environment
- [ ] Simple narration or text explanation
- [ ] User can navigate/interact with data
- [ ] Proper data attribution to ASC-CSA (Data attribution present)

---

## Tips from Previous Entries

1. **Use existing ocean assets** - Don't build from scratch
2. **Focus on ONE compelling data story** - Don't try to show everything
3. **Pre-process RADARSAT data** - Have clean images ready to drop in
4. **Record narration early** - Helps structure the experience
5. **Test in VR frequently** - Catch issues early
6. **Keep interactions simple** - Gaze + click is enough
7. **Use template code** - Start from A-Frame or Three.js examples

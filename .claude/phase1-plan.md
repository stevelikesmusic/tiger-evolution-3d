# Phase 1: Core Foundation Implementation Plan

## Overview
Phase 1 focuses on establishing the core Three.js foundation, basic tiger character, simple terrain, and essential systems needed for the game loop.

## Timeline: Weeks 1-4

### Week 1: Project Setup & Core Engine
#### Goals
- Set up development environment
- Create basic Three.js scene
- Implement core game loop
- Set up testing framework

#### Deliverables
- [x] Project structure created
- [ ] Jest testing framework configured
- [ ] Basic HTML structure with canvas
- [ ] Core Engine class with game loop
- [ ] Three.js scene initialization
- [ ] WebGL context setup with fallback

#### Technical Tasks
```javascript
// Core files to create:
- index.html (main game page)
- src/core/Engine.js (main game engine)
- src/core/Scene.js (scene management)
- src/core/Renderer.js (WebGL rendering)
- tests/setup/ (test configuration)
```

### Week 2: Tiger Character & Movement
#### Goals
- Create basic tiger model (simple geometry)
- Implement movement controls
- Add third-person camera
- Basic physics integration

#### Deliverables
- [ ] Tiger entity class with basic 3D model
- [ ] WASD movement controls
- [ ] Third-person camera following
- [ ] Basic collision detection
- [ ] Input system implementation

#### Technical Implementation
```javascript
// Key classes to implement:
- src/entities/Tiger.js
- src/systems/Input.js
- src/systems/Camera.js
- src/systems/Physics.js (basic)
```

### Week 3: Terrain & Environment
#### Goals
- Generate basic terrain using heightmaps
- Add simple texturing
- Implement frustum culling
- Basic environmental objects

#### Deliverables
- [ ] Heightmap-based terrain generation
- [ ] Multi-texture terrain rendering
- [ ] Basic vegetation placement
- [ ] Water bodies (simple planes)
- [ ] Skybox implementation

#### Technical Implementation
```javascript
// Environment system:
- src/entities/Terrain.js
- src/utils/TerrainGenerator.js
- src/utils/TextureManager.js
```

### Week 4: UI & Polish
#### Goals
- Create basic HUD
- Add health/stamina bars
- Implement basic menu system
- Performance optimization

#### Deliverables
- [ ] HUD with health/stamina displays
- [ ] Basic menu system
- [ ] Performance monitoring
- [ ] Mobile touch controls (basic)
- [ ] Cross-browser testing

#### Technical Implementation
```javascript
// UI system:
- src/ui/HUD.js
- src/ui/Menu.js
- src/utils/Performance.js
```

## Detailed Implementation Strategy

### Engine Architecture
```javascript
// Core Engine Structure
class Engine {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.physics = null;
    this.inputSystem = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.deltaTime = 0;
  }
  
  async init() {
    // Initialize Three.js components
    await this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupPhysics();
    this.setupInput();
    this.setupUI();
  }
  
  start() {
    this.isRunning = true;
    this.gameLoop();
  }
  
  gameLoop(currentTime = 0) {
    if (!this.isRunning) return;
    
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(this.deltaTime);
    this.render();
    
    requestAnimationFrame(this.gameLoop.bind(this));
  }
}
```

### Tiger Character Implementation
```javascript
// Basic Tiger Entity
class Tiger {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 12;
    this.health = 100;
    this.stamina = 300;
    
    this.mesh = this.createTigerMesh();
    this.boundingBox = new THREE.Box3();
  }
  
  createTigerMesh() {
    // Simple tiger representation for Phase 1
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xFF6600,
      map: this.loadTigerTexture()
    });
    return new THREE.Mesh(geometry, material);
  }
  
  update(deltaTime, inputState) {
    this.handleMovement(inputState, deltaTime);
    this.updatePhysics(deltaTime);
    this.updateBoundingBox();
  }
}
```

### Terrain Generation
```javascript
// Simple terrain generation
class TerrainGenerator {
  static generateHeightmap(width, height, scale = 1) {
    const data = new Float32Array(width * height);
    
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const x = i / width * scale;
        const y = j / height * scale;
        
        // Simple Perlin noise approximation
        data[i + j * width] = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 10;
      }
    }
    
    return data;
  }
  
  static createTerrain(width, height) {
    const heightmap = this.generateHeightmap(width, height);
    const geometry = new THREE.PlaneGeometry(width, height, width-1, height-1);
    
    // Apply heightmap to vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const index = Math.floor(i / 3);
      vertices[i + 2] = heightmap[index] || 0;
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }
}
```

## Testing Strategy for Phase 1

### Unit Tests Priority
1. **Engine initialization** - Core systems start correctly
2. **Tiger movement** - Input handling and position updates
3. **Camera following** - Smooth tiger tracking
4. **Terrain generation** - Heightmap creation and mesh generation
5. **UI rendering** - HUD elements display correctly

### Integration Tests
1. **Game loop performance** - Maintains target framerate
2. **Input to movement** - Key presses result in tiger movement
3. **Camera collision** - Camera adjusts when blocked by terrain
4. **Rendering pipeline** - All objects render correctly

### Performance Benchmarks
- Target: 60 FPS on desktop (1920x1080)
- Minimum: 30 FPS on mobile devices
- Memory usage: <256MB for core systems
- Load time: <5 seconds for Phase 1 assets

## Asset Requirements

### 3D Models (Simplified for Phase 1)
- Tiger: Simple box geometry with texture
- Terrain: Procedurally generated heightmap
- Vegetation: Basic cylinder/cone shapes
- Water: Simple plane with animated material

### Textures
- Tiger skin pattern (512x512)
- Grass texture (256x256)
- Rock texture (256x256)
- Water normal map (128x128)
- Skybox (cube map, 512x512 per face)

### Audio (Optional for Phase 1)
- Ambient jungle sounds
- Tiger footsteps
- Basic UI sounds

## Dependencies to Add

### Core Dependencies
```json
{
  "dependencies": {
    "three": "^0.155.0",
    "cannon-es": "^0.20.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@testing-library/jest-dom": "^5.16.0"
  }
}
```

## Risk Mitigation

### Technical Risks
1. **WebGL compatibility** - Implement WebGL 1.0 fallback
2. **Performance on mobile** - Early optimization and testing
3. **Asset loading** - Progressive loading with loading screens
4. **Memory management** - Object pooling for frequently created objects

### Timeline Risks
1. **Scope creep** - Stick to simple implementations for Phase 1
2. **Testing overhead** - Parallel development of features and tests
3. **Integration complexity** - Regular integration testing throughout

## Success Criteria

### Technical Milestones
- [ ] Game renders at 60 FPS with basic scene
- [ ] Tiger moves smoothly with WASD controls
- [ ] Camera follows tiger without stuttering
- [ ] Terrain generates and renders correctly
- [ ] HUD displays game information
- [ ] All unit tests pass with >80% coverage

### User Experience Goals
- [ ] Controls feel responsive and intuitive
- [ ] Tiger movement feels natural
- [ ] Camera behavior is comfortable
- [ ] Visual quality meets expectations for Phase 1
- [ ] Game loads quickly (<5 seconds)

### Deliverable Checklist
- [ ] Playable demo with basic tiger movement
- [ ] Simple terrain environment
- [ ] Working HUD system
- [ ] Complete test suite for Phase 1 features
- [ ] Performance benchmarks documented
- [ ] Cross-browser compatibility verified

This Phase 1 plan provides a solid foundation for the Three.js tiger evolution game while maintaining focus on core functionality and testing quality.
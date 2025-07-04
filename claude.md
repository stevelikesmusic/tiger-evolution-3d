# Tiger Evolution 3D

## Current Status (Latest Session)

### ✅ COMPLETED FEATURES

#### 🌿 **Jungle Terrain System** 
- **Procedural Terrain**: 512x512 world units with 128x128 segments using Perlin noise
- **Terrain Renderer**: Full 3D mesh with vertex colors based on height/slope
- **Height-based Texturing**: Automatic grass/dirt/rock/sand distribution
- **Collision System**: Tiger properly walks on terrain surface, no clipping
- **Slope Physics**: Tiger slides down steep slopes (>0.7 steepness)

#### 🌳 **Vegetation System**
- **Procedural Generation**: Trees, bushes, grass patches, and ferns
- **Intelligent Placement**: Respects terrain constraints (height, slope, spacing)
- **Visual Variety**: Multiple tree types with different trunk/leaf combinations
- **Wind Animation**: Grass and foliage sway with wind effects
- **Performance**: LOD groups and caching for optimal rendering

#### 🎮 **Camera & Controls**
- **Mouse Controls**: Pointer lock + mouse movement for camera orbiting
- **Zoom**: Mouse wheel for distance control (5-25 units)
- **Fallback**: Drag mode works without pointer lock
- **Movement**: WASD for tiger movement, Space to jump, Shift to run
- **Physics Integration**: Camera follows tiger smoothly on varied terrain

#### 🐅 **Tiger Movement & Physics**
- **Terrain Following**: Tiger position follows heightmap perfectly
- **Jump Mechanics**: Proper jumping with gravity and landing detection  
- **Realistic Movement**: Speed varies with stamina, running, crouching
- **Slope Handling**: Sliding on steep terrain for realistic physics

### 🎯 **HOW TO USE**
```bash
npm run dev                    # Start development server
# 1. Click canvas to enable mouse controls
# 2. Move mouse to look around tiger
# 3. WASD to move, Space to jump, Shift to run
# 4. Mouse wheel to zoom in/out
```

### 🏗️ **ARCHITECTURE OVERVIEW**

#### Key Systems:
- **`GameController.js`**: Main orchestrator, manages all systems
- **`VegetationSystem.js`**: Procedural jungle vegetation generation
- **`TerrainRenderer.js`**: 3D terrain mesh from heightmap data
- **`MovementSystem.js`**: Tiger physics with terrain collision
- **`CameraSystem.js`**: Third-person camera with mouse controls
- **`Terrain.js`**: Heightmap generation and terrain queries

#### Data Flow:
1. `Terrain` generates heightmap using Perlin noise
2. `TerrainRenderer` creates 3D mesh with vertex colors
3. `VegetationSystem` places flora based on terrain constraints
4. `MovementSystem` queries terrain height for tiger positioning
5. `CameraSystem` follows tiger and responds to mouse input

### 🧪 **TEST COVERAGE**
- ✅ 30/30 VegetationSystem tests pass
- ✅ 13/13 Terrain collision tests pass  
- ✅ 9/9 Camera integration tests pass
- ✅ All core systems fully tested

### 🚀 **NEXT PRIORITIES FOR FUTURE SESSIONS**

#### Immediate Improvements:
1. **Water System**: Rivers, ponds, and water physics
2. **Jungle Animals**: Wild boars, birds, prey animals
3. **Enhanced Lighting**: Filtered sunlight through canopy
4. **Sound System**: Ambient jungle sounds, footsteps, animal calls

#### Advanced Features:
1. **Tiger Evolution**: Growth stages, stat progression
2. **Hunting Mechanics**: Prey tracking, stealth, combat
3. **Survival Elements**: Hunger, thirst, territory management
4. **Weather System**: Rain, fog, day/night cycles

---

## Workflow

Follow this flow when performing your tasks

1. Read the [spec](.claude/spec.md)
2. Read the progress.md and project.md in .claude
3. Use TDD to write tests first based on your goals
4. Update documentation with new context and/or tools you added

## Tools and Scripts

### Development

- **Dev Server**: `npm run dev` - Start Vite development server with HMR
- **Build**: `npm run build` - Build for production
- **Preview**: `npm run preview` - Preview production build locally

#### MCP

- Use playwight MCP to test in the browser. 

### Testing

- **Run Tests**: `npm test` - Run tests with Vitest
- **Watch Tests**: `npm run test:watch` - Run tests in watch mode
- **Coverage**: `npm run test:coverage` - Run tests with coverage report
- **Test UI**: `npm run test:ui` - Open Vitest UI for interactive testing

### Technology Stack

- **Build Tool**: Vite 5.x for fast development and optimized builds
- **Testing**: Vitest with jsdom environment for unit/integration tests
- **3D Engine**: Three.js with native ES module imports
- **Physics**: Cannon-es for realistic physics simulation
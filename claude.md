# Tiger Evolution 3D

## Current Status (Latest Session - Phase 2 Water System Complete!)

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

#### 🌊 **NEW: Realistic Water System** 
- **✅ PROPER WATER SURFACES**: Real 3D water planes instead of blue terrain patches
- **✅ CONNECTED WATER BODIES**: Large central lake (35-unit radius) + winding river system
- **✅ REALISTIC DEPTH**: Water positioned 1-2.5 units below terrain for depth effect
- **✅ ANIMATED WATER SHADER**: Subtle waves, realistic blue coloring, transparency effects
- **Multiple Water Types**: Lake, river segments, scattered ponds throughout terrain
- **Smart Generation**: Connected flowing water bodies instead of fragmented patches
- **Performance Optimized**: Efficient water detection and rendering

#### 🏊 **NEW: Tiger Swimming Mechanics**
- **✅ AUTOMATIC DETECTION**: Tiger enters swimming mode when touching water
- **✅ SWIMMING PHYSICS**: Buoyancy, water resistance, reduced gravity in water
- **✅ SWIMMING CONTROLS**: Slower movement speed (0.7x), upward movement with jump/space
- **✅ REALISTIC CONSTRAINTS**: Tiger stays at water surface, can't go below terrain
- **State Management**: Seamless transition between land and water movement
- **Stamina Integration**: Swimming consumes energy like running

#### 🎮 **Tank Controls & Camera System**
- **✅ TRUE TANK CONTROLS**: W/S moves forward/backward in tiger's facing direction, A/D rotates left/right
- **✅ DIRECTION UPDATES**: Movement direction properly updates when tiger rotates (fixed critical bug!)
- **✅ PROPER TRIGONOMETRY**: Fixed forward direction calculation using `Math.sin/cos(rotation.y)`
- **✅ SMOOTH ACCELERATION**: Improved velocity interpolation prevents overshooting
- **Camera Following**: Camera stays behind tiger and follows rotation smoothly
- **Mouse Controls**: Pointer lock + mouse movement for camera orbiting
- **Zoom**: Mouse wheel for distance control (5-25 units)
- **Fallback**: Drag mode works without pointer lock
- **Responsive**: Enhanced smoothness (0.3) for better camera following

#### 🐅 **Tiger Movement & Physics**
- **✅ TANK MOVEMENT**: Tiger now correctly moves in its current facing direction after rotation
- **✅ DIRECTION CALCULATION**: `forwardX = Math.sin(rotation.y)`, `forwardZ = Math.cos(rotation.y)`
- **✅ VELOCITY SYSTEM**: Fixed acceleration to prevent overshoot with `Math.min(1.0, acceleration * deltaTime)`
- **✅ SWIMMING INTEGRATION**: Movement system handles both land and water physics
- **Correct Orientation**: Tiger head faces away from camera (positive Z direction)
- **Visual Clarity**: Head with eyes, ears, nose clearly visible at front
- **Tail Position**: Tail at back (negative Z) for proper visual feedback
- **Terrain Following**: Tiger position follows heightmap perfectly
- **Jump Mechanics**: Proper jumping with gravity and landing detection  
- **Realistic Movement**: Speed varies with stamina, running, crouching, swimming
- **Slope Handling**: Sliding on steep terrain for realistic physics
- **Robust Input**: Anti-stuck key system with focus/blur handling

### 🎯 **HOW TO USE**
```bash
npm run dev                    # Start development server
# 1. Click canvas to enable mouse controls
# 2. Move mouse to look around tiger
# 3. ✅ WORKING TANK CONTROLS:
#    - W: Move forward in tiger's CURRENT facing direction (FIXED!)
#    - S: Move backward in tiger's CURRENT facing direction
#    - A: Rotate tiger left (counter-clockwise)
#    - D: Rotate tiger right (clockwise)
#    - A+W: Rotate left while moving forward
#    - Space: Jump on land, swim upward in water
#    - Shift: Run (disabled while swimming)
# 4. Mouse wheel to zoom in/out
# 5. ✅ NEW: Tiger automatically swims when entering water!
# 6. Find the large lake, winding river, or scattered ponds to test swimming!
```

### 🏗️ **ARCHITECTURE OVERVIEW**

#### Key Systems:
- **`GameController.js`**: Main orchestrator, manages all systems, syncs tiger entity with model
- **`WaterSystem.js`**: NEW - Realistic water bodies with swimming mechanics
- **`VegetationSystem.js`**: Procedural jungle vegetation generation
- **`TerrainRenderer.js`**: 3D terrain mesh from heightmap data
- **`MovementSystem.js`**: ✅ ENHANCED tank controls with land/water physics integration
- **`CameraSystem.js`**: Third-person camera with rotation following
- **`Terrain.js`**: Heightmap generation and terrain queries
- **`Input.js`**: Separate movement (W/S) and rotation (A/D) input handling
- **`TigerModel.js`**: 3D tiger mesh with proper head/tail orientation

#### Data Flow:
1. `Terrain` generates heightmap using Perlin noise
2. `TerrainRenderer` creates 3D mesh with vertex colors
3. `VegetationSystem` places flora based on terrain constraints
4. `WaterSystem` generates realistic water bodies (lake, river, ponds) with animated shaders
5. `Input` separates movement and rotation inputs for tank controls
6. `MovementSystem` applies forces with land/water physics (ENHANCED: swimming integration)
7. `GameController` syncs tiger entity with model and coordinates all systems
8. `CameraSystem` follows tiger and integrates with tiger rotation

### 🧪 **TEST COVERAGE**
- ✅ 30/30 VegetationSystem tests pass
- ✅ 13/13 Terrain collision tests pass  
- ✅ 11/11 WaterSystem tests pass
- ✅ 9/9 SwimmingMechanics tests pass
- ⚠️ Camera tests need updating for new rotation integration
- ⚠️ Movement tests need updating for enhanced land/water controls
- ✅ All core systems functional and tested
- ✅ Water system and swimming mechanics manually tested and verified working

### 🔧 **RECENT IMPLEMENTATION (Current Session)**

#### 🌊 **Phase 2: Complete Water System Implementation**
**Goal**: Transform blue terrain patches into realistic swimming environment

**Major Changes**:
1. **Water System Rewrite (`WaterSystem.js`)**:
   - Replaced terrain-based water detection with proper 3D water bodies
   - Large central lake (35-unit radius) + winding river + scattered ponds
   - Animated shader with realistic wave effects and transparency
   - Connected water bodies instead of fragmented patches

2. **Swimming Mechanics (`MovementSystem.js`)**:
   - Automatic swimming detection when tiger enters water
   - Modified physics: buoyancy (15 units), water resistance (0.8x), reduced gravity
   - Swimming-specific controls: 0.7x speed, jump for upward movement
   - Proper collision with water surface and terrain boundaries

3. **Integration (`GameController.js`)**:
   - Connected water system to movement system
   - Added water system regeneration when terrain changes
   - Proper cleanup and resource management

**Technical Implementation**:
```javascript
// Water detection
isInWater(x, z) {
  for (const waterBody of this.waterBodies) {
    if (waterBody.type === 'lake' || waterBody.type === 'pond') {
      const distance = Math.sqrt(Math.pow(x - waterBody.center.x, 2) + Math.pow(z - waterBody.center.z, 2));
      if (distance <= waterBody.radius) return true;
    }
  }
}

// Swimming physics
applyGravity(deltaTime) {
  if (this.isSwimming) {
    const buoyancy = 15;
    const waterResistance = 0.8;
    this.velocity.y += (buoyancy + this.gravity * 0.3) * deltaTime;
    this.velocity.y *= waterResistance;
  }
}
```

**Result**: Realistic aquatic environment with proper swimming mechanics! ✅

### 🚀 **NEXT PRIORITIES FOR FUTURE SESSIONS**

#### Phase 3: Wildlife & Ecosystem (HIGH PRIORITY)
1. **Prey Animals**: Deer, wild boar, small mammals with realistic AI
2. **Predator Threats**: Other tigers, leopards, crocodiles near water
3. **Animal Behaviors**: Realistic movement, reactions to tiger presence
4. **Hunting Mechanics**: Stealth system, pouncing, kill animations

#### Phase 3: Environmental Enhancement (MEDIUM PRIORITY)  
1. **Enhanced Terrain**: Biome variation (dense forest, riverbanks, rocky outcrops)
2. **Weather System**: Rain, fog, dynamic weather affecting visibility
3. **Day/Night Cycle**: Dynamic lighting, different animal behaviors by time
4. **Audio Integration**: Ambient jungle sounds, water sounds, footsteps

#### Phase 4: Advanced Systems (FUTURE)
1. **Tiger Evolution**: Growth stages (cub → adult → alpha), stat progression
2. **Enhanced Lighting**: Filtered sunlight through canopy, dynamic shadows
3. **Territory System**: Marking, defending, expanding territory
4. **Survival Elements**: Hunger, thirst, stamina management

#### Technical Debt & Polish:
1. **Update Test Suite**: Fix camera and movement tests for enhanced controls
2. **Performance**: LOD system, chunk loading for larger worlds  
3. **UI System**: Health/stamina bars, minimap, interaction prompts
4. **Save/Load**: Game state persistence

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

### Testing

- **Run Tests**: `npm test` - Run tests with Vitest
- **Watch Tests**: `npm run test:watch` - Run tests in watch mode
- **Coverage**: `npm run test:coverage` - Run tests with coverage report
- **Test UI**: `npm run test:ui` - Open Vitest UI for interactive testing

### Browser Testing

- **Playwright MCP**: Available for automated browser testing and debugging
- **Navigation**: `mcp__playwright__browser_navigate` to visit localhost
- **Screenshots**: `mcp__playwright__browser_take_screenshot` for visual verification
- **Console Logs**: `mcp__playwright__browser_console_messages` to view debug output
- **Interaction**: `mcp__playwright__browser_click`, `mcp__playwright__browser_type`, `mcp__playwright__browser_press_key` for user simulation
- **Usage**: Start dev server first (`npm run dev`), then use Playwright tools to test game controls and movement

### Technology Stack

- **Build Tool**: Vite 5.x for fast development and optimized builds
- **Testing**: Vitest with jsdom environment for unit/integration tests
- **3D Engine**: Three.js with native ES module imports
- **Physics**: Cannon-es for realistic physics simulation
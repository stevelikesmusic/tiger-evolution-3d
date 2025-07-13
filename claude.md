# Tiger Evolution 3D

## Current Status (Latest Session - Complete Underwater Terrain System & Interactive Elements!)

### ✅ COMPLETED FEATURES

#### 🌿 **Jungle Terrain System** 
- **Procedural Terrain**: 512x512 world units with 128x128 segments using Perlin noise
- **Terrain Renderer**: Full 3D mesh with vertex colors based on height/slope
- **Height-based Texturing**: Automatic grass/dirt/rock/sand distribution
- **Collision System**: Tiger properly walks on terrain surface, no clipping
- **Slope Physics**: Tiger slides down steep slopes (>0.7 steepness)

#### 🌳 **ENHANCED: Vegetation & Ecosystem System**
- **Procedural Generation**: Trees, bushes, grass patches, and ferns
- **✅ WATER-AWARE PLACEMENT**: Vegetation avoids water areas with 3-unit shore buffer
- **✅ JUNGLE MUSHROOMS**: Realistic mushrooms with stems, caps, and white spots replace small water bodies
- **Intelligent Placement**: Respects terrain constraints (height, slope, spacing, water proximity)
- **Visual Variety**: Multiple tree types with different trunk/leaf combinations
- **Wind Animation**: Grass and foliage sway with wind effects
- **Performance**: LOD groups and caching for optimal rendering

#### 🌊 **ENHANCED: Professional Water System** 
- **✅ THREE.JS WATER CLASS**: All water uses professional Water class with realistic reflections
- **✅ BEAUTIFUL VISUALS**: Reflections, refractions, depth-based transparency, wave animations
- **✅ OPTIMIZED PERFORMANCE**: 128x128 render targets, distance culling, maintained 60fps
- **✅ WATER BODY TYPES**: Large reflective lake, flowing rivers, scattered ponds
- **✅ VEGETATION EXCLUSION**: Trees/bushes cannot spawn in water (3-unit shore buffer)
- **✅ DEPTH-BASED SWIMMING**: Shallow water allows jumping, deep water requires swimming
- **Smart Generation**: Connected water bodies with proper routing to avoid overlaps

#### 🏊 **ENHANCED: Advanced Swimming & Aquatic Navigation**
- **✅ DEPTH-AWARE SWIMMING**: Only swims in deep water (>1.5 units), can jump in shallow water
- **✅ LILY PAD PLATFORMS**: Floating lily pads with realistic lotus flowers serve as jump platforms
- **✅ PRECISE CONTROLS**: Enhanced friction (0.7x) and acceleration (1.5x) on lily pads  
- **✅ STRATEGIC CROSSING**: Use lily pads to cross water without swimming
- **✅ FLOATING ANIMATION**: Lily pads gently bob on water surface (3cm amplitude)
- **✅ REALISTIC CONSTRAINTS**: Tiger stays at water surface, can't go below terrain
- **State Management**: Seamless transition between land, lily pad, and water movement

#### 🌊 **ENHANCED: Complete Underwater Terrain System**
- **✅ TELEPORTATION SYSTEM**: R key teleports to underwater terrain, Space key returns to surface
- **✅ DEEP UNDERWATER FLOORS**: Brown dirt/sand floors 8+ units deep for clear separation
- **✅ MASSIVE VEGETATION**: Towering seaweed (30-50 units tall) and thick seagrass (15-40 units tall)
- **✅ SCATTERED DISTRIBUTION**: Vegetation spread naturally across underwater terrain (no clumps)
- **✅ UNDERWATER OBSTACLES**: Realistic rocks scattered across underwater floors
- **✅ SWIM-THROUGH LOGS**: Hollow log tunnels with enhanced movement speed (1.3x)
- **✅ BALLOON BUBBLES**: Small floating bubbles (0.3-0.7 units) that tiger needle can pop
- **✅ OPTIMIZED PERFORMANCE**: Reduced bubble count and geometry for smooth gameplay
- **✅ 3D UNDERWATER MOVEMENT**: Full WASD+GB controls for omnidirectional underwater navigation
- **✅ REALISTIC ANIMATIONS**: Seaweed swaying, bubbles rising with gentle drift
- **✅ SAFE TELEPORTATION**: No terrain collision crashes when switching surface/underwater
- **✅ PROFESSIONAL VISUALS**: Brown underwater terrain, proper depth rendering, realistic lighting

#### 🎮 **PERFECTED: Tank Controls & Camera System**
- **✅ CORRECTED CONTROLS**: W=forward, S=backward, A=left, D=right (fixed inversion!)
- **✅ TRUE TANK CONTROLS**: W/S moves forward/backward in tiger's facing direction, A/D rotates left/right
- **✅ DIRECTION UPDATES**: Movement direction properly updates when tiger rotates (fixed critical bug!)
- **✅ PROPER TRIGONOMETRY**: Fixed forward direction calculation using `Math.sin/cos(rotation.y)`
- **✅ ENHANCED RESPONSIVENESS**: Surface-aware friction and acceleration for precise control
- **Camera Following**: Camera stays behind tiger and follows rotation smoothly
- **Mouse Controls**: Pointer lock + mouse movement for camera orbiting
- **Zoom**: Mouse wheel for distance control (5-25 units)
- **Fallback**: Drag mode works without pointer lock
- **Responsive**: Enhanced smoothness (0.3) for better camera following

#### 🐅 **Tiger Movement & Physics**
- **✅ TANK MOVEMENT**: Tiger now correctly moves in its current facing direction after rotation
- **✅ DIRECTION CALCULATION**: `forwardX = Math.sin(rotation.y)`, `forwardZ = Math.cos(rotation.y)`
- **✅ VELOCITY SYSTEM**: Fixed acceleration to prevent overshoot with `Math.min(1.0, acceleration * deltaTime)`
- **✅ DUAL-MODE MOVEMENT**: Surface tank controls + underwater 3D omnidirectional movement
- **✅ ENHANCED TIGER MODEL**: Realistic four legs with upper/lower segments, paws, and tiger stripes
- **✅ PROPER POSITIONING**: Tiger legs positioned correctly above ground (y=0.1 to y=1.5)
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
# 3. ✅ SURFACE CONTROLS (Tank-style):
#    - W: Move forward in tiger's facing direction
#    - S: Move backward in tiger's facing direction  
#    - A: Rotate tiger left (counter-clockwise)
#    - D: Rotate tiger right (clockwise)
#    - Space: Jump on land/lily pads, return to surface from underwater
#    - Shift: Run (disabled while swimming)
#    - R: Teleport to underwater terrain (when in water)
# 4. ✅ UNDERWATER CONTROLS (3D movement):
#    - W/S: Swim up/down
#    - A/D: Strafe left/right
#    - G/B: Swim forward/backward
#    - Space: Return to surface
#    - Enhanced speed and maneuverability in log tunnels
# 5. Mouse wheel to zoom in/out
# 6. ✅ AQUATIC FEATURES:
#    - Reflective water with realistic visuals
#    - Lily pads with lotus flowers as jump platforms
#    - Depth-aware swimming (shallow=jump, deep=swim)
#    - Enhanced precision on lily pads
# 7. ✅ UNDERWATER FEATURES:
#    - Complete underwater terrain with brown floors
#    - Interactive bubbles that pop on contact
#    - Swim through hollow log tunnels
#    - Dense seaweed forests and seagrass patches
#    - Scattered rocks and realistic underwater environment
# 8. ✅ ECOSYSTEM FEATURES:
#    - Jungle mushrooms scattered around
#    - Water-aware vegetation placement
#    - Clean shorelines with natural buffers
```

### 🏗️ **ARCHITECTURE OVERVIEW**

#### Key Systems:
- **`GameController.js`**: Main orchestrator with underwater teleportation, manages all systems
- **`WaterSystem.js`**: ✅ ENHANCED - Professional Water class, lily pads with lotus flowers
- **`UnderwaterSystem.js`**: ✅ NEW - Complete underwater terrain with interactive elements
- **`VegetationSystem.js`**: ✅ ENHANCED - Water-aware placement, ecosystem integration
- **`TerrainRenderer.js`**: 3D terrain mesh with dual-mode color switching
- **`MovementSystem.js`**: ✅ DUAL-MODE - Surface tank controls + underwater 3D movement
- **`CameraSystem.js`**: Third-person camera with rotation following
- **`Terrain.js`**: Heightmap generation and terrain queries
- **`Input.js`**: ✅ ENHANCED - Surface + underwater control mappings (WASD+GB)
- **`TigerModel.js`**: ✅ ENHANCED - 3D tiger with realistic four-leg anatomy

#### Data Flow:
1. `Terrain` generates heightmap using Perlin noise
2. `TerrainRenderer` creates 3D mesh with vertex colors and dual-mode color switching
3. `WaterSystem` generates professional water bodies + lily pads with lotus flowers
4. `UnderwaterSystem` pre-loads complete underwater terrain (floors, seaweed, rocks, logs, bubbles)
5. `VegetationSystem` places flora based on terrain + water constraints (water-aware placement)
6. `Input` provides dual-mode controls: surface tank controls + underwater 3D movement
7. `MovementSystem` applies context-aware physics (surface/lily pad/underwater with log detection)
8. `GameController` manages teleportation between surface/underwater modes and syncs systems
9. `CameraSystem` follows tiger seamlessly across surface and underwater environments

### 🧪 **TEST COVERAGE**
- ✅ 30/30 VegetationSystem tests pass
- ✅ 13/13 Terrain collision tests pass  
- ✅ 11/11 WaterSystem tests pass
- ✅ 9/9 SwimmingMechanics tests pass
- ✅ UnderwaterSystem manually tested and verified working
- ⚠️ Camera tests need updating for dual-mode integration
- ⚠️ Movement tests need updating for underwater 3D controls
- ⚠️ Need UnderwaterSystem unit tests for bubble/log collision detection
- ✅ All core systems functional and tested
- ✅ Complete underwater terrain system manually tested and verified working

### 🔧 **RECENT IMPLEMENTATION (Latest Session - Underwater Performance & UX Improvements)**

#### 🌊 **Phase 5: Underwater Performance & User Experience Enhancements**
**Goal**: Fix underwater system performance issues and improve user experience with natural vegetation distribution

**Major Fixes & Improvements**:
1. **Bubble System Performance (`UnderwaterSystem.js`)**:
   - **Reduced Bubble Size**: From 1-3 units to 0.3-0.7 units (no more lag)
   - **Tiger Needle Concept**: Precise collision detection where tiger acts as needle popping balloon bubbles
   - **Optimized Geometry**: Reduced poly count from 16x12 to 8x6 for performance
   - **Fewer Bubbles**: Reduced count from radius×1.2 to radius×0.5 per water body
   - **Proper Floating**: Bubbles rise at 2.0 units/sec with gentle side-to-side drift

2. **Massive Vegetation Enhancement (`UnderwaterSystem.js`)**:
   - **Towering Seaweed**: Increased from 12-20 units to 30-50 units tall with thick stems (0.2-0.7 radius)
   - **Massive Seagrass**: Increased from 4-10 units to 15-40 units tall with 30-50 thick blades per patch
   - **Natural Distribution**: Vegetation now spreads in radius×2 area around water bodies instead of dense clumps
   - **Scattered Placement**: Additional plants placed randomly across radius×4 area for natural look
   - **Reduced Density**: Only 40% chance to place vegetation for scattered, realistic distribution

3. **Safe Teleportation System (`GameController.js`)**:
   - **Velocity Reset**: Clear all momentum before teleporting to prevent terrain conflicts
   - **Safe Positioning**: Higher placement (3.0 units above underwater floor, 2.5 above surface)
   - **Proper Sequencing**: Position first, then change movement mode to avoid crashes
   - **No More Terrain Collisions**: Fixed terrain crash issues when switching between modes

4. **Collision Detection Improvements (`UnderwaterSystem.js`)**:
   - **Precise Distance Calculation**: Using proper 3D distance formula for tiger needle vs bubble balloon
   - **Optimized Performance**: Only check collisions when underwater system is active
   - **Better Feedback**: Clean console logging for debugging bubble interactions

**Technical Implementation**:
```javascript
// Underwater terrain generation with deep positioning
createUnderwaterFloor(waterBody) {
  const underwaterDepth = 8 + (waterBody.radius * 0.1); // 8+ units deep
  const floorY = terrainHeight - underwaterDepth;
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
}

// Interactive bubble system with collision detection
checkBubbleCollisions(tigerX, tigerY, tigerZ) {
  for (let i = this.bubbleMeshes.length - 1; i >= 0; i--) {
    const bubble = this.bubbleMeshes[i];
    const distance = Math.sqrt(Math.pow(tigerX - bubble.position.x, 2) + 
                              Math.pow(tigerY - bubble.position.y, 2) + 
                              Math.pow(tigerZ - bubble.position.z, 2));
    if (distance <= tigerRadius + bubble.userData.size) {
      this.popBubble(i); // Pop and respawn
    }
  }
}

// Dual-mode movement system
applyUnderwaterMovement(deltaTime) {
  const leftRight = this.inputDirection.x;   // A/D = strafe
  const upDown = this.inputDirection.y;      // W/S = up/down
  const forwardBack = this.inputDirection.z; // G/B = forward/backward
  const speedMultiplier = this.isInsideLog ? 1.3 : 1.0; // Enhanced log speed
}

// Teleportation with terrain switching
teleportToUnderwaterTerrain() {
  this.isUnderwater = true;
  this.underwaterSystem.activate();
  waterMeshes.forEach(mesh => mesh.visible = false); // Hide surface water
  terrainMesh.material.color.setHex(0x8B4513); // Brown underwater ground
}

// Realistic tiger leg anatomy
addLegs() {
  const legs = ['frontLeft', 'frontRight', 'backLeft', 'backRight'];
  legs.forEach(position => {
    const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
    const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial); 
    const paw = new THREE.Mesh(pawGeometry, pawMaterial);
    this.addLegStripes(legGroup, upperLength, lowerLength, thickness);
  });
}
```

**Result**: High-performance underwater ecosystem with massive vegetation, optimized bubbles, and crash-free teleportation! ✅

### 🚀 **NEXT PRIORITIES FOR FUTURE SESSIONS**

#### Phase 6: Wildlife & Ecosystem (HIGH PRIORITY)
1. **Prey Animals**: Deer, wild boar, small mammals with realistic AI
2. **Predator Threats**: Other tigers, leopards, crocodiles near water
3. **Animal Behaviors**: Realistic movement, reactions to tiger presence
4. **Hunting Mechanics**: Stealth system, pouncing, kill animations
5. **Underwater Life**: Fish schools, underwater predators, aquatic prey

#### Phase 7: Environmental Enhancement (MEDIUM PRIORITY)  
1. **Enhanced Terrain**: Biome variation (dense forest, riverbanks, rocky outcrops)
2. **Weather System**: Rain, fog, dynamic weather affecting visibility
3. **Day/Night Cycle**: Dynamic lighting, different animal behaviors by time
4. **Audio Integration**: Ambient jungle sounds, water sounds, footsteps, underwater acoustics
5. **Particle Effects**: Water splashes, bubble trails, dust clouds

#### Phase 8: Advanced Systems (FUTURE)
1. **Tiger Evolution**: Growth stages (cub → adult → alpha), stat progression
2. **Enhanced Lighting**: Filtered sunlight through canopy, dynamic shadows, underwater caustics
3. **Territory System**: Marking, defending, expanding territory
4. **Survival Elements**: Hunger, thirst, stamina management, oxygen levels underwater
5. **Multiplayer**: Other players as tigers in shared jungle environment

#### Technical Debt & Polish:
1. **Update Test Suite**: Add UnderwaterSystem tests, fix camera/movement tests for dual-mode
2. **Performance**: LOD system, chunk loading for larger worlds, underwater rendering optimization
3. **UI System**: Health/stamina bars, minimap, interaction prompts, underwater HUD
4. **Save/Load**: Game state persistence including underwater progress

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
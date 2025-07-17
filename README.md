# Tiger Evolution 3D 🐅

**Status**: 🟢 **FULL HUNTING ECOSYSTEM** *(Phase 6 - 90% Complete)*

A realistic 3D tiger evolution and survival game built with Three.js and modern web technologies. Control a tiger through its evolution from Young to Alpha while hunting wildlife, surviving, and exploring a dynamic 3D jungle ecosystem with underwater terrain.

## 🎮 **Current Features - FULLY PLAYABLE**

### ✅ **Core Gameplay**
- **Controllable 3D Tiger**: Tank-style movement with realistic physics
- **Third-Person Camera**: Smooth following camera with mouse orbital controls  
- **Movement Modes**: Walking, running (Shift), crouching (Ctrl), jumping (Spacebar)
- **Stamina System**: Running consumes stamina and affects speed
- **Evolution System**: Tiger evolves from Young → Adult → Alpha with stat bonuses
- **Complete 3D Jungle**: Procedural terrain with vegetation, water systems, and wildlife

### ✅ **Hunting & Wildlife System**
- **Realistic Animals**: Deer with antlers, boars with tusks, rabbits with ears, leopards with spots
- **Simple Combat**: Press Z near animals to attack (Young tiger deals 10 damage)
- **Visual Health Bars**: Red/green health bars appear above animals when attacked
- **Animal Fight-Back**: ALL animals become aggressive and counter-attack when attacked
- **Balanced Damage**: Rabbit=5, Deer=20, Boar=30, Leopard=50 damage
- **AI Behaviors**: Animals graze, move, flee, and fight with realistic group behavior

### ✅ **Advanced World Systems**
- **Professional Water**: Reflective lakes, rivers, lily pad platforms with lotus flowers
- **Underwater Terrain**: Complete underwater world with seaweed, rocks, bubbles, and log tunnels
- **Dual Movement**: Surface tank controls + underwater 3D movement with teleportation
- **UI System**: Real-time health, stamina, XP, hunger, level, and evolution display
- **Performance Optimized**: 60 FPS with thousands of vegetation objects and animals

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🎮 **Game Controls**

### 🏃 **Surface Movement (Tank Controls)**
- `W` - Move forward in tiger's facing direction
- `S` - Move backward in tiger's facing direction  
- `A` - Rotate tiger left (counter-clockwise)
- `D` - Rotate tiger right (clockwise)
- `Shift` - Run (consumes stamina, disabled while swimming)
- `Ctrl` - Crouch (stealth mode, reduced detection)
- `Spacebar` - Jump on land/lily pads

### 🌊 **Water & Underwater**
- `R` - Teleport to underwater terrain (when in water)
- `Spacebar` - Return to surface (when underwater)
- **Underwater Controls:**
  - `T` - Swim forward
  - `G` - Swim backward
  - `F` - Swim left
  - `H` - Swim right
  - `Q` - Rotate left
  - `E` - Rotate right

### 🦌 **Hunting & Combat**
- `Z` - Attack nearby animals (Young tiger deals 10 damage)
- Get close to animals and press Z to hunt
- Animals will fight back with their own damage values
- Health bars appear above animals when attacked

### 📷 **Camera Controls**
- `Mouse` - Look around (click canvas first to enable)
- `Mouse Wheel` - Zoom in/out (5-25 units)
- Camera follows tiger and rotates with movement

### 📊 **UI Information**
- **Health Bar**: Tiger's current health (red when low)
- **Stamina Bar**: Current stamina (yellow when low)  
- **XP Bar**: Experience progress toward next level
- **Hunger Bar**: Hunger level (decreases over time)
- **Level**: Current level and evolution stage
- **Controls**: On-screen control reminder

## 🏗️ **Architecture**

Built with a clean, modular architecture using Entity-Component-System patterns:

```
GameController (orchestrates all systems)
├── Tiger (logic: health, stamina, evolution)
├── TigerModel (3D representation & animations)  
├── MovementSystem (physics: WASD → position)
├── CameraSystem (third-person following)
├── InputSystem (cross-platform controls)
└── Engine (Three.js rendering)
```

## 🧪 **Test Coverage**

**144 tests passing** across 6 core modules:
- Tiger character system (23 tests)
- TigerModel 3D system (18 tests)  
- CameraSystem (23 tests)
- InputSystem (26 tests)
- MovementSystem (27 tests)
- GameController integration (27 tests)

**Test-Driven Development** throughout with comprehensive integration testing.

## 📁 **Project Structure**

```
src/
├── core/
│   └── Engine.js              # Three.js engine with game integration
├── entities/  
│   ├── Tiger.js               # Tiger logic (stats, evolution)
│   └── TigerModel.js          # 3D model and animations
├── systems/
│   ├── Camera.js              # Third-person camera system
│   ├── Input.js               # Cross-platform input handling
│   ├── Movement.js            # Physics-based movement system
│   └── GameController.js      # System orchestration
└── tests/
    ├── unit/                  # Unit tests for each module
    └── integration/           # Integration tests
```

## 🎯 **Development Roadmap**

### ✅ **Phase 1-6 Complete**: Full Hunting Ecosystem
- **Phase 1**: Core foundation (Three.js, camera, input, tiger character)
- **Phase 2**: Basic water system and swimming mechanics
- **Phase 3**: Professional water with reflections and lily pads
- **Phase 4**: Complete underwater terrain with seaweed and interactive elements
- **Phase 5**: Wildlife system with realistic animals and AI behaviors
- **Phase 6**: Simplified hunting system with immediate combat mechanics

### 🚧 **Phase 7 Next**: Environmental Enhancement
- Enhanced terrain biomes (dense forest, riverbanks, rocky outcrops)
- Weather system (rain, fog) affecting visibility and animal behavior
- Day/night cycle with dynamic lighting and different animal activity patterns
- Audio integration (ambient jungle sounds, water sounds, footsteps, animal calls)

### 📋 **Phase 8 Planned**: Advanced Evolution & Systems
- Tiger evolution system (cub → adult → alpha) with enhanced stats and abilities
- Advanced hunting: stealth system, kill animations, prey tracking, combo attacks
- Territory management: marking, defending, expanding controlled areas
- Survival elements: hunger, thirst, stamina management with consequences

### 🎨 **Phase 9 Future**: Multiplayer & Advanced Features
- Other player tigers in shared jungle environment
- Cooperative hunting mechanics and territory disputes
- Advanced AI predators (crocodiles, other apex predators)
- Seasonal changes and migration patterns

## 🔧 **Technology Stack**

- **Build**: Vite 5.x (fast development, optimized builds)
- **3D Engine**: Three.js r168+ (WebGL rendering)
- **Testing**: Vitest (ES module support)  
- **Physics**: Custom movement system (Cannon.js integration planned)
- **Architecture**: Entity-Component-System pattern

## 📊 **Performance**

- **Target**: 60 FPS desktop, 30 FPS mobile
- **Optimization**: Frustum culling, LOD system planned
- **Memory**: Efficient object pooling and disposal
- **Loading**: Progressive asset loading planned

## 🤝 **Contributing**

This project follows strict **Test-Driven Development**:

1. Write tests first for any new feature
2. Implement minimal code to pass tests  
3. Refactor for quality and performance
4. Maintain 100% test pass rate

See `.claude/spec.md` for detailed game specifications and `.claude/progress.md` for current development status.

## 📄 **License**

MIT License - See LICENSE file for details.

---

## 🎮 **Gameplay Tips**

### 🦌 **Hunting Strategy**
- **Find Animals**: Look for deer, boars, rabbits, and leopards roaming the jungle
- **Get Close**: Walk up to animals until you're within attack range  
- **Press Z**: Attack with Z key (Young tiger deals 10 damage)
- **Health Bars**: Watch the red/green health bar above animals
- **Fight Back**: Be ready! All animals will counter-attack when hit
- **Gain XP**: Successfully kill animals to gain experience and evolve

### 🏊 **Exploration**
- **Water Areas**: Jump on lily pads to cross water safely
- **Underwater**: Press R in water to teleport to underwater terrain
- **Seaweed Forests**: Explore massive underwater vegetation
- **Bubble Popping**: Swim into bubbles to pop them for fun
- **Log Tunnels**: Swim through hollow logs for speed bonuses

### 💪 **Survival**
- **Stamina Management**: Don't run constantly - stamina affects movement speed
- **Health Monitoring**: Keep an eye on your health bar and avoid strong animals when low
- **Hunger System**: Hunt animals to restore hunger and stay healthy
- **Evolution**: Gain XP to evolve from Young → Adult → Alpha with enhanced abilities

**Ready to hunt?** Run `npm run dev` and control your tiger! 🐅
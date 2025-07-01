# Tiger Evolution 3D 🐅

**Status**: 🟢 **PLAYABLE TIGER SIMULATION** *(Phase 2 - 75% Complete)*

A realistic 3D tiger evolution and survival game built with Three.js and modern web technologies. Control a tiger through its evolution from Young to Alpha while hunting, surviving, and exploring a dynamic 3D jungle ecosystem.

## 🎮 **Current Features - FULLY PLAYABLE**

### ✅ **Core Gameplay**
- **Controllable 3D Tiger**: WASD movement with realistic physics
- **Third-Person Camera**: Smooth following camera with mouse orbital controls  
- **Movement Modes**: Walking, running (Shift), crouching (Ctrl), jumping (Spacebar)
- **Stamina System**: Running consumes stamina and affects speed
- **Evolution System**: Tiger evolves from Young → Adult → Alpha with stat bonuses
- **3D Environment**: Ground plane with atmospheric lighting and fog

### ✅ **Technical Features**  
- **Real-time Physics**: Acceleration, friction, gravity, ground collision
- **Animation Sync**: Tiger state automatically drives 3D model animations
- **Cross-platform Input**: Keyboard, mouse, and touch controls
- **Performance Optimized**: 60 FPS target with efficient rendering

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

**Controls:**
- `WASD` - Move tiger
- `Mouse` - Camera control  
- `Shift` - Run (consumes stamina)
- `Ctrl` - Crouch (stealth mode)
- `Spacebar` - Jump/Pounce
- `Mouse Wheel` - Zoom in/out

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

### ✅ **Phase 1 Complete**: Core Foundation
- Three.js setup, camera system, input controls, tiger character

### 🚧 **Phase 2 In Progress**: Gameplay Systems (75% Complete)
- ✅ Tiger movement and controls
- ✅ Camera integration  
- ✅ Physics and animation
- ⏳ **Next**: Animal AI ecosystem (deer, predators)
- ⏳ **Next**: Hunting mechanics
- ⏳ **Next**: UI/HUD system

### 📋 **Phase 3 Planned**: Environmental Polish
- Procedural terrain generation
- Day/night cycle with dynamic lighting  
- Weather effects and particle systems
- Advanced AI behaviors

### 🎨 **Phase 4 Planned**: Advanced Features
- Alpha Tiger special abilities (laser breath)
- Territory system and safe zones
- Mobile optimization  
- Performance optimization

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

**Ready to hunt?** Run `npm run dev` and control your tiger! 🐅
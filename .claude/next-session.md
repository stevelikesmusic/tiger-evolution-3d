# Next Session Development Notes

## 🎯 **Current Status: PLAYABLE TIGER COMPLETE**

**What works now:**
- Run `npm run dev` to play with controllable 3D tiger
- WASD movement, mouse camera, jumping, running, crouching
- Realistic physics with stamina system
- Evolution mechanics (Young → Adult → Alpha)
- 144 tests passing, full integration pipeline

## 📋 **Immediate Next Steps**

### 1. **Animal AI Ecosystem** (High Priority)
**Goal**: Add prey animals for the tiger to hunt

**Implementation Plan:**
```javascript
// Create base Animal class (similar to Tiger)
src/entities/Animal.js
src/entities/AnimalModel.js  

// Specific animal types
src/entities/Deer.js        // Fast prey, flocking behavior
src/entities/Rabbit.js      // Very fast, zigzag escape
src/entities/Leopard.js     // Competing predator
```

**Key Features:**
- AI state machines (Idle → Wander → Flee → Hide)
- Detection system (tiger proximity triggers flee)
- Flocking/herding behaviors for prey
- Different movement speeds and behaviors per animal
- Spawning system around the map

### 2. **Hunting Mechanics** (High Priority)
**Goal**: Make the tiger actually hunt and gain XP

**Implementation Plan:**
- Stealth detection system (crouching reduces detection radius)
- Pounce attack mechanics (spacebar charge system)
- Combat resolution (damage, XP gain, food restoration)
- Animal death/respawn system

### 3. **Basic UI/HUD** (Medium Priority)
**Goal**: Show tiger stats and game state

**Implementation Plan:**
```javascript
src/ui/HUD.js               // Health/stamina/hunger bars
src/ui/MiniMap.js          // Show nearby animals
src/ui/EvolutionIndicator.js // XP progress
```

## 🏗️ **Architecture Patterns to Follow**

### **For Animals**: Use Same Pattern as Tiger
```javascript
// Each animal should have:
Animal.js       // Logic (AI, stats, behavior)
AnimalModel.js  // 3D representation
MovementSystem  // Reuse existing system
AI System       // New - state machine for behaviors
```

### **For GameController**: Extend Existing Pattern
```javascript
// Add to GameController:
this.animals = [];           // Array of all animals
this.animalSpawner = new AnimalSpawner();
this.huntingSystem = new HuntingSystem();

// Update loop becomes:
update(deltaTime) {
  // ... existing tiger update
  this.animals.forEach(animal => animal.update(deltaTime));
  this.huntingSystem.checkInteractions(this.tiger, this.animals);
}
```

## 🧪 **Testing Strategy for Next Session**

### **TDD Approach**:
1. Write Animal AI tests first
2. Write AnimalModel tests  
3. Write HuntingSystem tests
4. Write integration tests for tiger-animal interactions

### **Test Files to Create**:
```
src/tests/unit/Animal.test.js
src/tests/unit/AnimalModel.test.js  
src/tests/unit/AISystem.test.js
src/tests/unit/HuntingSystem.test.js
src/tests/integration/EcosystemController.test.js
```

## 🔧 **Key Implementation Notes**

### **Reusable Systems**:
- **MovementSystem**: Already built, can be reused for all animals
- **GameController pattern**: Proven successful, extend for ecosystem
- **TigerModel approach**: Copy for AnimalModel with different geometries

### **Performance Considerations**:
- Animal AI should only update when within tiger detection range
- Use object pooling for animal spawning/despawning  
- LOD system for distant animals (reduce animation/AI complexity)

### **Code Patterns That Work**:
- Test-first development (144 tests passing)
- System coordination through GameController
- Clean separation: Logic classes + Model classes + System classes
- Mock-heavy integration tests for fast feedback

## 🎮 **Gameplay Focus**

### **Core Loop to Complete**:
1. Tiger moves around world ✅
2. Animals spawn and roam with AI ⏳ **NEXT**
3. Tiger hunts animals for XP ⏳ **NEXT**  
4. Tiger evolves and gets stronger ✅
5. Stronger predators appear ⏳ **LATER**

### **Fun Factor Priorities**:
1. **Hunting satisfaction** - Stealth approach, pounce attack, successful kill
2. **Animal variety** - Different behaviors make world feel alive
3. **Progression feedback** - Clear XP gain, evolution rewards
4. **Environmental richness** - Animals react to tiger presence

## 🚨 **Common Pitfalls to Avoid**

1. **Don't break existing integration** - Tiger movement works perfectly
2. **Follow TDD religiously** - Write tests first, implement after
3. **Keep GameController pattern** - Don't try to refactor, extend it
4. **Performance over features** - Better to have few animals running smoothly

## 📊 **Success Metrics for Next Session**

- [ ] At least 2 animal types spawning and moving
- [ ] Animals flee when tiger approaches
- [ ] Tiger can successfully hunt and gain XP
- [ ] No regression in existing tiger functionality
- [ ] Test coverage maintains 100% pass rate
- [ ] Game still runs at 60 FPS with animals

---

**Session Handoff**: The foundation is rock-solid. Focus on extending the ecosystem using the proven GameController pattern. The hardest integration work is done! 🚀
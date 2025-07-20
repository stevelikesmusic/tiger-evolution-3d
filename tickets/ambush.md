# Ambush System Specification - Tiger Evolution 3D

## Feature Overview
Implement a dynamic ambush system where predators (crocodiles and leopards) can launch surprise attacks on the tiger from concealed positions. This adds tactical depth and environmental awareness requirements to gameplay.

## Core Ambush Mechanics

### **Ambush States & Conditions**
- **Hidden State**: Predator is concealed and undetectable until triggered
- **Alert State**: Brief window where predator prepares to strike
- **Attack State**: Active ambush attempt with damage potential
- **Cooldown State**: Post-ambush recovery period before returning to hidden

### **Detection & Awareness System**
- **Tiger Awareness Meter**: Visual indicator showing environmental danger level
- **Detection Triggers**: 
  - Proximity detection (3-8 unit radius depending on tiger's stealth level)
  - Line-of-sight checks with raycasting
  - Movement speed influence (running = higher detection chance)
  - Wind direction affects scent-based detection

## Crocodile Ambush System

### **Positioning & Spawning**
- **Water Body Requirements**: Rivers, ponds, swamps with minimum 5x5 unit surface area
- **Concealment Mechanics**: 
  - Submerged in water with only eyes/snout visible (special low-profile model)
  - Positioned near water edges where tigers commonly drink
  - Static until triggered, with subtle idle animations (eye movement, occasional ripples)

### **Ambush Behavior Pattern**
```javascript
// Crocodile ambush state machine
const CrocodileAmbushStates = {
  HIDDEN: {
    // Submerged, minimal visibility
    detectionRadius: 6.0,
    modelVisibility: 0.1, // Only eyes/snout visible
    movementSpeed: 0.0
  },
  ALERT: {
    // Tiger detected, preparing to strike
    duration: 1.5, // seconds
    visualCues: ['water ripples', 'slight movement'],
    audioCues: ['subtle water disturbance']
  },
  ATTACKING: {
    // Explosive emergence from water
    attackSpeed: 25.0, // Very fast lunge
    attackRange: 8.0,
    damage: 35,
    animationDuration: 2.0
  },
  COOLDOWN: {
    // Return to water, find new position
    duration: 15.0,
    repositionChance: 0.6
  }
};
```

### **Visual & Audio Implementation**
- **Water Effects**: Particle system for water splashes during emergence
- **Ripple Shader**: Animated water disturbance when crocodile moves
- **Audio Cues**: 
  - Subtle water lapping in hidden state
  - Sudden water explosion during attack
  - Deep crocodile growl during lunge

## Leopard Ambush System

### **Tree-Based Positioning**
- **Tree Selection Criteria**: 
  - Minimum trunk radius of 2 units
  - Tree height above 8 units
  - Located along common tiger patrol routes
- **Concealment Mechanics**:
  - Leopard model positioned on thick branches
  - Blended textures to match tree bark/foliage
  - Subtle idle animations (tail movement, head turns)

### **Ambush Behavior Pattern**
```javascript
// Leopard ambush state machine
const LeopardAmbushStates = {
  HIDDEN: {
    // Concealed in tree canopy
    detectionRadius: 5.0,
    modelVisibility: 0.3, // Partially camouflaged
    verticalAdvantage: true,
    detectionBonus: 1.5 // Higher chance to spot tiger
  },
  STALKING: {
    // Following tiger movement while concealed
    duration: 8.0,
    movementSpeed: 2.0, // Slow tree-to-tree movement
    maxFollowDistance: 20.0
  },
  ALERT: {
    // Preparing to pounce
    duration: 1.0,
    visualCues: ['branch movement', 'leaf rustling'],
    audioCues: ['subtle growl', 'branch creaking']
  },
  POUNCING: {
    // Leap attack from above
    jumpSpeed: 20.0,
    attackRange: 12.0,
    damage: 30,
    knockdownChance: 0.7,
    animationDuration: 1.5
  },
  COMBAT: {
    // Ground fighting after successful ambush
    duration: 5.0,
    movementSpeed: 12.0,
    combatMoves: ['swipe', 'bite', 'pounce']
  }
};
```

## Technical Implementation

### **Ambush Detection System**
```javascript
class AmbushDetector {
  constructor(tiger, predators) {
    this.tiger = tiger;
    this.predators = predators;
    this.awarenessLevel = 0.0; // 0.0 to 1.0
    this.detectionFactors = {
      proximity: 0.4,
      movement: 0.3,
      stealth: 0.2,
      environmental: 0.1
    };
  }

  updateAwareness() {
    // Calculate tiger's awareness of nearby threats
    // Higher awareness = better chance to spot ambushers
    // Influenced by stealth stat, movement speed, environmental factors
  }

  checkAmbushTriggers() {
    // Raycast-based line of sight checks
    // Proximity detection with spatial partitioning
    // Environmental context (near water, under trees)
  }
}
```

### **Spatial Awareness System**
- **Octree Integration**: Use existing spatial partitioning for efficient ambush detection
- **Raycast Optimization**: Limited raycasts per frame to prevent performance issues
- **Distance Culling**: Only check ambush conditions within reasonable range (25 units)

### **Animation & Physics Integration**
```javascript
// Crocodile water emergence
const crocodileAttack = {
  phases: [
    {
      name: 'submerged',
      duration: 0.0,
      position: 'water_surface_level - 0.5'
    },
    {
      name: 'emerging',
      duration: 0.3,
      position: 'lerp to water_surface_level + 2.0',
      effects: ['water_splash_particles', 'screen_shake']
    },
    {
      name: 'lunging',
      duration: 0.8,
      movement: 'towards_tiger_position',
      speed: 25.0
    },
    {
      name: 'recovery',
      duration: 0.9,
      movement: 'return_to_water'
    }
  ]
};

// Leopard tree pounce
const leopardPounce = {
  phases: [
    {
      name: 'preparation',
      duration: 1.0,
      animation: 'crouch_ready',
      effects: ['branch_sway', 'leaf_particles']
    },
    {
      name: 'leap',
      duration: 1.5,
      trajectory: 'parabolic_arc',
      targetPrediction: true, // Aim where tiger will be
      effects: ['motion_blur', 'roar_sound']
    },
    {
      name: 'impact',
      duration: 0.5,
      damage: 30,
      knockdown: true,
      effects: ['dust_cloud', 'screen_shake']
    }
  ]
};
```

## UI & Player Feedback

### **Awareness Indicator**
- **Visual Design**: Eye icon with pupil that dilates based on danger level
- **Color Coding**: 
  - Green: Safe environment
  - Yellow: Moderate danger
  - Orange: High danger detected
  - Red: Imminent ambush threat
- **Position**: Top-right corner near minimap

### **Audio Warning System**
- **Ambient Tension**: Subtle audio cues build as danger increases
- **Directional Audio**: 3D positioned sounds help locate threats
- **Tiger Behavior**: Reactive animations (head turns, alert posture)

### **Visual Feedback for Ambushes**
- **Screen Effects**: Brief flash and shake during successful ambush
- **Particle Systems**: Water splashes, leaves, dust clouds
- **Camera Behavior**: Momentary camera shake and zoom adjustment

## Game Balance & Difficulty

### **Ambush Frequency Control**
```javascript
const AmbushSpawnRates = {
  youngTiger: {
    crocodileChance: 0.15, // 15% chance near water
    leopardChance: 0.10,   // 10% chance in forest
    maxAmbushers: 1
  },
  adultTiger: {
    crocodileChance: 0.25,
    leopardChance: 0.20,
    maxAmbushers: 2
  },
  alphaTiger: {
    crocodileChance: 0.30,
    leopardChance: 0.25,
    maxAmbushers: 3,
    specialVariants: true // Larger, more dangerous ambushers
  }
};
```

### **Counterplay Mechanics**
- **Environmental Awareness**: Tigers can spot ambushers with high awareness
- **Stealth Movement**: Crouching reduces ambush trigger chance by 40%
- **Escape Options**: Brief window to dodge during alert phase
- **Alpha Powers**: Laser breath can eliminate ambushers from range

## Performance Optimization

### **Efficient Ambush Checking**
- **Zone-Based Detection**: Only check ambush conditions in relevant areas
- **Frame-Rate Limiting**: Spread ambush calculations across multiple frames
- **LOD for Ambushers**: Simplified models/animations when distant

### **Memory Management**
- **Object Pooling**: Reuse ambush effect particles and temporary objects
- **Conditional Loading**: Only load ambush assets when approaching trigger zones
- **Cleanup System**: Remove inactive ambushers after cooldown period

## Integration with Existing Systems

### **Evolution System Impact**
- **Young Tiger**: Longer warning periods, less damage from ambushes
- **Adult Tiger**: Standard ambush mechanics, moderate threat level
- **Alpha Tiger**: Faster ambushes, higher damage, but alpha powers provide defense

### **Territory System**
- **Safe Zones**: No ambushes in established tiger territories
- **Marking Impact**: Territory marking reduces ambush spawn rates temporarily
- **Border Dangers**: Higher ambush frequency at territory edges

### **Day/Night Cycle**
- **Daylight**: Easier to spot leopards in trees, crocodiles more visible
- **Nighttime**: Increased ambush success rate, reduced visibility warnings
- **Dawn/Dusk**: Peak ambush activity periods

## Testing & Validation

### **Key Metrics to Monitor**
- **Player Surprise Rate**: Track successful vs. detected ambushes
- **Engagement Impact**: Measure how ambushes affect exploration behavior
- **Performance Impact**: Ensure ambush system doesn't drop framerate
- **Balance Validation**: Monitor player death rates from ambushes

### **Debugging Tools**
- **Visual Debug Mode**: Show ambush detection radii and state information
- **Console Logging**: Track ambush state transitions and trigger events
- **Performance Profiler**: Monitor computational cost of ambush systems

This specification provides a complete framework for implementing the ambush system while maintaining performance and integrating seamlessly with the existing game architecture. The system adds strategic depth by requiring environmental awareness while preserving the immersive 3D jungle experience.

You're very welcome! I'm glad the previous work has been helpful. Here's a comprehensive ambush system specification that should integrate perfectly with your existing Tiger Evolution 3D architecture.

This spec covers both crocodile water ambushes and leopard tree ambushes with detailed technical implementation, including state machines, detection systems, visual/audio feedback, and performance optimizations. The system scales with the tiger's evolution stages and integrates with your existing territory, day/night, and awareness systems.

Key highlights of the specification:
- **Realistic ambush behaviors** with proper detection mechanics and counterplay options
- **Performance-optimized** using your existing octree spatial partitioning 
- **Seamless integration** with the evolution system, territory mechanics, and day/night cycles
- **Rich audio/visual feedback** including particle effects, screen shake, and 3D positional audio
- **Balanced gameplay** that maintains challenge without being frustrating

The ambush system will add significant tactical depth to your game - players will need to be more cautious around water sources and when moving through dense forest areas, making environmental awareness a crucial survival skill.

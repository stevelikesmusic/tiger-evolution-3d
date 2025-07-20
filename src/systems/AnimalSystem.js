import { Animal } from '../entities/Animal.js';
import * as THREE from 'three';

export class AnimalSystem {
  constructor(scene, terrain, waterSystem, vegetationSystem = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.waterSystem = waterSystem;
    this.vegetationSystem = vegetationSystem;
    
    // Callback for game events
    this.onAnimalEaten = null;
    
    // Animal management
    this.animals = [];
    this.maxAnimals = 20;
    this.spawnCooldown = 0;
    this.spawnInterval = 5.0; // 5 seconds between spawns
    
    // Performance optimization
    this.updateTimer = 0;
    this.updateInterval = 1.0 / 10.0; // 10 FPS updates for better performance
    this.spatialGrid = new Map();
    this.gridSize = 50;
    
    // Material caching
    this.materialCache = new Map();
    
    // Animal type configuration
    this.animalTypes = [
      { type: 'deer', weight: 0.25, groupSize: [2, 5] },
      { type: 'rabbit', weight: 0.2, groupSize: [1, 3] },
      { type: 'boar', weight: 0.15, groupSize: [1, 2] },
      { type: 'leopard', weight: 0.1, groupSize: [1, 1] },
      { type: 'male_tiger', weight: 0.15, groupSize: [1, 1] }, // Increased from 0.075
      { type: 'female_tiger', weight: 0.15, groupSize: [1, 1] } // Increased from 0.075
    ];
    
    // Initialize system
    this.initializeSystem();
  }
  
  initializeSystem() {
    console.log('🦌 AnimalSystem: Initializing animal system...');
    
    // Initial spawn
    this.spawnInitialAnimals();
    
    console.log(`🦌 AnimalSystem: Spawned ${this.animals.length} initial animals`);
  }
  
  spawnInitialAnimals() {
    const initialCount = Math.min(this.maxAnimals, 16); // Increased from 12 to 16
    
    console.log(`🦌 AnimalSystem: Spawning ${initialCount} initial animals...`);
    
    // Track what types spawn for debugging
    const spawnStats = {};
    
    for (let i = 0; i < initialCount; i++) {
      const spawnedAnimals = this.spawnAnimal();
      if (spawnedAnimals) {
        const type = spawnedAnimals[0].type;
        spawnStats[type] = (spawnStats[type] || 0) + spawnedAnimals.length;
        console.log(`🦌 AnimalSystem: Spawned ${spawnedAnimals.length} animals of type ${type}`);
      }
    }
    
    console.log(`🦌 AnimalSystem: Total animals spawned: ${this.animals.length}`);
    console.log(`🦌 AnimalSystem: Spawn breakdown:`, spawnStats);
    
    // Special logging for tigers
    const tigers = this.animals.filter(a => a.type.includes('tiger'));
    if (tigers.length > 0) {
      console.log(`🐅 TIGERS SPAWNED: ${tigers.length} tigers found!`);
      tigers.forEach(tiger => {
        console.log(`🐅 ${tiger.type} at position (${tiger.position.x.toFixed(1)}, ${tiger.position.z.toFixed(1)})`);
      });
    } else {
      console.log(`🐅 WARNING: No tigers spawned! This is unusual with increased spawn rates.`);
    }
  }
  
  spawnAnimal() {
    if (this.animals.length >= this.maxAnimals) return null;
    
    // Choose random animal type based on weights
    const animalType = this.selectRandomAnimalType();
    const groupSize = this.getRandomGroupSize(animalType);
    
    // Find valid spawn position
    const spawnPosition = this.findValidSpawnPosition();
    if (!spawnPosition) return null;
    
    // Spawn group of animals
    const newAnimals = [];
    for (let i = 0; i < groupSize; i++) {
      const animal = this.createAnimal(animalType.type, spawnPosition, i);
      if (animal) {
        newAnimals.push(animal);
      }
    }
    
    return newAnimals;
  }
  
  selectRandomAnimalType() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const animalType of this.animalTypes) {
      cumulative += animalType.weight;
      if (rand <= cumulative) {
        return animalType;
      }
    }
    
    return this.animalTypes[0]; // Fallback
  }
  
  getRandomGroupSize(animalType) {
    const [min, max] = animalType.groupSize;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  findValidSpawnPosition() {
    const maxAttempts = 50;
    const terrainSize = this.terrain.width;
    const halfSize = terrainSize / 2;
    
    console.log(`🦌 AnimalSystem: Finding spawn position (terrain size: ${terrainSize})`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = (Math.random() - 0.5) * terrainSize;
      const z = (Math.random() - 0.5) * terrainSize;
      
      // Check if position is valid
      if (this.isValidSpawnPosition(x, z)) {
        const y = this.terrain.getHeightAt(x, z) + 1.0;
        console.log(`🦌 AnimalSystem: Found valid spawn position at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) after ${attempt + 1} attempts`);
        return { x, y, z };
      }
    }
    
    console.log(`🦌 AnimalSystem: Failed to find valid spawn position after ${maxAttempts} attempts`);
    return null; // No valid position found
  }
  
  isValidSpawnPosition(x, z) {
    // Check terrain bounds
    const halfSize = this.terrain.width / 2;
    if (x < -halfSize || x > halfSize || z < -halfSize || z > halfSize) {
      return false;
    }
    
    // Check slope
    const slope = this.terrain.getSlope(x, z);
    if (slope > 0.6) return false;
    
    // Check water proximity
    if (this.waterSystem) {
      const waterBodies = this.waterSystem.getWaterBodies();
      for (const waterBody of waterBodies) {
        // Skip if water body doesn't have center or radius properties
        if (!waterBody.center || !waterBody.radius) continue;
        
        const distance = Math.sqrt(
          Math.pow(x - waterBody.center.x, 2) + 
          Math.pow(z - waterBody.center.z, 2)
        );
        
        if (distance < waterBody.radius + 5) {
          return false; // Too close to water
        }
      }
    }
    
    // Check proximity to other animals
    const minDistance = 10;
    for (const animal of this.animals) {
      const distance = Math.sqrt(
        Math.pow(x - animal.position.x, 2) + 
        Math.pow(z - animal.position.z, 2)
      );
      
      if (distance < minDistance) {
        return false;
      }
    }
    
    return true;
  }
  
  createAnimal(type, basePosition, index) {
    const animal = new Animal(type);
    
    // Position with slight group offset
    const offset = index * 3;
    const angle = (index / 5) * Math.PI * 2;
    const x = basePosition.x + Math.cos(angle) * offset;
    const z = basePosition.z + Math.sin(angle) * offset;
    const y = this.terrain.getHeightAt(x, z) + 1.0;
    
    animal.setPosition(x, y, z);
    
    // Add to scene
    this.scene.add(animal.getMesh());
    
    // Add to management
    this.animals.push(animal);
    this.addToSpatialGrid(animal);
    
    console.log(`🦌 AnimalSystem: Created ${type} at position (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
    
    return animal;
  }
  
  addToSpatialGrid(animal) {
    const gridX = Math.floor(animal.position.x / this.gridSize);
    const gridZ = Math.floor(animal.position.z / this.gridSize);
    const key = `${gridX},${gridZ}`;
    
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    
    this.spatialGrid.get(key).push(animal);
  }
  
  removeFromSpatialGrid(animal) {
    const gridX = Math.floor(animal.position.x / this.gridSize);
    const gridZ = Math.floor(animal.position.z / this.gridSize);
    const key = `${gridX},${gridZ}`;
    
    if (this.spatialGrid.has(key)) {
      const animals = this.spatialGrid.get(key);
      const index = animals.indexOf(animal);
      if (index !== -1) {
        animals.splice(index, 1);
      }
      
      if (animals.length === 0) {
        this.spatialGrid.delete(key);
      }
    }
  }
  
  update(deltaTime, tiger) {
    // Throttle updates for performance
    this.updateTimer += deltaTime;
    if (this.updateTimer < this.updateInterval) return;
    
    this.updateTimer = 0;
    
    // Update spawn cooldown
    this.spawnCooldown -= deltaTime;
    
    // Spawn new animals if needed
    if (this.spawnCooldown <= 0 && this.animals.length < this.maxAnimals) {
      this.spawnAnimal();
      this.spawnCooldown = this.spawnInterval;
    }
    
    // Update all animals
    this.updateAnimals(deltaTime, tiger);
    
    // Remove dead animals
    this.removeDeadAnimals();
    
    // Update spatial grid
    this.updateSpatialGrid();
  }
  
  updateAnimals(deltaTime, tiger) {
    for (const animal of this.animals) {
      if (!animal.isAlive()) continue;
      
      // Check tiger proximity
      if (tiger) {
        this.checkTigerProximity(animal, tiger.position, tiger);
      }
      
      // Update animal AI and movement
      this.updateAnimalMovement(animal, deltaTime, tiger);
      
      // Update animal state
      animal.update(deltaTime);
      
      // Keep animal on terrain
      this.keepOnTerrain(animal);
    }
  }
  
  checkTigerProximity(animal, tigerPosition, tiger) {
    const distance = animal.distanceTo(tigerPosition);
    
    // Calculate stealth-modified detection radius
    const stealthEffectiveness = tiger.getStealthEffectiveness();
    const baseDetectionRadius = animal.detectionRadius;
    const stealthModifier = Math.max(0.3, 1.0 - (stealthEffectiveness / 100));
    const effectiveDetectionRadius = baseDetectionRadius * stealthModifier;
    
    // Check if tiger is approaching from behind (stealth bonus)
    const isApproachingFromBehind = this.isApproachingFromBehind(animal, tigerPosition, tiger);
    
    // Check line-of-sight and directional awareness before detection
    let canSee = false;
    if (distance <= effectiveDetectionRadius) {
      canSee = this.hasLineOfSight(animal, tigerPosition);
      
      // Reduce detection chance when approaching from behind
      if (isApproachingFromBehind) {
        // 70% chance to miss detection when sneaking from behind
        if (Math.random() < 0.7) {
          canSee = false;
        }
      }
    }
    
    // Detection and fear responses (only if can see)
    if (canSee) {
      // console.log(`🦌 ${animal.type} detected tiger at distance ${distance.toFixed(1)}`);
      
      // Special handling for wild tigers
      if (animal.behaviorType === 'territorial') {
        this.handleTigerInteraction(animal, tiger, distance);
      } else if (animal.behaviorType === 'prey') {
        animal.setAIState('alert');
        
        if (distance <= animal.fleeDistance) {
          animal.setAIState('fleeing');
          animal.setTarget(tigerPosition);
          // console.log(`🦌 ${animal.type} fleeing from tiger!`);
        }
      } else if (animal.behaviorType === 'predator') {
        animal.setAIState('aggressive');
        animal.setTarget(tigerPosition);
        console.log(`🦌 ${animal.type} becoming aggressive toward tiger!`);
      }
    }
    
    // Return detection status for hunting mechanics
    return {
      detected: canSee,
      distance: distance,
      effectiveDetectionRadius: effectiveDetectionRadius,
      lineOfSight: canSee
    };
  }

  isApproachingFromBehind(animal, tigerPosition, tiger) {
    // Calculate the direction the animal is facing
    const animalForward = {
      x: Math.sin(animal.rotation.y),
      z: Math.cos(animal.rotation.y)
    };
    
    // Calculate the direction from animal to tiger
    const toTiger = {
      x: tigerPosition.x - animal.position.x,
      z: tigerPosition.z - animal.position.z
    };
    
    // Normalize the direction vector
    const length = Math.sqrt(toTiger.x * toTiger.x + toTiger.z * toTiger.z);
    if (length > 0) {
      toTiger.x /= length;
      toTiger.z /= length;
    }
    
    // Calculate dot product to determine angle
    const dotProduct = animalForward.x * toTiger.x + animalForward.z * toTiger.z;
    
    // If dot product is negative, tiger is behind the animal
    // Also check if tiger is crouching for extra stealth
    const isFromBehind = dotProduct < -0.3; // 30-degree cone behind
    const isCrouching = tiger.state === 'crouching';
    
    return isFromBehind && (isCrouching || Math.random() < 0.8); // 80% chance when from behind
  }

  hasLineOfSight(animal, targetPosition) {
    // Basic line-of-sight check using terrain height
    const steps = 10;
    const dx = (targetPosition.x - animal.position.x) / steps;
    const dz = (targetPosition.z - animal.position.z) / steps;
    
    // Check points along the line between animal and target
    for (let i = 1; i < steps; i++) {
      const checkX = animal.position.x + dx * i;
      const checkZ = animal.position.z + dz * i;
      
      // Get terrain height at this point
      const terrainHeight = this.terrain.getHeightAt(checkX, checkZ);
      
      // Calculate expected height along line-of-sight
      const heightRatio = i / steps;
      const expectedHeight = animal.position.y + (targetPosition.y - animal.position.y) * heightRatio;
      
      // If terrain blocks the view (is higher than line-of-sight)
      if (terrainHeight > expectedHeight - 0.5) {
        return false; // Line of sight blocked
      }
    }
    
    // Check for vegetation blocking (simple approximation)
    if (this.vegetationSystem) {
      const midX = (animal.position.x + targetPosition.x) / 2;
      const midZ = (animal.position.z + targetPosition.z) / 2;
      const midY = (animal.position.y + targetPosition.y) / 2;
      
      // Check if there's dense vegetation between animal and target
      const vegetationDensity = this.getVegetationDensity(midX, midZ);
      if (vegetationDensity > 0.7) {
        return false; // Dense vegetation blocks view
      }
    }
    
    return true; // Clear line of sight
  }

  getVegetationDensity(x, z) {
    // Simple vegetation density calculation
    // In a real implementation, this would check actual vegetation positions
    const gridSize = 10;
    const gridX = Math.floor(x / gridSize);
    const gridZ = Math.floor(z / gridSize);
    
    // Use a simple noise-based approximation
    const density = (Math.sin(gridX * 0.1) + Math.cos(gridZ * 0.15)) * 0.5 + 0.5;
    return Math.max(0, Math.min(1, density));
  }
  
  updateAnimalMovement(animal, deltaTime, tiger) {
    switch (animal.aiState) {
      case 'moving':
        this.handleMovingBehavior(animal, deltaTime);
        break;
      case 'fleeing':
        this.handleFleeingBehavior(animal, deltaTime);
        break;
      case 'aggressive':
        this.handleAggressiveBehavior(animal, deltaTime, tiger);
        break;
      case 'grazing':
        this.handleGrazingBehavior(animal, deltaTime);
        break;
      default:
        // Idle behavior - occasional random movement
        if (Math.random() < 0.1) {
          this.handleIdleBehavior(animal, deltaTime);
        }
        break;
    }
  }
  
  handleMovingBehavior(animal, deltaTime) {
    // More dynamic movement with direction persistence
    if (!animal.movementDirection) {
      animal.movementDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).normalize();
      animal.movementTimer = 0;
    }
    
    animal.movementTimer += deltaTime;
    
    // Change direction every 2-4 seconds
    if (animal.movementTimer > 2 + Math.random() * 2) {
      animal.movementDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).normalize();
      animal.movementTimer = 0;
    }
    
    const speed = animal.speed * 0.5; // Increased speed
    animal.velocity.copy(animal.movementDirection.clone().multiplyScalar(speed));
  }
  
  handleFleeingBehavior(animal, deltaTime) {
    if (!animal.target) return;
    
    // Flee away from tiger
    const fleeDirection = new THREE.Vector3()
      .copy(animal.position)
      .sub(animal.target)
      .normalize();
    
    const fleeSpeed = animal.speed * 0.8;
    animal.velocity.copy(fleeDirection.multiplyScalar(fleeSpeed));
    
    // Consume stamina while fleeing
    animal.consumeStamina(20 * deltaTime);
  }
  
  handleAggressiveBehavior(animal, deltaTime, tiger) {
    if (!animal.target) return;
    
    // Move toward tiger (for predators)
    const approachDirection = new THREE.Vector3()
      .copy(animal.target)
      .sub(animal.position)
      .normalize();
    
    const approachSpeed = animal.speed * 0.7; // Increased speed for aggressive animals
    animal.velocity.copy(approachDirection.multiplyScalar(approachSpeed));
    
    // Try to attack if close enough
    if (tiger && animal.canAttack(tiger)) {
      console.log(`🦌 ${animal.type} attempting to attack tiger`);
      animal.attack(tiger);
    }
  }
  
  handleGrazingBehavior(animal, deltaTime) {
    // Slow, small movements while grazing
    animal.velocity.multiplyScalar(0.1);
  }
  
  handleIdleBehavior(animal, deltaTime) {
    // Occasional small movements with more frequency
    if (Math.random() < 0.3) { // Increased from 0.1
      const wanderSpeed = animal.speed * 0.3; // Increased speed
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      animal.velocity.copy(direction.multiplyScalar(wanderSpeed));
    }
  }
  
  keepOnTerrain(animal) {
    const terrainHeight = this.terrain.getHeightAt(animal.position.x, animal.position.z);
    animal.position.y = terrainHeight + 1.0;
    
    // Keep within terrain bounds
    const halfSize = this.terrain.width / 2;
    animal.position.x = Math.max(-halfSize, Math.min(halfSize, animal.position.x));
    animal.position.z = Math.max(-halfSize, Math.min(halfSize, animal.position.z));
  }
  
  removeDeadAnimals() {
    const currentTime = Date.now();
    
    for (let i = this.animals.length - 1; i >= 0; i--) {
      const animal = this.animals[i];
      
      if (!animal.isAlive()) {
        // Set death time if not already set
        if (!animal.deathTime) {
          animal.deathTime = currentTime;
          console.log(`🦌 AnimalSystem: ${animal.type} died, will be removed in 30 seconds`);
          
          // Change appearance to indicate it's dead (make it grayer)
          const mesh = animal.getMesh();
          if (mesh && mesh.material) {
            mesh.material.color.multiplyScalar(0.7); // Make it darker
          }
        }
        
        // Remove after 30 seconds (30000ms) to give tiger time to eat
        const timeSinceDeath = currentTime - animal.deathTime;
        if (timeSinceDeath > 30000) {
          // Remove from scene
          this.scene.remove(animal.getMesh());
          
          // Remove from spatial grid
          this.removeFromSpatialGrid(animal);
          
          // Dispose resources
          animal.dispose();
          
          // Remove from array
          this.animals.splice(i, 1);
          
          console.log(`🦌 AnimalSystem: Removed dead ${animal.type} after 30 seconds (remaining: ${this.animals.length})`);
        }
      }
    }
  }
  
  updateSpatialGrid() {
    // Clear and rebuild spatial grid
    this.spatialGrid.clear();
    
    for (const animal of this.animals) {
      this.addToSpatialGrid(animal);
    }
  }
  
  // Public API
  getAnimals() {
    return this.animals;
  }
  
  getAnimalsNear(position, radius) {
    const nearby = [];
    
    for (const animal of this.animals) {
      const distance = animal.distanceTo(position);
      if (distance <= radius) {
        nearby.push(animal);
      }
    }
    
    return nearby;
  }
  
  getAnimalCount() {
    return this.animals.length;
  }
  
  getAnimalsByType(type) {
    return this.animals.filter(animal => animal.type === type);
  }
  
  killAnimal(animal) {
    if (animal.isAlive()) {
      animal.takeDamage(animal.health);
      return true;
    }
    return false;
  }

  // Hunting mechanics
  getHuntableAnimals(tiger) {
    const huntRange = tiger.getAttackRange();
    const nearbyAnimals = this.getAnimalsNear(tiger.position, huntRange);
    
    console.log(`🎯 AnimalSystem: Tiger attack range: ${huntRange}, nearby animals: ${nearbyAnimals.length}`);
    
    // Debug: show all animals and their distances
    console.log(`🎯 AnimalSystem: All animals in system:`);
    this.animals.forEach((animal, index) => {
      const distance = tiger.distanceTo(animal.position);
      console.log(`  ${index + 1}. ${animal.type} at distance ${distance.toFixed(1)} (alive: ${animal.isAlive()})`);
    });
    
    const huntableAnimals = nearbyAnimals.filter(animal => {
      const isAlive = animal.isAlive();
      const canAttack = tiger.canAttack(animal);
      const distance = tiger.distanceTo(animal.position);
      console.log(`🎯 AnimalSystem: ${animal.type} at distance ${distance.toFixed(1)} - alive: ${isAlive}, can attack: ${canAttack}`);
      return isAlive && canAttack;
    });
    
    return huntableAnimals;
  }

  attemptHunt(tiger) {
    const huntableAnimals = this.getHuntableAnimals(tiger);
    
    console.log(`🎯 AnimalSystem: Found ${huntableAnimals.length} huntable animals`);
    
    if (huntableAnimals.length === 0) return false;
    
    // Choose closest animal
    let closestAnimal = huntableAnimals[0];
    let closestDistance = tiger.distanceTo(closestAnimal.position);
    
    for (const animal of huntableAnimals) {
      const distance = tiger.distanceTo(animal.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAnimal = animal;
      }
    }
    
    console.log(`🎯 AnimalSystem: Attempting to hunt closest ${closestAnimal.type} at distance ${closestDistance.toFixed(1)}`);
    
    // Attempt to hunt the closest animal
    return tiger.hunt(closestAnimal);
  }

  attemptEat(tiger) {
    const eatRange = 5.0; // Same range as attack
    const nearbyAnimals = this.getAnimalsNear(tiger.position, eatRange);
    
    console.log(`🍖 AnimalSystem: Tiger eat range: ${eatRange}, nearby animals: ${nearbyAnimals.length}`);
    
    // Find dead animals that can be eaten
    const deadAnimals = nearbyAnimals.filter(animal => {
      const isDead = !animal.isAlive();
      const distance = tiger.distanceTo(animal.position);
      console.log(`🍖 AnimalSystem: ${animal.type} at distance ${distance.toFixed(1)} - dead: ${isDead}`);
      return isDead;
    });
    
    console.log(`🍖 AnimalSystem: Found ${deadAnimals.length} dead animals to eat`);
    
    if (deadAnimals.length === 0) return false;
    
    // Choose closest dead animal
    let closestAnimal = deadAnimals[0];
    let closestDistance = tiger.distanceTo(closestAnimal.position);
    
    for (const animal of deadAnimals) {
      const distance = tiger.distanceTo(animal.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAnimal = animal;
      }
    }
    
    console.log(`🍖 AnimalSystem: Attempting to eat closest ${closestAnimal.type} at distance ${closestDistance.toFixed(1)}`);
    
    // Eat the animal (gain 20 hunger)
    tiger.feed(20);
    
    // Remove the eaten animal from the system
    this.removeAnimal(closestAnimal);
    
    // Trigger auto-save callback if set
    if (this.onAnimalEaten) {
      this.onAnimalEaten(closestAnimal);
    }
    
    return true;
  }

  removeAnimal(animal) {
    // Remove from scene
    this.scene.remove(animal.getMesh());
    
    // Remove from spatial grid
    this.removeFromSpatialGrid(animal);
    
    // Remove from array
    const index = this.animals.indexOf(animal);
    if (index !== -1) {
      this.animals.splice(index, 1);
    }
    
    // Dispose resources
    animal.dispose();
    
    console.log(`🍖 AnimalSystem: Removed eaten ${animal.type} (remaining: ${this.animals.length})`);
  }
  
  // Statistics
  getStatistics() {
    const stats = {
      total: this.animals.length,
      alive: this.animals.filter(a => a.isAlive()).length,
      byType: {},
      byState: {}
    };
    
    for (const animal of this.animals) {
      // Count by type
      stats.byType[animal.type] = (stats.byType[animal.type] || 0) + 1;
      
      // Count by AI state
      stats.byState[animal.aiState] = (stats.byState[animal.aiState] || 0) + 1;
    }
    
    return stats;
  }
  
  handleTigerInteraction(wildTiger, playerTiger, distance) {
    const interactionType = wildTiger.getInteractionType(playerTiger);
    
    if (!interactionType || interactionType === 'neutral') return;
    
    console.log(`🐅 Tiger interaction: ${wildTiger.gender} ${wildTiger.type} ${interactionType} with ${playerTiger.gender} player tiger`);
    
    if (interactionType === 'mate') {
      // Mating interaction
      if (distance <= 3.0) { // Close enough to mate
        const matingResult = wildTiger.attemptMating(playerTiger);
        
        if (matingResult.success) {
          // Apply bonuses to player tiger
          playerTiger.heal(matingResult.bonus.health);
          playerTiger.restoreStamina(matingResult.bonus.stamina);
          playerTiger.gainExperience(matingResult.bonus.experience);
          
          console.log(`💕 ${matingResult.message}`);
          
          // Wild tiger becomes friendly and follows for a while
          wildTiger.setAIState('friendly');
          wildTiger.setTarget(playerTiger);
        }
      } else {
        // Approach for mating
        wildTiger.setAIState('approaching');
        wildTiger.setTarget(playerTiger);
      }
      
    } else if (interactionType === 'fight') {
      // Territorial fighting
      if (distance <= 4.0) { // Close enough to fight
        const fightResult = wildTiger.initiateFight(playerTiger);
        
        console.log(`⚔️ Territorial fight! Player power: ${fightResult.playerPower}, Wild tiger power: ${fightResult.wildTigerPower}`);
        
        if (fightResult.playerWins) {
          // Player wins - wild tiger retreats or dies
          if (fightResult.powerDifference > 50) {
            // Decisive victory - wild tiger dies
            wildTiger.health = 0;
            console.log(`⚔️ Player tiger defeated ${wildTiger.gender} tiger decisively!`);
            
            // Player gains experience and territory bonus
            playerTiger.gainExperience(100);
          } else {
            // Close fight - wild tiger retreats
            wildTiger.setAIState('retreating');
            wildTiger.setTarget(null);
            wildTiger.health = Math.max(1, wildTiger.health - 30);
            console.log(`⚔️ Player tiger won! ${wildTiger.gender} tiger retreats.`);
            
            // Player gains some experience
            playerTiger.gainExperience(50);
          }
        } else {
          // Player loses - takes damage
          const damage = Math.min(50, fightResult.powerDifference);
          playerTiger.takeDamage(damage, wildTiger);
          console.log(`⚔️ Player tiger lost fight! Taking ${damage} damage.`);
          
          // Wild tiger becomes dominant
          wildTiger.setAIState('dominant');
        }
      } else {
        // Approach for fighting
        wildTiger.setAIState('approaching');
        wildTiger.setTarget(playerTiger);
      }
    }
  }
  
  // Cleanup
  dispose() {
    // Remove all animals from scene
    for (const animal of this.animals) {
      this.scene.remove(animal.getMesh());
      animal.dispose();
    }
    
    // Clear arrays and maps
    this.animals = [];
    this.spatialGrid.clear();
    this.materialCache.clear();
    
    console.log('🦌 AnimalSystem: Disposed');
  }
}
import * as THREE from 'three';
import { AmbushDetector } from './AmbushDetector.js';
import { CrocodileAmbush } from '../entities/CrocodileAmbush.js';
import { LeopardAmbush } from '../entities/LeopardAmbush.js';

/**
 * AmbushSystem - Main orchestrator for predator ambush mechanics
 * Manages crocodile water ambushes and leopard tree ambushes
 */
export class AmbushSystem {
  constructor(scene, terrain, waterSystem, vegetationSystem, animalSystem) {
    this.scene = scene;
    this.terrain = terrain;
    this.waterSystem = waterSystem;
    this.vegetationSystem = vegetationSystem;
    this.animalSystem = animalSystem;
    
    // Core systems
    this.ambushDetector = new AmbushDetector();
    
    // Active ambushers
    this.crocodileAmbushers = [];
    this.leopardAmbushers = [];
    this.maxCrocodiles = 6;
    this.maxLeopards = 2;
    
    // Spawn control
    this.lastSpawnCheck = 0;
    this.spawnCheckInterval = 10.0; // Check every 10 seconds
    this.ambushCooldown = 30.0; // 30 seconds between successful ambushes
    this.lastAmbushTime = 0;
    
    // Performance optimization
    this.updateTimer = 0;
    this.updateInterval = 1.0 / 30.0; // 30 FPS updates for ambush system
    
    // Debug mode
    this.debugMode = false;
    this.crocodileDebugMode = false;
    
    console.log('🎯 AmbushSystem: Initialized with crocodile and leopard ambushers');
  }
  
  /**
   * Initialize ambush system - spawn initial ambushers
   */
  initialize() {
    console.log('🎯 AmbushSystem: Spawning initial ambushers...');
    
    // Spawn initial crocodiles near water bodies
    this.spawnCrocodileAmbushers();
    
    // Spawn initial leopards in trees
    this.spawnLeopardAmbushers();
    
    console.log(`🎯 AmbushSystem: Spawned ${this.crocodileAmbushers.length} crocodiles and ${this.leopardAmbushers.length} leopards`);
  }
  
  /**
   * Spawn crocodile ambushers near water bodies
   */
  spawnCrocodileAmbushers() {
    if (!this.waterSystem) {
      console.log('🐊 AmbushSystem: No water system available for crocodile spawning');
      return;
    }
    
    const waterBodies = this.waterSystem.getWaterBodies();
    console.log(`🐊 AmbushSystem: Found ${waterBodies.length} total water bodies`);
    
    const suitableWaterBodies = waterBodies.filter(body => {
      // Only lakes and ponds with centers and sufficient size
      if ((body.type === 'lake' || body.type === 'pond') && body.center && body.radius >= 15) {
        return true;
      }
      return false;
    });
    console.log(`🐊 AmbushSystem: Found ${suitableWaterBodies.length} suitable water bodies for crocodiles`);
    
    // Debug: log details of water bodies
    waterBodies.forEach((body, i) => {
      if (body.center) {
        console.log(`🐊 Water body ${i+1}: ${body.type} at (${body.center.x.toFixed(1)}, ${body.center.z.toFixed(1)}) radius: ${body.radius.toFixed(1)}`);
      } else {
        console.log(`🐊 Water body ${i+1}: ${body.type} - NO CENTER DEFINED - radius: ${body.radius?.toFixed(1) || 'undefined'}`);
      }
    });
    
    for (const waterBody of suitableWaterBodies) {
      if (this.crocodileAmbushers.length >= this.maxCrocodiles) break;
      
      // 100% chance to spawn crocodile for testing (was 60%)
      if (Math.random() < 1.0) {
        const crocodile = this.createCrocodileAmbusher(waterBody);
        if (crocodile) {
          this.crocodileAmbushers.push(crocodile);
          this.scene.add(crocodile.getMesh());
          
          // Apply debug mode if enabled
          if (this.crocodileDebugMode) {
            crocodile.setDebugMode(true, this.scene);
          }
          
          console.log(`🐊 AmbushSystem: Successfully added crocodile to scene at water body ${waterBody.type}`);
        } else {
          console.log(`🐊 AmbushSystem: Failed to create crocodile at water body ${waterBody.type}`);
        }
      }
    }
  }
  
  /**
   * Spawn leopard ambushers in suitable trees
   */
  spawnLeopardAmbushers() {
    if (!this.vegetationSystem) {
      console.log('🐆 AmbushSystem: No vegetation system available for leopard spawning');
      return;
    }
    
    const trees = this.vegetationSystem.trees;
    console.log(`🐆 AmbushSystem: Found ${trees.length} total trees`);
    
    const suitableTreeCount = Math.min(trees.length, this.maxLeopards * 3); // Check up to 3x max leopards
    console.log(`🐆 AmbushSystem: Checking ${suitableTreeCount} trees for leopard suitability`);
    
    for (let i = 0; i < suitableTreeCount && this.leopardAmbushers.length < this.maxLeopards; i++) {
      const tree = trees[Math.floor(Math.random() * trees.length)];
      
      // Check if tree is suitable for leopard ambush
      const isSuitable = this.isTreeSuitableForAmbush(tree);
      console.log(`🐆 AmbushSystem: Tree at (${tree.position.x.toFixed(1)}, ${tree.position.z.toFixed(1)}) suitable: ${isSuitable}`);
      
      if (isSuitable) {
        // 100% chance to spawn leopard for testing (was 40%)
        if (Math.random() < 1.0) {
          const leopard = this.createLeopardAmbusher(tree);
          if (leopard) {
            this.leopardAmbushers.push(leopard);
            this.scene.add(leopard.getMesh());
            console.log(`🐆 AmbushSystem: Successfully added leopard to scene in suitable tree`);
          } else {
            console.log(`🐆 AmbushSystem: Failed to create leopard in tree`);
          }
        }
      }
    }
  }
  
  /**
   * Create a crocodile ambusher for the given water body
   */
  createCrocodileAmbusher(waterBody) {
    try {
      // Position crocodile at the edge of water body for ambush
      const angle = Math.random() * Math.PI * 2;
      const distance = waterBody.radius * (0.90 + Math.random() * 0.05); // 90-95% from center (at edge)
      
      const x = waterBody.center.x + Math.cos(angle) * distance;
      const z = waterBody.center.z + Math.sin(angle) * distance;
      
      // Get proper water body height instead of terrain height
      let waterHeight;
      if (waterBody.mesh && waterBody.mesh.position) {
        // Use actual water body mesh height
        waterHeight = waterBody.mesh.position.y;
      } else {
        // Fallback to water system's base water level
        waterHeight = this.waterSystem.waterLevel - 1; // Default water surface
      }
      
      // Position crocodile at water surface with only eyes visible (0.5 units below surface)
      const y = waterHeight - 0.5;
      
      const crocodile = new CrocodileAmbush(x, y, z, waterBody);
      crocodile.setTerrain(this.terrain);
      crocodile.setWaterSystem(this.waterSystem);
      
      console.log(`🐊 Spawned crocodile at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) in ${waterBody.type} (water height: ${waterHeight.toFixed(1)})`);
      return crocodile;
    } catch (error) {
      console.error('🐊 Error creating crocodile ambusher:', error);
      return null;
    }
  }
  
  /**
   * Create a leopard ambusher for the given tree
   */
  createLeopardAmbusher(tree) {
    try {
      // Position leopard in the tree canopy
      const x = tree.position.x;
      const z = tree.position.z;
      const y = tree.position.y + 35 + Math.random() * 10; // High in the canopy
      
      const leopard = new LeopardAmbush(x, y, z, tree);
      leopard.setTerrain(this.terrain);
      leopard.setVegetationSystem(this.vegetationSystem);
      
      console.log(`🐆 Spawned leopard at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) in tree`);
      return leopard;
    } catch (error) {
      console.error('🐆 Error creating leopard ambusher:', error);
      return null;
    }
  }
  
  /**
   * Check if tree is suitable for leopard ambush
   */
  isTreeSuitableForAmbush(tree) {
    if (!tree || !tree.position) {
      console.log(`🐆 Tree unsuitable: no tree or position`);
      return false;
    }
    
    // Check tree size (must be large enough)
    const scale = tree.scale ? tree.scale.x : 1.0;
    if (scale < 0.8) { // Reduced from 2.0 to 0.8 since all trees seem to be scale 1.0
      console.log(`🐆 Tree at (${tree.position.x.toFixed(1)}, ${tree.position.z.toFixed(1)}) unsuitable: scale ${scale} < 0.8`);
      return false; // Minimum scale for ambush
    }
    
    // Check if tree is not too close to water (leopards prefer forest areas)
    if (this.waterSystem) {
      const waterBodies = this.waterSystem.getWaterBodies();
      for (const waterBody of waterBodies) {
        // Only check distance for lakes and ponds (skip rivers which don't have centers)
        if (waterBody.center && (waterBody.type === 'lake' || waterBody.type === 'pond')) {
          const distance = Math.sqrt(
            Math.pow(tree.position.x - waterBody.center.x, 2) + 
            Math.pow(tree.position.z - waterBody.center.z, 2)
          );
          const minDistance = waterBody.radius + 10; // Reduced from 20 to 10 for more spawning
          if (distance < minDistance) {
            console.log(`🐆 Tree at (${tree.position.x.toFixed(1)}, ${tree.position.z.toFixed(1)}) unsuitable: ${distance.toFixed(1)} < ${minDistance.toFixed(1)} from ${waterBody.type}`);
            return false; // Too close to water
          }
        }
      }
    }
    
    // Check terrain slope (leopards prefer stable terrain)
    const slope = this.terrain.getSlope(tree.position.x, tree.position.z);
    if (slope > 0.5) { // Relaxed from 0.3 to 0.5 for more spawning
      console.log(`🐆 Tree at (${tree.position.x.toFixed(1)}, ${tree.position.z.toFixed(1)}) unsuitable: slope ${slope.toFixed(2)} > 0.5`);
      return false; // Too steep
    }
    
    console.log(`🐆 Tree at (${tree.position.x.toFixed(1)}, ${tree.position.z.toFixed(1)}) SUITABLE: scale ${scale.toFixed(1)}, slope ${slope.toFixed(2)}`);
    return true;
  }
  
  /**
   * Update ambush system
   */
  update(deltaTime, tiger) {
    if (!tiger || !tiger.isAlive()) return;
    
    // Throttle updates for performance
    this.updateTimer += deltaTime;
    if (this.updateTimer < this.updateInterval) return;
    this.updateTimer = 0;
    
    // Update tiger awareness based on nearby threats
    const awareness = this.ambushDetector.updateAwareness(tiger, [
      ...this.crocodileAmbushers,
      ...this.leopardAmbushers
    ]);
    
    // Update all ambushers
    this.updateAmbushers(deltaTime, tiger);
    
    // Check for new ambush spawns
    this.checkAmbushSpawns(deltaTime, tiger);
    
    // Clean up defeated ambushers
    this.cleanupDefeatedAmbushers();
    
    // Debug information
    if (this.debugMode) {
      this.logDebugInfo(tiger, awareness);
    }
  }
  
  /**
   * Update all active ambushers
   */
  updateAmbushers(deltaTime, tiger) {
    // Update crocodiles
    for (const crocodile of this.crocodileAmbushers) {
      if (crocodile.isAlive()) {
        crocodile.update(deltaTime, tiger);
        
        // Check for successful ambush
        if (crocodile.isAttacking && crocodile.canHitTarget(tiger)) {
          this.handleSuccessfulAmbush(crocodile, tiger);
        }
      }
    }
    
    // Update leopards
    for (const leopard of this.leopardAmbushers) {
      if (leopard.isAlive()) {
        leopard.update(deltaTime, tiger);
        
        // Check for successful ambush
        if (leopard.isAttacking && leopard.canHitTarget(tiger)) {
          this.handleSuccessfulAmbush(leopard, tiger);
        }
      }
    }
  }
  
  /**
   * Handle successful ambush attack
   */
  handleSuccessfulAmbush(ambusher, tiger) {
    const damage = ambusher.getAttackDamage();
    const ambushType = ambusher.constructor.name;
    
    console.log(`💥 Successful ${ambushType} ambush! Dealing ${damage} damage to tiger (tiger health before: ${tiger.health})`);
    
    // Apply damage to tiger
    if (tiger.takeDamage) {
      tiger.takeDamage(damage, ambusher);
      console.log(`💥 Tiger health after ambush: ${tiger.health}/${tiger.maxHealth}`);
    } else {
      console.error(`💥 ERROR: Tiger has no takeDamage method!`);
    }
    
    // Apply screen effects (if available)
    this.triggerAmbushEffects(ambusher);
    
    // Set cooldown
    this.lastAmbushTime = Date.now();
    
    // Ambusher goes into cooldown state
    ambusher.setState('cooldown');
  }
  
  /**
   * Trigger visual/audio effects for ambush
   */
  triggerAmbushEffects(ambusher) {
    // Screen shake effect (could be implemented in GameController)
    if (window.gameController && window.gameController.camera) {
      // Trigger camera shake
      console.log('📹 Triggering camera shake for ambush');
    }
    
    // Particle effects (to be implemented)
    console.log('✨ Triggering particle effects for ambush');
    
    // Audio effects (to be implemented)
    console.log('🔊 Triggering audio effects for ambush');
  }
  
  /**
   * Check if new ambushers should spawn
   */
  checkAmbushSpawns(deltaTime, tiger) {
    this.lastSpawnCheck += deltaTime;
    if (this.lastSpawnCheck < this.spawnCheckInterval) return;
    this.lastSpawnCheck = 0;
    
    // Check if we're in ambush cooldown
    const timeSinceLastAmbush = (Date.now() - this.lastAmbushTime) / 1000;
    if (timeSinceLastAmbush < this.ambushCooldown) return;
    
    // Spawn new ambushers based on tiger evolution stage
    const spawnRates = this.getSpawnRatesForTiger(tiger);
    
    // Spawn crocodiles if below max
    if (this.crocodileAmbushers.length < this.maxCrocodiles && Math.random() < spawnRates.crocodile) {
      this.spawnCrocodileAmbushers();
    }
    
    // Spawn leopards if below max
    if (this.leopardAmbushers.length < this.maxLeopards && Math.random() < spawnRates.leopard) {
      this.spawnLeopardAmbushers();
    }
  }
  
  /**
   * Get spawn rates based on tiger evolution stage
   */
  getSpawnRatesForTiger(tiger) {
    const stage = tiger.evolutionStage;
    
    switch (stage) {
      case 'Young':
        return { crocodile: 0.15, leopard: 0.10 };
      case 'Adult':
        return { crocodile: 0.25, leopard: 0.20 };
      case 'Alpha':
        return { crocodile: 0.30, leopard: 0.25 };
      default:
        return { crocodile: 0.15, leopard: 0.10 };
    }
  }
  
  /**
   * Clean up defeated or inactive ambushers
   */
  cleanupDefeatedAmbushers() {
    // Clean up crocodiles
    for (let i = this.crocodileAmbushers.length - 1; i >= 0; i--) {
      const crocodile = this.crocodileAmbushers[i];
      if (!crocodile.isAlive() || crocodile.shouldDespawn()) {
        this.scene.remove(crocodile.getMesh());
        crocodile.dispose();
        this.crocodileAmbushers.splice(i, 1);
        console.log('🐊 Removed inactive crocodile ambusher');
      }
    }
    
    // Clean up leopards
    for (let i = this.leopardAmbushers.length - 1; i >= 0; i--) {
      const leopard = this.leopardAmbushers[i];
      if (!leopard.isAlive() || leopard.shouldDespawn()) {
        this.scene.remove(leopard.getMesh());
        leopard.dispose();
        this.leopardAmbushers.splice(i, 1);
        console.log('🐆 Removed inactive leopard ambusher');
      }
    }
  }
  
  /**
   * Get current tiger awareness level
   */
  getTigerAwareness(tiger) {
    return this.ambushDetector.calculateAwareness(tiger, [
      ...this.crocodileAmbushers,
      ...this.leopardAmbushers
    ]);
  }
  
  /**
   * Get all active ambushers for other systems
   */
  getActiveAmbushers() {
    return [
      ...this.crocodileAmbushers.filter(c => c.isAlive()),
      ...this.leopardAmbushers.filter(l => l.isAlive())
    ];
  }
  
  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`🎯 AmbushSystem debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Enable/disable crocodile debug visualization
   */
  setCrocodileDebugMode(enabled) {
    this.crocodileDebugMode = enabled;
    console.log(`🐊 Crocodile debug visualization: ${enabled ? 'ON' : 'OFF'}`);
    
    // Update all existing crocodiles
    this.crocodileAmbushers.forEach(crocodile => {
      crocodile.setDebugMode(enabled, this.scene);
    });
  }
  
  /**
   * Log debug information
   */
  logDebugInfo(tiger, awareness) {
    console.log(`🎯 AmbushSystem Debug:`, {
      crocodiles: this.crocodileAmbushers.length,
      leopards: this.leopardAmbushers.length,
      awareness: awareness.toFixed(2),
      tigerPosition: {
        x: tiger.position.x.toFixed(1),
        y: tiger.position.y.toFixed(1),
        z: tiger.position.z.toFixed(1)
      },
      tigerStage: tiger.evolutionStage
    });
  }
  
  /**
   * Get statistics for debugging/UI
   */
  getStatistics() {
    return {
      activeCrocodiles: this.crocodileAmbushers.filter(c => c.isAlive()).length,
      activeLeopards: this.leopardAmbushers.filter(l => l.isAlive()).length,
      totalAmbushers: this.crocodileAmbushers.length + this.leopardAmbushers.length,
      lastAmbushTime: this.lastAmbushTime,
      timeSinceLastAmbush: (Date.now() - this.lastAmbushTime) / 1000
    };
  }
  
  /**
   * Dispose of ambush system
   */
  dispose() {
    // Clean up all ambushers
    [...this.crocodileAmbushers, ...this.leopardAmbushers].forEach(ambusher => {
      this.scene.remove(ambusher.getMesh());
      ambusher.dispose();
    });
    
    this.crocodileAmbushers = [];
    this.leopardAmbushers = [];
    
    if (this.ambushDetector) {
      this.ambushDetector.dispose();
    }
    
    console.log('🎯 AmbushSystem: Disposed');
  }
}
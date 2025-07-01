import * as THREE from 'three';

export class Animal {
  constructor(type, customStats = {}) {
    // Basic properties
    this.type = type;
    
    // Default stats (can be overridden by customStats)
    const defaultStats = {
      health: 50,
      speed: 10,
      power: 20,
      stamina: 100,
      behaviorType: 'neutral' // 'prey', 'predator', 'neutral'
    };
    
    // Merge custom stats with defaults
    const stats = { ...defaultStats, ...customStats };
    
    // Health system
    this.health = stats.health;
    this.maxHealth = stats.health;
    
    // Basic attributes
    this.speed = stats.speed;
    this.power = stats.power;
    
    // Stamina system
    this.stamina = stats.stamina;
    this.maxStamina = stats.stamina;
    
    // Behavior type
    this.behaviorType = stats.behaviorType;
    
    // Position and movement
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // State management
    this.state = 'idle'; // idle, walking, running, fleeing, attacking, etc.
    
    // AI behavior properties
    this.aiState = 'idle'; // idle, wandering, fleeing, hunting, attacking
    this.target = null; // Current target (threat or prey)
    this.detectionRadius = 25; // How far the animal can detect threats/prey
    this.fleeDistance = 40; // Distance at which prey animals flee
    this.attackRange = 3; // Distance at which predators can attack
    
    // AI timing
    this.lastStateChange = 0;
    this.stateChangeCooldown = 1000; // Minimum time between state changes (ms)
  }

  // Health management
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  isAlive() {
    return this.health > 0;
  }

  // Stamina management
  consumeStamina(amount) {
    this.stamina = Math.max(0, this.stamina - amount);
  }

  restoreStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }

  // Position and movement
  setPosition(x, y, z) {
    this.position.set(x, y, z);
  }

  distanceTo(target) {
    // Handle both entity objects and position objects
    const targetPos = target.position ? target.position : new THREE.Vector3(target.x, target.y, target.z);
    return this.position.distanceTo(targetPos);
  }

  setState(newState) {
    this.state = newState;
  }

  // AI behavior methods
  setAIState(newState) {
    this.aiState = newState;
    this.lastStateChange = Date.now();
  }

  setTarget(target) {
    this.target = target;
  }

  clearTarget() {
    this.target = null;
  }

  canDetect(entity) {
    const distance = this.distanceTo(entity);
    return distance <= this.detectionRadius;
  }

  shouldFlee(threat) {
    const distance = this.distanceTo(threat);
    return distance <= this.fleeDistance;
  }

  canAttack(target) {
    const distance = this.distanceTo(target);
    return distance <= this.attackRange;
  }

  // Experience and rewards (for when animal is hunted)
  getExperienceReward() {
    switch (this.behaviorType) {
      case 'prey':
        return 25; // Standard prey XP
      case 'predator':
        return 50; // Higher XP for defeating predators
      case 'neutral':
        return 15; // Lower XP for neutral animals
      default:
        return 10;
    }
  }

  getHealthRestoration() {
    // Amount of health restored when this animal is consumed
    switch (this.behaviorType) {
      case 'prey':
        return 30; // Medium health restoration
      case 'predator':
        return 50; // High health restoration
      case 'neutral':
        return 15; // Low health restoration
      default:
        return 10;
    }
  }

  // Update method for game loop
  update(deltaTime) {
    if (!this.isAlive()) {
      return;
    }

    // Clamp delta time to prevent large jumps
    deltaTime = Math.max(0, Math.min(deltaTime, 0.1));

    // Natural stamina regeneration
    if (this.stamina < this.maxStamina) {
      this.restoreStamina(deltaTime * 20); // 20 stamina per second
    }

    // TODO: AI behavior updates will be implemented by specific animal types
    this.updateAI(deltaTime);
  }

  // Base AI update - to be overridden by specific animal types
  updateAI(deltaTime) {
    // Base implementation does nothing
    // Specific animal types will override this method
  }

  // Utility methods
  getDirectionTo(target) {
    const direction = new THREE.Vector3(target.x, target.y, target.z)
      .sub(this.position)
      .normalize();
    return direction;
  }

  getDirectionFrom(threat) {
    const direction = this.position.clone()
      .sub(new THREE.Vector3(threat.x, threat.y, threat.z))
      .normalize();
    return direction;
  }
}
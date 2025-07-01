import * as THREE from 'three';

export class Tiger {
  constructor() {
    // Starting stats (realistic tiger attributes)
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 12; // units/second
    this.power = 80; // attack damage
    this.stamina = 300;
    this.maxStamina = 300;
    this.stealth = 60; // affects detection radius
    this.hunger = 100;
    this.maxHunger = 100;
    
    // Evolution system
    this.level = 1;
    this.experience = 0;
    this.evolutionStage = 'Young';
    
    // Position and movement
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // State management
    this.state = 'idle'; // idle, walking, running, crouching, attacking, etc.
    
    // Evolution thresholds
    this.experienceToNextLevel = 100;
    this.adultLevel = 11;
    this.alphaLevel = 26;
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

  // Hunger management
  consumeHunger(amount) {
    this.hunger = Math.max(0, this.hunger - amount);
  }

  feed(amount) {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }

  // Experience and evolution
  gainExperience(amount) {
    this.experience += amount;
    
    while (this.experience >= this.experienceToNextLevel) {
      this.experience -= this.experienceToNextLevel;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.evolve();
  }

  evolve() {
    const previousStage = this.evolutionStage;
    
    if (this.level >= this.alphaLevel && this.evolutionStage !== 'Alpha') {
      this.evolutionStage = 'Alpha';
      this.evolveToAlpha();
    } else if (this.level >= this.adultLevel && this.evolutionStage === 'Young') {
      this.evolutionStage = 'Adult';
      this.evolveToAdult();
    }
  }

  evolveToAdult() {
    // Enhanced stats: +25 HP, +3 speed, +15 power
    this.maxHealth += 25;
    this.health = this.maxHealth; // Full heal on evolution
    this.speed += 3;
    this.power += 15;
  }

  evolveToAlpha() {
    // Alpha Tiger: Jet black fur with glowing blue stripes
    // Double damage, faster energy regen, night vision
    this.power *= 2; // Double damage from current power
    this.stamina *= 1.5; // Enhanced stamina
    this.maxStamina *= 1.5;
    this.stealth += 20; // Enhanced stealth
  }

  // Position and movement
  setPosition(x, y, z) {
    this.position.set(x, y, z);
  }

  distanceTo(target) {
    return this.position.distanceTo(new THREE.Vector3(target.x, target.y, target.z));
  }

  setState(newState) {
    this.state = newState;
  }

  // Special abilities
  hasLaserBreath() {
    return this.evolutionStage === 'Alpha';
  }

  getDetectionRadius() {
    const baseRadius = 20; // Base detection radius
    let radius = baseRadius;
    
    // Stealth modifier
    if (this.state === 'crouching') {
      radius *= 0.5; // 50% reduction when crouching
    }
    
    return radius;
  }

  // Update method for game loop
  update(deltaTime) {
    // Natural hunger decrease over time
    this.consumeHunger(deltaTime * 2); // 2 hunger per second
    
    // Natural stamina regeneration when not exhausted
    if (this.stamina < this.maxStamina && this.state !== 'running') {
      this.restoreStamina(deltaTime * 10); // 10 stamina per second
    }
    
    // Health regeneration when well-fed
    if (this.hunger > 50 && this.health < this.maxHealth) {
      this.heal(deltaTime * 1); // 1 HP per 5 seconds (slow natural healing)
    }
  }
}
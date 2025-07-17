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
    this.adultLevel = 10;
    this.alphaLevel = 30;
  }

  // Health management
  takeDamage(amount, attacker = null) {
    console.log(`🐅 Tiger taking ${amount} damage from ${attacker ? attacker.type : 'unknown'} (health: ${this.health} -> ${Math.max(0, this.health - amount)})`);
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
    // Enhanced stats: +10 health, +10 hunger, +10 stamina
    this.maxHealth += 10;
    this.health = this.maxHealth; // Full heal on evolution
    this.maxHunger += 10;
    this.hunger = this.maxHunger; // Full hunger on evolution
    this.maxStamina += 10;
    this.stamina = this.maxStamina - 100; // +10 stamina but lose 100 as penalty
    
    // Ensure stamina doesn't go below 0
    this.stamina = Math.max(0, this.stamina);
    
    console.log(`🐅 Tiger evolved to Adult! Stats: Health +10, Hunger +10, Stamina +10 (but -100 penalty)`);
  }

  evolveToAlpha() {
    // Alpha Tiger: Enhanced stats: +10 health, +10 hunger, +10 stamina
    this.maxHealth += 10;
    this.health = this.maxHealth; // Full heal on evolution
    this.maxHunger += 10;
    this.hunger = this.maxHunger; // Full hunger on evolution
    this.maxStamina += 10;
    this.stamina = this.maxStamina - 100; // +10 stamina but lose 100 as penalty
    
    // Ensure stamina doesn't go below 0
    this.stamina = Math.max(0, this.stamina);
    
    // Alpha special abilities
    this.power *= 2; // Double damage from current power
    this.stealth += 20; // Enhanced stealth
    
    console.log(`🐅 Tiger evolved to Alpha! Stats: Health +10, Hunger +10, Stamina +10 (but -100 penalty), Power doubled!`);
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

  // Hunting mechanics
  canAttack(target) {
    const distance = this.distanceTo(target.position);
    const attackRange = this.getAttackRange();
    return distance <= attackRange;
  }

  getAttackRange() {
    let range = 5.0; // Increased base attack range for easier hunting
    
    // Pouncing extends range when running
    if (this.state === 'running') {
      range *= 2.0; // Double range for pouncing
    }
    
    return range;
  }

  attack(target) {
    if (!this.canAttack(target)) {
      console.log(`🐅 Tiger attack failed - target out of range`);
      return false;
    }
    
    // Calculate damage based on power and tiger state
    let damage = this.power;
    
    console.log(`🐅 Tiger attacking ${target.type} with base damage: ${damage}`);
    
    // Stealth attack bonus
    if (this.state === 'crouching') {
      damage *= 1.5; // 50% damage bonus for stealth attacks
      console.log(`🐅 Stealth bonus applied! New damage: ${damage}`);
    }
    
    // Pouncing attack bonus
    if (this.state === 'running') {
      damage *= 1.3; // 30% damage bonus for pouncing
      console.log(`🐅 Pouncing bonus applied! New damage: ${damage}`);
    }
    
    console.log(`🐅 Final damage: ${damage}, Target health before: ${target.health}`);
    
    // Apply damage to target
    if (target.takeDamage) {
      target.takeDamage(damage, this);
      console.log(`🐅 Target health after: ${target.health}, Target alive: ${target.isAlive()}`);
    } else {
      console.log(`🐅 ERROR: Target has no takeDamage method!`);
    }
    
    // Consume stamina for attack
    this.consumeStamina(30);
    
    // Set attack state
    this.setState('attacking');
    
    return true;
  }

  hunt(animal) {
    if (!animal || !animal.isAlive()) {
      console.log(`🐅 Hunt failed - animal is null or dead (animal: ${animal}, alive: ${animal ? animal.isAlive() : 'N/A'})`);
      return false;
    }
    
    console.log(`🐅 Starting hunt on ${animal.type} (health: ${animal.health})`);
    
    // Check if tiger can attack this animal
    if (!this.canAttack(animal)) {
      console.log(`🐅 Hunt failed - tiger cannot attack ${animal.type} (distance: ${this.distanceTo(animal.position).toFixed(1)}, attack range: ${this.getAttackRange()})`);
      return false;
    }
    
    // Simple collision damage - young stage prey loses 10 health
    const damage = this.evolutionStage === 'Young' ? 10 : this.power;
    
    console.log(`🐅 Tiger (${this.evolutionStage}) dealing ${damage} damage to ${animal.type}`);
    
    // Apply damage to animal
    animal.takeDamage(damage, this);
    
    if (!animal.isAlive()) {
      // Successful hunt - gain experience and restore hunger
      const xpReward = animal.getExperienceReward();
      const hungerReward = animal.getHealthRestoration();
      
      this.gainExperience(xpReward);
      this.feed(hungerReward);
      
      console.log(`🐅 Tiger successfully hunted ${animal.type}! +${xpReward} XP, +${hungerReward} hunger`);
      
      return true;
    } else {
      console.log(`🐅 Attack hit but animal survived (health: ${animal.health})`);
      return true;
    }
  }

  getStealthEffectiveness() {
    let effectiveness = this.stealth;
    
    // State modifiers
    if (this.state === 'crouching') {
      effectiveness *= 1.5; // 50% more effective when crouching
    } else if (this.state === 'running') {
      effectiveness *= 0.7; // 30% less effective when running
    }
    
    return effectiveness;
  }

  // Update method for game loop
  update(deltaTime) {
    // Natural hunger decrease over time
    this.consumeHunger(deltaTime * .25); // 2 hunger per second
    
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
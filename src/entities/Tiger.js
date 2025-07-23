import * as THREE from 'three';

export class Tiger {
  constructor(gender = 'male') {
    // Gender selection
    this.gender = gender; // 'male' or 'female'
    
    // Base stats (before gender modifiers)
    const baseHealth = 100;
    const basePower = 80;
    const baseStamina = 300;
    
    // Apply gender stat differences
    if (this.gender === 'female') {
      // Females: +20% stamina, -10% strength
      this.stamina = Math.floor(baseStamina * 1.2); // +20% stamina
      this.maxStamina = Math.floor(baseStamina * 1.2);
      this.power = Math.floor(basePower * 0.9); // -10% strength
      console.log('🐅♀️ Female tiger created: +20% stamina, -10% strength');
    } else {
      // Males: +15% strength, -10% stamina
      this.power = Math.floor(basePower * 1.15); // +15% strength
      this.stamina = Math.floor(baseStamina * 0.9); // -10% stamina
      this.maxStamina = Math.floor(baseStamina * 0.9);
      console.log('🐅♂️ Male tiger created: +15% strength, -10% stamina');
    }
    
    // Starting stats (after gender modifiers)
    this.health = baseHealth;
    this.maxHealth = baseHealth;
    this.speed = 12; // units/second
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
    
    console.log(`🐅 ${this.gender} tiger stats: Health ${this.health}, Power ${this.power}, Stamina ${this.stamina}/${this.maxStamina}`);
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
    
    // Apply stat bonuses for each level up
    this.maxHealth += 10;
    this.health = Math.min(this.maxHealth, this.health + 10); // Gain 10 health but don't exceed max
    this.maxHunger += 10;
    this.hunger = Math.min(this.maxHunger, this.hunger + 10); // Gain 10 hunger but don't exceed max
    this.power += 10; // Increase damage by 10
    this.maxStamina = Math.max(100, this.maxStamina - 5); // Decrease max stamina by 5 every level but never below 100
    this.stamina = Math.max(0, this.stamina - 5); // Lose 5 current stamina every level-up
    
    // Ensure current stamina doesn't exceed new max
    this.stamina = Math.min(this.stamina, this.maxStamina);
    
    console.log(`🐅 Tiger leveled up to ${this.level}! Stats: +10 health (${this.health}/${this.maxHealth}), +10 hunger (${this.hunger}/${this.maxHunger}), +10 damage (${this.power}), -5 max stamina (${this.maxStamina}), -5 stamina (${this.stamina})`);
    
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
    // Evolution bonuses (separate from level-up bonuses)
    this.maxHealth += 10;
    this.health = this.maxHealth; // Full heal on evolution
    this.maxHunger += 10;
    this.hunger = this.maxHunger; // Full hunger on evolution
    this.maxStamina += 15; // +15 to compensate for the -5 from level-up, net +10
    this.stamina = this.maxStamina - 5; // Full stamina but lose 5 for evolution
    
    // Ensure stamina doesn't go below 0
    this.stamina = Math.max(0, this.stamina);
    
    console.log(`🐅 Tiger evolved to Adult! Evolution bonuses: Health +10, Hunger +10, Max Stamina +15, -5 evolution penalty`);
  }

  evolveToAlpha() {
    // Evolution bonuses (separate from level-up bonuses)
    this.maxHealth += 10;
    this.health = this.maxHealth; // Full heal on evolution
    this.maxHunger += 10;
    this.hunger = this.maxHunger; // Full hunger on evolution
    this.maxStamina += 15; // +15 to compensate for the -5 from level-up, net +10
    this.stamina = this.maxStamina - 5; // Full stamina but lose 5 for evolution
    
    // Ensure stamina doesn't go below 0
    this.stamina = Math.max(0, this.stamina);
    
    // Alpha special abilities
    this.power *= 2; // Double damage from current power
    this.stealth += 20; // Enhanced stealth
    
    console.log(`🐅 Tiger evolved to Alpha! Evolution bonuses: Health +10, Hunger +10, Max Stamina +15, -5 evolution penalty, Power doubled!`);
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

  // Gender utilities
  getGenderDisplay() {
    return this.gender === 'female' ? '♀️ Female' : '♂️ Male';
  }

  getGenderStats() {
    if (this.gender === 'female') {
      return {
        bonuses: ['+20% Stamina'],
        penalties: ['-10% Strength']
      };
    } else {
      return {
        bonuses: ['+15% Strength'],
        penalties: ['-10% Stamina']
      };
    }
  }

  // Special abilities
  hasLaserBreath() {
    return this.evolutionStage === 'Alpha';
  }

  useLaserBreath(animals, tigerModel = null) {
    if (!this.hasLaserBreath()) {
      console.log(`🔴 Laser breath failed - tiger is not Alpha (current: ${this.evolutionStage})`);
      return false;
    }

    console.log(`🔴 Alpha tiger using laser breath!`);
    
    // Find animals in front of the tiger within laser range
    const laserRange = 20.0; // Laser can hit targets up to 20 units away
    const laserAngle = Math.PI / 6; // 30 degree cone
    let hitTargets = [];
    let closestTarget = null;
    let closestDistance = Infinity;

    for (const animal of animals) {
      if (!animal.isAlive()) continue;

      // Calculate distance to animal
      const distance = this.distanceTo(animal.position);
      if (distance > laserRange) continue;

      // Calculate angle between tiger's facing direction and animal
      const tigerForwardX = Math.sin(this.rotation.y);
      const tigerForwardZ = Math.cos(this.rotation.y);
      
      const toAnimalX = animal.position.x - this.position.x;
      const toAnimalZ = animal.position.z - this.position.z;
      const toAnimalLength = Math.sqrt(toAnimalX * toAnimalX + toAnimalZ * toAnimalZ);
      
      if (toAnimalLength === 0) continue;
      
      const toAnimalNormX = toAnimalX / toAnimalLength;
      const toAnimalNormZ = toAnimalZ / toAnimalLength;
      
      // Dot product to get angle
      const dotProduct = tigerForwardX * toAnimalNormX + tigerForwardZ * toAnimalNormZ;
      const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

      // Check if animal is within laser cone
      if (angle <= laserAngle) {
        hitTargets.push(animal);
        
        // Track closest target for visual beam
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTarget = animal;
        }
      }
    }

    // Create visual laser beam 
    if (tigerModel) {
      let targetPos;
      
      if (closestTarget) {
        // Aim at closest target
        targetPos = new THREE.Vector3(
          closestTarget.position.x,
          closestTarget.position.y + 1, // Aim slightly higher
          closestTarget.position.z
        );
      } else {
        // Fire forward if no targets (like Godzilla)
        const tigerForwardX = Math.sin(this.rotation.y);
        const tigerForwardZ = Math.cos(this.rotation.y);
        const beamDistance = 15; // Fire 15 units forward
        
        targetPos = new THREE.Vector3(
          this.position.x + (tigerForwardX * beamDistance),
          this.position.y + 2, // Fire slightly upward
          this.position.z + (tigerForwardZ * beamDistance)
        );
      }
      
      tigerModel.fireLaser(targetPos, 1.5); // 1.5 second beam duration
    }

    // Deal 400 damage to all targets hit by laser
    let successfulHits = 0;
    for (const target of hitTargets) {
      console.log(`🔴 Laser hitting ${target.type} for 400 damage (health: ${target.health})`);
      target.takeDamage(400, this);
      successfulHits++;
      
      if (!target.isAlive()) {
        console.log(`🔴 Laser killed ${target.type}!`);
      }
    }

    if (successfulHits > 0) {
      console.log(`🔴 Laser breath hit ${successfulHits} targets with 400 damage each!`);
      return true;
    } else {
      console.log(`🔴 Laser breath fired but hit no targets`);
      return false;
    }
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
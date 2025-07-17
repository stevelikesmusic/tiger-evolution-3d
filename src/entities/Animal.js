import * as THREE from 'three';

export class Animal {
  constructor(type, stats = {}) {
    this.type = type;
    
    // Default stats based on animal type
    const defaultStats = this.getDefaultStats(type);
    
    // Apply custom stats if provided
    this.health = stats.health || defaultStats.health;
    this.maxHealth = this.health;
    this.speed = stats.speed || defaultStats.speed;
    this.power = stats.power || defaultStats.power;
    this.stamina = stats.stamina || defaultStats.stamina;
    this.maxStamina = this.stamina;
    this.behaviorType = stats.behaviorType || defaultStats.behaviorType;
    
    // Position and movement
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.velocity = new THREE.Vector3();
    
    // Animation and state
    this.state = 'idle';
    this.lastStateChange = Date.now();
    
    // AI properties
    this.aiState = 'idle';
    this.target = null;
    this.detectionRadius = 25;
    this.fleeDistance = 40;
    this.attackRange = 3;
    
    // Timers
    this.stateTimer = 0;
    this.staminaRegenTimer = 0;
    
    // 3D model reference
    this.mesh = null;
    this.mixers = [];
    
    // Initialize 3D model
    this.createModel();
  }
  
  getDefaultStats(type) {
    const animalStats = {
      deer: {
        health: 50,
        speed: 10,
        power: 20, // deer damage 20
        stamina: 100,
        behaviorType: 'prey'
      },
      rabbit: {
        health: 25,
        speed: 15,
        power: 5, // rabbit damage 5
        stamina: 80,
        behaviorType: 'prey'
      },
      boar: {
        health: 80,
        speed: 8,
        power: 30, // boar damage 30
        stamina: 120,
        behaviorType: 'neutral'
      },
      leopard: {
        health: 100,
        speed: 12,
        power: 50, // leopard damage 50
        stamina: 150,
        behaviorType: 'predator'
      }
    };
    
    return animalStats[type] || animalStats.deer;
  }
  
  createModel() {
    // Create basic 3D model based on animal type
    const geometry = this.getGeometry();
    const material = this.getMaterial();
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData.animal = this;
    
    // Add body parts for more realistic appearance
    this.addBodyParts();
  }
  
  getGeometry() {
    switch (this.type) {
      case 'deer':
        return new THREE.BoxGeometry(1.5, 1.2, 3); // Larger body
      case 'rabbit':
        return new THREE.BoxGeometry(0.8, 0.6, 1.2); // Small body
      case 'boar':
        return new THREE.BoxGeometry(1.8, 1.0, 2.5); // Stocky body
      case 'leopard':
        return new THREE.BoxGeometry(1.2, 0.8, 2.8); // Sleek body
      default:
        return new THREE.BoxGeometry(1.5, 1.2, 3);
    }
  }
  
  getMaterial() {
    switch (this.type) {
      case 'deer':
        return new THREE.MeshLambertMaterial({ 
          color: 0x8B4513, // Brown
          transparent: false,
          opacity: 1.0
        }); 
      case 'rabbit':
        // Random rabbit colors: white, black, or brown
        const rabbitColors = [0xFFFFFF, 0x000000, 0x8B4513]; // White, black, brown
        const randomColor = rabbitColors[Math.floor(Math.random() * rabbitColors.length)];
        return new THREE.MeshLambertMaterial({ 
          color: randomColor,
          transparent: false,
          opacity: 1.0
        });
      case 'boar':
        return new THREE.MeshLambertMaterial({ 
          color: 0x808080, // Grey
          transparent: false,
          opacity: 1.0
        });
      case 'leopard':
        return new THREE.MeshLambertMaterial({ 
          color: 0xFFD700, // Golden yellow
          transparent: false,
          opacity: 1.0
        });
      default:
        return new THREE.MeshLambertMaterial({ 
          color: 0x8B4513,
          transparent: false,
          opacity: 1.0
        });
    }
  }
  
  addBodyParts() {
    if (!this.mesh) return;
    
    // Get shared material
    const sharedMaterial = this.getMaterial();
    
    // Add head
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.8);
    const head = new THREE.Mesh(headGeometry, sharedMaterial);
    head.position.set(0, 0.3, 1.5);
    this.mesh.add(head);
    
    // Add ears for specific animals
    if (this.type === 'deer') {
      this.addAntlers(head);
    } else if (this.type === 'rabbit') {
      this.addEars(head);
    } else if (this.type === 'boar') {
      this.addTusks(head);
    }
    
    // Add eyes to all animals
    this.addEyes(head);
    
    // Add spots for deer and leopards
    if (this.type === 'deer') {
      this.addDeerSpots();
    } else if (this.type === 'leopard') {
      this.addLeopardSpots();
    }
    
    // Add legs
    this.addLegs();
    
    // Add tail
    this.addTail();
    
    // Add health bar (initially hidden)
    this.createHealthBar();
  }
  
  addAntlers(head) {
    const antlerGeometry = new THREE.ConeGeometry(0.05, 0.8, 4);
    const antlerMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Darker brown for antlers
    
    const leftAntler = new THREE.Mesh(antlerGeometry, antlerMaterial);
    leftAntler.position.set(-0.2, 0.6, 0);
    head.add(leftAntler);
    
    const rightAntler = new THREE.Mesh(antlerGeometry, antlerMaterial);
    rightAntler.position.set(0.2, 0.6, 0);
    head.add(rightAntler);
  }
  
  addEars(head) {
    const earGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.2);
    const earMaterial = this.mesh.material; // Use same material as body
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.2, 0.4, 0);
    head.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.2, 0.4, 0);
    head.add(rightEar);
  }
  
  addTusks(head) {
    const tuskGeometry = new THREE.ConeGeometry(0.03, 0.3, 4);
    const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // Pure white
    
    const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    leftTusk.position.set(-0.15, -0.2, 0.3);
    leftTusk.rotation.x = Math.PI / 4;
    head.add(leftTusk);
    
    const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    rightTusk.position.set(0.15, -0.2, 0.3);
    rightTusk.rotation.x = Math.PI / 4;
    head.add(rightTusk);
  }
  
  addLegs() {
    const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const legMaterial = this.mesh.material; // Use same material as body
    
    const positions = [
      [-0.5, -0.8, 1.0],   // Front left
      [0.5, -0.8, 1.0],    // Front right
      [-0.5, -0.8, -1.0],  // Back left
      [0.5, -0.8, -1.0]    // Back right
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(leg);
    });
  }
  
  addTail() {
    const tailGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    const tailMaterial = this.mesh.material; // Use same material as body
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.2, -1.8);
    this.mesh.add(tail);
  }

  addEyes(head) {
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    
    // Determine eye color based on animal type
    let eyeColor = 0x000000; // Default black
    if (this.type === 'rabbit') {
      // Random eye color for rabbits: black or red
      eyeColor = Math.random() < 0.5 ? 0x000000 : 0xFF0000;
    }
    
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: eyeColor });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.1, 0.35);
    head.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.1, 0.35);
    head.add(rightEye);
  }

  addDeerSpots() {
    // Add white spots to deer body
    const spotGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    // Add several spots across the body
    const spotPositions = [
      [0.3, 0.2, 0.5],   // Right side front
      [-0.3, 0.2, 0.5],  // Left side front
      [0.4, 0.1, -0.2],  // Right side back
      [-0.4, 0.1, -0.2], // Left side back
      [0.2, 0.3, 0.0],   // Right side middle
      [-0.2, 0.3, 0.0],  // Left side middle
      [0.0, 0.4, 0.3],   // Top front
      [0.0, 0.4, -0.3]   // Top back
    ];
    
    spotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(spot);
    });
  }

  addLeopardSpots() {
    // Add black spots to leopard body
    const spotGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const spotMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Add many spots for leopard pattern
    const spotPositions = [
      [0.2, 0.3, 0.8],   [0.4, 0.1, 0.6],   [0.3, 0.4, 0.3],
      [-0.2, 0.3, 0.8],  [-0.4, 0.1, 0.6],  [-0.3, 0.4, 0.3],
      [0.5, 0.2, 0.0],   [0.3, 0.5, -0.2],  [0.2, 0.1, -0.5],
      [-0.5, 0.2, 0.0],  [-0.3, 0.5, -0.2], [-0.2, 0.1, -0.5],
      [0.1, 0.2, 1.0],   [0.6, 0.3, -0.8],  [0.0, 0.5, 0.1],
      [-0.1, 0.2, 1.0],  [-0.6, 0.3, -0.8], [0.4, 0.0, -1.0],
      [0.2, 0.6, 0.5],   [0.5, 0.4, -0.3],  [0.3, 0.2, -0.7],
      [-0.2, 0.6, 0.5],  [-0.5, 0.4, -0.3], [-0.3, 0.2, -0.7]
    ];
    
    spotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(spot);
    });
  }
  
  createHealthBar() {
    // Create health bar container
    const barWidth = 2.0;
    const barHeight = 0.2;
    
    // Background bar (red)
    const bgGeometry = new THREE.BoxGeometry(barWidth, barHeight, 0.1);
    const bgMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarBg.position.set(0, 2.5, 0); // Above animal
    this.healthBarBg.visible = false;
    this.mesh.add(this.healthBarBg);
    
    // Health bar (green)
    const healthGeometry = new THREE.BoxGeometry(barWidth, barHeight, 0.1);
    const healthMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.set(0, 2.5, 0.05); // Slightly in front
    this.healthBar.visible = false;
    this.mesh.add(this.healthBar);
    
    // Timer for hiding health bar
    this.healthBarTimer = 0;
  }
  
  showHealthBar() {
    if (this.healthBarBg && this.healthBar) {
      this.healthBarBg.visible = true;
      this.healthBar.visible = true;
      this.healthBarTimer = 5.0; // Show for 5 seconds (increased from 3)
      this.updateHealthBarScale();
    }
  }
  
  updateHealthBarScale() {
    if (this.healthBar) {
      const healthRatio = this.health / this.maxHealth;
      this.healthBar.scale.x = healthRatio;
      this.healthBar.position.x = -(1.0 - healthRatio) * 1.0; // Adjust position for left alignment
    }
  }
  
  hideHealthBar() {
    if (this.healthBarBg && this.healthBar) {
      this.healthBarBg.visible = false;
      this.healthBar.visible = false;
    }
  }
  
  flipUpsideDown() {
    if (this.mesh) {
      // Flip the animal upside down (180 degrees around Z-axis)
      this.mesh.rotation.z = Math.PI;
      console.log(`🦌 ${this.type} flipped upside down`);
    }
  }
  
  // Health management
  takeDamage(amount, attacker = null) {
    console.log(`🦌 ${this.type} taking ${amount} damage (health: ${this.health} -> ${Math.max(0, this.health - amount)})`);
    this.health = Math.max(0, this.health - amount);
    
    // Show health bar when attacked
    this.showHealthBar();
    
    // React to being attacked
    if (attacker && this.isAlive()) {
      this.reactToAttack(attacker);
    }
    
    if (this.health <= 0) {
      this.setState('dead');
      this.flipUpsideDown();
      console.log(`🦌 ${this.type} is now dead`);
    }
  }
  
  reactToAttack(attacker) {
    console.log(`🦌 ${this.type} reacting to attack from ${attacker.constructor.name}`);
    
    // Set the attacker as target
    this.setTarget(attacker.position);
    
    // ALL prey fight back when attacked
    this.setAIState('aggressive');
    console.log(`🦌 ${this.type} becoming aggressive and fighting back!`);
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
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }
  
  distanceTo(target) {
    return Math.sqrt(
      Math.pow(this.position.x - target.x, 2) +
      Math.pow(this.position.y - (target.y || 0), 2) +
      Math.pow(this.position.z - target.z, 2)
    );
  }
  
  // State management
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.lastStateChange = Date.now();
      this.stateTimer = 0;
    }
  }
  
  // AI behavior
  setAIState(newState) {
    this.aiState = newState;
  }
  
  setTarget(target) {
    this.target = target;
  }
  
  clearTarget() {
    this.target = null;
  }
  
  canDetect(threat) {
    return this.distanceTo(threat) <= this.detectionRadius;
  }
  
  shouldFlee(threat) {
    return this.distanceTo(threat) <= this.fleeDistance;
  }
  
  canAttack(target) {
    return (this.behaviorType === 'predator' || this.type === 'boar') && this.distanceTo(target) <= this.attackRange;
  }
  
  attack(target) {
    if (!this.canAttack(target)) return false;
    
    console.log(`🦌 ${this.type} attacking ${target.constructor.name} with ${this.power} damage`);
    
    // Apply damage to target
    if (target.takeDamage) {
      target.takeDamage(this.power, this);
      console.log(`🦌 ${this.type} dealt ${this.power} damage to tiger`);
    }
    
    return true;
  }
  
  // Experience and rewards
  getExperienceReward() {
    switch (this.behaviorType) {
      case 'prey':
        return 25;
      case 'predator':
        return 50;
      default:
        return 35;
    }
  }
  
  getHealthRestoration() {
    return 30;
  }
  
  // Update cycle
  update(deltaTime) {
    if (!this.isAlive()) return;
    
    // Clamp delta time to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.1);
    
    // Update timers
    this.stateTimer += deltaTime;
    this.staminaRegenTimer += deltaTime;
    
    // Update health bar timer
    if (this.healthBarTimer > 0) {
      this.healthBarTimer -= deltaTime;
      if (this.healthBarTimer <= 0) {
        this.hideHealthBar();
      }
    }
    
    // Regenerate stamina over time
    if (this.staminaRegenTimer >= 0.5) { // Every 0.5 seconds
      this.restoreStamina(5);
      this.staminaRegenTimer = 0;
    }
    
    // Update AI behavior
    this.updateAI(deltaTime);
    
    // Update position based on velocity
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Sync mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
  }
  
  updateAI(deltaTime) {
    // Basic AI state machine
    switch (this.aiState) {
      case 'idle':
        this.handleIdleState(deltaTime);
        break;
      case 'grazing':
        this.handleGrazingState(deltaTime);
        break;
      case 'moving':
        this.handleMovingState(deltaTime);
        break;
      case 'alert':
        this.handleAlertState(deltaTime);
        break;
      case 'fleeing':
        this.handleFleeingState(deltaTime);
        break;
      case 'aggressive':
        this.handleAggressiveState(deltaTime);
        break;
    }
  }
  
  handleIdleState(deltaTime) {
    // More frequent state changes
    if (this.stateTimer > 1.0 && Math.random() < 0.3) {
      const nextState = Math.random() < 0.6 ? 'grazing' : 'moving';
      this.setAIState(nextState);
    }
  }
  
  handleGrazingState(deltaTime) {
    // Graze for a while, then return to idle
    if (this.stateTimer > 3.0) {
      this.setAIState('idle');
    }
  }
  
  handleMovingState(deltaTime) {
    // Move randomly for a while, then either idle or keep moving
    if (this.stateTimer > 3.0) {
      const nextState = Math.random() < 0.5 ? 'idle' : 'moving';
      this.setAIState(nextState);
    }
  }
  
  handleAlertState(deltaTime) {
    // Stay alert for a moment
    if (this.stateTimer > 1.0) {
      this.setAIState('idle');
    }
  }
  
  handleFleeingState(deltaTime) {
    // Flee for a longer period
    if (this.stateTimer > 4.0) {
      this.setAIState('idle');
    }
  }
  
  handleAggressiveState(deltaTime) {
    // Aggressive behavior for predators
    if (this.stateTimer > 2.0) {
      this.setAIState('idle');
    }
  }
  
  // Cleanup
  dispose() {
    if (this.mesh) {
      this.mesh.clear();
      this.mesh = null;
    }
    
    this.mixers.forEach(mixer => mixer.stopAllAction());
    this.mixers = [];
  }
  
  // Get mesh for adding to scene
  getMesh() {
    return this.mesh;
  }
}
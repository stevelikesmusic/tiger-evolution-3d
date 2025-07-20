import * as THREE from 'three';

/**
 * CrocodileAmbush - Water-based ambush predator
 * Implements crocodile ambush behavior with state machine and water emergence attacks
 */
export class CrocodileAmbush {
  constructor(x, y, z, waterBody) {
    // Position and water body association
    this.position = new THREE.Vector3(x, y, z);
    this.rotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
    this.waterBody = waterBody;
    this.originalPosition = this.position.clone();
    
    // Crocodile stats
    this.health = 200;
    this.maxHealth = 200;
    this.power = 35; // Base damage
    this.speed = 25.0; // Attack speed
    this.detectionRadius = 6.0;
    
    // State machine
    this.state = 'hidden';
    this.stateTimer = 0;
    this.alertDuration = 1.5; // seconds
    this.attackDuration = 2.0; // seconds
    this.cooldownDuration = 15.0; // seconds
    this.repositionChance = 0.6;
    
    // Attack properties
    this.attackRange = 8.0;
    this.isAttacking = false;
    this.hasAttacked = false;
    this.target = null;
    
    // Movement and animation
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.attackDirection = new THREE.Vector3(0, 0, 0);
    this.emergenceHeight = 0;
    
    // 3D model
    this.mesh = null;
    this.createModel();
    
    // Systems references
    this.terrain = null;
    this.waterSystem = null;
    
    console.log(`🐊 CrocodileAmbush: Created at position (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
  }
  
  /**
   * Create 3D model for crocodile
   */
  createModel() {
    // Main body - elongated and powerful
    const bodyGeometry = new THREE.BoxGeometry(2.5, 0.8, 8.0);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a4a3a, // Dark gray-green
      transparent: true,
      opacity: 0.9
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Head - large and menacing
    const headGeometry = new THREE.BoxGeometry(1.8, 1.0, 2.5);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.2, 4.8);
    this.mesh.add(head);
    
    // Eyes - only visible parts when hidden
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 }); // Red eyes
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.4, 0.6, 1.0);
    head.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.4, 0.6, 1.0);
    head.add(rightEye);
    
    // Snout
    const snoutGeometry = new THREE.BoxGeometry(1.2, 0.6, 1.5);
    const snout = new THREE.Mesh(snoutGeometry, headMaterial);
    snout.position.set(0, -0.1, 1.8);
    head.add(snout);
    
    // Teeth
    this.addTeeth(snout);
    
    // Tail
    const tailGeometry = new THREE.BoxGeometry(1.5, 0.6, 4.0);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, -6.0);
    tail.rotation.z = 0.1; // Slight curve
    this.mesh.add(tail);
    
    // Legs - short and powerful
    this.addLegs();
    
    // Scales/texture details
    this.addScales();
    
    // Position mesh at crocodile position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    
    // Initially mostly submerged (only eyes visible)
    this.setVisibilityForState('hidden');
  }
  
  /**
   * Add teeth to crocodile snout
   */
  addTeeth(snout) {
    const toothGeometry = new THREE.ConeGeometry(0.08, 0.3, 4);
    const toothMaterial = new THREE.MeshLambertMaterial({ color: 0xffffee });
    
    // Upper teeth
    for (let i = 0; i < 8; i++) {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
      const x = (i - 3.5) * 0.25;
      tooth.position.set(x, 0.15, 0.6);
      tooth.rotation.x = Math.PI;
      snout.add(tooth);
    }
    
    // Lower teeth
    for (let i = 0; i < 6; i++) {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
      const x = (i - 2.5) * 0.3;
      tooth.position.set(x, -0.25, 0.6);
      snout.add(tooth);
    }
  }
  
  /**
   * Add legs to crocodile
   */
  addLegs() {
    const legGeometry = new THREE.BoxGeometry(0.6, 0.4, 1.0);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    
    const legPositions = [
      [-1.0, -0.5, 2.0],  // Front left
      [1.0, -0.5, 2.0],   // Front right
      [-1.0, -0.5, -2.0], // Back left
      [1.0, -0.5, -2.0]   // Back right
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(leg);
    });
  }
  
  /**
   * Add scale details to crocodile
   */
  addScales() {
    const scaleGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    const scaleMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x5a5a4a,
      transparent: true,
      opacity: 0.8
    });
    
    // Add scales along the back
    for (let i = 0; i < 12; i++) {
      const scale = new THREE.Mesh(scaleGeometry, scaleMaterial);
      scale.position.set(0, 0.5, -3 + i * 0.8);
      scale.rotation.y = (Math.random() - 0.5) * 0.3;
      this.mesh.add(scale);
    }
  }
  
  /**
   * Set visibility based on crocodile state
   */
  setVisibilityForState(state) {
    switch (state) {
      case 'hidden':
        this.mesh.position.y = this.position.y - 1.0; // Mostly submerged
        this.mesh.children.forEach(child => {
          if (child.children.length > 0) { // Head with eyes
            child.visible = true;
            child.position.y = 0.8; // Eyes above water
          } else {
            child.visible = false; // Hide body
          }
        });
        break;
        
      case 'alert':
        this.mesh.position.y = this.position.y - 0.5; // Slightly more visible
        this.mesh.children.forEach(child => {
          child.visible = true;
        });
        break;
        
      case 'attacking':
      case 'cooldown':
        this.mesh.position.y = this.position.y; // Fully emerged
        this.mesh.children.forEach(child => {
          child.visible = true;
        });
        break;
    }
  }
  
  /**
   * Set terrain reference
   */
  setTerrain(terrain) {
    this.terrain = terrain;
  }
  
  /**
   * Set water system reference
   */
  setWaterSystem(waterSystem) {
    this.waterSystem = waterSystem;
  }
  
  /**
   * Update crocodile behavior
   */
  update(deltaTime, tiger) {
    if (!this.isAlive() || !tiger) return;
    
    this.stateTimer += deltaTime;
    
    // Update state machine
    this.updateStateMachine(deltaTime, tiger);
    
    // Update position and animation
    this.updateMovement(deltaTime);
    
    // Update mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
  }
  
  /**
   * Update state machine
   */
  updateStateMachine(deltaTime, tiger) {
    const distanceToTiger = this.getDistanceToTiger(tiger);
    
    switch (this.state) {
      case 'hidden':
        this.handleHiddenState(tiger, distanceToTiger);
        break;
        
      case 'alert':
        this.handleAlertState(tiger, distanceToTiger);
        break;
        
      case 'attacking':
        this.handleAttackingState(tiger, distanceToTiger);
        break;
        
      case 'cooldown':
        this.handleCooldownState();
        break;
    }
  }
  
  /**
   * Handle hidden state - waiting for tiger to approach
   */
  handleHiddenState(tiger, distance) {
    // Check if tiger is within detection radius
    if (distance <= this.detectionRadius) {
      // Check if tiger is near water edge (ambush trigger zone)
      const isNearWaterEdge = this.isNearWaterEdge(tiger.position);
      
      if (isNearWaterEdge) {
        console.log(`🐊 Crocodile detected tiger at distance ${distance.toFixed(1)} - entering alert state`);
        this.setState('alert');
        this.target = tiger;
      }
    }
  }
  
  /**
   * Handle alert state - preparing to attack
   */
  handleAlertState(tiger, distance) {
    if (this.stateTimer >= this.alertDuration) {
      // Check if tiger is still in range for attack
      if (distance <= this.attackRange && this.target) {
        console.log(`🐊 Crocodile launching ambush attack!`);
        this.setState('attacking');
        this.initiateAttack(tiger);
      } else {
        // Tiger moved away, return to hidden
        console.log(`🐊 Tiger moved away during alert phase - returning to hidden`);
        this.setState('hidden');
        this.target = null;
      }
    } else {
      // Create ripples and subtle movement during alert phase
      this.createWaterRipples();
    }
  }
  
  /**
   * Handle attacking state - explosive emergence and lunge
   */
  handleAttackingState(tiger, distance) {
    if (this.stateTimer >= this.attackDuration) {
      console.log(`🐊 Crocodile attack completed - entering cooldown`);
      this.setState('cooldown');
      this.isAttacking = false;
      this.hasAttacked = false;
    } else {
      // Execute attack movement
      this.executeAttackMovement(tiger);
    }
  }
  
  /**
   * Handle cooldown state - recovery and repositioning
   */
  handleCooldownState() {
    if (this.stateTimer >= this.cooldownDuration) {
      console.log(`🐊 Crocodile cooldown complete - repositioning`);
      
      // Chance to reposition to new ambush spot
      if (Math.random() < this.repositionChance) {
        this.repositionToNewAmbushSpot();
      }
      
      this.setState('hidden');
      this.target = null;
    }
  }
  
  /**
   * Set crocodile state
   */
  setState(newState) {
    if (this.state !== newState) {
      console.log(`🐊 Crocodile state: ${this.state} -> ${newState}`);
      this.state = newState;
      this.stateTimer = 0;
      this.setVisibilityForState(newState);
    }
  }
  
  /**
   * Initiate attack sequence
   */
  initiateAttack(tiger) {
    this.isAttacking = true;
    this.hasAttacked = false;
    
    // Calculate attack direction
    this.attackDirection.subVectors(tiger.position, this.position).normalize();
    
    // Create water splash effects
    this.createWaterSplash();
    
    // Play attack sound
    this.playAttackSound();
  }
  
  /**
   * Execute attack movement (lunge toward tiger)
   */
  executeAttackMovement(tiger) {
    if (!this.isAttacking) return;
    
    const attackProgress = this.stateTimer / this.attackDuration;
    
    if (attackProgress < 0.3) {
      // Emergence phase - rise from water
      this.emergenceHeight = attackProgress / 0.3; // 0 to 1
      this.position.y = this.originalPosition.y + this.emergenceHeight * 2.0;
    } else if (attackProgress < 0.8) {
      // Lunge phase - move toward tiger
      const lungeProgress = (attackProgress - 0.3) / 0.5; // 0 to 1
      const maxLungeDistance = Math.min(this.attackRange, this.getDistanceToTiger(tiger));
      
      this.velocity.copy(this.attackDirection).multiplyScalar(this.speed);
      this.position.add(this.velocity.clone().multiplyScalar(0.016)); // Assume ~60fps
      
      // Check for hit during lunge
      if (!this.hasAttacked && this.canHitTarget(tiger)) {
        this.executeAttackHit(tiger);
      }
    } else {
      // Recovery phase - return toward water
      const recoveryDirection = new THREE.Vector3()
        .subVectors(this.originalPosition, this.position)
        .normalize();
      
      this.velocity.copy(recoveryDirection).multiplyScalar(this.speed * 0.5);
      this.position.add(this.velocity.clone().multiplyScalar(0.016));
    }
  }
  
  /**
   * Execute attack hit on tiger
   */
  executeAttackHit(tiger) {
    this.hasAttacked = true;
    console.log(`🐊 Crocodile hit tiger for ${this.power} damage!`);
    
    // This will be handled by the AmbushSystem
    // tiger.takeDamage(this.power, this);
  }
  
  /**
   * Check if crocodile can hit target
   */
  canHitTarget(tiger) {
    if (!this.isAttacking || this.hasAttacked) return false;
    
    const distance = this.getDistanceToTiger(tiger);
    return distance <= 3.0; // Close hit range
  }
  
  /**
   * Get distance to tiger
   */
  getDistanceToTiger(tiger) {
    return this.position.distanceTo(tiger.position);
  }
  
  /**
   * Check if tiger is near water edge (ambush trigger zone)
   */
  isNearWaterEdge(tigerPosition) {
    if (!this.waterBody || !this.waterBody.center) return false;
    
    const distanceToCenter = Math.sqrt(
      Math.pow(tigerPosition.x - this.waterBody.center.x, 2) +
      Math.pow(tigerPosition.z - this.waterBody.center.z, 2)
    );
    
    const waterRadius = this.waterBody.radius;
    const edgeDistance = Math.abs(distanceToCenter - waterRadius);
    
    // Tiger is near edge if within 5 units of water boundary
    return edgeDistance <= 5.0;
  }
  
  /**
   * Reposition to new ambush spot
   */
  repositionToNewAmbushSpot() {
    if (!this.waterBody) return;
    
    // Find new position around water body
    const angle = Math.random() * Math.PI * 2;
    const distance = this.waterBody.radius * (0.7 + Math.random() * 0.2);
    
    const newX = this.waterBody.center.x + Math.cos(angle) * distance;
    const newZ = this.waterBody.center.z + Math.sin(angle) * distance;
    const newY = this.terrain ? this.terrain.getHeightAt(newX, newZ) - 0.5 : this.originalPosition.y;
    
    this.position.set(newX, newY, newZ);
    this.originalPosition.copy(this.position);
    
    console.log(`🐊 Crocodile repositioned to (${newX.toFixed(1)}, ${newY.toFixed(1)}, ${newZ.toFixed(1)})`);
  }
  
  /**
   * Create water ripple effects
   */
  createWaterRipples() {
    // Placeholder for water ripple particle effects
    console.log('🌊 Creating water ripples...');
  }
  
  /**
   * Create water splash effects
   */
  createWaterSplash() {
    // Placeholder for water splash particle effects
    console.log('💦 Creating water splash effects...');
  }
  
  /**
   * Play attack sound
   */
  playAttackSound() {
    // Placeholder for 3D positioned audio
    console.log('🔊 Playing crocodile attack sound...');
  }
  
  /**
   * Update movement and physics
   */
  updateMovement(deltaTime) {
    // Apply velocity damping when not attacking
    if (!this.isAttacking) {
      this.velocity.multiplyScalar(0.9);
    }
    
    // Keep crocodile within water body bounds
    if (this.waterBody && this.waterBody.center) {
      const distanceFromCenter = Math.sqrt(
        Math.pow(this.position.x - this.waterBody.center.x, 2) +
        Math.pow(this.position.z - this.waterBody.center.z, 2)
      );
      
      if (distanceFromCenter > this.waterBody.radius + 5) {
        // Move back toward water body
        const directionToCenter = new THREE.Vector3()
          .subVectors(this.waterBody.center, this.position)
          .normalize();
        
        this.position.add(directionToCenter.multiplyScalar(2.0));
      }
    }
  }
  
  /**
   * Check if crocodile is alive
   */
  isAlive() {
    return this.health > 0;
  }
  
  /**
   * Take damage
   */
  takeDamage(amount, attacker) {
    this.health = Math.max(0, this.health - amount);
    console.log(`🐊 Crocodile took ${amount} damage (health: ${this.health})`);
    
    if (!this.isAlive()) {
      console.log(`🐊 Crocodile defeated!`);
      this.setState('dead');
    }
  }
  
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get detection radius
   */
  getDetectionRadius() {
    return this.detectionRadius;
  }
  
  /**
   * Get attack damage
   */
  getAttackDamage() {
    return this.power;
  }
  
  /**
   * Check if should despawn
   */
  shouldDespawn() {
    return !this.isAlive() || this.state === 'dead';
  }
  
  /**
   * Get mesh for scene
   */
  getMesh() {
    return this.mesh;
  }
  
  /**
   * Dispose of crocodile
   */
  dispose() {
    if (this.mesh) {
      this.mesh.clear();
      this.mesh = null;
    }
    console.log('🐊 CrocodileAmbush: Disposed');
  }
}
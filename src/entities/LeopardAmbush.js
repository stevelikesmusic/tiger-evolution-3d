import * as THREE from 'three';

/**
 * LeopardAmbush - Tree-based ambush predator
 * Implements leopard ambush behavior with stalking, pouncing, and ground combat
 */
export class LeopardAmbush {
  constructor(x, y, z, tree) {
    // Position and tree association
    this.position = new THREE.Vector3(x, y, z);
    this.rotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
    this.tree = tree;
    this.originalPosition = this.position.clone();
    
    // Leopard identity and stats
    this.type = 'leopard';
    this.health = 180;
    this.maxHealth = 180;
    this.power = 30; // Base damage
    this.speed = 20.0; // Jump/pounce speed
    this.groundSpeed = 12.0; // Ground movement speed
    this.detectionRadius = 5.0;
    this.detectionBonus = 1.5; // Height advantage bonus
    
    // State machine
    this.state = 'hidden';
    this.stateTimer = 0;
    this.stalkingDuration = 8.0; // seconds
    this.alertDuration = 1.0; // seconds
    this.pounceDuration = 1.5; // seconds
    this.combatDuration = 5.0; // seconds
    this.maxFollowDistance = 20.0;
    
    // Attack properties
    this.attackRange = 12.0; // Pounce range
    this.groundAttackRange = 3.0;
    this.knockdownChance = 0.7;
    this.isAttacking = false;
    this.hasAttacked = false;
    this.target = null;
    
    // Movement and animation
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.pounceDirection = new THREE.Vector3(0, 0, 0);
    this.isGrounded = false;
    this.stalkingPath = [];
    this.currentStalkingTarget = 0;
    
    // Tree movement
    this.currentTreePosition = null;
    this.targetTreePosition = null;
    this.treeMovementSpeed = 2.0;
    this.availableTrees = [];
    
    // 3D model
    this.mesh = null;
    this.createModel();
    
    // Systems references
    this.terrain = null;
    this.vegetationSystem = null;
    
    console.log(`🐆 LeopardAmbush: Created at position (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
  }
  
  /**
   * Create 3D model for leopard
   */
  createModel() {
    // Main body - sleek and athletic
    const bodyGeometry = new THREE.BoxGeometry(1.4, 0.9, 3.0);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xDAA520, // Goldenrod base color
      transparent: true,
      opacity: 0.9
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Head - feline and alert
    const headGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.9);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xC8940D });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.3, 1.7);
    this.mesh.add(head);
    
    // Eyes - keen and predatory
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Golden eyes
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.18, 0.12, 0.4);
    head.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.18, 0.12, 0.4);
    head.add(rightEye);
    
    // Ears - pointed and alert
    const earGeometry = new THREE.ConeGeometry(0.1, 0.3, 6);
    const leftEar = new THREE.Mesh(earGeometry, headMaterial);
    leftEar.position.set(-0.2, 0.4, 0.1);
    head.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, headMaterial);
    rightEar.position.set(0.2, 0.4, 0.1);
    head.add(rightEar);
    
    // Tail - long and expressive
    const tailGeometry = new THREE.BoxGeometry(0.12, 0.12, 1.5);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0.2, -1.8);
    tail.rotation.x = -0.2; // Slight upward curve
    this.mesh.add(tail);
    
    // Legs - powerful for pouncing
    this.addLegs();
    
    // Leopard spots
    this.addLeopardSpots();
    
    // Position mesh at leopard position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    
    // Initially camouflaged in tree
    this.setCamouflageLevel(0.7); // 70% camouflaged when hidden
  }
  
  /**
   * Add legs to leopard
   */
  addLegs() {
    const legGeometry = new THREE.BoxGeometry(0.20, 0.9, 0.20);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0xC8940D });
    
    const legPositions = [
      [-0.5, -0.8, 1.1],   // Front left
      [0.5, -0.8, 1.1],    // Front right
      [-0.5, -0.8, -1.1],  // Back left
      [0.5, -0.8, -1.1]    // Back right
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(leg);
    });
  }
  
  /**
   * Add leopard spot pattern
   */
  addLeopardSpots() {
    const spotGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const spotMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x000000, // Black spots
      transparent: true,
      opacity: 0.8
    });
    
    // Leopard rosette pattern
    const spotPositions = [
      // Body spots
      [0.3, 0.4, 0.9], [-0.3, 0.4, 0.9], [0.5, 0.2, 0.5], [-0.5, 0.2, 0.5],
      [0.2, 0.5, 0.0], [-0.2, 0.5, 0.0], [0.4, 0.1, -0.5], [-0.4, 0.1, -0.5],
      [0.1, 0.3, -1.0], [-0.1, 0.3, -1.0], [0.3, 0.0, -0.8], [-0.3, 0.0, -0.8],
      // Additional spots for density
      [0.6, 0.3, 0.2], [-0.6, 0.3, 0.2], [0.0, 0.5, 0.7], [0.0, 0.2, -0.3]
    ];
    
    spotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(spot);
    });
  }
  
  /**
   * Set camouflage level (0.0 = fully visible, 1.0 = fully hidden)
   */
  setCamouflageLevel(level) {
    if (this.mesh) {
      const opacity = 1.0 - (level * 0.7); // Max 70% transparency
      this.mesh.material.opacity = opacity;
      
      // Also affect spot opacity
      this.mesh.children.forEach(child => {
        if (child.material && child.material.color.getHex() === 0x000000) {
          child.material.opacity = opacity * 0.6;
        }
      });
    }
  }
  
  /**
   * Set terrain reference
   */
  setTerrain(terrain) {
    this.terrain = terrain;
  }
  
  /**
   * Set vegetation system reference
   */
  setVegetationSystem(vegetationSystem) {
    this.vegetationSystem = vegetationSystem;
    if (vegetationSystem) {
      this.availableTrees = vegetationSystem.trees.slice(); // Copy tree array
    }
  }
  
  /**
   * Update leopard behavior
   */
  update(deltaTime, tiger) {
    if (!this.isAlive() || !tiger) return;
    
    this.stateTimer += deltaTime;
    
    // Update state machine
    this.updateStateMachine(deltaTime, tiger);
    
    // Update movement and animation
    this.updateMovement(deltaTime);
    
    // Update mesh position and visibility
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
        
      case 'stalking':
        this.handleStalkingState(tiger, distanceToTiger);
        break;
        
      case 'alert':
        this.handleAlertState(tiger, distanceToTiger);
        break;
        
      case 'pouncing':
        this.handlePouncingState(tiger, distanceToTiger);
        break;
        
      case 'combat':
        this.handleCombatState(tiger, distanceToTiger);
        break;
        
      case 'retreating':
        this.handleRetreatingState(tiger, distanceToTiger);
        break;
    }
  }
  
  /**
   * Handle hidden state - watching from trees
   */
  handleHiddenState(tiger, distance) {
    const effectiveDetectionRadius = this.detectionRadius * this.detectionBonus;
    
    // Check if tiger is within enhanced detection radius (height advantage)
    if (distance <= effectiveDetectionRadius) {
      console.log(`🐆 Leopard detected tiger at distance ${distance.toFixed(1)} - entering stalking state`);
      this.setState('stalking');
      this.target = tiger;
      this.planStalkingRoute(tiger);
    }
  }
  
  /**
   * Handle stalking state - following tiger through trees
   */
  handleStalkingState(tiger, distance) {
    if (this.stateTimer >= this.stalkingDuration || distance > this.maxFollowDistance) {
      console.log(`🐆 Stalking timeout or tiger too far - returning to hidden`);
      this.setState('hidden');
      this.target = null;
      return;
    }
    
    // Update stalking movement
    this.updateStalkingMovement(tiger);
    
    // Check if in position for pounce
    if (distance <= this.attackRange && this.canPounceOnTiger(tiger)) {
      console.log(`🐆 Leopard in position for pounce attack!`);
      this.setState('alert');
    }
  }
  
  /**
   * Handle alert state - preparing to pounce
   */
  handleAlertState(tiger, distance) {
    if (this.stateTimer >= this.alertDuration) {
      if (distance <= this.attackRange && this.canPounceOnTiger(tiger)) {
        console.log(`🐆 Leopard launching pounce attack!`);
        this.setState('pouncing');
        this.initiatePounce(tiger);
      } else {
        console.log(`🐆 Tiger moved out of pounce range - returning to stalking`);
        this.setState('stalking');
      }
    } else {
      // Create subtle movement cues during alert
      this.createAlertEffects();
    }
  }
  
  /**
   * Handle pouncing state - leap attack from above
   */
  handlePouncingState(tiger, distance) {
    if (this.stateTimer >= this.pounceDuration) {
      if (this.isGrounded) {
        console.log(`🐆 Leopard landed - entering ground combat`);
        this.setState('combat');
      } else {
        console.log(`🐆 Pounce missed - landing`);
        this.setState('combat');
        this.isGrounded = true;
      }
    } else {
      // Execute pounce movement
      this.executePounceMovement(tiger);
    }
  }
  
  /**
   * Handle combat state - ground fighting
   */
  handleCombatState(tiger, distance) {
    if (this.stateTimer >= this.combatDuration) {
      // Decide whether to continue fighting or retreat
      const healthRatio = this.health / this.maxHealth;
      if (healthRatio < 0.3 || Math.random() < 0.3) {
        console.log(`🐆 Leopard retreating from combat`);
        this.setState('retreating');
      } else {
        console.log(`🐆 Leopard continuing combat`);
        this.stateTimer = 0; // Reset combat timer
      }
    } else {
      // Ground combat behavior
      this.executeGroundCombat(tiger, distance);
    }
  }
  
  /**
   * Handle retreating state - escape to safety
   */
  handleRetreatingState(tiger, distance) {
    // Move away from tiger
    const retreatDirection = new THREE.Vector3()
      .subVectors(this.position, tiger.position)
      .normalize();
    
    this.velocity.copy(retreatDirection).multiplyScalar(this.groundSpeed);
    
    // Try to find a tree to climb
    if (distance > this.maxFollowDistance || this.findNearbyTree()) {
      console.log(`🐆 Leopard successfully retreated`);
      this.setState('hidden');
      this.target = null;
      this.repositionInTree();
    }
  }
  
  /**
   * Set leopard state
   */
  setState(newState) {
    if (this.state !== newState) {
      console.log(`🐆 Leopard state: ${this.state} -> ${newState}`);
      this.state = newState;
      this.stateTimer = 0;
      this.updateVisualState(newState);
    }
  }
  
  /**
   * Update visual state based on current behavior
   */
  updateVisualState(state) {
    switch (state) {
      case 'hidden':
        this.setCamouflageLevel(0.7); // Highly camouflaged
        this.isGrounded = false;
        break;
        
      case 'stalking':
        this.setCamouflageLevel(0.5); // Partially visible
        this.isGrounded = false;
        break;
        
      case 'alert':
        this.setCamouflageLevel(0.3); // More visible
        this.isGrounded = false;
        break;
        
      case 'pouncing':
      case 'combat':
      case 'retreating':
        this.setCamouflageLevel(0.0); // Fully visible
        break;
    }
  }
  
  /**
   * Plan stalking route following tiger through trees
   */
  planStalkingRoute(tiger) {
    // Find trees between current position and tiger for stalking path
    this.stalkingPath = [];
    this.currentStalkingTarget = 0;
    
    // Simple implementation: find trees in general direction of tiger
    const directionToTiger = new THREE.Vector3()
      .subVectors(tiger.position, this.position)
      .normalize();
    
    // Find suitable trees for stalking
    if (this.availableTrees) {
      for (const tree of this.availableTrees) {
        const treeDirection = new THREE.Vector3()
          .subVectors(tree.position, this.position)
          .normalize();
        
        const dot = directionToTiger.dot(treeDirection);
        const distance = this.position.distanceTo(tree.position);
        
        // Tree is in general direction and reasonable distance
        if (dot > 0.3 && distance < 30 && distance > 5) {
          this.stalkingPath.push({
            position: tree.position.clone().add(new THREE.Vector3(0, 35, 0)),
            tree: tree
          });
        }
      }
    }
    
    // Sort by distance to tiger
    this.stalkingPath.sort((a, b) => {
      const aDist = a.position.distanceTo(tiger.position);
      const bDist = b.position.distanceTo(tiger.position);
      return aDist - bDist;
    });
    
    console.log(`🐆 Planned stalking route with ${this.stalkingPath.length} waypoints`);
  }
  
  /**
   * Update stalking movement through trees
   */
  updateStalkingMovement(tiger) {
    if (this.stalkingPath.length === 0) return;
    
    // Move to current stalking target
    const currentTarget = this.stalkingPath[this.currentStalkingTarget];
    if (!currentTarget) return;
    
    const direction = new THREE.Vector3()
      .subVectors(currentTarget.position, this.position)
      .normalize();
    
    this.velocity.copy(direction).multiplyScalar(this.treeMovementSpeed);
    
    // Check if reached current target
    const distanceToTarget = this.position.distanceTo(currentTarget.position);
    if (distanceToTarget < 2.0) {
      this.currentStalkingTarget++;
      
      // If reached end of path, plan new route
      if (this.currentStalkingTarget >= this.stalkingPath.length) {
        this.planStalkingRoute(tiger);
      }
    }
  }
  
  /**
   * Check if leopard can pounce on tiger
   */
  canPounceOnTiger(tiger) {
    // Must be above tiger and within range
    const heightDifference = this.position.y - tiger.position.y;
    return heightDifference > 5.0 && this.getDistanceToTiger(tiger) <= this.attackRange;
  }
  
  /**
   * Initiate pounce attack
   */
  initiatePounce(tiger) {
    this.isAttacking = true;
    this.hasAttacked = false;
    this.isGrounded = false;
    
    // Calculate pounce trajectory (parabolic arc)
    const horizontalDistance = Math.sqrt(
      Math.pow(tiger.position.x - this.position.x, 2) +
      Math.pow(tiger.position.z - this.position.z, 2)
    );
    const verticalDistance = this.position.y - tiger.position.y;
    
    // Predict tiger movement
    const tigerVelocity = tiger.velocity || new THREE.Vector3(0, 0, 0);
    const timeToReach = horizontalDistance / this.speed;
    const predictedPosition = tiger.position.clone().add(
      tigerVelocity.clone().multiplyScalar(timeToReach)
    );
    
    // Calculate pounce direction
    this.pounceDirection.subVectors(predictedPosition, this.position).normalize();
    
    console.log(`🐆 Leopard pouncing from height ${verticalDistance.toFixed(1)} toward predicted position`);
    
    // Create visual effects
    this.createPounceEffects();
  }
  
  /**
   * Execute pounce movement
   */
  executePounceMovement(tiger) {
    if (!this.isAttacking) return;
    
    const pounceProgress = this.stateTimer / this.pounceDuration;
    
    if (pounceProgress < 0.8) {
      // Flying through air
      const horizontalVelocity = this.pounceDirection.clone().multiplyScalar(this.speed);
      horizontalVelocity.y = 0; // Remove Y component for separate calculation
      
      // Parabolic trajectory
      const gravity = -30;
      const initialVerticalVelocity = 5; // Small upward component
      const verticalVelocity = initialVerticalVelocity + gravity * pounceProgress;
      
      this.velocity.copy(horizontalVelocity);
      this.velocity.y = verticalVelocity;
      
      // Check for ground collision or tiger hit
      if (this.position.y <= this.getGroundHeight() + 1.0) {
        this.isGrounded = true;
        this.position.y = this.getGroundHeight() + 1.0;
        this.velocity.y = 0;
      }
      
      // Check for tiger hit during pounce
      if (!this.hasAttacked && this.canHitTarget(tiger)) {
        this.executePounceHit(tiger);
      }
    }
  }
  
  /**
   * Execute pounce hit on tiger
   */
  executePounceHit(tiger) {
    this.hasAttacked = true;
    
    // Apply knockdown chance
    const knockdownSuccess = Math.random() < this.knockdownChance;
    
    console.log(`🐆 Leopard pounce hit! Damage: ${this.power}, Knockdown: ${knockdownSuccess}`);
    
    if (knockdownSuccess) {
      // Apply knockdown effect to tiger (would be handled by game systems)
      console.log(`🐆 Tiger knocked down by leopard pounce!`);
    }
    
    // This will be handled by the AmbushSystem
    // tiger.takeDamage(this.power, this);
  }
  
  /**
   * Execute ground combat behavior
   */
  executeGroundCombat(tiger, distance) {
    if (distance <= this.groundAttackRange) {
      // Close range combat
      if (Math.random() < 0.3) { // 30% chance per update to attack
        this.executeGroundAttack(tiger);
      }
    } else if (distance <= this.groundAttackRange * 2) {
      // Move closer for attack
      const direction = new THREE.Vector3()
        .subVectors(tiger.position, this.position)
        .normalize();
      
      this.velocity.copy(direction).multiplyScalar(this.groundSpeed);
    }
  }
  
  /**
   * Execute ground attack
   */
  executeGroundAttack(tiger) {
    console.log(`🐆 Leopard ground attack for ${this.power * 0.8} damage`);
    // Reduced damage for ground attacks compared to pounce
  }
  
  /**
   * Create alert visual effects
   */
  createAlertEffects() {
    // Placeholder for branch movement and leaf rustling effects
    console.log('🍃 Creating leopard alert effects...');
  }
  
  /**
   * Create pounce visual effects
   */
  createPounceEffects() {
    // Placeholder for motion blur and leap effects
    console.log('💨 Creating leopard pounce effects...');
  }
  
  /**
   * Find nearby tree for retreat
   */
  findNearbyTree() {
    if (!this.availableTrees) return false;
    
    for (const tree of this.availableTrees) {
      const distance = this.position.distanceTo(tree.position);
      if (distance < 15.0) {
        this.tree = tree;
        return true;
      }
    }
    return false;
  }
  
  /**
   * Reposition leopard in tree after retreat
   */
  repositionInTree() {
    if (this.tree) {
      this.position.copy(this.tree.position);
      this.position.y += 35 + Math.random() * 10; // High in canopy
      this.originalPosition.copy(this.position);
    }
  }
  
  /**
   * Get ground height at current position
   */
  getGroundHeight() {
    if (this.terrain) {
      return this.terrain.getHeightAt(this.position.x, this.position.z);
    }
    return 0;
  }
  
  /**
   * Update movement and physics
   */
  updateMovement(deltaTime) {
    // Apply velocity to position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply velocity damping
    this.velocity.multiplyScalar(0.95);
    
    // Keep leopard within reasonable bounds when in trees
    if (!this.isGrounded && this.tree) {
      const distanceFromTree = this.position.distanceTo(this.tree.position);
      if (distanceFromTree > 25.0) {
        const directionToTree = new THREE.Vector3()
          .subVectors(this.tree.position, this.position)
          .normalize();
        this.position.add(directionToTree.multiplyScalar(2.0));
      }
    }
  }
  
  /**
   * Check if leopard can hit target
   */
  canHitTarget(tiger) {
    if (!this.isAttacking || this.hasAttacked) return false;
    
    const distance = this.getDistanceToTiger(tiger);
    return distance <= 2.5; // Close hit range for pounce
  }
  
  /**
   * Get distance to tiger
   */
  getDistanceToTiger(tiger) {
    return this.position.distanceTo(tiger.position);
  }
  
  /**
   * Check if leopard is alive
   */
  isAlive() {
    return this.health > 0;
  }
  
  /**
   * Take damage
   */
  takeDamage(amount, attacker) {
    this.health = Math.max(0, this.health - amount);
    console.log(`🐆 Leopard took ${amount} damage (health: ${this.health})`);
    
    if (!this.isAlive()) {
      console.log(`🐆 Leopard defeated!`);
      this.setState('dead');
    } else {
      // Injured leopard more likely to retreat
      if (this.health < this.maxHealth * 0.5 && this.state === 'combat') {
        console.log(`🐆 Leopard injured, entering retreat mode`);
        this.setState('retreating');
      }
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
    return this.detectionRadius * this.detectionBonus;
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
   * Dispose of leopard
   */
  dispose() {
    if (this.mesh) {
      this.mesh.clear();
      this.mesh = null;
    }
    console.log('🐆 LeopardAmbush: Disposed');
  }
}
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
    
    // Crocodile identity and stats
    this.type = 'crocodile';
    this.health = 400;
    this.maxHealth = 400;
    this.power = 50; // Base damage
    this.speed = 25.0; // Attack speed
    this.detectionRadius = 20.0;
    
    // State machine
    this.state = 'hidden';
    this.stateTimer = 0;
    this.alertDuration = 1.5; // seconds
    this.attackDuration = 2.0; // seconds
    this.grabbingDuration = 5.0; // 5 seconds hold
    this.retreatingDuration = 3.0; // seconds to retreat
    this.cooldownDuration = 30.0; // 30 seconds before next attack
    this.repositionChance = 0.6;
    
    // Attack properties
    this.attackRange = 15.0;
    this.isAttacking = false;
    this.hasAttacked = false;
    this.target = null;
    
    // Grab properties
    this.isGrabbing = false;
    this.grabbedTiger = null;
    this.grabDamagePerSecond = 15; // continuous damage while holding
    this.hasDealtInitialBite = false;
    
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
    
    // Debug visualization
    this.debugMode = false;
    this.detectionRangeHelper = null;
    this.attackRangeHelper = null;
    this.stateIndicator = null;
    
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
    
    // Head container (for jaw animation)
    this.headContainer = new THREE.Group();
    this.headContainer.position.set(0, 0.2, 4.8);
    this.mesh.add(this.headContainer);
    
    // Upper jaw
    const upperJawGeometry = new THREE.BoxGeometry(1.8, 0.5, 2.5);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    this.upperJaw = new THREE.Mesh(upperJawGeometry, headMaterial);
    this.upperJaw.position.set(0, 0.25, 0);
    this.headContainer.add(this.upperJaw);
    
    // Lower jaw (will animate)
    const lowerJawGeometry = new THREE.BoxGeometry(1.8, 0.5, 2.5);
    this.lowerJaw = new THREE.Mesh(lowerJawGeometry, headMaterial);
    this.lowerJaw.position.set(0, -0.25, 0);
    this.lowerJaw.rotation.x = 0; // Will animate this
    this.headContainer.add(this.lowerJaw);
    
    // Eyes - only visible parts when hidden
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 }); // Red eyes
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.4, 0.1, 1.0);
    this.upperJaw.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.4, 0.1, 1.0);
    this.upperJaw.add(rightEye);
    
    // Upper snout
    const upperSnoutGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.5);
    const upperSnout = new THREE.Mesh(upperSnoutGeometry, headMaterial);
    upperSnout.position.set(0, 0, 1.8);
    this.upperJaw.add(upperSnout);
    
    // Lower snout
    const lowerSnoutGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.5);
    const lowerSnout = new THREE.Mesh(lowerSnoutGeometry, headMaterial);
    lowerSnout.position.set(0, 0, 1.8);
    this.lowerJaw.add(lowerSnout);
    
    // Teeth on upper jaw
    this.addTeeth(upperSnout, true);
    // Teeth on lower jaw
    this.addTeeth(lowerSnout, false);
    
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
  addTeeth(snout, isUpper) {
    const toothGeometry = new THREE.ConeGeometry(0.08, 0.3, 4);
    const toothMaterial = new THREE.MeshLambertMaterial({ color: 0xffffee });
    
    if (isUpper) {
      // Upper teeth pointing down
      for (let i = 0; i < 8; i++) {
        const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
        const x = (i - 3.5) * 0.25;
        tooth.position.set(x, -0.15, 0.6);
        tooth.rotation.x = Math.PI;
        snout.add(tooth);
      }
    } else {
      // Lower teeth pointing up
      for (let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
        const x = (i - 2.5) * 0.3;
        tooth.position.set(x, 0.15, 0.6);
        snout.add(tooth);
      }
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
    if (!this.mesh) return;
    
    switch (state) {
      case 'hidden':
        // Fully submerged - only eyes barely visible
        this.mesh.position.y = this.position.y;
        // Show only head container with closed mouth
        this.headContainer.visible = true;
        this.headContainer.position.y = 1.0; // Just eyes above water surface
        this.lowerJaw.rotation.x = 0; // Mouth closed
        // Hide body parts
        this.mesh.children.forEach(child => {
          if (child !== this.headContainer) {
            child.visible = false;
          }
        });
        console.log(`🐊 Hidden state: mesh at y=${this.mesh.position.y.toFixed(1)}, eyes at water surface`);
        break;
        
      case 'alert':
        // Head partially emerged - creating ripples
        this.mesh.position.y = this.position.y + 0.3;
        this.mesh.children.forEach(child => {
          child.visible = true;
        });
        this.headContainer.position.y = 0.2; // Reset head position
        // Start opening mouth slightly
        this.lowerJaw.rotation.x = 0.2; // Small opening
        console.log(`🐊 Alert state: mesh at y=${this.mesh.position.y.toFixed(1)}, head visible, mouth opening`);
        break;
        
      case 'attacking':
        // Fully emerged for explosive attack
        this.mesh.position.y = this.position.y + 1.5;
        this.mesh.children.forEach(child => {
          child.visible = true;
        });
        // Wide mouth opening for attack
        this.lowerJaw.rotation.x = 0.8; // Maximum jaw opening (~45 degrees)
        console.log(`🐊 Attacking state: mesh at y=${this.mesh.position.y.toFixed(1)}, fully emerged, mouth wide open`);
        break;
        
      case 'grabbing':
        // Holding tiger - mouth closed on prey
        this.mesh.position.y = this.position.y + 1.2;
        this.mesh.children.forEach(child => {
          child.visible = true;
        });
        // Mouth closed tight on prey
        this.lowerJaw.rotation.x = 0.1; // Almost closed
        console.log(`🐊 Grabbing state: mouth closed on prey`);
        break;
        
      case 'retreating':
        // Quickly submerging
        this.mesh.position.y = this.position.y;
        this.mesh.children.forEach(child => {
          child.visible = true;
        });
        this.lowerJaw.rotation.x = 0; // Mouth closed
        console.log(`🐊 Retreating state: rapidly submerging`);
        break;
        
      case 'cooldown':
        // Mostly submerged, repositioning
        this.mesh.position.y = this.position.y;
        this.headContainer.visible = true;
        this.headContainer.position.y = 0.5; // Just eyes visible
        this.lowerJaw.rotation.x = 0; // Mouth closed
        // Hide body parts
        this.mesh.children.forEach(child => {
          if (child !== this.headContainer) {
            child.visible = false;
          }
        });
        console.log(`🐊 Cooldown state: mostly hidden, repositioning`);
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
    
    // Validate position before updating mesh
    if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
      console.error(`🐊 NaN position detected! Resetting to original position`, {
        current: { x: this.position.x, y: this.position.y, z: this.position.z },
        original: { x: this.originalPosition.x, y: this.originalPosition.y, z: this.originalPosition.z }
      });
      
      // Reset to original position
      this.position.copy(this.originalPosition);
      
      // If original position is also invalid, use water body center
      if (isNaN(this.position.y)) {
        if (this.waterBody && this.waterBody.mesh && this.waterBody.mesh.position) {
          this.position.y = this.waterBody.mesh.position.y - 0.5;
        } else {
          this.position.y = 0;
        }
      }
    }
    
    // Update mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
  }
  
  /**
   * Handle grabbing state - holding tiger for 5 seconds
   */
  handleGrabbingState(tiger, distance) {
    if (!this.grabbedTiger || !this.isGrabbing) {
      // Lost the grab somehow
      console.log(`🐊 Lost grab - entering cooldown`);
      this.setState('cooldown');
      this.releaseGrab();
      return;
    }
    
    // Apply initial bite damage once
    if (!this.hasDealtInitialBite) {
      const biteDamage = this.getInitialBiteDamage(tiger);
      tiger.takeDamage(biteDamage, this);
      console.log(`🐊 Initial bite damage: ${biteDamage}`);
      this.hasDealtInitialBite = true;
    }
    
    // Apply continuous damage while holding
    const holdDamage = this.getHoldDamagePerSecond(tiger) * 0.016; // Per frame
    tiger.takeDamage(holdDamage, this);
    
    // Pull tiger toward water center
    this.pullTigerToWater(tiger);
    
    // Check if grab duration is complete
    if (this.stateTimer >= this.grabbingDuration) {
      console.log(`🐊 5-second grab complete - releasing tiger and retreating`);
      this.releaseGrab();
      this.setState('retreating');
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
        
      case 'grabbing':
        this.handleGrabbingState(tiger, distanceToTiger);
        break;
        
      case 'retreating':
        this.handleRetreatingState();
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
    // Simplified detection: attack if tiger is within detection radius
    if (distance <= this.detectionRadius) {
      console.log(`🐊 Crocodile detected tiger at distance ${distance.toFixed(1)} - entering alert state`);
      this.setState('alert');
      this.target = tiger;
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
   * Handle retreating state - move away from attack location
   */
  handleRetreatingState() {
    if (!this.waterBody || !this.waterBody.center) {
      this.setState('cooldown');
      return;
    }
    
    // Move toward water center at retreat speed
    const retreatDirection = new THREE.Vector3();
    retreatDirection.subVectors(this.waterBody.center, this.position);
    retreatDirection.y = 0;
    retreatDirection.normalize();
    
    const retreatSpeed = 15.0; // Fast retreat
    const retreatDistance = retreatSpeed * 0.016; // Per frame
    
    this.position.x += retreatDirection.x * retreatDistance;
    this.position.z += retreatDirection.z * retreatDistance;
    
    // Gradually submerge during retreat
    const retreatProgress = this.stateTimer / this.retreatingDuration;
    // Ensure we have a valid Y position
    if (isNaN(this.position.y) || isNaN(this.originalPosition.y)) {
      console.error(`🐊 Invalid Y position during retreat! position.y: ${this.position.y}, originalPosition.y: ${this.originalPosition.y}`);
      // Reset to water level
      if (this.waterBody && this.waterBody.mesh && this.waterBody.mesh.position) {
        this.position.y = this.waterBody.mesh.position.y - 0.5;
      } else if (this.waterSystem) {
        this.position.y = this.waterSystem.waterLevel - 1.5;
      } else {
        this.position.y = 0; // Fallback
      }
    } else {
      const targetY = this.originalPosition.y - 1.5; // Deeper than original
      this.position.y = this.position.y + (targetY - this.position.y) * 0.1;
    }
    
    if (this.stateTimer >= this.retreatingDuration) {
      console.log(`🐊 Retreat complete - entering cooldown`);
      this.setState('cooldown');
      
      // Reposition during cooldown
      this.repositionToNewAmbushSpot();
    }
  }
  
  /**
   * Handle cooldown state - recovery and repositioning
   */
  handleCooldownState() {
    if (this.stateTimer >= this.cooldownDuration) {
      console.log(`🐊 Crocodile cooldown complete - ready for next ambush`);
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
      this.updateDebugVisualization();
    }
  }
  
  /**
   * Initiate attack sequence
   */
  initiateAttack(tiger) {
    this.isAttacking = true;
    this.hasAttacked = false;
    
    // Calculate attack direction (horizontal only)
    this.attackDirection.subVectors(tiger.position, this.position);
    this.attackDirection.y = 0; // Keep attack horizontal
    this.attackDirection.normalize();
    
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
    
    if (attackProgress < 0.2) {
      // Explosive emergence phase - burst from water
      this.emergenceHeight = (attackProgress / 0.2) * (attackProgress / 0.2); // Accelerating emergence
      // No horizontal movement yet - pure vertical explosion
      console.log(`🐊 Emerging explosively: ${(this.emergenceHeight * 100).toFixed(0)}%`);
    } else if (attackProgress < 0.7) {
      // Lightning-fast lunge phase
      const lungeProgress = (attackProgress - 0.2) / 0.5; // 0 to 1
      
      // Aggressive forward movement
      this.velocity.copy(this.attackDirection).multiplyScalar(this.speed * 1.5); // 50% faster lunge
      
      // Store current Y to prevent corruption
      const currentY = this.position.y;
      this.position.add(this.velocity.clone().multiplyScalar(0.016));
      
      // Maintain Y position during horizontal lunge
      if (!isNaN(currentY)) {
        this.position.y = currentY;
      }
      
      // Check for hit during lunge - multiple chances for contact
      if (!this.hasAttacked && this.canHitTarget(tiger)) {
        this.executeAttackHit(tiger);
      }
      
      console.log(`🐊 Lunging at tiger: distance ${this.getDistanceToTiger(tiger).toFixed(1)}`);
    } else {
      // Quick recovery phase - return to ambush position
      const recoveryDirection = new THREE.Vector3()
        .subVectors(this.originalPosition, this.position);
      recoveryDirection.y = 0; // Only move horizontally
      recoveryDirection.normalize();
      
      this.velocity.copy(recoveryDirection).multiplyScalar(this.speed * 0.8);
      
      // Store current Y to prevent corruption
      const currentY = this.position.y;
      this.position.add(this.velocity.clone().multiplyScalar(0.016));
      
      // Maintain Y position during recovery
      if (!isNaN(currentY)) {
        this.position.y = currentY;
      }
      
      console.log(`🐊 Recovering to ambush position`);
    }
  }
  
  /**
   * Execute attack hit on tiger
   */
  executeAttackHit(tiger) {
    this.hasAttacked = true;
    console.log(`🐊 Crocodile grabbed tiger! Starting 5-second hold...`);
    
    // Transition to grabbing state
    this.setState('grabbing');
    this.startGrab(tiger);
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
   * Get distance to tiger with NaN protection
   */
  getDistanceToTiger(tiger) {
    // Validate positions to prevent NaN
    if (!tiger || !tiger.position || !this.position) {
      console.warn('🐊 Invalid positions in distance calculation');
      return Infinity;
    }
    
    // Check for NaN coordinates
    if (isNaN(tiger.position.x) || isNaN(tiger.position.y) || isNaN(tiger.position.z) ||
        isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
      console.error('🐊 NaN coordinates detected!', {
        tiger: { x: tiger.position.x, y: tiger.position.y, z: tiger.position.z },
        crocodile: { x: this.position.x, y: this.position.y, z: this.position.z }
      });
      return Infinity;
    }
    
    const distance = this.position.distanceTo(tiger.position);
    
    // Final NaN check on result
    if (isNaN(distance)) {
      console.error('🐊 Distance calculation returned NaN!');
      return Infinity;
    }
    
    return distance;
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
    
    // Enhanced detection: Tiger is approaching if within 8 units of water edge
    // This includes tigers both inside and outside the water body
    if (distanceToCenter <= waterRadius) {
      // Tiger is inside water body - always trigger (drinking, wading)
      return true;
    } else {
      // Tiger is outside - trigger if within 8 units of edge
      const distanceFromEdge = distanceToCenter - waterRadius;
      return distanceFromEdge <= 8.0;
    }
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
    // Crocodiles have thick armor - reduce damage by 40%
    const reducedDamage = Math.floor(amount * 0.6);
    this.health = Math.max(0, this.health - reducedDamage);
    console.log(`🐊 Crocodile took ${amount} damage (reduced to ${reducedDamage} due to armor) (health: ${this.health})`);
    
    // Become aggressive when attacked
    if (this.state === 'hidden' && attacker) {
      console.log(`🐊 Crocodile enraged by attack - becoming aggressive!`);
      this.setState('alert');
      this.target = attacker;
    }
    
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
   * Start grab on tiger
   */
  startGrab(tiger) {
    this.isGrabbing = true;
    this.grabbedTiger = tiger;
    this.hasDealtInitialBite = false;
    
    // Lock tiger movement
    if (tiger.setMovementLocked) {
      tiger.setMovementLocked(true);
    }
    
    console.log(`🐊 Grab started - tiger movement locked for ${this.grabbingDuration} seconds`);
  }
  
  /**
   * Release grab
   */
  releaseGrab() {
    if (this.grabbedTiger && this.grabbedTiger.setMovementLocked) {
      this.grabbedTiger.setMovementLocked(false);
    }
    
    this.isGrabbing = false;
    this.grabbedTiger = null;
    this.hasDealtInitialBite = false;
    
    console.log(`🐊 Grab released - tiger can move again`);
  }
  
  /**
   * Get initial bite damage based on tiger stage
   */
  getInitialBiteDamage(tiger) {
    const damageByStage = {
      'Young': 30,
      'Adult': 50,
      'Alpha': 70
    };
    return damageByStage[tiger.evolutionStage] || 50;
  }
  
  /**
   * Get hold damage per second based on tiger stage
   */
  getHoldDamagePerSecond(tiger) {
    const damageByStage = {
      'Young': 10,
      'Adult': 15,
      'Alpha': 20
    };
    return damageByStage[tiger.evolutionStage] || 15;
  }
  
  /**
   * Pull tiger toward water center
   */
  pullTigerToWater(tiger) {
    if (!this.waterBody || !this.waterBody.center) return;
    
    // Calculate pull direction toward water center
    const pullDirection = new THREE.Vector3();
    pullDirection.subVectors(this.waterBody.center, tiger.position);
    pullDirection.y = 0; // Only pull horizontally
    pullDirection.normalize();
    
    // Pull speed: 5 units per second
    const pullSpeed = 5.0;
    const pullDistance = pullSpeed * 0.016; // Per frame
    
    // Move tiger position
    tiger.position.x += pullDirection.x * pullDistance;
    tiger.position.z += pullDirection.z * pullDistance;
    
    // Also move crocodile with the tiger
    this.position.x += pullDirection.x * pullDistance * 0.5; // Crocodile moves slower
    this.position.z += pullDirection.z * pullDistance * 0.5;
    
    // Create splash effects periodically
    if (Math.floor(this.stateTimer * 4) !== Math.floor((this.stateTimer - 0.016) * 4)) {
      this.createWaterSplash();
    }
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
   * Enable/disable debug visualization
   */
  setDebugMode(enabled, scene = null) {
    this.debugMode = enabled;
    
    if (enabled && scene) {
      this.createDebugVisualization(scene);
    } else {
      this.removeDebugVisualization(scene);
    }
  }

  /**
   * Create debug visualization helpers
   */
  createDebugVisualization(scene) {
    if (!scene) return;
    
    // Detection range circle (red wireframe)
    const detectionGeometry = new THREE.RingGeometry(
      this.detectionRadius - 0.5, 
      this.detectionRadius + 0.5, 
      32
    );
    const detectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    this.detectionRangeHelper = new THREE.Mesh(detectionGeometry, detectionMaterial);
    this.detectionRangeHelper.position.copy(this.position);
    this.detectionRangeHelper.position.y += 2; // Slightly above water
    this.detectionRangeHelper.rotation.x = -Math.PI / 2; // Lay flat
    scene.add(this.detectionRangeHelper);
    
    // Attack range circle (orange wireframe)
    const attackGeometry = new THREE.RingGeometry(
      this.attackRange - 0.5,
      this.attackRange + 0.5,
      32
    );
    const attackMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    this.attackRangeHelper = new THREE.Mesh(attackGeometry, attackMaterial);
    this.attackRangeHelper.position.copy(this.position);
    this.attackRangeHelper.position.y += 1.5; // Slightly below detection range
    this.attackRangeHelper.rotation.x = -Math.PI / 2;
    scene.add(this.attackRangeHelper);
    
    // State indicator (colored sphere above crocodile)
    const indicatorGeometry = new THREE.SphereGeometry(1, 8, 6);
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.stateIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.stateIndicator.position.copy(this.position);
    this.stateIndicator.position.y += 5; // High above crocodile
    scene.add(this.stateIndicator);
    
    this.updateDebugVisualization();
  }

  /**
   * Update debug visualization based on current state
   */
  updateDebugVisualization() {
    if (!this.debugMode || !this.stateIndicator) return;
    
    // Update state indicator color
    switch (this.state) {
      case 'hidden':
        this.stateIndicator.material.color.setHex(0x0066cc); // Blue - hidden
        break;
      case 'alert':
        this.stateIndicator.material.color.setHex(0xffff00); // Yellow - alert
        break;
      case 'attacking':
        this.stateIndicator.material.color.setHex(0xff0000); // Red - attacking
        break;
      case 'cooldown':
        this.stateIndicator.material.color.setHex(0x00ff00); // Green - cooldown
        break;
      default:
        this.stateIndicator.material.color.setHex(0x888888); // Gray - unknown
    }
    
    // Update positions
    if (this.detectionRangeHelper) {
      this.detectionRangeHelper.position.copy(this.position);
      this.detectionRangeHelper.position.y += 2;
    }
    
    if (this.attackRangeHelper) {
      this.attackRangeHelper.position.copy(this.position);
      this.attackRangeHelper.position.y += 1.5;
    }
    
    if (this.stateIndicator) {
      this.stateIndicator.position.copy(this.position);
      this.stateIndicator.position.y += 5;
    }
  }

  /**
   * Remove debug visualization
   */
  removeDebugVisualization(scene) {
    if (scene && this.detectionRangeHelper) {
      scene.remove(this.detectionRangeHelper);
      this.detectionRangeHelper.geometry.dispose();
      this.detectionRangeHelper.material.dispose();
      this.detectionRangeHelper = null;
    }
    
    if (scene && this.attackRangeHelper) {
      scene.remove(this.attackRangeHelper);
      this.attackRangeHelper.geometry.dispose();
      this.attackRangeHelper.material.dispose();
      this.attackRangeHelper = null;
    }
    
    if (scene && this.stateIndicator) {
      scene.remove(this.stateIndicator);
      this.stateIndicator.geometry.dispose();
      this.stateIndicator.material.dispose();
      this.stateIndicator = null;
    }
  }

  /**
   * Dispose of crocodile
   */
  dispose() {
    // Clean up drag effects
    this.isDragging = false;
    this.target = null;
    this.dragTimer = 0;
    
    // Clean up debug visualization
    this.removeDebugVisualization(null); // Scene reference not available here
    
    if (this.mesh) {
      this.mesh.clear();
      this.mesh = null;
    }
    console.log('🐊 CrocodileAmbush: Disposed');
  }
}
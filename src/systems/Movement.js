import * as THREE from 'three';

export class MovementSystem {
  constructor(tiger, terrain = null, waterSystem = null) {
    if (!tiger) {
      throw new Error('Tiger is required for MovementSystem');
    }

    this.tiger = tiger;
    this.terrain = terrain;
    this.waterSystem = waterSystem;

    // Movement state
    this.isMoving = false;
    this.isRunning = false;
    this.isCrouching = false;
    this.isJumping = false;
    this.isSwimming = false;

    // Input direction (normalized)
    this.inputDirection = new THREE.Vector3(0, 0, 0);

    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = 50; // Units per second squared
    this.groundFriction = 0.85; // Base friction coefficient
    this.lilyPadFriction = 0.7; // Higher friction on lily pads for precise control
    this.jumpForce = 15; // Jump impulse force
    this.gravity = -30; // Gravity acceleration
    this.isGrounded = true;

    // Movement multipliers
    this.runSpeedMultiplier = 1.5;
    this.crouchSpeedMultiplier = 0.5;
    this.staminaSpeedReduction = 0.3; // Speed reduction when low stamina
    this.swimSpeedMultiplier = 0.7; // Swimming is slower than running

    // Rotation properties
    this.rotationInput = 0; // Current rotation input (-1 to 1)
    this.rotationSpeed = 3.0; // Rotation speed in radians per second
    this.minimumMovementThreshold = 0.01; // Prevent micro-movements
  }

  setWaterSystem(waterSystem) {
    this.waterSystem = waterSystem;
  }

  updateSwimmingState() {
    if (!this.waterSystem) {
      this.isSwimming = false;
      return;
    }

    // Check if tiger is on a lily pad first
    const isOnLilyPad = this.waterSystem.isOnLilyPad(this.tiger.position.x, this.tiger.position.z);
    
    if (isOnLilyPad) {
      // Tiger is on lily pad - not swimming, can jump normally
      this.isSwimming = false;
      return;
    }

    // Check if tiger is in water and get depth
    const wasSwimming = this.isSwimming;
    const isInWater = this.waterSystem.isInWater(this.tiger.position.x, this.tiger.position.z);
    const waterDepth = this.waterSystem.getWaterDepth(this.tiger.position.x, this.tiger.position.z);
    
    // Only consider it "swimming" if in deep enough water (>1.5 units deep)
    // This allows jumping in shallow water near shores
    this.isSwimming = isInWater && waterDepth > 1.5;

    // Log swimming state changes
    if (wasSwimming !== this.isSwimming) {
      console.log(`🏊 SWIMMING STATE: ${wasSwimming ? 'Swimming' : 'Land'} -> ${this.isSwimming ? 'Swimming' : 'Land'} (depth: ${waterDepth.toFixed(1)})`);
    }
  }

  setMovementInput(input) {
    // Tank controls - separate movement from rotation
    const { direction, rotation, isRunning, isCrouching, isJumping } = input;
    
    // Store previous state for comparison
    const prevMoving = this.isMoving;
    
    // Store movement input (forward/backward only)
    this.inputDirection.set(0, 0, direction.z);
    
    // Store rotation input separately
    this.rotationInput = rotation || 0;
    
    // Update movement state - only forward/backward movement counts as "moving"
    const movementMagnitude = Math.abs(direction.z);
    this.isMoving = movementMagnitude > 0.01;
    this.isRunning = isRunning && this.isMoving;
    this.isCrouching = isCrouching;
    this.isJumping = isJumping;
    
    // Log significant state changes for debugging
    if (prevMoving !== this.isMoving) {
      console.log(`🐅 MOVEMENT STATE: ${prevMoving ? 'Moving' : 'Stopped'} -> ${this.isMoving ? 'Moving' : 'Stopped'}, movement: ${movementMagnitude.toFixed(3)}, rotation: ${this.rotationInput.toFixed(3)}`);
    }
  }

  getCurrentFriction() {
    // Check if tiger is on a lily pad for enhanced friction
    if (this.waterSystem && this.waterSystem.isOnLilyPad(this.tiger.position.x, this.tiger.position.z)) {
      return this.lilyPadFriction; // Much stronger friction on lily pads
    }
    
    return this.groundFriction; // Normal ground friction
  }

  getCurrentSpeed() {
    let speed = this.tiger.speed;

    // Apply movement modifiers
    if (this.isSwimming) {
      speed *= this.swimSpeedMultiplier;
      // No running or crouching while swimming
    } else if (this.isRunning) {
      speed *= this.runSpeedMultiplier;
    } else if (this.isCrouching) {
      speed *= this.crouchSpeedMultiplier;
    }

    // Reduce speed based on stamina (when stamina < 30%)
    const staminaRatio = this.tiger.stamina / 300; // Assuming max stamina is 300
    if (staminaRatio < 0.3) {
      const staminaMultiplier = 0.5 + (staminaRatio / 0.3) * 0.5; // 0.5 to 1.0
      speed *= staminaMultiplier;
    }

    return speed;
  }

  updateRotation(deltaTime) {
    // Tank controls - direct rotation based on A/D input
    if (Math.abs(this.rotationInput) > this.minimumMovementThreshold) {
      // Apply rotation directly based on input
      const rotationChange = this.rotationInput * this.rotationSpeed * deltaTime;
      this.tiger.rotation.y += rotationChange;
      
      // Normalize rotation to [-π, π]
      while (this.tiger.rotation.y > Math.PI) this.tiger.rotation.y -= 2 * Math.PI;
      while (this.tiger.rotation.y < -Math.PI) this.tiger.rotation.y += 2 * Math.PI;
    }
  }

  applyMovementForces(deltaTime) {
    // Tank controls - movement only in tiger's facing direction
    const forwardBackward = this.inputDirection.z; // -1 for forward, +1 for backward
    
    // Check if there's any movement input
    const hasMovementInput = Math.abs(forwardBackward) > this.minimumMovementThreshold;
    
    if (!hasMovementInput) {
      // Apply friction when not moving - use stronger friction on lily pads
      const frictionMultiplier = this.getCurrentFriction();
      this.velocity.x *= frictionMultiplier;
      this.velocity.z *= frictionMultiplier;
      return;
    }

    // Calculate target velocity based on tiger's facing direction
    const speed = this.getCurrentSpeed();
    
    // Get tiger's forward direction vector
    // Tiger faces positive Z at rotation 0 (forward in Three.js coordinate system)
    const tigerRotation = this.tiger.rotation ? this.tiger.rotation.y : 0;
    
    // Calculate forward direction using trigonometry
    // At rotation = 0: tiger faces +Z (forward)
    // As rotation increases (counter-clockwise): direction changes
    const forwardX = Math.sin(tigerRotation);   // X component of forward vector
    const forwardZ = Math.cos(tigerRotation);   // Z component of forward vector
    
    
    // Apply movement in tiger's facing direction
    // Note: forwardBackward is positive for forward (W), negative for backward (S)
    // Tiger faces positive Z, so W should move in positive Z direction
    const targetVelocityX = forwardX * forwardBackward * speed;
    const targetVelocityZ = forwardZ * forwardBackward * speed;

    // Tank controls: immediately change direction, smoothly change speed
    if (hasMovementInput) {
      // Enhanced acceleration on lily pads for more responsive control
      const baseAcceleration = this.acceleration;
      const isOnLilyPad = this.waterSystem && this.waterSystem.isOnLilyPad(this.tiger.position.x, this.tiger.position.z);
      const accelerationMultiplier = isOnLilyPad ? 1.5 : 1.0; // Faster response on lily pads
      
      const accelerationFactor = Math.min(1.0, baseAcceleration * accelerationMultiplier * deltaTime);
      this.velocity.x = this.velocity.x + (targetVelocityX - this.velocity.x) * accelerationFactor;
      this.velocity.z = this.velocity.z + (targetVelocityZ - this.velocity.z) * accelerationFactor;
    } else {
      // Apply friction when not moving - use enhanced friction
      const frictionMultiplier = this.getCurrentFriction();
      this.velocity.x *= frictionMultiplier;
      this.velocity.z *= frictionMultiplier;
    }
  }

  applyJump() {
    if (this.isJumping) {
      if (this.isSwimming) {
        // Swimming: jump input makes tiger swim upward
        this.velocity.y = this.jumpForce * 0.5; // Reduced force for swimming
      } else if (this.isGrounded) {
        // Land: normal jump
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
      // Reset jumping state after applying jump force (one-time action)
      this.isJumping = false;
    }
  }

  applyGravity(deltaTime) {
    if (this.isSwimming) {
      // Swimming: apply buoyancy and water resistance
      const buoyancy = 15; // Upward force in water
      const waterResistance = 0.8; // Damping factor for vertical movement
      
      this.velocity.y += (buoyancy + this.gravity * 0.3) * deltaTime; // Reduced gravity in water
      this.velocity.y *= waterResistance; // Damping
    } else if (!this.isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
    }
  }

  updatePosition(deltaTime) {
    // Update position based on velocity
    this.tiger.position.x += this.velocity.x * deltaTime;
    this.tiger.position.y += this.velocity.y * deltaTime;
    this.tiger.position.z += this.velocity.z * deltaTime;

    // Terrain and water collision detection
    if (this.terrain) {
      const terrainHeight = this.terrain.getHeightAt(this.tiger.position.x, this.tiger.position.z);
      const tigerHeight = 1.0; // Tiger's height above ground
      const groundLevel = terrainHeight + tigerHeight;

      // Check if tiger is on a lily pad first
      const lilyPadHeight = this.waterSystem ? this.waterSystem.getLilyPadHeight(this.tiger.position.x, this.tiger.position.z) : null;
      
      if (lilyPadHeight !== null) {
        // Tiger is on a lily pad - treat it like solid ground
        if (this.tiger.position.y <= lilyPadHeight) {
          this.tiger.position.y = lilyPadHeight;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else {
          this.isGrounded = false;
        }
      } else if (this.isSwimming && this.waterSystem) {
        // Swimming mode: maintain tiger at water surface level or below
        const waterDepth = this.waterSystem.getWaterDepth(this.tiger.position.x, this.tiger.position.z);
        const waterSurface = terrainHeight + waterDepth - 0.5; // Water surface level
        
        // Keep tiger submerged but not too deep
        if (this.tiger.position.y > waterSurface) {
          this.tiger.position.y = waterSurface; // Don't go above water surface
        }
        
        // Don't let tiger go below terrain
        if (this.tiger.position.y < groundLevel) {
          this.tiger.position.y = groundLevel;
          this.velocity.y = 0;
        }
        
        this.isGrounded = false; // Never grounded while swimming
      } else {
        // Land mode: normal terrain collision
        if (this.tiger.position.y <= groundLevel) {
          this.tiger.position.y = groundLevel;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else {
          this.isGrounded = false;
        }
      }

      // Handle steep slope sliding
      const slope = this.terrain.getSlope(this.tiger.position.x, this.tiger.position.z);
      if (slope > 0.7 && this.isGrounded) {
        // Get slope normal for sliding direction
        const normal = this.terrain.getNormal(this.tiger.position.x, this.tiger.position.z);
        const slideForce = (slope - 0.7) * 20; // Sliding strength
        
        // Apply sliding force in direction of steepest descent (opposite of normal x,z)
        this.velocity.x -= normal.x * slideForce * deltaTime;
        this.velocity.z -= normal.z * slideForce * deltaTime;
      }
    } else {
      // Fallback: simple ground collision at y=0
      if (this.tiger.position.y <= 0) {
        this.tiger.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }
  }

  updateTigerState() {
    let newState = 'idle';

    if (this.isCrouching) {
      newState = 'crouching';
    } else if (this.isRunning) {
      newState = 'running';
    } else if (this.isMoving) {
      newState = 'walking';
    }

    this.tiger.setState(newState);
  }

  consumeStamina(deltaTime) {
    // Only consume stamina when running and moving
    if (this.isRunning && this.isMoving) {
      const staminaCost = 30; // Stamina per second when running
      this.tiger.consumeStamina(staminaCost * deltaTime);
    }
  }

  update(deltaTime) {
    if (!this.tiger || !this.tiger.isAlive()) {
      return;
    }

    // Clamp delta time to prevent large jumps
    deltaTime = Math.max(0, Math.min(deltaTime, 0.1));

    // Store position before update for logging
    const prevPosition = new THREE.Vector3(this.tiger.position.x, this.tiger.position.y, this.tiger.position.z);
    const prevRotation = this.tiger.rotation ? this.tiger.rotation.y : 0;

    // Check if tiger is in water
    this.updateSwimmingState();

    // Update tiger rotation based on left/right input
    this.updateRotation(deltaTime);

    // Apply movement forces based on forward/backward input
    this.applyMovementForces(deltaTime);

    // Handle jumping (or swimming up/down)
    this.applyJump();

    // Apply gravity (modified for swimming)
    this.applyGravity(deltaTime);

    // Update position
    this.updatePosition(deltaTime);

    // Update tiger state
    this.updateTigerState();

    // Consume stamina if needed
    this.consumeStamina(deltaTime);

    // Log movement data when there's input or position changes (throttled)
    const positionChanged = Math.abs(this.tiger.position.x - prevPosition.x) > 0.01 || 
                           Math.abs(this.tiger.position.y - prevPosition.y) > 0.01 || 
                           Math.abs(this.tiger.position.z - prevPosition.z) > 0.01;
    
    if (this.isMoving || positionChanged) {
      this.logCounter = (this.logCounter || 0) + 1;
      if (this.logCounter % 60 === 0) { // Log every 60 frames
        this.logMovementData(deltaTime, prevPosition, prevRotation);
      }
    }
  }

  logMovementData(deltaTime, prevPosition, prevRotation) {
    const currentRotation = this.tiger.rotation ? this.tiger.rotation.y : 0;
    const currentPosition = new THREE.Vector3(this.tiger.position.x, this.tiger.position.y, this.tiger.position.z);
    const positionDelta = currentPosition.sub(prevPosition);
    const rotationDelta = currentRotation - prevRotation;
    
    console.log('🐅 TIGER MOVEMENT:', JSON.stringify({
      deltaTime: deltaTime.toFixed(4),
      position: {
        x: this.tiger.position.x.toFixed(2),
        y: this.tiger.position.y.toFixed(2),
        z: this.tiger.position.z.toFixed(2)
      },
      rotation: {
        y: (currentRotation * 180 / Math.PI).toFixed(1) + '°'
      },
      input: {
        direction: {
          x: this.inputDirection.x.toFixed(2),
          z: this.inputDirection.z.toFixed(2)
        },
        isMoving: this.isMoving,
        isRunning: this.isRunning
      },
      velocity: {
        x: this.velocity.x.toFixed(2),
        y: this.velocity.y.toFixed(2),
        z: this.velocity.z.toFixed(2),
        magnitude: this.velocity.length().toFixed(2)
      },
      deltas: {
        position: {
          x: positionDelta.x.toFixed(3),
          y: positionDelta.y.toFixed(3),
          z: positionDelta.z.toFixed(3)
        },
        rotation: (rotationDelta * 180 / Math.PI).toFixed(1) + '°'
      },
      state: this.tiger.state,
      isGrounded: this.isGrounded
    }, null, 2));
  }

  // Helper methods for debugging/testing
  getVelocity() {
    return this.velocity.clone();
  }

  setVelocity(x, y, z) {
    this.velocity.set(x, y, z);
  }

  reset() {
    this.velocity.set(0, 0, 0);
    this.inputDirection.set(0, 0, 0);
    this.isMoving = false;
    this.isRunning = false;
    this.isCrouching = false;
    this.isJumping = false;
    this.isGrounded = true;
    this.targetRotation = 0;
    if (this.tiger && this.tiger.rotation) {
      this.tiger.rotation.y = 0;
    }
  }

  // Set terrain for collision detection
  setTerrain(terrain) {
    this.terrain = terrain;
  }

  // Get current terrain height at tiger position
  getCurrentTerrainHeight() {
    if (!this.terrain) return 0;
    return this.terrain.getHeightAt(this.tiger.position.x, this.tiger.position.z);
  }

  // Handle terrain collision (for compatibility with tests)
  handleTerrainCollision(deltaTime) {
    // This is just the terrain collision part of updatePosition
    if (this.terrain) {
      // Get terrain height at tiger's x,z position
      const terrainHeight = this.terrain.getHeightAt(this.tiger.position.x, this.tiger.position.z);
      const tigerHeight = 1.0; // Tiger's height above ground
      const groundLevel = terrainHeight + tigerHeight;

      // If tiger is at or below ground level, place on terrain
      if (this.tiger.position.y <= groundLevel) {
        this.tiger.position.y = groundLevel;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }

      // Handle steep slope sliding
      const slope = this.terrain.getSlope(this.tiger.position.x, this.tiger.position.z);
      if (slope > 0.7 && this.isGrounded) {
        // Get slope normal for sliding direction
        const normal = this.terrain.getNormal(this.tiger.position.x, this.tiger.position.z);
        const slideForce = (slope - 0.7) * 20; // Sliding strength
        
        // Apply sliding force in direction of steepest descent (opposite of normal x,z)
        this.velocity.x -= normal.x * slideForce * deltaTime;
        this.velocity.z -= normal.z * slideForce * deltaTime;
      }
    } else {
      // Fallback: simple ground collision at y=0
      if (this.tiger.position.y <= 0) {
        this.tiger.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }
  }
}
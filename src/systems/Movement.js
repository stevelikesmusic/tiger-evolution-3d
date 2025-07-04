import * as THREE from 'three';

export class MovementSystem {
  constructor(tiger, terrain = null) {
    if (!tiger) {
      throw new Error('Tiger is required for MovementSystem');
    }

    this.tiger = tiger;
    this.terrain = terrain;

    // Movement state
    this.isMoving = false;
    this.isRunning = false;
    this.isCrouching = false;
    this.isJumping = false;

    // Input direction (normalized)
    this.inputDirection = new THREE.Vector3(0, 0, 0);

    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = 50; // Units per second squared
    this.groundFriction = 0.9; // Friction coefficient
    this.jumpForce = 15; // Jump impulse force
    this.gravity = -30; // Gravity acceleration
    this.isGrounded = true;

    // Movement multipliers
    this.runSpeedMultiplier = 1.5;
    this.crouchSpeedMultiplier = 0.5;
    this.staminaSpeedReduction = 0.3; // Speed reduction when low stamina

    // Rotation properties
    this.targetRotation = 0; // Target rotation angle in radians
    this.rotationSpeed = 3; // Rotation speed in radians per second (slower for gradual turning)
  }

  setMovementInput(input) {
    // Normalize input direction
    const { direction, isRunning, isCrouching, isJumping } = input;
    
    // Store previous state for comparison
    const prevMoving = this.isMoving;
    
    this.inputDirection.set(direction.x, 0, direction.z);
    
    // Normalize if length > 1
    const length = this.inputDirection.length();
    if (length > 1) {
      this.inputDirection.normalize();
    }

    // Update movement state - any directional input counts as "moving"
    // But require a minimum threshold to prevent micro-movements
    this.isMoving = length > 0.01;
    this.isRunning = isRunning && this.isMoving;
    this.isCrouching = isCrouching;
    this.isJumping = isJumping;
    
    // Log significant state changes for debugging
    if (prevMoving !== this.isMoving && (this.isMoving || length > 0.01)) {
      console.log(`🐅 MOVEMENT STATE: ${prevMoving ? 'Moving' : 'Stopped'} -> ${this.isMoving ? 'Moving' : 'Stopped'}, input length: ${length.toFixed(3)}`);
    }
  }

  getCurrentSpeed() {
    let speed = this.tiger.speed;

    // Apply movement modifiers
    if (this.isRunning) {
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
    // Rotate tiger to face movement direction for natural diagonal movement
    if (this.isMoving && this.inputDirection.length() > 0) {
      // Calculate target rotation based on movement direction
      const targetRotation = Math.atan2(-this.inputDirection.x, this.inputDirection.z);
      
      const currentRotation = this.tiger.rotation ? this.tiger.rotation.y : 0;
      
      // Calculate shortest angle difference
      let angleDiff = targetRotation - currentRotation;
      
      // Normalize angle difference to [-π, π]
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Apply smooth rotation toward movement direction
      const rotationChange = this.rotationSpeed * deltaTime;
      const actualChange = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotationChange);
      this.tiger.rotation.y = currentRotation + actualChange;
    }
  }

  applyMovementForces(deltaTime) {
    // Extract movement input
    const forwardBackward = this.inputDirection.z; // -1 for forward, +1 for backward
    const leftRight = this.inputDirection.x; // -1 for left, +1 for right
    
    // Check if there's any movement input
    const hasMovementInput = Math.abs(forwardBackward) > 0.1 || Math.abs(leftRight) > 0.1;
    
    if (!hasMovementInput) {
      // Apply friction when not moving
      this.velocity.x *= this.groundFriction;
      this.velocity.z *= this.groundFriction;
      return;
    }

    // Calculate target velocity based on input direction
    const speed = this.getCurrentSpeed();
    
    // Create movement vector from input (diagonal movement in world space)
    const movementVector = new THREE.Vector3(leftRight, 0, forwardBackward);
    if (movementVector.length() > 1) {
      movementVector.normalize();
    }
    
    // Apply movement in world coordinates for true diagonal movement
    const targetVelocityX = movementVector.x * speed; // Left/right movement (fixed: removed inversion)
    const targetVelocityZ = -movementVector.z * speed; // Forward/backward movement (fixed: added inversion for correct forward direction)

    // Apply acceleration towards target velocity
    const velocityDiffX = targetVelocityX - this.velocity.x;
    const velocityDiffZ = targetVelocityZ - this.velocity.z;
    
    this.velocity.x += velocityDiffX * this.acceleration * deltaTime;
    this.velocity.z += velocityDiffZ * this.acceleration * deltaTime;
  }

  applyJump() {
    if (this.isJumping && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
  }

  applyGravity(deltaTime) {
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
    }
  }

  updatePosition(deltaTime) {
    // Update position based on velocity
    this.tiger.position.x += this.velocity.x * deltaTime;
    this.tiger.position.y += this.velocity.y * deltaTime;
    this.tiger.position.z += this.velocity.z * deltaTime;

    // Terrain collision detection
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

    // Update tiger rotation based on left/right input
    this.updateRotation(deltaTime);

    // Apply movement forces based on forward/backward input
    this.applyMovementForces(deltaTime);

    // Handle jumping
    this.applyJump();

    // Apply gravity
    this.applyGravity(deltaTime);

    // Update position
    this.updatePosition(deltaTime);

    // Update tiger state
    this.updateTigerState();

    // Consume stamina if needed
    this.consumeStamina(deltaTime);

    // Log movement data when there's input or position changes (throttled)
    if (this.isMoving || this.tiger.position.distanceTo(prevPosition) > 0.01) {
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
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
    
    this.inputDirection.set(direction.x, 0, direction.z);
    
    // Normalize if length > 1
    const length = this.inputDirection.length();
    if (length > 1) {
      this.inputDirection.normalize();
    }

    // Update movement state - any directional input counts as "moving"
    this.isMoving = length > 0;
    this.isRunning = isRunning && this.isMoving;
    this.isCrouching = isCrouching;
    this.isJumping = isJumping;
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
    const targetVelocityX = -movementVector.x * speed; // Left/right movement
    const targetVelocityZ = movementVector.z * speed; // Forward/backward movement

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
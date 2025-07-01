import * as THREE from 'three';

export class MovementSystem {
  constructor(tiger) {
    if (!tiger) {
      throw new Error('Tiger is required for MovementSystem');
    }

    this.tiger = tiger;

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

    // Update movement state
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

  applyMovementForces(deltaTime) {
    if (!this.isMoving) {
      // Apply friction when not moving
      this.velocity.x *= this.groundFriction;
      this.velocity.z *= this.groundFriction;
      return;
    }

    // Calculate target velocity based on input
    const speed = this.getCurrentSpeed();
    const targetVelocity = this.inputDirection.clone().multiplyScalar(speed);

    // Apply acceleration towards target velocity
    const velocityDiff = targetVelocity.clone().sub(
      new THREE.Vector3(this.velocity.x, 0, this.velocity.z)
    );
    
    const accelerationForce = velocityDiff.multiplyScalar(this.acceleration * deltaTime);
    
    this.velocity.x += accelerationForce.x;
    this.velocity.z += accelerationForce.z;
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

    // Ground collision (simple)
    if (this.tiger.position.y <= 0) {
      this.tiger.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
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

    // Apply movement forces
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
  }
}
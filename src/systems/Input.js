export class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Keyboard state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      run: false,
      interact: false,
      mateTrail: false,
      diving: false,
      forward_underwater: false,
      backward_underwater: false,
      left_underwater: false,
      right_underwater: false,
      hunt: false,
      Escape: false,
      scentTrail: false,
      mateTrail: false,
      diving: false,
      laserBreath: false
    };
    
    // Track which keys are currently physically pressed
    this.physicalKeys = new Set();
    
    // Debounce timer for key state validation
    this.keyValidationTimer = null;

    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      leftButton: false,
      rightButton: false
    };

    // Touch/virtual controls for mobile
    this.virtualMovement = {
      x: 0,
      z: 0
    };

    // Callbacks
    this.onMouseWheel = null;
    this.onPointerLockChange = null;

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Add blur and focus handlers to reset keys when window loses focus
    window.addEventListener('blur', () => this.resetAllKeys());
    window.addEventListener('focus', () => this.resetAllKeys());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.resetAllKeys();
      }
    });
    
    // Emergency key reset on pointer lock change
    document.addEventListener('pointerlockchange', () => {
      // Small delay to prevent interfering with normal pointer lock flow
      setTimeout(() => this.validateKeyStates(), 50);
    });

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('wheel', this.handleMouseWheel);

    // Pointer lock events
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  // Keyboard event handlers
  handleKeyDown(event) {
    // Prevent repeated keydown events
    if (event.repeat) return;
    
    // Track physical key press
    this.physicalKeys.add(event.code);
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.jump = true;
        event.preventDefault(); // Prevent page scroll
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.crouch = true;
        break;
      case 'KeyE':
        this.keys.interact = true;
        break;
      case 'KeyR':
        this.keys.diving = true; // R = diving (only in water)
        break;
      case 'KeyT':
        this.keys.forward_underwater = true;
        break;
      case 'KeyG':
        this.keys.backward_underwater = true;
        break;
      case 'KeyF':
        this.keys.left = true; // F = left in underwater mode
        break;
      case 'KeyH':
        this.keys.right = true; // H = right in underwater mode
        break;
      case 'KeyQ':
        this.keys.left_underwater = true; // Q = rotate left underwater
        break;
      case 'KeyE':
        this.keys.right_underwater = true; // E = rotate right underwater
        break;
      case 'KeyZ':
        this.keys.hunt = true; // Z = hunt/attack
        console.log('🎯 Z key pressed - hunt = true');
        break;
      case 'KeyM':
        this.keys.scentTrail = true; // M = prey scent trail
        console.log('🟣 M key pressed - prey scent trail = true');
        break;
      case 'KeyU':
        this.keys.mateTrail = true; // U = mate scent trail
        console.log('💕 U key pressed - mate scent trail = true');
        break;
      case 'Escape':
        this.keys.Escape = true; // Escape = menu
        console.log('🎮 Escape key pressed - menu toggle');
        break;
      case 'KeyL':
        this.keys.laserBreath = true; // L = laser breath (Alpha only)
        console.log('🔴 L key pressed - laser breath = true');
        break;
    }
    
    // Schedule key validation
    this.scheduleKeyValidation();
  }

  handleKeyUp(event) {
    // Remove from physical key tracking
    this.physicalKeys.delete(event.code);
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.keys.crouch = false;
        break;
      case 'KeyE':
        this.keys.interact = false;
        break;
      case 'KeyR':
        this.keys.diving = false; // R = diving (only in water)
        break;
      case 'KeyT':
        this.keys.forward_underwater = false;
        break;
      case 'KeyG':
        this.keys.backward_underwater = false;
        break;
      case 'KeyF':
        this.keys.left = false; // F = left in underwater mode
        break;
      case 'KeyH':
        this.keys.right = false; // H = right in underwater mode
        break;
      case 'KeyQ':
        this.keys.left_underwater = false; // Q = rotate left underwater
        break;
      case 'KeyE':
        this.keys.right_underwater = false; // E = rotate right underwater
        break;
      case 'KeyZ':
        this.keys.hunt = false; // Z = hunt/attack
        console.log('🎯 Z key released - hunt = false');
        break;
      case 'KeyM':
        this.keys.scentTrail = false; // M = prey scent trail
        console.log('🟣 M key released - prey scent trail = false');
        break;
      case 'KeyU':
        this.keys.mateTrail = false; // U = mate scent trail
        console.log('💕 U key released - mate scent trail = false');
        break;
      case 'Escape':
        this.keys.Escape = false; // Escape = menu
        console.log('🎮 Escape key released');
        break;
      case 'KeyL':
        this.keys.laserBreath = false; // L = laser breath (Alpha only)
        console.log('🔴 L key released - laser breath = false');
        break;
    }
    
    // Schedule key validation
    this.scheduleKeyValidation();
  }

  // Mouse event handlers
  handleMouseDown(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouse.leftButton = true;
        // Request pointer lock for first-person camera control
        this.canvas.requestPointerLock();
        break;
      case 2: // Right button
        this.mouse.rightButton = true;
        break;
    }
  }

  handleMouseUp(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouse.leftButton = false;
        break;
      case 2: // Right button
        this.mouse.rightButton = false;
        break;
    }
  }

  handleMouseMove(event) {
    if (this.isPointerLocked()) {
      // Use movement deltas when pointer is locked
      this.mouse.deltaX = event.movementX || 0;
      this.mouse.deltaY = event.movementY || 0;
    } else {
      // Use absolute position when pointer is not locked
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      this.mouse.deltaX = event.movementX || 0;
      this.mouse.deltaY = event.movementY || 0;
    }
  }

  handleMouseWheel(event) {
    if (this.onMouseWheel) {
      this.onMouseWheel(event);
    }
  }

  handlePointerLockChange() {
    const isLocked = this.isPointerLocked();
    if (this.onPointerLockChange) {
      this.onPointerLockChange(isLocked);
    }
  }

  // Touch event handlers (for mobile support)
  handleTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.mouse.x;
      const deltaY = touch.clientY - this.mouse.y;
      
      this.mouse.deltaX = deltaX;
      this.mouse.deltaY = deltaY;
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    }
  }

  handleTouchEnd(event) {
    event.preventDefault();
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }

  // Input state queries
  isMoving() {
    return this.keys.forward || this.keys.backward || 
           this.keys.left || this.keys.right ||
           this.virtualMovement.x !== 0 || this.virtualMovement.z !== 0;
  }

  isRunning() {
    return this.keys.run && this.isMoving();
  }

  isCrouching() {
    return this.keys.crouch;
  }

  isJumping() {
    return this.keys.jump;
  }

  isInteracting() {
    return this.keys.interact;
  }

  isHunting() {
    return this.keys.hunt;
  }

  isUsingLaserBreath() {
    return this.keys.laserBreath;
  }

  isPointerLocked() {
    return document.pointerLockElement === this.canvas;
  }

  // Get forward/backward movement input (tank controls)
  getMovementDirection() {
    let z = 0;

    // Only forward/backward movement (W/S keys)
    // Tiger now faces positive Z, so W should be positive Z
    if (this.keys.forward) z += 1;  // W key = forward = positive Z
    if (this.keys.backward) z -= 1; // S key = backward = negative Z

    // Virtual input (touch/gamepad) - only Z axis for movement
    z += this.virtualMovement.z;

    return { x: 0, z }; // X is always 0 for tank controls
  }

  // Get rotation input (tank controls)
  getRotationDirection() {
    let rotation = 0;

    // Only left/right rotation (A/D keys)
    if (this.keys.left) rotation += 1;  // A key = rotate left = positive rotation
    if (this.keys.right) rotation -= 1; // D key = rotate right = negative rotation

    // Virtual input (touch/gamepad) - only X axis for rotation
    rotation += this.virtualMovement.x;

    // Debug logging for problematic input
    this.debugLogCounter = (this.debugLogCounter || 0) + 1;
    if (this.debugLogCounter % 60 === 0 && rotation !== 0) {
      console.log('🖥️ ROTATION INPUT DEBUG:', JSON.stringify({
        keys: {
          left: this.keys.left,
          right: this.keys.right
        },
        virtualRotation: this.virtualMovement.x,
        rotation: rotation
      }, null, 2));
    }

    return rotation;
  }

  // Get mouse movement deltas
  getMouseDelta() {
    return {
      x: this.mouse.deltaX,
      y: this.mouse.deltaY
    };
  }

  // Set virtual movement (for touch controls or AI)
  setVirtualMovement(x, z) {
    this.virtualMovement.x = Math.max(-1, Math.min(1, x)); // Used for rotation in tank controls
    this.virtualMovement.z = Math.max(-1, Math.min(1, z)); // Used for forward/backward movement
  }

  // Reset virtual movement
  resetVirtualMovement() {
    this.virtualMovement.x = 0;
    this.virtualMovement.z = 0;
  }

  // Reset all keys (useful when window loses focus)
  resetAllKeys() {
    console.log('🔄 INPUT: Resetting all keys due to focus change');
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      run: false,
      interact: false,
      mateTrail: false,
      diving: false,
      forward_underwater: false,
      backward_underwater: false,
      hunt: false,
      laserBreath: false,
      scentTrail: false
    };
    this.physicalKeys.clear();
    this.resetVirtualMovement();
    
    // Clear any pending validation
    if (this.keyValidationTimer) {
      clearTimeout(this.keyValidationTimer);
      this.keyValidationTimer = null;
    }
  }
  
  // Schedule key state validation to prevent stuck keys
  scheduleKeyValidation() {
    if (this.keyValidationTimer) {
      clearTimeout(this.keyValidationTimer);
    }
    
    this.keyValidationTimer = setTimeout(() => {
      this.validateKeyStates();
    }, 100); // Check after 100ms
  }
  
  // Validate that key states match expected physical state
  validateKeyStates() {
    const expectedKeys = {
      forward: this.physicalKeys.has('KeyW') || this.physicalKeys.has('ArrowUp'),
      backward: this.physicalKeys.has('KeyS') || this.physicalKeys.has('ArrowDown'),
      left: this.physicalKeys.has('KeyA') || this.physicalKeys.has('ArrowLeft'),
      right: this.physicalKeys.has('KeyD') || this.physicalKeys.has('ArrowRight'),
      jump: this.physicalKeys.has('Space'),
      run: this.physicalKeys.has('ShiftLeft') || this.physicalKeys.has('ShiftRight'),
      crouch: this.physicalKeys.has('ControlLeft') || this.physicalKeys.has('ControlRight'),
      interact: this.physicalKeys.has('KeyE'),
      forward_underwater: this.physicalKeys.has('KeyG'),
      backward_underwater: this.physicalKeys.has('KeyB'),
      hunt: this.physicalKeys.has('KeyZ'),
      scentTrail: this.physicalKeys.has('KeyM'),
      mateTrail: this.physicalKeys.has('KeyU'),
      diving: this.physicalKeys.has('KeyR'),
      laserBreath: this.physicalKeys.has('KeyL')
    };
    
    let hasStuckKeys = false;
    for (const [key, expectedState] of Object.entries(expectedKeys)) {
      if (this.keys[key] !== expectedState) {
        console.log(`⚠️ INPUT: Fixed stuck key ${key}: ${this.keys[key]} -> ${expectedState}`);
        this.keys[key] = expectedState;
        hasStuckKeys = true;
      }
    }
    
    if (hasStuckKeys) {
      console.log('🔧 INPUT: Key state validation corrected stuck keys');
    }
  }

  // Input state getters
  getMovementDirection() {
    const direction = { x: 0, y: 0, z: 0 };
    
    // Tank controls: W/S for forward/backward movement only
    if (this.keys.forward) direction.z = 1; // W = Forward (positive Z)
    if (this.keys.backward) direction.z = -1; // S = Backward (negative Z)
    
    return direction;
  }
  
  getRotationDirection() {
    let rotation = 0;
    
    // Tank controls: A/D for left/right rotation only
    if (this.keys.left) rotation = 1; // A = Turn left (positive rotation)
    if (this.keys.right) rotation = -1; // D = Turn right (negative rotation)
    
    return rotation;
  }
  
  isRunning() {
    return this.keys.run;
  }
  
  isCrouching() {
    return this.keys.crouch;
  }
  
  isJumping() {
    return this.keys.jump;
  }

  isDiving() {
    return this.keys.diving;
  }
  
  isUsingScentTrail() {
    return this.keys.scentTrail;
  }
  
  isUsingMateTrail() {
    return this.keys.mateTrail;
  }

  // Get underwater movement direction (T/G/F/H keys, same movement method as surface)
  getUnderwaterMovementDirection() {
    const direction = { x: 0, y: 0, z: 0 };
    
    // T/G/F/H keys with same tank movement method as surface
    if (this.keys.forward_underwater) direction.z = 1;  // T = forward
    if (this.keys.backward_underwater) direction.z = -1; // G = backward
    if (this.keys.left) direction.x = -1;     // F = left
    if (this.keys.right) direction.x = 1;     // H = right
    
    return direction;
  }

  // Get underwater rotation direction (Q/E keys)
  getUnderwaterRotationDirection() {
    let rotation = 0;
    
    if (this.keys.left_underwater) rotation -= 1;  // Q = rotate left
    if (this.keys.right_underwater) rotation += 1; // E = rotate right
    
    return rotation;
  }

  // Update method (call once per frame)
  update() {
    // Reset mouse deltas after they've been processed
    // This ensures deltas are only used for one frame
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    
    // Periodic key validation (every 60 frames = ~1 second at 60fps)
    this.validationCounter = (this.validationCounter || 0) + 1;
    if (this.validationCounter % 60 === 0) {
      this.validateKeyStates();
    }
  }

  // Cleanup
  dispose() {
    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    // Remove focus event listeners  
    window.removeEventListener('blur', this.resetAllKeys);
    window.removeEventListener('focus', this.resetAllKeys);
    document.removeEventListener('visibilitychange', this.resetAllKeys);

    // Remove mouse event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('wheel', this.handleMouseWheel);

    // Remove pointer lock event listeners
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    // Remove touch event listeners
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}
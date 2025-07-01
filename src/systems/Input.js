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
      interact: false
    };

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
    }
  }

  handleKeyUp(event) {
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
    }
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

  isPointerLocked() {
    return document.pointerLockElement === this.canvas;
  }

  // Get normalized movement direction vector
  getMovementDirection() {
    let x = 0;
    let z = 0;

    // Keyboard input
    if (this.keys.left) x -= 1;
    if (this.keys.right) x += 1;
    if (this.keys.forward) z -= 1;
    if (this.keys.backward) z += 1;

    // Virtual input (touch/gamepad)
    x += this.virtualMovement.x;
    z += this.virtualMovement.z;

    // Normalize the vector
    const length = Math.sqrt(x * x + z * z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    return { x, z };
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
    this.virtualMovement.x = Math.max(-1, Math.min(1, x));
    this.virtualMovement.z = Math.max(-1, Math.min(1, z));
  }

  // Reset virtual movement
  resetVirtualMovement() {
    this.virtualMovement.x = 0;
    this.virtualMovement.z = 0;
  }

  // Update method (call once per frame)
  update() {
    // Reset mouse deltas after they've been processed
    // This ensures deltas are only used for one frame
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }

  // Cleanup
  dispose() {
    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);

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
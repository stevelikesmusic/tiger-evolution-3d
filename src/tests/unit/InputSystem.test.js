import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputSystem } from '../../systems/Input.js';

// Mock DOM events
global.document = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  pointerLockElement: null
};

global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('InputSystem', () => {
  let inputSystem;
  let mockCanvas;

  beforeEach(() => {
    mockCanvas = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestPointerLock: vi.fn(),
      width: 800,
      height: 600
    };
    inputSystem = new InputSystem(mockCanvas);
  });

  describe('initialization', () => {
    it('should initialize with default key states', () => {
      expect(inputSystem.keys.forward).toBe(false);
      expect(inputSystem.keys.backward).toBe(false);
      expect(inputSystem.keys.left).toBe(false);
      expect(inputSystem.keys.right).toBe(false);
      expect(inputSystem.keys.jump).toBe(false);
      expect(inputSystem.keys.crouch).toBe(false);
      expect(inputSystem.keys.run).toBe(false);
    });

    it('should initialize mouse state', () => {
      expect(inputSystem.mouse.x).toBe(0);
      expect(inputSystem.mouse.y).toBe(0);
      expect(inputSystem.mouse.deltaX).toBe(0);
      expect(inputSystem.mouse.deltaY).toBe(0);
      expect(inputSystem.mouse.leftButton).toBe(false);
      expect(inputSystem.mouse.rightButton).toBe(false);
    });

    it('should set up event listeners', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    });
  });

  describe('keyboard input', () => {
    it('should handle WASD keys for movement', () => {
      inputSystem.handleKeyDown({ code: 'KeyW' });
      expect(inputSystem.keys.forward).toBe(true);

      inputSystem.handleKeyDown({ code: 'KeyS' });
      expect(inputSystem.keys.backward).toBe(true);

      inputSystem.handleKeyDown({ code: 'KeyA' });
      expect(inputSystem.keys.left).toBe(true);

      inputSystem.handleKeyDown({ code: 'KeyD' });
      expect(inputSystem.keys.right).toBe(true);
    });

    it('should handle arrow keys for movement', () => {
      inputSystem.handleKeyDown({ code: 'ArrowUp' });
      expect(inputSystem.keys.forward).toBe(true);

      inputSystem.handleKeyDown({ code: 'ArrowDown' });
      expect(inputSystem.keys.backward).toBe(true);

      inputSystem.handleKeyDown({ code: 'ArrowLeft' });
      expect(inputSystem.keys.left).toBe(true);

      inputSystem.handleKeyDown({ code: 'ArrowRight' });
      expect(inputSystem.keys.right).toBe(true);
    });

    it('should handle special action keys', () => {
      inputSystem.handleKeyDown({ code: 'Space', preventDefault: vi.fn() });
      expect(inputSystem.keys.jump).toBe(true);

      inputSystem.handleKeyDown({ code: 'ShiftLeft', preventDefault: vi.fn() });
      expect(inputSystem.keys.run).toBe(true);

      inputSystem.handleKeyDown({ code: 'ControlLeft', preventDefault: vi.fn() });
      expect(inputSystem.keys.crouch).toBe(true);

      inputSystem.handleKeyDown({ code: 'KeyE', preventDefault: vi.fn() });
      expect(inputSystem.keys.interact).toBe(true);
    });

    it('should handle key release events', () => {
      inputSystem.handleKeyDown({ code: 'KeyW' });
      expect(inputSystem.keys.forward).toBe(true);

      inputSystem.handleKeyUp({ code: 'KeyW' });
      expect(inputSystem.keys.forward).toBe(false);
    });

    it('should ignore unknown keys', () => {
      const initialState = { ...inputSystem.keys };
      inputSystem.handleKeyDown({ code: 'KeyZ' });
      expect(inputSystem.keys).toEqual(initialState);
    });
  });

  describe('mouse input', () => {
    it('should handle mouse button press', () => {
      inputSystem.handleMouseDown({ button: 0 }); // Left button
      expect(inputSystem.mouse.leftButton).toBe(true);

      inputSystem.handleMouseDown({ button: 2 }); // Right button
      expect(inputSystem.mouse.rightButton).toBe(true);
    });

    it('should handle mouse button release', () => {
      inputSystem.handleMouseDown({ button: 0 });
      inputSystem.handleMouseUp({ button: 0 });
      expect(inputSystem.mouse.leftButton).toBe(false);
    });

    it('should handle mouse movement without pointer lock', () => {
      const event = {
        clientX: 400,
        clientY: 300,
        movementX: 10,
        movementY: -5
      };

      inputSystem.handleMouseMove(event);
      expect(inputSystem.mouse.x).toBe(400);
      expect(inputSystem.mouse.y).toBe(300);
      expect(inputSystem.mouse.deltaX).toBe(10);
      expect(inputSystem.mouse.deltaY).toBe(-5);
    });

    it('should handle mouse movement with pointer lock', () => {
      document.pointerLockElement = mockCanvas;
      
      const event = {
        movementX: 15,
        movementY: -10
      };

      inputSystem.handleMouseMove(event);
      expect(inputSystem.mouse.deltaX).toBe(15);
      expect(inputSystem.mouse.deltaY).toBe(-10);
    });

    it('should handle mouse wheel events', () => {
      const wheelEvent = { deltaY: 100 };
      const callback = vi.fn();
      
      inputSystem.onMouseWheel = callback;
      inputSystem.handleMouseWheel(wheelEvent);
      
      expect(callback).toHaveBeenCalledWith(wheelEvent);
    });

    it('should request pointer lock on canvas click', () => {
      inputSystem.handleMouseDown({ button: 0 });
      expect(mockCanvas.requestPointerLock).toHaveBeenCalled();
    });
  });

  describe('input state queries', () => {
    it('should detect movement input', () => {
      expect(inputSystem.isMoving()).toBe(false);

      inputSystem.keys.forward = true;
      expect(inputSystem.isMoving()).toBe(true);

      inputSystem.keys.forward = false;
      inputSystem.keys.left = true;
      expect(inputSystem.isMoving()).toBe(true);
    });

    it('should get movement direction vector', () => {
      // Forward movement
      inputSystem.keys.forward = true;
      let direction = inputSystem.getMovementDirection();
      expect(direction.x).toBe(0);
      expect(direction.z).toBe(-1);

      // Reset
      inputSystem.keys.forward = false;

      // Right movement
      inputSystem.keys.right = true;
      direction = inputSystem.getMovementDirection();
      expect(direction.x).toBe(1);
      expect(direction.z).toBe(0);

      // Diagonal movement
      inputSystem.keys.forward = true;
      direction = inputSystem.getMovementDirection();
      expect(direction.x).toBeCloseTo(0.707, 2); // Normalized diagonal
      expect(direction.z).toBeCloseTo(-0.707, 2);
    });

    it('should detect if running', () => {
      expect(inputSystem.isRunning()).toBe(false);

      inputSystem.keys.run = true;
      inputSystem.keys.forward = true;
      expect(inputSystem.isRunning()).toBe(true);

      inputSystem.keys.forward = false;
      expect(inputSystem.isRunning()).toBe(false); // Not moving
    });

    it('should detect if crouching', () => {
      expect(inputSystem.isCrouching()).toBe(false);

      inputSystem.keys.crouch = true;
      expect(inputSystem.isCrouching()).toBe(true);
    });

    it('should detect jump input', () => {
      expect(inputSystem.isJumping()).toBe(false);

      inputSystem.keys.jump = true;
      expect(inputSystem.isJumping()).toBe(true);
    });
  });

  describe('pointer lock', () => {
    it('should handle pointer lock change', () => {
      const callback = vi.fn();
      inputSystem.onPointerLockChange = callback;

      document.pointerLockElement = mockCanvas;
      inputSystem.handlePointerLockChange();
      expect(callback).toHaveBeenCalledWith(true);

      document.pointerLockElement = null;
      inputSystem.handlePointerLockChange();
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should check if pointer is locked', () => {
      document.pointerLockElement = null;
      expect(inputSystem.isPointerLocked()).toBe(false);

      document.pointerLockElement = mockCanvas;
      expect(inputSystem.isPointerLocked()).toBe(true);
    });
  });

  describe('touch controls', () => {
    it('should handle touch start events', () => {
      const touchEvent = {
        touches: [{ clientX: 100, clientY: 200 }],
        preventDefault: vi.fn()
      };

      inputSystem.handleTouchStart(touchEvent);
      expect(touchEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle touch move events', () => {
      const touchEvent = {
        touches: [{ clientX: 150, clientY: 250 }],
        preventDefault: vi.fn()
      };

      inputSystem.handleTouchMove(touchEvent);
      expect(touchEvent.preventDefault).toHaveBeenCalled();
    });

    it('should simulate movement from touch input', () => {
      // Simulate touch joystick input that results in normalized vector
      inputSystem.setVirtualMovement(1, 0); // Pure right movement
      
      const direction = inputSystem.getMovementDirection();
      expect(direction.x).toBe(1);
      expect(direction.z).toBe(0);
      
      // Test diagonal movement
      inputSystem.setVirtualMovement(0.707, -0.707); // Diagonal
      const diagDirection = inputSystem.getMovementDirection();
      expect(diagDirection.x).toBeCloseTo(0.707, 2);
      expect(diagDirection.z).toBeCloseTo(-0.707, 2);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on dispose', () => {
      inputSystem.dispose();
      
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    });
  });

  describe('input update', () => {
    it('should reset mouse deltas after update', () => {
      inputSystem.mouse.deltaX = 10;
      inputSystem.mouse.deltaY = -5;

      inputSystem.update();

      expect(inputSystem.mouse.deltaX).toBe(0);
      expect(inputSystem.mouse.deltaY).toBe(0);
    });
  });
});
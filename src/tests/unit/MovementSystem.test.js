import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import * as THREE from 'three';

// Mock Three.js Vector3
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Vector3: vi.fn((x = 0, y = 0, z = 0) => {
      const vector = {
        set: vi.fn(function(newX, newY, newZ) { 
          this.x = newX; this.y = newY; this.z = newZ; 
          return this;
        }),
        copy: vi.fn(function(v) { 
          this.x = v.x; this.y = v.y; this.z = v.z; 
          return this;
        }),
        add: vi.fn(function(v) { 
          this.x += v.x; this.y += v.y; this.z += v.z; 
          return this;
        }),
        sub: vi.fn(function(v) { 
          this.x -= v.x; this.y -= v.y; this.z -= v.z; 
          return this;
        }),
        multiplyScalar: vi.fn(function(s) { 
          this.x *= s; this.y *= s; this.z *= s; 
          return this;
        }),
        normalize: vi.fn(function() { 
          const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
          if (length > 0) {
            this.x /= length; this.y /= length; this.z /= length;
          }
          return this; 
        }),
        length: vi.fn(function() {
          return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }),
        clone: vi.fn(function() { 
          return new THREE.Vector3(this.x, this.y, this.z);
        }),
        x: x, y: y, z: z
      };
      return vector;
    })
  };
});

describe('MovementSystem', () => {
  let movementSystem;
  let mockTiger;

  beforeEach(() => {
    mockTiger = {
      position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
      rotation: { x: 0, y: 0, z: 0, set: vi.fn() },
      velocity: { x: 0, y: 0, z: 0, set: vi.fn(), add: vi.fn(), multiplyScalar: vi.fn() },
      speed: 12,
      state: 'idle',
      setState: vi.fn(),
      consumeStamina: vi.fn(),
      stamina: 300,
      isAlive: vi.fn(() => true)
    };

    movementSystem = new MovementSystem(mockTiger);
  });

  describe('initialization', () => {
    it('should initialize with tiger reference', () => {
      expect(movementSystem.tiger).toBe(mockTiger);
    });

    it('should initialize movement state', () => {
      expect(movementSystem.isMoving).toBe(false);
      expect(movementSystem.isRunning).toBe(false);
      expect(movementSystem.isCrouching).toBe(false);
      expect(movementSystem.isJumping).toBe(false);
    });

    it('should initialize physics properties', () => {
      expect(movementSystem.groundFriction).toBe(0.9);
      expect(movementSystem.acceleration).toBe(50);
      expect(movementSystem.jumpForce).toBe(15);
      expect(movementSystem.gravity).toBe(-30);
    });

    it('should initialize as grounded', () => {
      expect(movementSystem.isGrounded).toBe(true);
    });
  });

  describe('movement input', () => {
    it('should set movement input correctly', () => {
      const input = {
        direction: { x: 1, z: 0 },
        isRunning: true,
        isCrouching: false,
        isJumping: false
      };

      movementSystem.setMovementInput(input);

      expect(movementSystem.inputDirection.x).toBe(1);
      expect(movementSystem.inputDirection.z).toBe(0);
      expect(movementSystem.isRunning).toBe(true);
      expect(movementSystem.isCrouching).toBe(false);
      expect(movementSystem.isJumping).toBe(false);
    });

    it('should normalize large input directions', () => {
      const input = {
        direction: { x: 5, z: 5 }, // Large values
        isRunning: false,
        isCrouching: false,
        isJumping: false
      };

      movementSystem.setMovementInput(input);

      // Should be normalized to unit vector
      const length = Math.sqrt(
        movementSystem.inputDirection.x * movementSystem.inputDirection.x +
        movementSystem.inputDirection.z * movementSystem.inputDirection.z
      );
      expect(length).toBeCloseTo(1, 2);
    });

    it('should handle zero input direction', () => {
      const input = {
        direction: { x: 0, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: false
      };

      movementSystem.setMovementInput(input);

      expect(movementSystem.inputDirection.x).toBe(0);
      expect(movementSystem.inputDirection.z).toBe(0);
      expect(movementSystem.isMoving).toBe(false);
    });
  });

  describe('speed calculation', () => {
    it('should use normal speed when walking', () => {
      movementSystem.isRunning = false;
      movementSystem.isCrouching = false;

      const speed = movementSystem.getCurrentSpeed();
      expect(speed).toBe(12); // Tiger base speed
    });

    it('should use increased speed when running', () => {
      movementSystem.isRunning = true;
      movementSystem.isCrouching = false;

      const speed = movementSystem.getCurrentSpeed();
      expect(speed).toBe(18); // 12 * 1.5
    });

    it('should use reduced speed when crouching', () => {
      movementSystem.isRunning = false;
      movementSystem.isCrouching = true;

      const speed = movementSystem.getCurrentSpeed();
      expect(speed).toBe(6); // 12 * 0.5
    });

    it('should limit speed when low stamina', () => {
      mockTiger.stamina = 10; // Very low stamina
      movementSystem.isRunning = true;

      const speed = movementSystem.getCurrentSpeed();
      expect(speed).toBeLessThan(18); // Should be reduced due to low stamina
    });
  });

  describe('movement physics', () => {
    it('should apply movement in correct direction', () => {
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 }, // Move right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      movementSystem.update(0.016);

      // Should have applied rightward force
      expect(movementSystem.velocity.x).toBeGreaterThan(0);
      expect(movementSystem.velocity.z).toBe(0);
    });

    it('should apply friction when not moving', () => {
      // Set initial velocity
      movementSystem.velocity.x = 10;
      movementSystem.velocity.z = 5;

      // No input
      movementSystem.setMovementInput({
        direction: { x: 0, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      movementSystem.update(0.016);

      // Velocity should be reduced by friction
      expect(movementSystem.velocity.x).toBeLessThan(10);
      expect(movementSystem.velocity.z).toBeLessThan(5);
    });

    it('should handle jumping when grounded', () => {
      movementSystem.isGrounded = true;

      movementSystem.setMovementInput({
        direction: { x: 0, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: true
      });

      movementSystem.update(0.016);

      // Jump force minus gravity applied in same frame: 15 + (-30 * 0.016) = 14.52
      expect(movementSystem.velocity.y).toBeCloseTo(14.52, 2);
      expect(movementSystem.isGrounded).toBe(false);
    });

    it('should not jump when not grounded', () => {
      movementSystem.isGrounded = false;
      movementSystem.velocity.y = 0;

      movementSystem.setMovementInput({
        direction: { x: 0, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: true
      });

      movementSystem.update(0.016);

      expect(movementSystem.velocity.y).toBe(0); // No jump
    });

    it('should apply gravity when not grounded', () => {
      movementSystem.isGrounded = false;
      movementSystem.velocity.y = 5;

      movementSystem.update(0.016);

      expect(movementSystem.velocity.y).toBeLessThan(5); // Gravity applied
    });
  });

  describe('stamina consumption', () => {
    it('should consume stamina when running', () => {
      movementSystem.isRunning = true;
      movementSystem.isMoving = true;

      movementSystem.update(0.016);

      expect(mockTiger.consumeStamina).toHaveBeenCalled();
    });

    it('should not consume stamina when walking', () => {
      movementSystem.isRunning = false;
      movementSystem.isMoving = true;

      movementSystem.update(0.016);

      expect(mockTiger.consumeStamina).not.toHaveBeenCalled();
    });

    it('should not consume stamina when not moving', () => {
      movementSystem.isRunning = true;
      movementSystem.isMoving = false;

      movementSystem.update(0.016);

      expect(mockTiger.consumeStamina).not.toHaveBeenCalled();
    });
  });

  describe('tiger state updates', () => {
    it('should set tiger state to running when running', () => {
      movementSystem.isRunning = true;
      movementSystem.isMoving = true;

      movementSystem.updateTigerState();

      expect(mockTiger.setState).toHaveBeenCalledWith('running');
    });

    it('should set tiger state to crouching when crouching', () => {
      movementSystem.isCrouching = true;

      movementSystem.updateTigerState();

      expect(mockTiger.setState).toHaveBeenCalledWith('crouching');
    });

    it('should set tiger state to walking when moving normally', () => {
      movementSystem.isMoving = true;
      movementSystem.isRunning = false;
      movementSystem.isCrouching = false;

      movementSystem.updateTigerState();

      expect(mockTiger.setState).toHaveBeenCalledWith('walking');
    });

    it('should set tiger state to idle when not moving', () => {
      movementSystem.isMoving = false;

      movementSystem.updateTigerState();

      expect(mockTiger.setState).toHaveBeenCalledWith('idle');
    });
  });

  describe('position updates', () => {
    it('should update tiger position based on velocity', () => {
      // Set velocity directly
      movementSystem.setVelocity(10, 0, 5);
      mockTiger.position.x = 0;
      mockTiger.position.z = 0;
      
      // Set no input to avoid movement forces affecting the test
      movementSystem.setMovementInput({
        direction: { x: 0, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      movementSystem.update(0.016);

      expect(mockTiger.position.x).toBeCloseTo(0.144, 2); // 10 * 0.016 * friction
      expect(mockTiger.position.z).toBeCloseTo(0.072, 2); // 5 * 0.016 * friction
    });

    it('should handle ground collision', () => {
      movementSystem.velocity.y = -10;
      mockTiger.position.y = -1; // Below ground

      movementSystem.update(0.016);

      expect(mockTiger.position.y).toBe(0); // Should be on ground
      expect(movementSystem.velocity.y).toBe(0); // Velocity should stop
      expect(movementSystem.isGrounded).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error when tiger is null', () => {
      expect(() => new MovementSystem(null)).toThrow('Tiger is required for MovementSystem');
    });

    it('should handle invalid delta time', () => {
      expect(() => movementSystem.update(-1)).not.toThrow();
      expect(() => movementSystem.update(0)).not.toThrow();
    });
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import { Tiger } from '../../entities/Tiger.js';

describe('Rotation-Only Movement Controls', () => {
  let tiger;
  let movementSystem;
  let deltaTime;

  beforeEach(() => {
    tiger = new Tiger();
    movementSystem = new MovementSystem(tiger);
    deltaTime = 0.016; // 60 FPS
  });

  describe('Left/Right Rotation Only', () => {
    it('should only rotate when pressing left (A key)', () => {
      const initialPosition = tiger.position.clone();
      const initialRotation = tiger.rotation.y;

      // Press only left (A key)
      movementSystem.setMovementInput({
        direction: { x: -1, z: 0 }, // Pure left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Position should NOT change
      expect(tiger.position.x).toBeCloseTo(initialPosition.x, 3);
      expect(tiger.position.z).toBeCloseTo(initialPosition.z, 3);

      // Rotation should change (turn left - more negative)
      expect(tiger.rotation.y).toBeLessThan(initialRotation);
    });

    it('should only rotate when pressing right (D key)', () => {
      const initialPosition = tiger.position.clone();
      const initialRotation = tiger.rotation.y;

      // Press only right (D key)
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 }, // Pure right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Position should NOT change
      expect(tiger.position.x).toBeCloseTo(initialPosition.x, 3);
      expect(tiger.position.z).toBeCloseTo(initialPosition.z, 3);

      // Rotation should change (turn right - more positive)
      expect(tiger.rotation.y).toBeGreaterThan(initialRotation);
    });

    it('should not move forward when only rotating', () => {
      const initialPosition = tiger.position.clone();

      // Rotate left for a while
      movementSystem.setMovementInput({
        direction: { x: -1, z: 0 }, // Pure left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 20; i++) {
        movementSystem.update(deltaTime);
      }

      // Then rotate right
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 }, // Pure right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 20; i++) {
        movementSystem.update(deltaTime);
      }

      // Position should still be the same
      expect(tiger.position.distanceTo(initialPosition)).toBeLessThan(0.1);
    });
  });

  describe('Forward/Backward Movement Only', () => {
    it('should only move forward when pressing W key', () => {
      const initialPosition = tiger.position.clone();
      const initialRotation = tiger.rotation.y;

      // Press only forward (W key)
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Pure forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Position should change (move forward)
      expect(tiger.position.z).toBeLessThan(initialPosition.z); // Forward is negative Z

      // Rotation should stay the same
      expect(tiger.rotation.y).toBeCloseTo(initialRotation, 3);
    });

    it('should only move backward when pressing S key', () => {
      const initialPosition = tiger.position.clone();
      const initialRotation = tiger.rotation.y;

      // Press only backward (S key)
      movementSystem.setMovementInput({
        direction: { x: 0, z: 1 }, // Pure backward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Position should change (move backward)
      expect(tiger.position.z).toBeGreaterThan(initialPosition.z); // Backward is positive Z

      // Rotation should stay the same
      expect(tiger.rotation.y).toBeCloseTo(initialRotation, 3);
    });
  });

  describe('Combined Movement and Rotation', () => {
    it('should move forward and turn when pressing W+A', () => {
      const initialPosition = tiger.position.clone();
      const initialRotation = tiger.rotation.y;

      // Press forward + left (W + A)
      movementSystem.setMovementInput({
        direction: { x: -1, z: -1 }, // Forward + left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Should move forward (Z should decrease)
      expect(tiger.position.z).toBeLessThan(initialPosition.z);

      // Should also move left (X should decrease)
      expect(tiger.position.x).toBeLessThan(initialPosition.x);

      // Should rotate left
      expect(tiger.rotation.y).toBeLessThan(initialRotation);
    });

    it('should move forward and turn when pressing W+D', () => {
      const initialPosition = tiger.position.clone();
      const initialRotation = tiger.rotation.y;

      // Press forward + right (W + D)
      movementSystem.setMovementInput({
        direction: { x: 1, z: -1 }, // Forward + right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Should move forward (Z should decrease)
      expect(tiger.position.z).toBeLessThan(initialPosition.z);

      // Should also move right (X should increase)
      expect(tiger.position.x).toBeGreaterThan(initialPosition.x);

      // Should rotate right
      expect(tiger.rotation.y).toBeGreaterThan(initialRotation);
    });

    it('should prioritize rotation over forward movement for direction', () => {
      // Start with tiger facing forward
      tiger.rotation.y = 0;

      // Turn tiger to face right first
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 }, // Pure right turn
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 20; i++) {
        movementSystem.update(deltaTime);
      }

      const rightFacingRotation = tiger.rotation.y;
      const positionAfterTurning = tiger.position.clone();

      // Now move forward while tiger is facing right
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Pure forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Tiger should move in the direction it's facing (right)
      // Since tiger is facing right, forward movement should increase X
      expect(tiger.position.x).toBeGreaterThan(positionAfterTurning.x);

      // Rotation should not change during pure forward movement
      expect(tiger.rotation.y).toBeCloseTo(rightFacingRotation, 3);
    });
  });

  describe('Movement Direction Based on Rotation', () => {
    it('should move in local forward direction regardless of world coordinates', () => {
      // Turn tiger to face right (90 degrees)
      tiger.rotation.y = Math.PI / 2;
      const initialPosition = tiger.position.clone();

      // Press forward - should move in tiger's forward direction (which is now right in world space)
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward command
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Tiger facing right means forward movement should increase X
      expect(tiger.position.x).toBeGreaterThan(initialPosition.x);
      // Z should not change much since tiger is moving sideways in world space
      expect(Math.abs(tiger.position.z - initialPosition.z)).toBeLessThan(0.5);
    });

    it('should move backward in local direction when pressing S', () => {
      // Turn tiger to face left (-90 degrees)
      tiger.rotation.y = -Math.PI / 2;
      const initialPosition = tiger.position.clone();

      // Press backward - should move in tiger's backward direction
      movementSystem.setMovementInput({
        direction: { x: 0, z: 1 }, // Backward command
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Tiger facing left means backward movement should increase X (move right in world space)
      expect(tiger.position.x).toBeGreaterThan(initialPosition.x);
    });
  });
});
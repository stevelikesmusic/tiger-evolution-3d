import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import { Tiger } from '../../entities/Tiger.js';
import * as THREE from 'three';

describe('Movement Controls Behavior', () => {
  let tiger;
  let movementSystem;
  let deltaTime;

  beforeEach(() => {
    tiger = new Tiger();
    movementSystem = new MovementSystem(tiger);
    deltaTime = 0.016; // 60 FPS
  });

  describe('Tiger Rotation and Movement', () => {
    it('should turn tiger to face movement direction when moving forward', () => {
      // Move forward (W key)
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward in Three.js
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update movement system
      movementSystem.update(deltaTime);

      // Tiger should face forward (0 radians)
      expect(tiger.rotation.y).toBeCloseTo(0, 2);
    });

    it('should turn tiger to face diagonal movement when moving forward-left', () => {
      // Move forward-left (W + A keys)
      movementSystem.setMovementInput({
        direction: { x: -1, z: -1 }, // Forward-left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update movement system multiple times to allow rotation
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Tiger should face forward-left (around -π/4 radians)
      expect(tiger.rotation.y).toBeCloseTo(-Math.PI / 4, 1);
    });

    it('should turn tiger to face diagonal movement when moving forward-right', () => {
      // Move forward-right (W + D keys)
      movementSystem.setMovementInput({
        direction: { x: 1, z: -1 }, // Forward-right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update movement system multiple times to allow rotation
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      // Tiger should face forward-right (around π/4 radians)
      expect(tiger.rotation.y).toBeCloseTo(Math.PI / 4, 1);
    });

    it('should smoothly rotate tiger when changing direction', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update to establish initial rotation
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      const initialRotation = tiger.rotation.y;

      // Change to moving right
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 }, // Right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update once - rotation should not instantly snap
      movementSystem.update(deltaTime);
      const intermediateRotation = tiger.rotation.y;

      // Should be different from initial but not at final position yet
      expect(intermediateRotation).not.toBeCloseTo(initialRotation, 2);
      expect(intermediateRotation).not.toBeCloseTo(Math.PI / 2, 2);
    });

    it('should maintain forward movement while turning', () => {
      const initialPosition = tiger.position.clone();

      // Move forward-left (W + A keys)
      movementSystem.setMovementInput({
        direction: { x: -1, z: -1 }, // Forward-left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update movement system
      movementSystem.update(deltaTime);

      // Tiger should have moved (position changed)
      expect(tiger.position.x).not.toEqual(initialPosition.x);
      expect(tiger.position.z).not.toEqual(initialPosition.z);

      // Movement should be in the input direction
      const movementVector = tiger.position.clone().sub(initialPosition);
      expect(movementVector.x).toBeLessThan(0); // Moved left
      expect(movementVector.z).toBeLessThan(0); // Moved forward
    });

    it('should not rotate when not moving', () => {
      // Set initial rotation
      tiger.rotation.y = Math.PI / 4;
      const initialRotation = tiger.rotation.y;

      // No movement input
      movementSystem.setMovementInput({
        direction: { x: 0, z: 0 }, // No movement
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update movement system
      movementSystem.update(deltaTime);

      // Tiger rotation should remain unchanged
      expect(tiger.rotation.y).toEqual(initialRotation);
    });
  });

  describe('Combined Movement Scenarios', () => {
    it('should handle continuous forward movement with left turn', () => {
      const positions = [];
      const rotations = [];

      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update and record initial state
      movementSystem.update(deltaTime);
      positions.push(tiger.position.clone());
      rotations.push(tiger.rotation.y);

      // Change to forward-left while maintaining movement
      movementSystem.setMovementInput({
        direction: { x: -1, z: -1 }, // Forward-left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update multiple times
      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
        positions.push(tiger.position.clone());
        rotations.push(tiger.rotation.y);
      }

      // Should have continuous movement (no stopping)
      for (let i = 1; i < positions.length; i++) {
        const movement = positions[i].clone().sub(positions[i - 1]);
        expect(movement.length()).toBeGreaterThan(0);
      }

      // Rotation should change toward left
      expect(rotations[rotations.length - 1]).toBeLessThan(rotations[0]);
    });

    it('should handle quick direction changes smoothly', () => {
      // Rapid direction changes: Forward -> Right -> Back -> Left
      const directions = [
        { x: 0, z: -1 }, // Forward
        { x: 1, z: 0 },  // Right
        { x: 0, z: 1 },  // Back
        { x: -1, z: 0 }  // Left
      ];

      const rotations = [];

      directions.forEach(direction => {
        movementSystem.setMovementInput({
          direction,
          isRunning: false,
          isCrouching: false,
          isJumping: false
        });

        // Update a few times for each direction
        for (let i = 0; i < 3; i++) {
          movementSystem.update(deltaTime);
        }
        rotations.push(tiger.rotation.y);
      });

      // Each rotation should be different (tiger turning)
      for (let i = 1; i < rotations.length; i++) {
        expect(rotations[i]).not.toBeCloseTo(rotations[i - 1], 2);
      }
    });
  });
});
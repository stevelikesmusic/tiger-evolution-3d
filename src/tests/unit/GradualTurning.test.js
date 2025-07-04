import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import { Tiger } from '../../entities/Tiger.js';

describe('Gradual Turning Behavior', () => {
  let tiger;
  let movementSystem;
  let deltaTime;

  beforeEach(() => {
    tiger = new Tiger();
    movementSystem = new MovementSystem(tiger);
    deltaTime = 0.016; // 60 FPS
  });

  describe('Gradual Direction Changes', () => {
    it('should gradually turn left when holding left key', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update a few times to establish forward movement
      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
      }

      const initialRotation = tiger.rotation.y;

      // Now start turning left (hold left while moving forward)
      movementSystem.setMovementInput({
        direction: { x: -1, z: -1 }, // Forward-left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      const rotations = [];
      const positions = [];

      // Track rotation and position over several updates
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
        rotations.push(tiger.rotation.y);
        positions.push(tiger.position.clone());
      }

      // Should gradually turn left (rotation becomes more negative)
      expect(rotations[rotations.length - 1]).toBeLessThan(initialRotation);
      
      // Should be continuous turning (each step should be closer to target)
      for (let i = 1; i < rotations.length; i++) {
        expect(rotations[i]).toBeLessThan(rotations[i - 1]); // Continuously turning left
      }

      // Should maintain forward movement while turning
      for (let i = 1; i < positions.length; i++) {
        const movement = positions[i].clone().sub(positions[i - 1]);
        expect(movement.length()).toBeGreaterThan(0); // Still moving
      }
    });

    it('should gradually turn right when holding right key', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update a few times to establish forward movement
      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
      }

      const initialRotation = tiger.rotation.y;

      // Now start turning right (hold right while moving forward)
      movementSystem.setMovementInput({
        direction: { x: 1, z: -1 }, // Forward-right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      const rotations = [];

      // Track rotation over several updates
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
        rotations.push(tiger.rotation.y);
      }

      // Should gradually turn right (rotation becomes more positive)
      expect(rotations[rotations.length - 1]).toBeGreaterThan(initialRotation);
      
      // Should be continuous turning (each step should be closer to target)
      for (let i = 1; i < rotations.length; i++) {
        expect(rotations[i]).toBeGreaterThan(rotations[i - 1]); // Continuously turning right
      }
    });

    it('should not instantly snap to new direction', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update to establish forward movement
      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
      }

      const forwardRotation = tiger.rotation.y;

      // Suddenly change to backward
      movementSystem.setMovementInput({
        direction: { x: 0, z: 1 }, // Backward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update once - should NOT instantly snap to backward
      movementSystem.update(deltaTime);
      const afterOneUpdate = tiger.rotation.y;

      // Should not instantly reach backward rotation (π)
      const targetBackwardRotation = Math.PI;
      const rotationDifference = Math.abs(afterOneUpdate - targetBackwardRotation);
      expect(rotationDifference).toBeGreaterThan(Math.PI / 4); // Should be far from target

      // Should be different from initial forward rotation
      expect(afterOneUpdate).not.toBeCloseTo(forwardRotation, 3);
    });

    it('should eventually reach target rotation', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update to establish forward movement
      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
      }

      // Change to right
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 }, // Right
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update many times to reach target rotation
      for (let i = 0; i < 50; i++) {
        movementSystem.update(deltaTime);
      }

      // Should eventually reach right rotation (π/2)
      const targetRightRotation = Math.PI / 2;
      expect(tiger.rotation.y).toBeCloseTo(targetRightRotation, 1);
    });

    it('should have smooth rotation speed', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
      }

      // Change to left
      movementSystem.setMovementInput({
        direction: { x: -1, z: 0 }, // Left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      const rotationChanges = [];

      let previousRotation = tiger.rotation.y;
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
        const currentRotation = tiger.rotation.y;
        const rotationChange = Math.abs(currentRotation - previousRotation);
        rotationChanges.push(rotationChange);
        previousRotation = currentRotation;
      }

      // Rotation changes should be consistent (smooth)
      const averageChange = rotationChanges.reduce((a, b) => a + b) / rotationChanges.length;
      
      // All changes should be within reasonable range of average (smooth)
      rotationChanges.forEach(change => {
        expect(change).toBeLessThan(averageChange * 2); // Not too jerky
        expect(change).toBeGreaterThan(averageChange * 0.5); // Not too inconsistent
      });
    });
  });

  describe('Turning While Moving Forward', () => {
    it('should maintain forward momentum while turning', () => {
      // Start moving forward
      movementSystem.setMovementInput({
        direction: { x: 0, z: -1 }, // Forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 5; i++) {
        movementSystem.update(deltaTime);
      }

      const initialPosition = tiger.position.clone();

      // Turn left while maintaining forward movement
      movementSystem.setMovementInput({
        direction: { x: -0.5, z: -1 }, // Slight left while forward
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      // Update several times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      const finalPosition = tiger.position.clone();
      const totalMovement = finalPosition.clone().sub(initialPosition);

      // Should have moved significantly (maintained momentum)
      expect(totalMovement.length()).toBeGreaterThan(5);

      // Should have moved both forward and left
      expect(totalMovement.z).toBeLessThan(0); // Forward (negative Z)
      expect(totalMovement.x).toBeLessThan(0); // Left (negative X)
    });

    it('should turn more aggressively with sharper input', () => {
      // Test gentle turn
      movementSystem.setMovementInput({
        direction: { x: -0.2, z: -1 }, // Slight left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      const gentleRotation = tiger.rotation.y;

      // Reset tiger
      tiger.rotation.y = 0;

      // Test sharp turn
      movementSystem.setMovementInput({
        direction: { x: -1, z: -1 }, // Sharp left
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      for (let i = 0; i < 10; i++) {
        movementSystem.update(deltaTime);
      }

      const sharpRotation = tiger.rotation.y;

      // Sharp turn should result in more rotation than gentle turn
      expect(Math.abs(sharpRotation)).toBeGreaterThan(Math.abs(gentleRotation));
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CameraSystem } from '../../systems/Camera.js';

describe('Camera Integration', () => {
  let camera;
  let mockTarget;

  beforeEach(() => {
    // Mock target object
    mockTarget = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: 0 }
    };

    camera = new CameraSystem(800, 600);
    camera.setTarget(mockTarget);
  });

  describe('mouse movement handling', () => {
    it('should handle mouse movement with pointer lock', () => {
      // Mock pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: {},
        writable: true
      });

      const initialOrbitX = camera.orbitX;
      const initialOrbitY = camera.orbitY;

      const mockEvent = {
        movementX: 10,
        movementY: 5,
        buttons: 0
      };

      camera.handleMouseMove(mockEvent);

      // Camera orbit should have changed
      expect(camera.orbitX).not.toBe(initialOrbitX);
      expect(camera.orbitY).not.toBe(initialOrbitY);
    });

    it('should handle mouse movement when dragging', () => {
      // No pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: null,
        writable: true
      });

      const initialOrbitX = camera.orbitX;
      const initialOrbitY = camera.orbitY;

      const mockEvent = {
        movementX: 10,
        movementY: 5,
        buttons: 1 // Left button held
      };

      camera.handleMouseMove(mockEvent);

      // Camera orbit should have changed
      expect(camera.orbitX).not.toBe(initialOrbitX);
      expect(camera.orbitY).not.toBe(initialOrbitY);
    });

    it('should not move camera without pointer lock or button held', () => {
      // No pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        value: null,
        writable: true
      });

      const initialOrbitX = camera.orbitX;
      const initialOrbitY = camera.orbitY;

      const mockEvent = {
        movementX: 10,
        movementY: 5,
        buttons: 0 // No button held
      };

      camera.handleMouseMove(mockEvent);

      // Camera orbit should not have changed
      expect(camera.orbitX).toBe(initialOrbitX);
      expect(camera.orbitY).toBe(initialOrbitY);
    });

    it('should clamp vertical orbit angle', () => {
      Object.defineProperty(document, 'pointerLockElement', {
        value: {},
        writable: true
      });

      // Try to move way up
      const mockEvent = {
        movementX: 0,
        movementY: -10000, // Large negative movement (up)
        buttons: 0
      };

      camera.handleMouseMove(mockEvent);

      // Should be clamped to max angle
      expect(camera.orbitY).toBeLessThanOrEqual(camera.maxOrbitY);
      expect(camera.orbitY).toBeGreaterThanOrEqual(-camera.maxOrbitY);
    });
  });

  describe('camera positioning', () => {
    it('should calculate correct position based on orbit angles', () => {
      camera.orbitX = Math.PI / 4; // 45 degrees
      camera.orbitY = Math.PI / 6; // 30 degrees
      camera.distance = 10;

      const position = camera.calculateDesiredPosition();

      expect(position).toBeDefined();
      expect(position.x).not.toBe(0);
      expect(position.y).toBeGreaterThan(0); // Should be above target
      expect(position.z).not.toBe(0);
    });

    it('should update camera position smoothly', () => {
      const initialPosition = camera.camera.position.clone();
      
      // Set target far away to create movement
      mockTarget.position.x = 50;
      
      camera.update(0.016); // 60fps frame time

      // Camera should have moved towards target
      expect(camera.camera.position.x).not.toBe(initialPosition.x);
    });
  });

  describe('zoom controls', () => {
    it('should zoom in and out with mouse wheel', () => {
      const initialDistance = camera.distance;

      // Zoom in
      camera.handleMouseWheel({ deltaY: -100 });
      const zoomedInDistance = camera.distance;
      expect(zoomedInDistance).toBeLessThan(initialDistance);

      // Zoom out
      camera.handleMouseWheel({ deltaY: 100 });
      expect(camera.distance).toBeGreaterThan(zoomedInDistance);
    });

    it('should clamp zoom distance to valid range', () => {
      // Try to zoom way in
      camera.handleMouseWheel({ deltaY: -10000 });
      expect(camera.distance).toBeGreaterThanOrEqual(camera.minDistance);

      // Try to zoom way out
      camera.handleMouseWheel({ deltaY: 10000 });
      expect(camera.distance).toBeLessThanOrEqual(camera.maxDistance);
    });
  });

  describe('camera reset', () => {
    it('should reset to default position and angles', () => {
      // Modify camera state
      camera.orbitX = Math.PI;
      camera.orbitY = Math.PI / 2;
      camera.distance = 30;

      camera.reset();

      expect(camera.orbitX).toBe(0);
      expect(camera.orbitY).toBe(0.3);
      expect(camera.distance).toBe(15);
    });
  });
});
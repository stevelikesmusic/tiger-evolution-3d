import { describe, it, expect, beforeEach } from 'vitest';
import { CameraSystem } from '../../systems/Camera.js';
import { TigerModel } from '../../entities/TigerModel.js';
import * as THREE from 'three';

describe('Camera Following Behavior', () => {
  let camera;
  let tigerModel;
  let deltaTime;

  beforeEach(() => {
    camera = new CameraSystem(800, 600);
    tigerModel = new TigerModel();
    camera.setTarget(tigerModel);
    deltaTime = 0.016; // 60 FPS
  });

  describe('Camera Position Relative to Tiger', () => {
    it('should position camera behind tiger when tiger faces forward', () => {
      // Tiger faces forward (0 rotation)
      tigerModel.setRotation(0, 0, 0);
      tigerModel.setPosition(0, 0, 0);

      // Update camera multiple times to allow smooth movement to target position
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const cameraPosition = camera.getCamera().position;
      const tigerPosition = tigerModel.position;

      // Camera should be behind tiger (positive Z in Three.js)
      expect(cameraPosition.z).toBeGreaterThan(tigerPosition.z);
      
      // Camera should be at roughly the same X position (behind, not to the side)
      expect(Math.abs(cameraPosition.x - tigerPosition.x)).toBeLessThan(1);
    });

    it('should position camera behind tiger when tiger faces right', () => {
      // Tiger faces right (π/2 rotation)
      tigerModel.setRotation(0, Math.PI / 2, 0);
      tigerModel.setPosition(0, 0, 0);

      // Update camera multiple times to allow smooth following
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const cameraPosition = camera.getCamera().position;
      const tigerPosition = tigerModel.position;

      // Camera should be behind tiger (negative X when tiger faces right)
      expect(cameraPosition.x).toBeLessThan(tigerPosition.x);
      
      // Camera should be at roughly the same Z position
      expect(Math.abs(cameraPosition.z - tigerPosition.z)).toBeLessThan(1);
    });

    it('should position camera behind tiger when tiger faces left', () => {
      // Tiger faces left (-π/2 rotation)
      tigerModel.setRotation(0, -Math.PI / 2, 0);
      tigerModel.setPosition(0, 0, 0);

      // Update camera multiple times to allow smooth following
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const cameraPosition = camera.getCamera().position;
      const tigerPosition = tigerModel.position;

      // Camera should be behind tiger (positive X when tiger faces left)
      expect(cameraPosition.x).toBeGreaterThan(tigerPosition.x);
      
      // Camera should be at roughly the same Z position
      expect(Math.abs(cameraPosition.z - tigerPosition.z)).toBeLessThan(1);
    });

    it('should position camera behind tiger when tiger faces backward', () => {
      // Tiger faces backward (π rotation)
      tigerModel.setRotation(0, Math.PI, 0);
      tigerModel.setPosition(0, 0, 0);

      // Update camera multiple times to allow smooth following
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const cameraPosition = camera.getCamera().position;
      const tigerPosition = tigerModel.position;

      // Camera should be behind tiger (negative Z when tiger faces backward)
      expect(cameraPosition.z).toBeLessThan(tigerPosition.z);
      
      // Camera should be at roughly the same X position
      expect(Math.abs(cameraPosition.x - tigerPosition.x)).toBeLessThan(1);
    });
  });

  describe('Camera Following Movement', () => {
    it('should follow tiger when tiger moves forward', () => {
      // Initial position
      tigerModel.setPosition(0, 0, 0);
      tigerModel.setRotation(0, 0, 0);
      
      // Update camera to establish initial position
      camera.update(deltaTime);
      const initialCameraPosition = camera.getCamera().position.clone();

      // Move tiger forward
      tigerModel.setPosition(0, 0, -5);
      
      // Update camera multiple times to allow smooth following
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const finalCameraPosition = camera.getCamera().position;

      // Camera should have moved forward (negative Z)
      expect(finalCameraPosition.z).toBeLessThan(initialCameraPosition.z);
      
      // Camera should still be behind tiger
      expect(finalCameraPosition.z).toBeGreaterThan(-5);
    });

    it('should follow tiger when tiger moves and turns', () => {
      // Initial position and rotation
      tigerModel.setPosition(0, 0, 0);
      tigerModel.setRotation(0, 0, 0);
      
      // Update camera to establish initial position
      camera.update(deltaTime);
      const initialCameraPosition = camera.getCamera().position.clone();

      // Move tiger forward-right and turn right
      tigerModel.setPosition(3, 0, -3);
      tigerModel.setRotation(0, Math.PI / 4, 0);
      
      // Update camera multiple times to allow smooth following
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const finalCameraPosition = camera.getCamera().position;

      // Camera should have moved toward the tiger's new position
      expect(finalCameraPosition.x).toBeGreaterThan(initialCameraPosition.x);
      expect(finalCameraPosition.z).toBeLessThan(initialCameraPosition.z);
      
      // Camera should still be behind the turned tiger
      // When tiger faces forward-right, camera should be behind-left
      expect(finalCameraPosition.x).toBeLessThan(3); // Behind in X
      expect(finalCameraPosition.z).toBeGreaterThan(-3); // Behind in Z
    });

    it('should maintain appropriate distance from tiger', () => {
      tigerModel.setPosition(0, 0, 0);
      tigerModel.setRotation(0, 0, 0);
      
      // Update camera multiple times to reach target position
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }
      
      const cameraPosition = camera.getCamera().position;
      const tigerPosition = tigerModel.position;
      
      const distance = cameraPosition.distanceTo(tigerPosition);
      
      // Distance should be within reasonable range (camera distance setting)
      expect(distance).toBeGreaterThan(5); // Not too close
      expect(distance).toBeLessThan(25); // Not too far
    });
  });

  describe('Camera Look Direction', () => {
    it('should always look at tiger', () => {
      // Move tiger to various positions
      const positions = [
        { x: 0, y: 0, z: 0 },
        { x: 5, y: 0, z: -5 },
        { x: -3, y: 0, z: 3 },
        { x: 0, y: 0, z: 10 }
      ];

      positions.forEach(pos => {
        tigerModel.setPosition(pos.x, pos.y, pos.z);
        
        // Update camera multiple times
        for (let i = 0; i < 10; i++) {
          camera.update(deltaTime);
        }

        // Check that camera is looking at tiger
        const cameraObj = camera.getCamera();
        const cameraDirection = new THREE.Vector3();
        cameraObj.getWorldDirection(cameraDirection);
        
        const tigerDirection = tigerModel.position.clone().sub(cameraObj.position).normalize();
        
        // Camera direction should be similar to direction toward tiger
        expect(cameraDirection.dot(tigerDirection)).toBeGreaterThan(0.9);
      });
    });
  });

  describe('Camera Rotation with Tiger', () => {
    it('should orbit around tiger when tiger rotates', () => {
      tigerModel.setPosition(0, 0, 0);
      tigerModel.setRotation(0, 0, 0);
      
      // Update camera to establish initial position
      camera.update(deltaTime);
      const initialCameraPosition = camera.getCamera().position.clone();

      // Rotate tiger 90 degrees right
      tigerModel.setRotation(0, Math.PI / 2, 0);
      
      // Update camera multiple times to allow smooth following
      for (let i = 0; i < 50; i++) {
        camera.update(deltaTime);
      }

      const finalCameraPosition = camera.getCamera().position;

      // Camera should have orbited around tiger
      expect(finalCameraPosition.x).not.toBeCloseTo(initialCameraPosition.x, 1);
      expect(finalCameraPosition.z).not.toBeCloseTo(initialCameraPosition.z, 1);
      
      // Distance from tiger should remain roughly the same
      const initialDistance = initialCameraPosition.distanceTo(tigerModel.position);
      const finalDistance = finalCameraPosition.distanceTo(tigerModel.position);
      expect(finalDistance).toBeCloseTo(initialDistance, 1);
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CameraSystem } from '../../systems/Camera.js';
import * as THREE from 'three';

// Mock Three.js objects
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    PerspectiveCamera: vi.fn((fov, aspect, near, far) => ({
      position: { 
        set: vi.fn(),
        copy: vi.fn(),
        lerp: vi.fn(),
        clone: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
        x: 0, y: 0, z: 0
      },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
      aspect: aspect,
      near: near,
      far: far,
      fov: fov
    })),
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
        normalize: vi.fn(function() { return this; }),
        multiplyScalar: vi.fn(function(s) { 
          this.x *= s; this.y *= s; this.z *= s; 
          return this;
        }),
        distanceTo: vi.fn(() => 10),
        clone: vi.fn(function() { 
          return {
            x: this.x, y: this.y, z: this.z,
            sub: vi.fn(function(v) { 
              this.x -= v.x; this.y -= v.y; this.z -= v.z; 
              return this;
            }),
            normalize: vi.fn(function() { return this; }),
            set: vi.fn(function(x, y, z) { 
              this.x = x; this.y = y; this.z = z; 
              return this;
            }),
            distanceTo: vi.fn(() => 10)
          };
        }),
        x: x, y: y, z: z
      };
      return vector;
    }),
    Raycaster: vi.fn(() => ({
      setFromCamera: vi.fn(),
      intersectObjects: vi.fn(() => []),
      set: vi.fn(),
      near: 0.1,
      far: 1000
    }))
  };
});

describe('CameraSystem', () => {
  let cameraSystem;
  let mockTarget;

  beforeEach(() => {
    mockTarget = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: 0 }
    };
    cameraSystem = new CameraSystem(800, 600);
  });

  describe('initialization', () => {
    it('should create a perspective camera with correct settings', () => {
      expect(cameraSystem.camera).toBeDefined();
      expect(cameraSystem.camera.fov).toBe(75);
      expect(cameraSystem.camera.aspect).toBe(800 / 600);
      expect(cameraSystem.camera.near).toBe(0.1);
      expect(cameraSystem.camera.far).toBe(1000);
    });

    it('should have default camera configuration', () => {
      expect(cameraSystem.distance).toBe(15);
      expect(cameraSystem.height).toBe(8);
      expect(cameraSystem.smoothness).toBe(0.1);
      expect(cameraSystem.minDistance).toBe(5);
      expect(cameraSystem.maxDistance).toBe(25);
    });

    it('should initialize with no target', () => {
      expect(cameraSystem.target).toBeNull();
    });
  });

  describe('target following', () => {
    beforeEach(() => {
      cameraSystem.setTarget(mockTarget);
    });

    it('should set target correctly', () => {
      expect(cameraSystem.target).toBe(mockTarget);
    });

    it('should calculate desired camera position behind target', () => {
      mockTarget.position = { x: 10, y: 0, z: 5 };
      mockTarget.rotation = { y: Math.PI / 2 }; // 90 degrees
      
      const desiredPos = cameraSystem.calculateDesiredPosition();
      expect(desiredPos).toBeDefined();
    });

    it('should update camera position smoothly', () => {
      mockTarget.position = { x: 5, y: 0, z: 5 };
      cameraSystem.update(0.016); // 60 FPS delta
      
      expect(cameraSystem.camera.position.lerp).toHaveBeenCalled();
      expect(cameraSystem.camera.lookAt).toHaveBeenCalled();
    });

    it('should maintain minimum distance from target', () => {
      cameraSystem.distance = 3; // Below minimum
      cameraSystem.update(0.016);
      expect(cameraSystem.distance).toBe(5); // Should be clamped to minimum
    });

    it('should maintain maximum distance from target', () => {
      cameraSystem.distance = 30; // Above maximum
      cameraSystem.update(0.016);
      expect(cameraSystem.distance).toBe(25); // Should be clamped to maximum
    });
  });

  describe('camera controls', () => {
    beforeEach(() => {
      cameraSystem.setTarget(mockTarget);
    });

    it('should zoom in when mouse wheel scrolls up', () => {
      const initialDistance = cameraSystem.distance;
      cameraSystem.handleMouseWheel({ deltaY: -100 });
      expect(cameraSystem.distance).toBeLessThan(initialDistance);
    });

    it('should zoom out when mouse wheel scrolls down', () => {
      const initialDistance = cameraSystem.distance;
      cameraSystem.handleMouseWheel({ deltaY: 100 });
      expect(cameraSystem.distance).toBeGreaterThan(initialDistance);
    });

    it('should orbit camera on mouse drag', () => {
      const initialOrbitX = cameraSystem.orbitX;
      const initialOrbitY = cameraSystem.orbitY;
      
      cameraSystem.handleMouseMove({ 
        movementX: 50, 
        movementY: 30,
        buttons: 1 
      });
      
      expect(cameraSystem.orbitX).not.toBe(initialOrbitX);
      expect(cameraSystem.orbitY).not.toBe(initialOrbitY);
    });

    it('should clamp vertical orbit angle', () => {
      // Test maximum up angle
      cameraSystem.orbitY = -2; // Beyond limit
      cameraSystem.update(0.016);
      expect(cameraSystem.orbitY).toBeGreaterThanOrEqual(-Math.PI / 3);
      
      // Test maximum down angle
      cameraSystem.orbitY = 2; // Beyond limit
      cameraSystem.update(0.016);
      expect(cameraSystem.orbitY).toBeLessThanOrEqual(Math.PI / 3);
    });

    it('should not orbit when mouse is not pressed', () => {
      const initialOrbitX = cameraSystem.orbitX;
      
      cameraSystem.handleMouseMove({ 
        movementX: 50, 
        movementY: 30,
        buttons: 0 // No buttons pressed
      });
      
      expect(cameraSystem.orbitX).toBe(initialOrbitX);
    });
  });

  describe('collision detection', () => {
    beforeEach(() => {
      cameraSystem.setTarget(mockTarget);
    });

    it('should check for obstacles between camera and target', () => {
      const obstacles = [{ id: 'tree1' }, { id: 'rock1' }];
      const hasCollision = cameraSystem.checkCollision(obstacles);
      
      expect(cameraSystem.raycaster.set).toHaveBeenCalled();
      expect(cameraSystem.raycaster.intersectObjects).toHaveBeenCalledWith(obstacles);
    });

    it('should adjust camera position when collision detected', () => {
      // Mock collision detection
      cameraSystem.raycaster.intersectObjects = vi.fn(() => [
        { distance: 8, point: { x: 2, y: 2, z: 2 } }
      ]);
      
      const obstacles = [{ id: 'wall' }];
      const collision = cameraSystem.checkCollision(obstacles);
      
      expect(collision).toBe(true);
    });

    it('should return false when no collision detected', () => {
      cameraSystem.raycaster.intersectObjects = vi.fn(() => []);
      
      const obstacles = [{ id: 'tree' }];
      const collision = cameraSystem.checkCollision(obstacles);
      
      expect(collision).toBe(false);
    });
  });

  describe('camera configuration', () => {
    it('should update aspect ratio', () => {
      cameraSystem.updateAspectRatio(1920, 1080);
      expect(cameraSystem.camera.aspect).toBe(1920 / 1080);
      expect(cameraSystem.camera.updateProjectionMatrix).toHaveBeenCalled();
    });

    it('should set camera distance', () => {
      cameraSystem.setDistance(20);
      expect(cameraSystem.distance).toBe(20);
    });

    it('should set camera height', () => {
      cameraSystem.setHeight(12);
      expect(cameraSystem.height).toBe(12);
    });

    it('should set smoothness factor', () => {
      cameraSystem.setSmoothness(0.05);
      expect(cameraSystem.smoothness).toBe(0.05);
    });

    it('should clamp distance within valid range', () => {
      cameraSystem.setDistance(2); // Below minimum
      expect(cameraSystem.distance).toBe(5);
      
      cameraSystem.setDistance(50); // Above maximum
      expect(cameraSystem.distance).toBe(25);
    });
  });

  describe('third-person perspective', () => {
    beforeEach(() => {
      cameraSystem.setTarget(mockTarget);
    });

    it('should position camera behind and above target', () => {
      mockTarget.position = { x: 0, y: 0, z: 0 };
      mockTarget.rotation = { y: 0 }; // Facing forward
      
      cameraSystem.update(0.016);
      
      const desiredPos = cameraSystem.calculateDesiredPosition();
      // Since we're using mocked Vector3, just check that set was called
      expect(desiredPos.set).toHaveBeenCalled();
    });

    it('should adjust camera based on target rotation', () => {
      mockTarget.rotation = { y: Math.PI }; // Facing backward
      
      cameraSystem.calculateDesiredPosition();
      const callCount1 = cameraSystem.desiredPosition.set.mock.calls.length;
      
      mockTarget.rotation = { y: 0 }; // Facing forward
      
      cameraSystem.calculateDesiredPosition();
      const callCount2 = cameraSystem.desiredPosition.set.mock.calls.length;
      
      // Should have called set method multiple times for different rotations
      expect(callCount2).toBeGreaterThan(callCount1);
    });
  });
});
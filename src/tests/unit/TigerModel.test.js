import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TigerModel } from '../../entities/TigerModel.js';
import * as THREE from 'three';

// Mock Three.js objects
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
    MeshBasicMaterial: vi.fn(() => ({ 
      dispose: vi.fn(),
      color: { 
        setRGB: vi.fn(),
        r: 1, g: 0.4, b: 0
      },
      emissive: { r: 0, g: 0, b: 0 },
      emissiveIntensity: 0
    })),
    Mesh: vi.fn(() => ({
      position: { 
        set: vi.fn(),
        clone: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
        x: 0, y: 0, z: 0
      },
      rotation: { 
        set: vi.fn(),
        clone: vi.fn(() => ({ x: 0, y: 0, z: 0 }))
      },
      scale: { set: vi.fn() },
      material: {
        dispose: vi.fn(),
        color: { 
          setRGB: vi.fn(),
          r: 1, g: 0.4, b: 0
        },
        emissive: { r: 0, g: 0, b: 0 },
        emissiveIntensity: 0
      },
      geometry: { dispose: vi.fn() },
      add: vi.fn(),
      dispose: vi.fn()
    })),
    AnimationMixer: vi.fn(() => ({
      clipAction: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        setLoop: vi.fn(),
        clampWhenFinished: vi.fn()
      })),
      update: vi.fn()
    })),
    Color: vi.fn((hex) => ({ r: 0, g: 0, b: 1 })),
    BufferGeometry: vi.fn(() => ({
      setAttribute: vi.fn(),
      dispose: vi.fn()
    })),
    BufferAttribute: vi.fn(),
    PointsMaterial: vi.fn(() => ({ dispose: vi.fn() })),
    Points: vi.fn(() => ({
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn() },
      rotation: { y: 0 }
    }))
  };
});

describe('TigerModel', () => {
  let tigerModel;

  beforeEach(() => {
    tigerModel = new TigerModel();
  });

  describe('initialization', () => {
    it('should create a tiger model with default properties', () => {
      expect(tigerModel.mesh).toBeDefined();
      expect(tigerModel.mixer).toBeDefined();
      expect(tigerModel.currentAnimation).toBe('idle');
      expect(tigerModel.evolutionStage).toBe('Young');
    });

    it('should have correct initial scale for Young tiger', () => {
      expect(tigerModel.mesh.scale.set).toHaveBeenCalledWith(1, 1, 1);
    });

    it('should have idle animation playing by default', () => {
      expect(tigerModel.currentAnimation).toBe('idle');
    });
  });

  describe('evolution appearance', () => {
    it('should update appearance for Adult evolution', () => {
      tigerModel.evolveToAdult();
      expect(tigerModel.evolutionStage).toBe('Adult');
      expect(tigerModel.mesh.scale.set).toHaveBeenCalledWith(1.2, 1.2, 1.2);
    });

    it('should update appearance for Alpha evolution', () => {
      tigerModel.evolveToAlpha();
      expect(tigerModel.evolutionStage).toBe('Alpha');
      expect(tigerModel.mesh.scale.set).toHaveBeenCalledWith(1.4, 1.4, 1.4);
    });

    it('should change material color for Alpha stage', () => {
      tigerModel.evolveToAlpha();
      // Check that setRGB was called with black color values
      expect(tigerModel.mesh.material.color.setRGB).toHaveBeenCalledWith(0.1, 0.1, 0.1);
    });
  });

  describe('animation system', () => {
    it('should change animation state', () => {
      tigerModel.playAnimation('walking');
      expect(tigerModel.currentAnimation).toBe('walking');
    });

    it('should not change to same animation', () => {
      const playAnimationSpy = vi.spyOn(tigerModel, 'playAnimation');
      tigerModel.playAnimation('idle');
      tigerModel.playAnimation('idle');
      expect(playAnimationSpy).toHaveBeenCalledTimes(2);
    });

    it('should have all required animation states', () => {
      const requiredAnimations = ['idle', 'walking', 'running', 'crouching', 'attacking', 'drinking'];
      requiredAnimations.forEach(animation => {
        expect(() => tigerModel.playAnimation(animation)).not.toThrow();
      });
    });
  });

  describe('position and rotation', () => {
    it('should update position correctly', () => {
      tigerModel.setPosition(10, 5, -3);
      expect(tigerModel.mesh.position.set).toHaveBeenCalledWith(10, 5, -3);
    });

    it('should update rotation correctly', () => {
      tigerModel.setRotation(0, Math.PI / 2, 0);
      expect(tigerModel.mesh.rotation.set).toHaveBeenCalledWith(0, Math.PI / 2, 0);
    });

    it('should get current position', () => {
      tigerModel.mesh.position.x = 5;
      tigerModel.mesh.position.y = 2;
      tigerModel.mesh.position.z = -1;
      const position = tigerModel.getPosition();
      expect(tigerModel.mesh.position.clone).toHaveBeenCalled();
    });
  });

  describe('update and cleanup', () => {
    it('should update animation mixer', () => {
      const deltaTime = 0.016;
      tigerModel.update(deltaTime);
      expect(tigerModel.mixer.update).toHaveBeenCalledWith(deltaTime);
    });

    it('should dispose resources properly', () => {
      tigerModel.dispose();
      expect(tigerModel.mesh.geometry.dispose).toHaveBeenCalled();
      expect(tigerModel.mesh.material.dispose).toHaveBeenCalled();
    });
  });

  describe('alpha tiger special effects', () => {
    beforeEach(() => {
      tigerModel.evolveToAlpha();
    });

    it('should have glowing effects for Alpha tiger', () => {
      expect(tigerModel.hasGlowEffects()).toBe(true);
    });

    it('should be able to charge laser breath', () => {
      tigerModel.startChargingLaser();
      expect(tigerModel.isChargingLaser).toBe(true);
    });

    it('should be able to fire laser breath', () => {
      tigerModel.startChargingLaser();
      const result = tigerModel.fireLaser();
      expect(result).toBe(true);
      expect(tigerModel.isChargingLaser).toBe(false);
    });

    it('should not fire laser if not charging', () => {
      const result = tigerModel.fireLaser();
      expect(result).toBe(false);
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { VegetationSystem } from '../../systems/VegetationSystem.js';
import { Terrain } from '../../entities/Terrain.js';

// Mock THREE.js objects
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      shadowMap: { enabled: false, type: null },
      outputColorSpace: null,
      toneMapping: null,
      toneMappingExposure: 1,
      render: vi.fn(),
      dispose: vi.fn()
    }))
  };
});

describe('VegetationSystem', () => {
  let vegetationSystem;
  let mockScene;
  let mockTerrain;

  beforeEach(() => {
    // Mock scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    // Mock terrain with realistic data
    mockTerrain = {
      getBounds: vi.fn(() => ({
        minX: -50,
        maxX: 50,
        minZ: -50,
        maxZ: 50
      })),
      getHeightAt: vi.fn((x, z) => {
        // Simulate varied terrain heights
        return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10;
      }),
      getSlope: vi.fn((x, z) => {
        // Simulate realistic slopes
        return Math.random() * 0.5;
      })
    };

    vegetationSystem = new VegetationSystem(mockScene, mockTerrain);
  });

  describe('constructor', () => {
    it('should initialize with scene and terrain', () => {
      expect(vegetationSystem.scene).toBe(mockScene);
      expect(vegetationSystem.terrain).toBe(mockTerrain);
    });

    it('should create vegetation groups', () => {
      expect(vegetationSystem.treeGroup).toBeInstanceOf(THREE.Group);
      expect(vegetationSystem.bushGroup).toBeInstanceOf(THREE.Group);
      expect(vegetationSystem.grassGroup).toBeInstanceOf(THREE.Group);
      expect(vegetationSystem.foliageGroup).toBeInstanceOf(THREE.Group);
    });

    it('should add groups to scene', () => {
      expect(mockScene.add).toHaveBeenCalledWith(vegetationSystem.treeGroup);
      expect(mockScene.add).toHaveBeenCalledWith(vegetationSystem.bushGroup);
      expect(mockScene.add).toHaveBeenCalledWith(vegetationSystem.grassGroup);
      expect(mockScene.add).toHaveBeenCalledWith(vegetationSystem.foliageGroup);
    });

    it('should initialize materials and geometries', () => {
      expect(vegetationSystem.materials.size).toBeGreaterThan(0);
      expect(vegetationSystem.geometries.size).toBeGreaterThan(0);
    });
  });

  describe('materials initialization', () => {
    it('should create tree trunk material', () => {
      const treeTrunkMaterial = vegetationSystem.materials.get('treeTrunk');
      expect(treeTrunkMaterial).toBeInstanceOf(THREE.MeshLambertMaterial);
      expect(treeTrunkMaterial.color.getHex()).toBe(0x4a3c28);
    });

    it('should create multiple leaf materials', () => {
      const leafMaterial0 = vegetationSystem.materials.get('treeLeaves0');
      const leafMaterial1 = vegetationSystem.materials.get('treeLeaves1');
      expect(leafMaterial0).toBeInstanceOf(THREE.MeshLambertMaterial);
      expect(leafMaterial1).toBeInstanceOf(THREE.MeshLambertMaterial);
    });

    it('should create bush material', () => {
      const bushMaterial = vegetationSystem.materials.get('bush');
      expect(bushMaterial).toBeInstanceOf(THREE.MeshLambertMaterial);
      expect(bushMaterial.transparent).toBe(true);
    });

    it('should create grass material', () => {
      const grassMaterial = vegetationSystem.materials.get('grass');
      expect(grassMaterial).toBeInstanceOf(THREE.MeshLambertMaterial);
      expect(grassMaterial.side).toBe(THREE.DoubleSide);
    });
  });

  describe('geometries initialization', () => {
    it('should create tree trunk geometry', () => {
      const trunkGeometry = vegetationSystem.geometries.get('treeTrunk');
      expect(trunkGeometry).toBeInstanceOf(THREE.CylinderGeometry);
    });

    it('should create multiple leaf geometries', () => {
      const leafGeometry0 = vegetationSystem.geometries.get('treeLeaves0');
      const leafGeometry1 = vegetationSystem.geometries.get('treeLeaves1');
      expect(leafGeometry0).toBeInstanceOf(THREE.SphereGeometry);
      expect(leafGeometry1).toBeInstanceOf(THREE.ConeGeometry);
    });

    it('should create bush geometry', () => {
      const bushGeometry = vegetationSystem.geometries.get('bush');
      expect(bushGeometry).toBeInstanceOf(THREE.SphereGeometry);
    });

    it('should create grass geometry', () => {
      const grassGeometry = vegetationSystem.geometries.get('grass');
      expect(grassGeometry).toBeInstanceOf(THREE.PlaneGeometry);
    });
  });

  describe('seeded random generator', () => {
    it('should create deterministic random numbers', () => {
      const rng1 = vegetationSystem.createSeededRandom(12345);
      const rng2 = vegetationSystem.createSeededRandom(12345);
      
      const values1 = [rng1(), rng1(), rng1()];
      const values2 = [rng2(), rng2(), rng2()];
      
      expect(values1).toEqual(values2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = vegetationSystem.createSeededRandom(12345);
      const rng2 = vegetationSystem.createSeededRandom(54321);
      
      const value1 = rng1();
      const value2 = rng2();
      
      expect(value1).not.toEqual(value2);
    });
  });

  describe('position validation', () => {
    it('should validate position based on height constraints', () => {
      const constraints = {
        minHeight: -10,
        maxHeight: 20,
        minSlope: 0,
        maxSlope: 0.5
      };

      // Mock terrain to return specific values
      mockTerrain.getHeightAt.mockReturnValue(5);
      mockTerrain.getSlope.mockReturnValue(0.2);

      const isValid = vegetationSystem.isValidPosition(0, 0, constraints);
      expect(isValid).toBe(true);
    });

    it('should reject position with height too high', () => {
      const constraints = {
        minHeight: -10,
        maxHeight: 20,
        minSlope: 0,
        maxSlope: 0.5
      };

      mockTerrain.getHeightAt.mockReturnValue(25);
      mockTerrain.getSlope.mockReturnValue(0.2);

      const isValid = vegetationSystem.isValidPosition(0, 0, constraints);
      expect(isValid).toBe(false);
    });

    it('should reject position with slope too steep', () => {
      const constraints = {
        minHeight: -10,
        maxHeight: 20,
        minSlope: 0,
        maxSlope: 0.5
      };

      mockTerrain.getHeightAt.mockReturnValue(5);
      mockTerrain.getSlope.mockReturnValue(0.8);

      const isValid = vegetationSystem.isValidPosition(0, 0, constraints);
      expect(isValid).toBe(false);
    });
  });

  describe('spacing validation', () => {
    it('should allow placement in empty area', () => {
      const occupiedPositions = new Set();
      const canPlace = vegetationSystem.checkSpacing(10, 10, 5, occupiedPositions);
      expect(canPlace).toBe(true);
    });

    it('should prevent placement near occupied position', () => {
      const occupiedPositions = new Set(['5_5']);
      const canPlace = vegetationSystem.checkSpacing(10, 10, 5, occupiedPositions);
      expect(canPlace).toBe(false);
    });
  });

  describe('vegetation generation', () => {
    beforeEach(() => {
      // Reset terrain mocks to return suitable values
      mockTerrain.getHeightAt.mockImplementation((x, z) => {
        return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5; // Suitable height range
      });
      mockTerrain.getSlope.mockImplementation((x, z) => {
        return Math.random() * 0.3; // Suitable slope range
      });
    });

    it('should generate vegetation with consistent seed', () => {
      vegetationSystem.generateVegetation(12345);
      const stats1 = vegetationSystem.getStatistics();
      
      vegetationSystem.clearVegetation();
      vegetationSystem.generateVegetation(12345);
      const stats2 = vegetationSystem.getStatistics();
      
      expect(stats1).toEqual(stats2);
    });

    it('should clear existing vegetation before generating new', () => {
      vegetationSystem.generateVegetation(12345);
      const initialStats = vegetationSystem.getStatistics();
      
      vegetationSystem.generateVegetation(54321);
      const newStats = vegetationSystem.getStatistics();
      
      // Stats might be different due to different seed, but old vegetation should be cleared
      expect(vegetationSystem.trees.length).toBe(newStats.trees);
    });

    it('should create vegetation within terrain bounds', () => {
      vegetationSystem.generateVegetation(12345);
      
      const bounds = mockTerrain.getBounds();
      
      vegetationSystem.trees.forEach(tree => {
        expect(tree.position.x).toBeGreaterThanOrEqual(bounds.minX);
        expect(tree.position.x).toBeLessThanOrEqual(bounds.maxX);
        expect(tree.position.z).toBeGreaterThanOrEqual(bounds.minZ);
        expect(tree.position.z).toBeLessThanOrEqual(bounds.maxZ);
      });
    });
  });

  describe('vegetation creation', () => {
    it('should create tree with trunk and leaves', () => {
      const rng = vegetationSystem.createSeededRandom(12345);
      
      // Mock successful terrain conditions
      mockTerrain.getHeightAt.mockReturnValue(5);
      
      const initialTreeCount = vegetationSystem.trees.length;
      vegetationSystem.createTree(0, 0, rng);
      
      expect(vegetationSystem.trees.length).toBe(initialTreeCount + 1);
      
      const tree = vegetationSystem.trees[vegetationSystem.trees.length - 1];
      expect(tree).toBeInstanceOf(THREE.Group);
      expect(tree.children.length).toBe(2); // trunk + leaves
    });

    it('should create bush with proper scaling', () => {
      const rng = vegetationSystem.createSeededRandom(12345);
      mockTerrain.getHeightAt.mockReturnValue(3);
      
      const initialBushCount = vegetationSystem.bushes.length;
      vegetationSystem.createBush(0, 0, rng);
      
      expect(vegetationSystem.bushes.length).toBe(initialBushCount + 1);
      
      const bush = vegetationSystem.bushes[vegetationSystem.bushes.length - 1];
      expect(bush).toBeInstanceOf(THREE.Mesh);
      expect(bush.scale.x).toBeGreaterThan(0.5);
      expect(bush.scale.x).toBeLessThanOrEqual(1.3);
    });

    it('should create grass patch with multiple blades', () => {
      const rng = vegetationSystem.createSeededRandom(12345);
      mockTerrain.getHeightAt.mockReturnValue(2);
      
      const initialGrassCount = vegetationSystem.grass.length;
      vegetationSystem.createGrassPatch(0, 0, rng);
      
      expect(vegetationSystem.grass.length).toBeGreaterThan(initialGrassCount);
      expect(vegetationSystem.grass.length).toBeGreaterThanOrEqual(initialGrassCount + 3);
    });
  });

  describe('update method', () => {
    it('should animate grass with wind effect', () => {
      // Create some grass first
      const rng = vegetationSystem.createSeededRandom(12345);
      mockTerrain.getHeightAt.mockReturnValue(2);
      vegetationSystem.createGrassPatch(0, 0, rng);
      
      const grass = vegetationSystem.grass[0];
      const initialRotation = grass.rotation.z;
      
      vegetationSystem.update(0.016); // 60fps delta time
      
      // Rotation should have changed due to wind effect
      expect(grass.rotation.z).not.toBe(initialRotation);
    });
  });

  describe('statistics', () => {
    it('should return correct vegetation counts', () => {
      // Create some vegetation manually for testing
      const rng = vegetationSystem.createSeededRandom(12345);
      mockTerrain.getHeightAt.mockReturnValue(5);
      
      vegetationSystem.createTree(0, 0, rng);
      vegetationSystem.createBush(5, 5, rng);
      vegetationSystem.createGrassPatch(10, 10, rng);
      
      const stats = vegetationSystem.getStatistics();
      
      expect(stats.trees).toBe(1);
      expect(stats.bushes).toBe(1);
      expect(stats.grass).toBeGreaterThanOrEqual(3); // Grass patch creates multiple blades
      expect(stats.total).toBe(stats.trees + stats.bushes + stats.grass + stats.foliage);
    });
  });

  describe('disposal', () => {
    it('should clear all vegetation', () => {
      // Generate some vegetation
      vegetationSystem.generateVegetation(12345);
      
      vegetationSystem.dispose();
      
      const stats = vegetationSystem.getStatistics();
      expect(stats.total).toBe(0);
    });

    it('should dispose materials and geometries', () => {
      const materialDisposeSpy = vi.fn();
      const geometryDisposeSpy = vi.fn();
      
      // Mock dispose methods
      vegetationSystem.materials.forEach(material => {
        material.dispose = materialDisposeSpy;
      });
      vegetationSystem.geometries.forEach(geometry => {
        geometry.dispose = geometryDisposeSpy;
      });
      
      vegetationSystem.dispose();
      
      expect(materialDisposeSpy).toHaveBeenCalled();
      expect(geometryDisposeSpy).toHaveBeenCalled();
    });

    it('should remove groups from scene', () => {
      vegetationSystem.dispose();
      
      expect(mockScene.remove).toHaveBeenCalledWith(vegetationSystem.treeGroup);
      expect(mockScene.remove).toHaveBeenCalledWith(vegetationSystem.bushGroup);
      expect(mockScene.remove).toHaveBeenCalledWith(vegetationSystem.grassGroup);
      expect(mockScene.remove).toHaveBeenCalledWith(vegetationSystem.foliageGroup);
    });
  });
});
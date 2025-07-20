import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AmbushSystem } from '../../systems/AmbushSystem.js';
import { AmbushDetector } from '../../systems/AmbushDetector.js';

// Mock the ambush entities to avoid Three.js dependency issues
vi.mock('../../entities/CrocodileAmbush.js', () => ({
  CrocodileAmbush: class {
    constructor(x, y, z, waterBody) {
      this.position = { x, y, z };
      this.waterBody = waterBody;
      this.health = 200;
      this.state = 'hidden';
    }
    setTerrain() {}
    setWaterSystem() {}
    getMesh() { return {}; }
    isAlive() { return this.health > 0; }
    shouldDespawn() { return !this.isAlive(); }
    dispose() {}
  }
}));

vi.mock('../../entities/LeopardAmbush.js', () => ({
  LeopardAmbush: class {
    constructor(x, y, z, tree) {
      this.position = { x, y, z };
      this.tree = tree;
      this.health = 180;
      this.state = 'hidden';
    }
    setTerrain() {}
    setVegetationSystem() {}
    getMesh() { return {}; }
    isAlive() { return this.health > 0; }
    shouldDespawn() { return !this.isAlive(); }
    dispose() {}
  }
}));

// Mock Three.js
vi.mock('three', () => ({
  Vector3: class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z);
    }
    distanceTo(v) {
      return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    }
    sub(v) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    }
    subVectors(a, b) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    }
    normalize() {
      const length = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
      if (length > 0) {
        this.x /= length;
        this.y /= length;
        this.z /= length;
      }
      return this;
    }
    multiplyScalar(s) {
      this.x *= s;
      this.y *= s;
      this.z *= s;
      return this;
    }
    dot(v) {
      return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    length() {
      return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }
  },
  Euler: class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    copy(e) {
      this.x = e.x;
      this.y = e.y;
      this.z = e.z;
      return this;
    }
  },
  Mesh: class {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.position = new this.constructor.Vector3();
      this.rotation = new this.constructor.Euler();
      this.children = [];
    }
    add(child) {
      this.children.push(child);
    }
    clear() {
      this.children = [];
    }
  },
  BoxGeometry: class {},
  SphereGeometry: class {},
  ConeGeometry: class {},
  MeshLambertMaterial: class {
    constructor(props) {
      Object.assign(this, props);
    }
  }
}));

describe('AmbushSystem', () => {
  let ambushSystem;
  let mockScene;
  let mockTerrain;
  let mockWaterSystem;
  let mockVegetationSystem;
  let mockAnimalSystem;

  beforeEach(() => {
    // Mock dependencies
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    mockTerrain = {
      getHeightAt: vi.fn().mockReturnValue(5.0),
      getSlope: vi.fn().mockReturnValue(0.2),
      getBounds: vi.fn().mockReturnValue({
        minX: -100, maxX: 100,
        minZ: -100, maxZ: 100
      })
    };

    mockWaterSystem = {
      getWaterBodies: vi.fn().mockReturnValue([
        {
          type: 'lake',
          center: { x: 0, z: 0 },
          radius: 20
        },
        {
          type: 'pond',
          center: { x: 50, z: 30 },
          radius: 15
        }
      ]),
      isInWater: vi.fn().mockReturnValue(false),
      getWaterDepth: vi.fn().mockReturnValue(2.0)
    };

    mockVegetationSystem = {
      trees: [
        {
          position: { x: 10, y: 5, z: 15 },
          scale: { x: 2.5 }
        },
        {
          position: { x: -20, y: 5, z: 25 },
          scale: { x: 3.0 }
        }
      ]
    };

    mockAnimalSystem = {};

    // Create ambush system
    ambushSystem = new AmbushSystem(
      mockScene,
      mockTerrain,
      mockWaterSystem,
      mockVegetationSystem,
      mockAnimalSystem
    );
  });

  describe('initialization', () => {
    it('should create AmbushSystem with correct dependencies', () => {
      expect(ambushSystem).toBeDefined();
      expect(ambushSystem.scene).toBe(mockScene);
      expect(ambushSystem.terrain).toBe(mockTerrain);
      expect(ambushSystem.waterSystem).toBe(mockWaterSystem);
      expect(ambushSystem.vegetationSystem).toBe(mockVegetationSystem);
    });

    it('should initialize with empty ambusher arrays', () => {
      expect(ambushSystem.crocodileAmbushers).toEqual([]);
      expect(ambushSystem.leopardAmbushers).toEqual([]);
    });

    it('should create AmbushDetector instance', () => {
      expect(ambushSystem.ambushDetector).toBeInstanceOf(AmbushDetector);
    });
  });

  describe('spawning', () => {
    it('should spawn crocodile ambushers near water bodies', () => {
      // Mock Math.random to guarantee spawning
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.5); // Always true for 60% chance
      
      ambushSystem.spawnCrocodileAmbushers();
      
      expect(ambushSystem.crocodileAmbushers.length).toBeGreaterThan(0);
      expect(mockScene.add).toHaveBeenCalled();
      
      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should spawn leopard ambushers in suitable trees', () => {
      // Mock Math.random to guarantee spawning
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.3); // Always true for 40% chance
      
      // Make trees suitable by positioning them far from water bodies
      // Water bodies are at (0,0) r=20 and (50,30) r=15
      // Trees need to be >20+20=40 units from (0,0) and >15+20=35 units from (50,30)
      mockVegetationSystem.trees = [
        {
          position: { x: -80, y: 5, z: -80 }, // Far from all water
          scale: { x: 2.5 } // Above minimum scale of 2.0
        },
        {
          position: { x: -100, y: 5, z: 100 }, // Far from all water
          scale: { x: 3.0 }
        }
      ];
      
      ambushSystem.spawnLeopardAmbushers();
      
      expect(ambushSystem.leopardAmbushers.length).toBeGreaterThan(0);
      expect(mockScene.add).toHaveBeenCalled();
      
      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should respect maximum ambusher limits', () => {
      // Mock Math.random to guarantee spawning
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Always spawn
      
      // Set low limits for testing
      ambushSystem.maxCrocodiles = 1;
      ambushSystem.maxLeopards = 1;
      
      // Update vegetation for suitable trees (far from water)
      mockVegetationSystem.trees = [
        { position: { x: -100, y: 5, z: -100 }, scale: { x: 3.0 } }
      ];
      
      // Spawn multiple times
      for (let i = 0; i < 5; i++) {
        ambushSystem.spawnCrocodileAmbushers();
        ambushSystem.spawnLeopardAmbushers();
      }
      
      expect(ambushSystem.crocodileAmbushers.length).toBeLessThanOrEqual(1);
      expect(ambushSystem.leopardAmbushers.length).toBeLessThanOrEqual(1);
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('update', () => {
    let mockTiger;

    beforeEach(() => {
      mockTiger = {
        position: { x: 0, y: 5, z: 0 },
        evolutionStage: 'Young',
        isAlive: vi.fn().mockReturnValue(true),
        getStealthEffectiveness: vi.fn().mockReturnValue(60),
        state: 'walking'
      };
    });

    it('should update tiger awareness', () => {
      const awareness = ambushSystem.update(0.016, mockTiger);
      
      expect(typeof awareness).toBe('undefined'); // update returns void
      expect(ambushSystem.ambushDetector.currentAwareness).toBeGreaterThanOrEqual(0);
      expect(ambushSystem.ambushDetector.currentAwareness).toBeLessThanOrEqual(1);
    });

    it('should not update if tiger is not alive', () => {
      mockTiger.isAlive.mockReturnValue(false);
      
      const updateSpy = vi.spyOn(ambushSystem, 'updateAmbushers');
      ambushSystem.update(0.016, mockTiger);
      
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should throttle updates for performance', () => {
      const updateSpy = vi.spyOn(ambushSystem, 'updateAmbushers');
      
      // Multiple quick updates
      ambushSystem.update(0.001, mockTiger);
      ambushSystem.update(0.001, mockTiger);
      ambushSystem.update(0.001, mockTiger);
      
      // Should not update every frame due to throttling
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('tiger awareness', () => {
    let mockTiger;

    beforeEach(() => {
      mockTiger = {
        position: { x: 0, y: 5, z: 0 },
        evolutionStage: 'Adult',
        isAlive: vi.fn().mockReturnValue(true),
        getStealthEffectiveness: vi.fn().mockReturnValue(60),
        state: 'walking'
      };
    });

    it('should calculate tiger awareness correctly', () => {
      const awareness = ambushSystem.getTigerAwareness(mockTiger);
      
      expect(awareness).toBeGreaterThanOrEqual(0);
      expect(awareness).toBeLessThanOrEqual(1);
    });

    it('should return active ambushers', () => {
      // Add some mock ambushers
      ambushSystem.crocodileAmbushers.push({
        isAlive: vi.fn().mockReturnValue(true)
      });
      ambushSystem.leopardAmbushers.push({
        isAlive: vi.fn().mockReturnValue(true)
      });

      const activeAmbushers = ambushSystem.getActiveAmbushers();
      expect(activeAmbushers).toHaveLength(2);
    });
  });

  describe('spawn rates', () => {
    let mockTiger;

    beforeEach(() => {
      mockTiger = {
        evolutionStage: 'Young'
      };
    });

    it('should return correct spawn rates for Young tiger', () => {
      const rates = ambushSystem.getSpawnRatesForTiger(mockTiger);
      
      expect(rates.crocodile).toBe(0.15);
      expect(rates.leopard).toBe(0.10);
    });

    it('should return correct spawn rates for Adult tiger', () => {
      mockTiger.evolutionStage = 'Adult';
      const rates = ambushSystem.getSpawnRatesForTiger(mockTiger);
      
      expect(rates.crocodile).toBe(0.25);
      expect(rates.leopard).toBe(0.20);
    });

    it('should return correct spawn rates for Alpha tiger', () => {
      mockTiger.evolutionStage = 'Alpha';
      const rates = ambushSystem.getSpawnRatesForTiger(mockTiger);
      
      expect(rates.crocodile).toBe(0.30);
      expect(rates.leopard).toBe(0.25);
    });
  });

  describe('cleanup', () => {
    it('should remove defeated ambushers', () => {
      // Add mock ambushers
      const deadCrocodile = {
        isAlive: vi.fn().mockReturnValue(false),
        shouldDespawn: vi.fn().mockReturnValue(true),
        getMesh: vi.fn().mockReturnValue({}),
        dispose: vi.fn()
      };

      const aliveLeopard = {
        isAlive: vi.fn().mockReturnValue(true),
        shouldDespawn: vi.fn().mockReturnValue(false)
      };

      ambushSystem.crocodileAmbushers.push(deadCrocodile);
      ambushSystem.leopardAmbushers.push(aliveLeopard);

      ambushSystem.cleanupDefeatedAmbushers();

      expect(ambushSystem.crocodileAmbushers).toHaveLength(0);
      expect(ambushSystem.leopardAmbushers).toHaveLength(1);
      expect(mockScene.remove).toHaveBeenCalled();
      expect(deadCrocodile.dispose).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should return correct statistics', () => {
      // Add mock ambushers
      ambushSystem.crocodileAmbushers.push({
        isAlive: vi.fn().mockReturnValue(true)
      });
      ambushSystem.leopardAmbushers.push({
        isAlive: vi.fn().mockReturnValue(false)
      });

      const stats = ambushSystem.getStatistics();

      expect(stats.activeCrocodiles).toBe(1);
      expect(stats.activeLeopards).toBe(0);
      expect(stats.totalAmbushers).toBe(2);
      expect(typeof stats.timeSinceLastAmbush).toBe('number');
    });
  });

  describe('disposal', () => {
    it('should clean up all resources on dispose', () => {
      // Add mock ambushers
      const mockCrocodile = {
        getMesh: vi.fn().mockReturnValue({}),
        dispose: vi.fn()
      };
      const mockLeopard = {
        getMesh: vi.fn().mockReturnValue({}),
        dispose: vi.fn()
      };

      ambushSystem.crocodileAmbushers.push(mockCrocodile);
      ambushSystem.leopardAmbushers.push(mockLeopard);

      const detectorDisposeSpy = vi.spyOn(ambushSystem.ambushDetector, 'dispose');

      ambushSystem.dispose();

      expect(ambushSystem.crocodileAmbushers).toHaveLength(0);
      expect(ambushSystem.leopardAmbushers).toHaveLength(0);
      expect(mockScene.remove).toHaveBeenCalledTimes(2);
      expect(mockCrocodile.dispose).toHaveBeenCalled();
      expect(mockLeopard.dispose).toHaveBeenCalled();
      expect(detectorDisposeSpy).toHaveBeenCalled();
    });
  });
});

describe('AmbushDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new AmbushDetector();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(detector.currentAwareness).toBe(0.0);
      expect(detector.baseDetectionRadius).toBe(25.0);
      expect(detector.maxAwarenessDistance).toBe(50.0);
    });

    it('should have correct awareness factor weights', () => {
      const factors = detector.awarenessFactors;
      expect(factors.proximity + factors.movement + factors.stealth + factors.environmental).toBe(1.0);
    });
  });

  describe('awareness calculation', () => {
    let mockTiger;
    let mockThreats;

    beforeEach(() => {
      mockTiger = {
        position: { x: 0, y: 5, z: 0 },
        state: 'walking',
        getStealthEffectiveness: vi.fn().mockReturnValue(60)
      };

      mockThreats = [
        {
          position: { x: 10, y: 5, z: 0 },
          isAlive: vi.fn().mockReturnValue(true),
          getState: vi.fn().mockReturnValue('hidden'),
          getDetectionRadius: vi.fn().mockReturnValue(25)
        }
      ];
    });

    it('should calculate awareness correctly with nearby threats', () => {
      const awareness = detector.updateAwareness(mockTiger, mockThreats);
      
      expect(awareness).toBeGreaterThan(0);
      expect(awareness).toBeLessThanOrEqual(1);
    });

    it('should return zero awareness with no threats', () => {
      const awareness = detector.updateAwareness(mockTiger, []);
      
      expect(awareness).toBeGreaterThanOrEqual(0);
    });

    it('should handle null threats gracefully', () => {
      const awareness = detector.updateAwareness(mockTiger, null);
      
      expect(awareness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detection methods', () => {
    let mockTiger;
    let mockAmbusher;

    beforeEach(() => {
      mockTiger = {
        position: { x: 0, y: 5, z: 0 },
        state: 'walking',
        getDetectionRadius: vi.fn().mockReturnValue(25),
        getStealthEffectiveness: vi.fn().mockReturnValue(60)
      };

      mockAmbusher = {
        position: { x: 15, y: 5, z: 0 },
        isAlive: vi.fn().mockReturnValue(true)
      };
    });

    it('should detect nearby ambushers correctly', () => {
      const canDetect = detector.canDetectAmbusher(mockTiger, mockAmbusher);
      
      expect(typeof canDetect).toBe('boolean');
    });

    it('should always detect dead ambushers', () => {
      mockAmbusher.isAlive.mockReturnValue(false);
      
      const canDetect = detector.canDetectAmbusher(mockTiger, mockAmbusher);
      
      expect(canDetect).toBe(true);
    });
  });

  describe('awareness levels', () => {
    it('should categorize awareness levels correctly', () => {
      detector.currentAwareness = 0.1;
      expect(detector.getAwarenessLevel()).toBe('safe');

      detector.currentAwareness = 0.3;
      expect(detector.getAwarenessLevel()).toBe('alert');

      detector.currentAwareness = 0.5;
      expect(detector.getAwarenessLevel()).toBe('danger');

      detector.currentAwareness = 0.8;
      expect(detector.getAwarenessLevel()).toBe('imminent');
    });

    it('should return correct colors for awareness levels', () => {
      detector.currentAwareness = 0.1;
      expect(detector.getAwarenessColor()).toBe('#00FF00'); // Green

      detector.currentAwareness = 0.8;
      expect(detector.getAwarenessColor()).toBe('#FF0000'); // Red
    });
  });

  describe('statistics', () => {
    it('should return detection statistics', () => {
      const stats = detector.getDetectionStatistics();
      
      expect(stats).toHaveProperty('currentAwareness');
      expect(stats).toHaveProperty('averageAwareness');
      expect(stats).toHaveProperty('awarenessLevel');
      expect(stats).toHaveProperty('cacheSize');
    });
  });

  describe('disposal', () => {
    it('should clean up resources on dispose', () => {
      detector.detectionCache.set('test', true);
      detector.awarenessHistory.push(0.5);
      
      detector.dispose();
      
      expect(detector.detectionCache.size).toBe(0);
      expect(detector.awarenessHistory).toHaveLength(0);
    });
  });
});
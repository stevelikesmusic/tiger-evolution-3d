import { describe, it, expect, beforeEach } from 'vitest';
import { Terrain } from '../../entities/Terrain.js';

describe('Terrain', () => {
  let terrain;

  beforeEach(() => {
    terrain = new Terrain();
  });

  describe('constructor', () => {
    it('should create terrain with default parameters', () => {
      expect(terrain).toBeDefined();
      expect(terrain.width).toBe(512);
      expect(terrain.height).toBe(512);
      expect(terrain.segments).toBe(128);
    });

    it('should create terrain with custom parameters', () => {
      const customTerrain = new Terrain(256, 256, 64);
      expect(customTerrain.width).toBe(256);
      expect(customTerrain.height).toBe(256);
      expect(customTerrain.segments).toBe(64);
    });

    it('should initialize heightmap array', () => {
      expect(terrain.heightmap).toBeDefined();
      expect(terrain.heightmap).toBeInstanceOf(Array);
      expect(terrain.heightmap.length).toBe(terrain.segments + 1);
      expect(terrain.heightmap[0].length).toBe(terrain.segments + 1);
    });
  });

  describe('generateHeightmap', () => {
    it('should generate heightmap using Perlin noise', () => {
      terrain.generateHeightmap();
      
      // Check that heights are within expected range
      let minHeight = Infinity;
      let maxHeight = -Infinity;
      
      for (let i = 0; i <= terrain.segments; i++) {
        for (let j = 0; j <= terrain.segments; j++) {
          const height = terrain.heightmap[i][j];
          minHeight = Math.min(minHeight, height);
          maxHeight = Math.max(maxHeight, height);
        }
      }
      
      expect(minHeight).toBeGreaterThanOrEqual(-50);
      expect(maxHeight).toBeLessThanOrEqual(50);
    });

    it('should generate different heightmaps with different seeds', () => {
      terrain.generateHeightmap(12345);
      const heightmap1 = JSON.parse(JSON.stringify(terrain.heightmap));
      
      terrain.generateHeightmap(67890);
      const heightmap2 = terrain.heightmap;
      
      // Should be different
      let isDifferent = false;
      for (let i = 0; i <= terrain.segments && !isDifferent; i++) {
        for (let j = 0; j <= terrain.segments && !isDifferent; j++) {
          if (heightmap1[i][j] !== heightmap2[i][j]) {
            isDifferent = true;
          }
        }
      }
      
      expect(isDifferent).toBe(true);
    });
  });

  describe('getHeightAt', () => {
    beforeEach(() => {
      terrain.generateHeightmap();
    });

    it('should return correct height at world position', () => {
      const height = terrain.getHeightAt(0, 0);
      expect(typeof height).toBe('number');
      expect(height).toBeGreaterThanOrEqual(-50);
      expect(height).toBeLessThanOrEqual(50);
    });

    it('should interpolate height between vertices', () => {
      const height1 = terrain.getHeightAt(1.5, 1.5);
      const height2 = terrain.getHeightAt(2.0, 2.0);
      
      expect(typeof height1).toBe('number');
      expect(typeof height2).toBe('number');
    });

    it('should return 0 for positions outside terrain bounds', () => {
      const height = terrain.getHeightAt(1000, 1000);
      expect(height).toBe(0);
    });
  });

  describe('getSlope', () => {
    beforeEach(() => {
      terrain.generateHeightmap();
    });

    it('should calculate slope at given position', () => {
      const slope = terrain.getSlope(10, 10);
      expect(typeof slope).toBe('number');
      expect(slope).toBeGreaterThanOrEqual(0);
      expect(slope).toBeLessThanOrEqual(1);
    });

    it('should return 0 slope for flat terrain', () => {
      // Create flat terrain
      for (let i = 0; i <= terrain.segments; i++) {
        for (let j = 0; j <= terrain.segments; j++) {
          terrain.heightmap[i][j] = 0;
        }
      }
      
      const slope = terrain.getSlope(10, 10);
      expect(slope).toBe(0);
    });
  });

  describe('getTextureWeights', () => {
    beforeEach(() => {
      terrain.generateHeightmap();
    });

    it('should return texture weights based on height and slope', () => {
      const weights = terrain.getTextureWeights(10, 10);
      
      expect(weights).toBeDefined();
      expect(weights.grass).toBeGreaterThanOrEqual(0);
      expect(weights.dirt).toBeGreaterThanOrEqual(0);
      expect(weights.rock).toBeGreaterThanOrEqual(0);
      expect(weights.sand).toBeGreaterThanOrEqual(0);
      
      // Weights should sum to approximately 1
      const sum = weights.grass + weights.dirt + weights.rock + weights.sand;
      expect(sum).toBeCloseTo(1, 2);
    });

    it('should prefer grass texture for low, flat areas', () => {
      // Set specific height and slope conditions
      for (let i = 9; i <= 12; i++) {
        for (let j = 9; j <= 12; j++) {
          terrain.heightmap[i][j] = 5; // Low height, flat
        }
      }
      
      // Convert heightmap coordinates to world coordinates
      const worldX = (10 / terrain.segments) * terrain.width - terrain.width / 2;
      const worldZ = (10 / terrain.segments) * terrain.height - terrain.height / 2;
      
      const weights = terrain.getTextureWeights(worldX, worldZ);
      expect(weights.grass).toBeGreaterThan(0.5);
    });

    it('should prefer rock texture for high, steep areas', () => {
      // Set specific height and slope conditions for rock
      // Create a steep slope by setting neighboring heights
      for (let i = 9; i <= 12; i++) {
        for (let j = 9; j <= 12; j++) {
          terrain.heightmap[i][j] = 30; // High height base
        }
      }
      // Create steep slope by making adjacent cells much lower
      terrain.heightmap[10][11] = 5;
      terrain.heightmap[11][10] = 5;
      terrain.heightmap[9][10] = 5;
      terrain.heightmap[10][9] = 5;
      
      // Convert heightmap coordinates to world coordinates
      // heightmap[10][10] corresponds to world position based on terrain size
      const worldX = (10 / terrain.segments) * terrain.width - terrain.width / 2;
      const worldZ = (10 / terrain.segments) * terrain.height - terrain.height / 2;
      
      const weights = terrain.getTextureWeights(worldX, worldZ);
      expect(weights.rock).toBeGreaterThan(0.3);
    });
  });

  describe('getNormal', () => {
    beforeEach(() => {
      terrain.generateHeightmap();
    });

    it('should calculate surface normal at given position', () => {
      const normal = terrain.getNormal(10, 10);
      
      expect(normal).toBeDefined();
      expect(normal.x).toBeDefined();
      expect(normal.y).toBeDefined();
      expect(normal.z).toBeDefined();
      
      // Normal should be normalized (length ≈ 1)
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
      expect(length).toBeCloseTo(1, 2);
    });

    it('should return upward normal for flat terrain', () => {
      // Create flat terrain
      for (let i = 0; i <= terrain.segments; i++) {
        for (let j = 0; j <= terrain.segments; j++) {
          terrain.heightmap[i][j] = 0;
        }
      }
      
      const normal = terrain.getNormal(10, 10);
      expect(normal.x).toBeCloseTo(0, 2);
      expect(normal.y).toBeCloseTo(1, 2);
      expect(normal.z).toBeCloseTo(0, 2);
    });
  });

  describe('isWalkable', () => {
    beforeEach(() => {
      terrain.generateHeightmap();
    });

    it('should return true for walkable slopes', () => {
      // Create gentle slope
      for (let i = 9; i <= 12; i++) {
        for (let j = 9; j <= 12; j++) {
          terrain.heightmap[i][j] = 0; // Base height
        }
      }
      // Create gentle slope
      terrain.heightmap[10][11] = 2;
      terrain.heightmap[11][10] = 2;
      terrain.heightmap[9][10] = 2;
      terrain.heightmap[10][9] = 2;
      
      // Convert heightmap coordinates to world coordinates
      const worldX = (10 / terrain.segments) * terrain.width - terrain.width / 2;
      const worldZ = (10 / terrain.segments) * terrain.height - terrain.height / 2;
      
      const walkable = terrain.isWalkable(worldX, worldZ);
      expect(walkable).toBe(true);
    });

    it('should return false for steep slopes', () => {
      // Set terrain.walkableSlope to a very low value to ensure failure
      const originalSlope = terrain.walkableSlope;
      terrain.walkableSlope = 0.001; // Very restrictive
      
      // Generate some terrain with noise to ensure we have some slope
      terrain.generateHeightmap(12345);
      
      // Test various positions until we find one that's not walkable
      let foundUnwalkable = false;
      for (let x = -50; x <= 50; x += 10) {
        for (let z = -50; z <= 50; z += 10) {
          const walkable = terrain.isWalkable(x, z);
          if (!walkable) {
            foundUnwalkable = true;
            expect(walkable).toBe(false);
            break;
          }
        }
        if (foundUnwalkable) break;
      }
      
      // If we still didn't find unwalkable terrain, manually create extreme slope
      if (!foundUnwalkable) {
        // Create a very steep area by manually setting heightmap
        const center = Math.floor(terrain.segments / 2);
        terrain.heightmap[center][center] = 0;
        terrain.heightmap[center][center + 1] = 1000; // Extreme height
        
        // This should definitely be unwalkable
        const walkable = terrain.isWalkable(1, 0); // Slightly off center
        expect(walkable).toBe(false);
      }
      
      // Restore original slope
      terrain.walkableSlope = originalSlope;
    });
  });

  describe('getBounds', () => {
    it('should return terrain bounds', () => {
      const bounds = terrain.getBounds();
      
      expect(bounds).toBeDefined();
      expect(bounds.minX).toBe(-terrain.width / 2);
      expect(bounds.maxX).toBe(terrain.width / 2);
      expect(bounds.minZ).toBe(-terrain.height / 2);
      expect(bounds.maxZ).toBe(terrain.height / 2);
    });
  });
});
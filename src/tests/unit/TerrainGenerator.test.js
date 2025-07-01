import { describe, it, expect } from 'vitest';
import { TerrainGenerator } from '../../utils/TerrainGenerator.js';

describe('TerrainGenerator', () => {
  describe('generatePerlinNoise', () => {
    it('should generate 2D noise array with correct dimensions', () => {
      const width = 64;
      const height = 64;
      const noise = TerrainGenerator.generatePerlinNoise(width, height);
      
      expect(noise).toBeDefined();
      expect(noise.length).toBe(height);
      expect(noise[0].length).toBe(width);
    });

    it('should generate noise values in expected range', () => {
      const width = 32;
      const height = 32;
      const noise = TerrainGenerator.generatePerlinNoise(width, height);
      
      let minValue = Infinity;
      let maxValue = -Infinity;
      
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const value = noise[i][j];
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      }
      
      // Perlin noise should be in range [-1, 1]
      expect(minValue).toBeGreaterThanOrEqual(-1);
      expect(maxValue).toBeLessThanOrEqual(1);
    });

    it('should generate different noise with different seeds', () => {
      const width = 16;
      const height = 16;
      
      const noise1 = TerrainGenerator.generatePerlinNoise(width, height, { seed: 123 });
      const noise2 = TerrainGenerator.generatePerlinNoise(width, height, { seed: 456 });
      
      let isDifferent = false;
      for (let i = 0; i < height && !isDifferent; i++) {
        for (let j = 0; j < width && !isDifferent; j++) {
          if (noise1[i][j] !== noise2[i][j]) {
            isDifferent = true;
          }
        }
      }
      
      expect(isDifferent).toBe(true);
    });

    it('should generate smooth noise with scale parameter', () => {
      const width = 32;
      const height = 32;
      
      const fineNoise = TerrainGenerator.generatePerlinNoise(width, height, { scale: 0.1 });
      const coarseNoise = TerrainGenerator.generatePerlinNoise(width, height, { scale: 0.05 });
      
      // Both should be valid noise arrays
      expect(fineNoise).toBeDefined();
      expect(coarseNoise).toBeDefined();
      expect(fineNoise.length).toBe(height);
      expect(coarseNoise.length).toBe(height);
    });
  });

  describe('generateHeightmap', () => {
    it('should generate heightmap with multiple octaves', () => {
      const width = 64;
      const height = 64;
      const heightmap = TerrainGenerator.generateHeightmap(width, height);
      
      expect(heightmap).toBeDefined();
      expect(heightmap.length).toBe(height);
      expect(heightmap[0].length).toBe(width);
    });

    it('should respect amplitude parameter', () => {
      const width = 32;
      const height = 32;
      
      const lowHeightmap = TerrainGenerator.generateHeightmap(width, height, { amplitude: 10 });
      const highHeightmap = TerrainGenerator.generateHeightmap(width, height, { amplitude: 50 });
      
      // Calculate ranges
      let lowMin = Infinity, lowMax = -Infinity;
      let highMin = Infinity, highMax = -Infinity;
      
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          lowMin = Math.min(lowMin, lowHeightmap[i][j]);
          lowMax = Math.max(lowMax, lowHeightmap[i][j]);
          highMin = Math.min(highMin, highHeightmap[i][j]);
          highMax = Math.max(highMax, highHeightmap[i][j]);
        }
      }
      
      // Higher amplitude should produce larger range
      const lowRange = lowMax - lowMin;
      const highRange = highMax - highMin;
      expect(highRange).toBeGreaterThan(lowRange);
    });

    it('should apply erosion effect when enabled', () => {
      const width = 32;
      const height = 32;
      
      const normalHeightmap = TerrainGenerator.generateHeightmap(width, height, { 
        seed: 123, 
        erosion: false 
      });
      
      const erodedHeightmap = TerrainGenerator.generateHeightmap(width, height, { 
        seed: 123, 
        erosion: true,
        erosionStrength: 0.3
      });
      
      // Should be different due to erosion
      let isDifferent = false;
      for (let i = 0; i < height && !isDifferent; i++) {
        for (let j = 0; j < width && !isDifferent; j++) {
          if (Math.abs(normalHeightmap[i][j] - erodedHeightmap[i][j]) > 0.001) {
            isDifferent = true;
          }
        }
      }
      
      expect(isDifferent).toBe(true);
    });

    it('should generate reproducible results with same seed', () => {
      const width = 16;
      const height = 16;
      const options = { seed: 42, amplitude: 20 };
      
      const heightmap1 = TerrainGenerator.generateHeightmap(width, height, options);
      const heightmap2 = TerrainGenerator.generateHeightmap(width, height, options);
      
      // Should be identical
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          expect(heightmap1[i][j]).toBeCloseTo(heightmap2[i][j], 5);
        }
      }
    });
  });

  describe('applyErosion', () => {
    it('should modify heightmap when applied', () => {
      const width = 16;
      const height = 16;
      
      // Create simple heightmap
      const heightmap = [];
      for (let i = 0; i < height; i++) {
        heightmap[i] = [];
        for (let j = 0; j < width; j++) {
          heightmap[i][j] = Math.sin(i * 0.5) + Math.cos(j * 0.5);
        }
      }
      
      const originalHeightmap = JSON.parse(JSON.stringify(heightmap));
      TerrainGenerator.applyErosion(heightmap, 5, 0.3);
      
      // Should be modified
      let isDifferent = false;
      for (let i = 0; i < height && !isDifferent; i++) {
        for (let j = 0; j < width && !isDifferent; j++) {
          if (Math.abs(originalHeightmap[i][j] - heightmap[i][j]) > 0.001) {
            isDifferent = true;
          }
        }
      }
      
      expect(isDifferent).toBe(true);
    });

    it('should not modify heightmap with zero iterations', () => {
      const width = 8;
      const height = 8;
      
      const heightmap = [];
      for (let i = 0; i < height; i++) {
        heightmap[i] = [];
        for (let j = 0; j < width; j++) {
          heightmap[i][j] = i + j;
        }
      }
      
      const originalHeightmap = JSON.parse(JSON.stringify(heightmap));
      TerrainGenerator.applyErosion(heightmap, 0, 0.5);
      
      // Should be unchanged
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          expect(heightmap[i][j]).toBe(originalHeightmap[i][j]);
        }
      }
    });
  });

  describe('smoothHeightmap', () => {
    it('should smooth heightmap reducing sharp variations', () => {
      const width = 8;
      const height = 8;
      
      // Create heightmap with sharp spikes
      const heightmap = [];
      for (let i = 0; i < height; i++) {
        heightmap[i] = [];
        for (let j = 0; j < width; j++) {
          heightmap[i][j] = (i === 4 && j === 4) ? 100 : 0; // Single spike
        }
      }
      
      const originalSpike = heightmap[4][4];
      TerrainGenerator.smoothHeightmap(heightmap, 1);
      
      // Spike should be reduced
      expect(heightmap[4][4]).toBeLessThan(originalSpike);
      expect(heightmap[4][4]).toBeGreaterThan(0);
    });

    it('should not change already smooth heightmap significantly', () => {
      const width = 8;
      const height = 8;
      
      // Create smooth gradient
      const heightmap = [];
      for (let i = 0; i < height; i++) {
        heightmap[i] = [];
        for (let j = 0; j < width; j++) {
          heightmap[i][j] = i * 2 + j; // Linear gradient
        }
      }
      
      const originalHeightmap = JSON.parse(JSON.stringify(heightmap));
      TerrainGenerator.smoothHeightmap(heightmap, 1);
      
      // Should be similar (allowing for small changes due to smoothing)
      for (let i = 1; i < height - 1; i++) {
        for (let j = 1; j < width - 1; j++) {
          const diff = Math.abs(heightmap[i][j] - originalHeightmap[i][j]);
          expect(diff).toBeLessThan(2); // Small tolerance for smoothing effect
        }
      }
    });
  });
});
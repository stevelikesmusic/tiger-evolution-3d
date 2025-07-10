import { describe, it, expect, beforeEach } from 'vitest';
import { WaterSystem } from '../../systems/WaterSystem.js';
import { Terrain } from '../../entities/Terrain.js';

describe('WaterSystem', () => {
  let terrain;
  let waterSystem;

  beforeEach(() => {
    // Create a terrain with some low areas for water
    terrain = new Terrain(64, 64, 32);
    terrain.generateHeightmap(12345);
    
    // Create water system
    waterSystem = new WaterSystem(terrain);
  });

  describe('Initialization', () => {
    it('should create water system with terrain', () => {
      expect(waterSystem.terrain).toBe(terrain);
      expect(waterSystem.waterLevel).toBe(2);
      expect(waterSystem.waterBodies).toBeInstanceOf(Array);
      expect(waterSystem.waterMeshes).toBeInstanceOf(Array);
    });

    it('should create water material', () => {
      expect(waterSystem.waterMaterial).toBeDefined();
      expect(waterSystem.waterMaterial.uniforms.time).toBeDefined();
      expect(waterSystem.waterMaterial.uniforms.waveHeight).toBeDefined();
      expect(waterSystem.waterMaterial.uniforms.waterColor).toBeDefined();
    });
  });

  describe('Basic Water Detection', () => {
    it('should detect water in generated water bodies', () => {
      // Test a few random points - some should be in water
      let foundWater = false;
      
      for (let x = -200; x <= 200; x += 50) {
        for (let z = -200; z <= 200; z += 50) {
          const isWater = waterSystem.isInWater(x, z);
          if (isWater) {
            foundWater = true;
            // If we found water, depth should be greater than 0
            const depth = waterSystem.getWaterDepth(x, z);
            expect(depth).toBeGreaterThan(0);
          }
        }
      }
      
      // We should find at least some water in our test area
      expect(foundWater).toBe(true);
    });

    it('should return zero depth for non-water areas', () => {
      // Test an area that's definitely not water (far from any water body)
      const depth = waterSystem.getWaterDepth(500, 500);
      expect(depth).toBe(0);
    });
  });

  describe('Water Body Generation', () => {
    it('should generate water bodies from terrain', () => {
      expect(waterSystem.waterBodies.length).toBeGreaterThan(0);
      
      // Water bodies should have proper structure
      waterSystem.waterBodies.forEach(body => {
        expect(['river', 'pond', 'lake']).toContain(body.type);
        if (body.type === 'pond' || body.type === 'lake') {
          expect(body.center).toBeDefined();
          expect(body.radius).toBeGreaterThan(0);
        }
        if (body.type === 'river') {
          expect(body.path).toBeDefined();
          expect(body.path.length).toBeGreaterThan(0);
        }
      });
    });

    it('should create water meshes', () => {
      expect(waterSystem.waterMeshes).toBeInstanceOf(Array);
      expect(waterSystem.waterMeshes.length).toBeGreaterThan(0);
    });
  });

  describe('Water Detection', () => {
    it('should detect water bodies correctly', () => {
      // Test that water detection works for generated water bodies
      const waterBodies = waterSystem.getWaterBodies();
      
      if (waterBodies.length > 0) {
        const firstWaterBody = waterBodies[0];
        
        if (firstWaterBody.type === 'pond' || firstWaterBody.type === 'lake') {
          // Test center of pond/lake
          const isWater = waterSystem.isInWater(firstWaterBody.center.x, firstWaterBody.center.z);
          expect(isWater).toBe(true);
          
          // Test outside pond/lake
          const outsideX = firstWaterBody.center.x + firstWaterBody.radius + 10;
          const outsideZ = firstWaterBody.center.z + firstWaterBody.radius + 10;
          const isWaterOutside = waterSystem.isInWater(outsideX, outsideZ);
          expect(isWaterOutside).toBe(false);
        }
      }
    });

    it('should calculate correct water depth', () => {
      const waterBodies = waterSystem.getWaterBodies();
      
      if (waterBodies.length > 0) {
        const firstWaterBody = waterBodies[0];
        
        if (firstWaterBody.type === 'pond' || firstWaterBody.type === 'lake') {
          const depth = waterSystem.getWaterDepth(firstWaterBody.center.x, firstWaterBody.center.z);
          expect(depth).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Animation', () => {
    it('should update water animation', () => {
      const initialTime = waterSystem.waterMaterial.uniforms.time.value;
      
      waterSystem.update(0.016); // 60 FPS delta
      
      expect(waterSystem.waterMaterial.uniforms.time.value).toBe(initialTime + 0.016);
    });
  });

  describe('Resource Management', () => {
    it('should dispose of resources properly', () => {
      const waterMeshCount = waterSystem.waterMeshes.length;
      
      waterSystem.dispose();
      
      expect(waterSystem.waterMeshes.length).toBe(0);
      expect(waterSystem.waterBodies.length).toBe(0);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance to line segment correctly', () => {
      const point = { x: 5, z: 5 };
      const lineStart = { x: 0, z: 0 };
      const lineEnd = { x: 10, z: 0 };
      
      const distance = waterSystem.distanceToLineSegment(point, lineStart, lineEnd);
      expect(distance).toBe(5); // Point is 5 units away from the line
    });
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import { WaterSystem } from '../../systems/WaterSystem.js';
import { Tiger } from '../../entities/Tiger.js';
import { Terrain } from '../../entities/Terrain.js';

describe('Swimming Mechanics', () => {
  let tiger;
  let terrain;
  let waterSystem;
  let movementSystem;

  beforeEach(() => {
    // Create test objects
    tiger = new Tiger();
    terrain = new Terrain(64, 64, 32);
    terrain.generateHeightmap(12345);
    
    waterSystem = new WaterSystem(terrain);
    movementSystem = new MovementSystem(tiger, terrain, waterSystem);
  });

  describe('Swimming State Detection', () => {
    it('should detect when tiger enters water', () => {
      // Position tiger at a known water location
      const waterBodies = waterSystem.getWaterBodies();
      
      if (waterBodies.length > 0) {
        const waterBody = waterBodies.find(body => body.type === 'lake' || body.type === 'pond');
        
        if (waterBody) {
          // Position tiger at water center
          tiger.position.set(waterBody.center.x, 0, waterBody.center.z);
          
          // Update swimming state
          movementSystem.updateSwimmingState();
          
          expect(movementSystem.isSwimming).toBe(true);
        }
      }
    });

    it('should detect when tiger exits water', () => {
      // Start in water
      movementSystem.isSwimming = true;
      
      // Move tiger to land (far from any water)
      tiger.position.set(500, 10, 500);
      
      // Update swimming state
      movementSystem.updateSwimmingState();
      
      expect(movementSystem.isSwimming).toBe(false);
    });
  });

  describe('Swimming Physics', () => {
    it('should apply reduced speed while swimming', () => {
      movementSystem.isSwimming = true;
      const swimmingSpeed = movementSystem.getCurrentSpeed();
      
      movementSystem.isSwimming = false;
      const landSpeed = movementSystem.getCurrentSpeed();
      
      expect(swimmingSpeed).toBeLessThan(landSpeed);
    });

    it('should apply buoyancy instead of gravity while swimming', () => {
      movementSystem.isSwimming = true;
      const initialVelocityY = movementSystem.velocity.y;
      
      // Apply gravity (which should be modified for swimming)
      movementSystem.applyGravity(0.016);
      
      // In water, gravity should be reduced and buoyancy applied
      // The exact value depends on the implementation, but it should be different
      expect(movementSystem.velocity.y).not.toBe(initialVelocityY);
    });

    it('should handle jumping differently while swimming', () => {
      // Test swimming upward movement
      movementSystem.isSwimming = true;
      movementSystem.isJumping = true;
      
      const initialY = movementSystem.velocity.y;
      movementSystem.applyJump();
      
      // Should apply upward force for swimming
      expect(movementSystem.velocity.y).toBeGreaterThan(initialY);
    });
  });

  describe('Swimming Position Updates', () => {
    it('should maintain tiger position relative to water surface', () => {
      const waterBodies = waterSystem.getWaterBodies();
      
      if (waterBodies.length > 0) {
        const waterBody = waterBodies.find(body => body.type === 'lake' || body.type === 'pond');
        
        if (waterBody) {
          // Position tiger at water location
          tiger.position.set(waterBody.center.x, 10, waterBody.center.z); // High above water
          movementSystem.isSwimming = true;
          
          // Update position
          movementSystem.updatePosition(0.016);
          
          // Tiger should be repositioned to water surface level
          const terrainHeight = terrain.getHeightAt(tiger.position.x, tiger.position.z);
          const waterDepth = waterSystem.getWaterDepth(tiger.position.x, tiger.position.z);
          const waterSurface = terrainHeight + waterDepth - 0.5;
          
          expect(tiger.position.y).toBeLessThanOrEqual(waterSurface);
        }
      }
    });

    it('should prevent tiger from going below terrain while swimming', () => {
      const waterBodies = waterSystem.getWaterBodies();
      
      if (waterBodies.length > 0) {
        const waterBody = waterBodies.find(body => body.type === 'lake' || body.type === 'pond');
        
        if (waterBody) {
          // Position tiger below terrain
          const terrainHeight = terrain.getHeightAt(waterBody.center.x, waterBody.center.z);
          tiger.position.set(waterBody.center.x, terrainHeight - 2, waterBody.center.z);
          movementSystem.isSwimming = true;
          
          // Update position
          movementSystem.updatePosition(0.016);
          
          // Tiger should be repositioned above terrain
          const groundLevel = terrainHeight + 1.0; // Tiger height above ground
          expect(tiger.position.y).toBeGreaterThanOrEqual(groundLevel);
        }
      }
    });
  });

  describe('Water System Integration', () => {
    it('should update water system reference', () => {
      const newWaterSystem = new WaterSystem(terrain);
      movementSystem.setWaterSystem(newWaterSystem);
      
      expect(movementSystem.waterSystem).toBe(newWaterSystem);
    });

    it('should handle missing water system gracefully', () => {
      movementSystem.setWaterSystem(null);
      
      // Should not throw error and should set swimming to false
      expect(() => {
        movementSystem.updateSwimmingState();
      }).not.toThrow();
      
      expect(movementSystem.isSwimming).toBe(false);
    });
  });
});
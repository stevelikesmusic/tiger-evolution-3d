import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import { Tiger } from '../../entities/Tiger.js';

describe('MovementSystem Terrain Integration', () => {
  let movementSystem;
  let mockTiger;
  let mockTerrain;

  beforeEach(() => {
    // Mock tiger
    mockTiger = {
      position: { x: 0, y: 0, z: 0 },
      speed: 10,
      stamina: 300,
      isAlive: vi.fn(() => true),
      setState: vi.fn(),
      consumeStamina: vi.fn(),
      setPosition: vi.fn((x, y, z) => {
        mockTiger.position.x = x;
        mockTiger.position.y = y;
        mockTiger.position.z = z;
      })
    };

    // Mock terrain with varied heights
    mockTerrain = {
      walkableSlope: 0.7,
      getHeightAt: vi.fn((x, z) => {
        // Create a simple hill: height varies based on distance from center
        const distance = Math.sqrt(x * x + z * z);
        return Math.max(0, 10 - distance * 0.1);
      }),
      getSlope: vi.fn((x, z) => {
        // Return gentle slopes most places, steep at edges
        const distance = Math.sqrt(x * x + z * z);
        return distance > 50 ? 0.8 : 0.2;
      }),
      getNormal: vi.fn((x, z) => ({
        x: 0.1,
        y: 0.9,
        z: 0.1
      }))
    };

    movementSystem = new MovementSystem(mockTiger, mockTerrain);
  });

  describe('terrain collision', () => {
    it('should position tiger on terrain surface when grounded', () => {
      // Set tiger at center where terrain height is 10
      mockTiger.position.x = 0;
      mockTiger.position.z = 0;
      movementSystem.isGrounded = true;

      movementSystem.handleTerrainCollision(0.016);

      // Tiger should be positioned at terrain height + tiger height (1.0)
      expect(mockTiger.position.y).toBe(11.0); // 10 + 1
      expect(movementSystem.velocity.y).toBe(0);
    });

    it('should handle landing on terrain when airborne', () => {
      mockTiger.position.x = 0;
      mockTiger.position.z = 0;
      mockTiger.position.y = 15; // Above terrain
      movementSystem.isGrounded = false;
      movementSystem.velocity.y = -5; // Falling

      movementSystem.handleTerrainCollision(0.1);

      // Position should be updated by velocity first: 15 + (-5 * 0.1) = 14.5
      // Then since 14.5 > 11, tiger is still airborne
      expect(mockTiger.position.y).toBe(14.5); // Still falling
      expect(movementSystem.isGrounded).toBe(false);
    });

    it('should land when close enough to terrain', () => {
      mockTiger.position.x = 0;
      mockTiger.position.z = 0;
      mockTiger.position.y = 11.5; // Just above terrain surface
      movementSystem.isGrounded = false;
      movementSystem.velocity.y = -5; // Falling

      movementSystem.handleTerrainCollision(0.1);

      // Should land: 11.5 + (-5 * 0.1) = 11.0, which equals ground level
      expect(mockTiger.position.y).toBe(11.0); // Landed
      expect(movementSystem.isGrounded).toBe(true);
      expect(movementSystem.velocity.y).toBe(0);
    });

    it('should continue falling when above terrain', () => {
      mockTiger.position.x = 0;
      mockTiger.position.z = 0;
      mockTiger.position.y = 20; // Well above terrain
      movementSystem.isGrounded = false;
      movementSystem.velocity.y = -5;

      movementSystem.handleTerrainCollision(0.1);

      // Tiger should fall but not yet land
      expect(mockTiger.position.y).toBe(19.5); // 20 - 5 * 0.1
      expect(movementSystem.isGrounded).toBe(false);
    });

    it('should get terrain height at tiger position', () => {
      mockTiger.position.x = 10;
      mockTiger.position.z = 20;

      movementSystem.handleTerrainCollision(0.016);

      expect(mockTerrain.getHeightAt).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('slope handling', () => {
    it('should apply slide force on steep slopes', () => {
      mockTiger.position.x = 60; // Far from center, steep slope
      mockTiger.position.z = 0;
      movementSystem.isGrounded = true;
      
      const initialVelocityX = movementSystem.velocity.x;
      
      movementSystem.handleTerrainCollision(0.1);

      // Should have applied slide force
      expect(Math.abs(movementSystem.velocity.x)).toBeGreaterThan(Math.abs(initialVelocityX));
    });

    it('should not slide on gentle slopes', () => {
      mockTiger.position.x = 10; // Near center, gentle slope
      mockTiger.position.z = 0;
      movementSystem.isGrounded = true;
      
      const initialVelocity = { ...movementSystem.velocity };
      
      movementSystem.handleTerrainCollision(0.1);

      // Velocity should not change significantly due to slope
      expect(Math.abs(movementSystem.velocity.x - initialVelocity.x)).toBeLessThan(1);
    });
  });

  describe('terrain setter', () => {
    it('should set terrain reference', () => {
      const newTerrain = { getHeightAt: vi.fn() };
      movementSystem.setTerrain(newTerrain);
      
      expect(movementSystem.terrain).toBe(newTerrain);
    });

    it('should get current terrain height', () => {
      mockTiger.position.x = 5;
      mockTiger.position.z = 10;
      
      const height = movementSystem.getCurrentTerrainHeight();
      
      expect(mockTerrain.getHeightAt).toHaveBeenCalledWith(5, 10);
      expect(height).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no terrain', () => {
      movementSystem.setTerrain(null);
      
      const height = movementSystem.getCurrentTerrainHeight();
      
      expect(height).toBe(0);
    });
  });

  describe('fallback collision', () => {
    beforeEach(() => {
      movementSystem.setTerrain(null); // Remove terrain
    });

    it('should use simple ground collision when no terrain', () => {
      mockTiger.position.y = -5;
      movementSystem.velocity.y = -10;

      movementSystem.handleTerrainCollision(0.1);

      expect(mockTiger.position.y).toBe(0);
      expect(movementSystem.velocity.y).toBe(0);
      expect(movementSystem.isGrounded).toBe(true);
    });
  });

  describe('integration with movement', () => {
    it('should maintain position on terrain while moving', () => {
      // Set up movement input
      movementSystem.setMovementInput({
        direction: { x: 1, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });

      const initialX = mockTiger.position.x;
      
      // Update movement system
      movementSystem.update(0.1);

      // Tiger should move horizontally
      expect(mockTiger.position.x).toBeGreaterThan(initialX);
      
      // But Y position should follow terrain
      const expectedTerrainHeight = mockTerrain.getHeightAt(mockTiger.position.x, mockTiger.position.z);
      expect(mockTiger.position.y).toBe(expectedTerrainHeight + 1.0);
    });

    it('should handle jumping over terrain', () => {
      // Start tiger on ground
      movementSystem.isGrounded = true;
      
      movementSystem.setMovementInput({
        direction: { x: 0, z: 0 },
        isRunning: false,
        isCrouching: false,
        isJumping: true
      });

      movementSystem.update(0.1);

      // Tiger should jump up
      expect(movementSystem.velocity.y).toBeGreaterThan(0);
      expect(movementSystem.isGrounded).toBe(false);
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Deer } from '../../entities/Deer.js';
import * as THREE from 'three';

describe('Deer', () => {
  describe('constructor', () => {
    it('should create a deer with prey-specific stats', () => {
      const deer = new Deer();
      
      expect(deer.type).toBe('deer');
      expect(deer.behaviorType).toBe('prey');
      expect(deer.health).toBe(60);
      expect(deer.speed).toBe(15); // Fast escape speed
      expect(deer.power).toBe(10); // Low attack power
      expect(deer.stamina).toBe(150); // High stamina for escaping
      expect(deer.detectionRadius).toBe(30); // Enhanced hearing
      expect(deer.fleeDistance).toBe(50); // Flee at longer distance
    });

    it('should initialize flocking behavior properties', () => {
      const deer = new Deer();
      
      expect(deer.flockingRadius).toBe(20);
      expect(deer.flockMembers).toEqual([]);
      expect(deer.alertLevel).toBe(0);
      expect(deer.maxAlertLevel).toBe(100);
    });

    it('should start in wandering state', () => {
      const deer = new Deer();
      expect(deer.aiState).toBe('wandering');
    });
  });

  describe('flocking behavior', () => {
    let deer;

    beforeEach(() => {
      deer = new Deer();
      deer.setPosition(0, 0, 0);
    });

    it('should add nearby deer to flock', () => {
      const otherDeer1 = new Deer();
      const otherDeer2 = new Deer();
      const farDeer = new Deer();
      
      otherDeer1.setPosition(10, 0, 0); // Within flocking radius
      otherDeer2.setPosition(0, 0, 15); // Within flocking radius
      farDeer.setPosition(30, 0, 0); // Outside flocking radius
      
      const nearbyAnimals = [otherDeer1, otherDeer2, farDeer];
      deer.updateFlock(nearbyAnimals);
      
      expect(deer.flockMembers).toHaveLength(2);
      expect(deer.flockMembers).toContain(otherDeer1);
      expect(deer.flockMembers).toContain(otherDeer2);
      expect(deer.flockMembers).not.toContain(farDeer);
    });

    it('should calculate flock center correctly', () => {
      const deer1 = new Deer();
      const deer2 = new Deer();
      
      deer1.setPosition(10, 0, 0);
      deer2.setPosition(0, 0, 10);
      
      deer.flockMembers = [deer1, deer2];
      const center = deer.getFlockCenter();
      
      expect(center.x).toBe(5);
      expect(center.y).toBe(0);
      expect(center.z).toBe(5);
    });

    it('should return own position as flock center when alone', () => {
      const center = deer.getFlockCenter();
      expect(center.equals(deer.position)).toBe(true);
    });
  });

  describe('alert system', () => {
    let deer;

    beforeEach(() => {
      deer = new Deer();
    });

    it('should increase alert level when threat detected', () => {
      const initialAlert = deer.alertLevel;
      deer.increaseAlert(30);
      expect(deer.alertLevel).toBe(initialAlert + 30);
    });

    it('should not exceed max alert level', () => {
      deer.increaseAlert(150);
      expect(deer.alertLevel).toBe(100);
    });

    it('should decrease alert level over time', () => {
      deer.increaseAlert(50);
      deer.decreaseAlert(20);
      expect(deer.alertLevel).toBe(30);
    });

    it('should not go below 0 alert level', () => {
      deer.decreaseAlert(50);
      expect(deer.alertLevel).toBe(0);
    });

    it('should be highly alert when alert level is high', () => {
      deer.increaseAlert(80);
      expect(deer.isHighlyAlert()).toBe(true);
    });

    it('should not be highly alert when alert level is low', () => {
      deer.increaseAlert(30);
      expect(deer.isHighlyAlert()).toBe(false);
    });
  });

  describe('threat detection', () => {
    let deer;

    beforeEach(() => {
      deer = new Deer();
      deer.setPosition(0, 0, 0);
    });

    it('should detect threats within enhanced detection radius', () => {
      const threat = { x: 25, y: 0, z: 0 };
      expect(deer.canDetect(threat)).toBe(true);
    });

    it('should have enhanced detection when highly alert', () => {
      deer.increaseAlert(80);
      const threat = { x: 35, y: 0, z: 0 }; // Beyond normal detection radius
      expect(deer.canDetect(threat)).toBe(true);
    });

    it('should trigger flee behavior when threat is close', () => {
      const threat = { x: 20, y: 0, z: 0 };
      deer.detectThreat(threat);
      expect(deer.aiState).toBe('fleeing');
      expect(deer.target).toEqual(threat);
    });

    it('should alert flock members when threat detected', () => {
      const flockMember = new Deer();
      deer.flockMembers = [flockMember];
      
      const threat = { x: 20, y: 0, z: 0 };
      deer.detectThreat(threat);
      
      expect(flockMember.alertLevel).toBeGreaterThan(0);
    });
  });

  describe('AI behavior updates', () => {
    let deer;

    beforeEach(() => {
      deer = new Deer();
      deer.setPosition(0, 0, 0);
    });

    it('should transition from wandering to fleeing when threat detected', () => {
      deer.setAIState('wandering');
      const threat = { x: 30, y: 0, z: 0 };
      
      // Mock nearby threats
      deer.nearbyThreats = [threat];
      deer.updateAI(1.0);
      
      expect(deer.aiState).toBe('fleeing');
    });

    it('should continue fleeing until safe distance', () => {
      const threat = { x: 20, y: 0, z: 0 };
      deer.setAIState('fleeing');
      deer.setTarget(threat);
      deer.nearbyThreats = [threat]; // Add threat to nearby threats
      
      deer.updateAI(1.0);
      
      expect(deer.aiState).toBe('fleeing');
    });

    it('should decrease alert level over time when no threats', () => {
      deer.increaseAlert(50);
      deer.nearbyThreats = [];
      
      deer.updateAI(1.0);
      
      expect(deer.alertLevel).toBeLessThan(50);
    });

    it('should consume stamina when fleeing', () => {
      const threat = { x: 20, y: 0, z: 0 };
      deer.setAIState('fleeing');
      deer.setTarget(threat);
      const initialStamina = deer.stamina;
      
      deer.updateAI(1.0);
      
      expect(deer.stamina).toBeLessThan(initialStamina);
    });
  });

  describe('movement behavior', () => {
    let deer;

    beforeEach(() => {
      deer = new Deer();
      deer.setPosition(0, 0, 0);
    });

    it('should move away from threats when fleeing', () => {
      const threat = { x: 10, y: 0, z: 0 };
      deer.setAIState('fleeing');
      deer.setTarget(threat);
      
      const fleeDirection = deer.getFleeDirection();
      
      expect(fleeDirection.x).toBeLessThan(0); // Moving away from threat
    });

    it('should use zigzag pattern when highly stressed', () => {
      deer.increaseAlert(90);
      deer.setAIState('fleeing');
      
      const direction1 = deer.getMovementDirection();
      // Update a few times to see zigzag pattern
      deer.updateAI(0.1);
      deer.updateAI(0.1);
      const direction2 = deer.getMovementDirection();
      
      // Directions should be different due to zigzag
      expect(direction1.equals(direction2)).toBe(false);
    });

    it('should move toward flock center when wandering', () => {
      const flockMember = new Deer();
      flockMember.setPosition(20, 0, 0);
      deer.flockMembers = [flockMember];
      deer.setAIState('wandering');
      
      const direction = deer.getMovementDirection();
      
      expect(direction.x).toBeGreaterThan(0); // Moving toward flock
    });
  });

  describe('experience and rewards', () => {
    let deer;

    beforeEach(() => {
      deer = new Deer();
    });

    it('should provide correct XP reward', () => {
      expect(deer.getExperienceReward()).toBe(25);
    });

    it('should provide correct health restoration', () => {
      expect(deer.getHealthRestoration()).toBe(30);
    });
  });
});
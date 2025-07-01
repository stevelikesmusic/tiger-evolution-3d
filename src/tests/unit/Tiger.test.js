import { describe, it, expect, beforeEach } from 'vitest';
import { Tiger } from '../../entities/Tiger.js';

describe('Tiger', () => {
  let tiger;

  beforeEach(() => {
    tiger = new Tiger();
  });

  describe('initialization', () => {
    it('should create a tiger with default stats', () => {
      expect(tiger.health).toBe(100);
      expect(tiger.maxHealth).toBe(100);
      expect(tiger.speed).toBe(12);
      expect(tiger.power).toBe(80);
      expect(tiger.stamina).toBe(300);
      expect(tiger.maxStamina).toBe(300);
      expect(tiger.stealth).toBe(60);
      expect(tiger.hunger).toBe(100);
      expect(tiger.maxHunger).toBe(100);
    });

    it('should start as a Young Tiger (level 1)', () => {
      expect(tiger.level).toBe(1);
      expect(tiger.evolutionStage).toBe('Young');
      expect(tiger.experience).toBe(0);
    });

    it('should have initial position at origin', () => {
      expect(tiger.position.x).toBe(0);
      expect(tiger.position.y).toBe(0);
      expect(tiger.position.z).toBe(0);
    });

    it('should start in idle state', () => {
      expect(tiger.state).toBe('idle');
    });
  });

  describe('stat management', () => {
    it('should take damage correctly', () => {
      tiger.takeDamage(25);
      expect(tiger.health).toBe(75);
      expect(tiger.isAlive()).toBe(true);
    });

    it('should not go below 0 health', () => {
      tiger.takeDamage(150);
      expect(tiger.health).toBe(0);
      expect(tiger.isAlive()).toBe(false);
    });

    it('should heal correctly', () => {
      tiger.takeDamage(30);
      tiger.heal(15);
      expect(tiger.health).toBe(85);
    });

    it('should not heal above max health', () => {
      tiger.heal(50);
      expect(tiger.health).toBe(100);
    });

    it('should consume stamina correctly', () => {
      tiger.consumeStamina(50);
      expect(tiger.stamina).toBe(250);
    });

    it('should not go below 0 stamina', () => {
      tiger.consumeStamina(400);
      expect(tiger.stamina).toBe(0);
    });

    it('should restore stamina correctly', () => {
      tiger.consumeStamina(100);
      tiger.restoreStamina(30);
      expect(tiger.stamina).toBe(230);
    });

    it('should consume hunger over time', () => {
      tiger.consumeHunger(20);
      expect(tiger.hunger).toBe(80);
    });

    it('should feed to restore hunger', () => {
      tiger.consumeHunger(40);
      tiger.feed(25);
      expect(tiger.hunger).toBe(85);
    });
  });

  describe('experience and evolution', () => {
    it('should gain experience', () => {
      tiger.gainExperience(25);
      expect(tiger.experience).toBe(25);
    });

    it('should level up when reaching experience threshold', () => {
      tiger.gainExperience(100); // Level 1 -> 2 at 100 XP
      expect(tiger.level).toBe(2);
      expect(tiger.experience).toBe(0); // Reset after level up
    });

    it('should evolve to Adult Tiger at level 11', () => {
      // Set level to 11 to trigger Adult evolution
      tiger.level = 10;
      tiger.gainExperience(100);
      expect(tiger.level).toBe(11);
      expect(tiger.evolutionStage).toBe('Adult');
      expect(tiger.maxHealth).toBe(125); // +25 HP
      expect(tiger.speed).toBe(15); // +3 speed
      expect(tiger.power).toBe(95); // +15 power
    });

    it('should evolve to Alpha Tiger at level 26', () => {
      tiger.level = 25;
      tiger.gainExperience(100);
      expect(tiger.level).toBe(26);
      expect(tiger.evolutionStage).toBe('Alpha');
      expect(tiger.power).toBe(160); // Double damage from Adult
    });
  });

  describe('movement and positioning', () => {
    it('should update position', () => {
      tiger.setPosition(10, 5, -3);
      expect(tiger.position.x).toBe(10);
      expect(tiger.position.y).toBe(5);
      expect(tiger.position.z).toBe(-3);
    });

    it('should calculate distance to another position', () => {
      tiger.setPosition(0, 0, 0);
      const distance = tiger.distanceTo({ x: 3, y: 4, z: 0 });
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should change state correctly', () => {
      tiger.setState('running');
      expect(tiger.state).toBe('running');
    });
  });

  describe('special abilities', () => {
    it('should not have laser breath before Alpha stage', () => {
      expect(tiger.hasLaserBreath()).toBe(false);
    });

    it('should have laser breath at Alpha stage', () => {
      tiger.level = 26;
      tiger.evolve();
      expect(tiger.hasLaserBreath()).toBe(true);
    });

    it('should calculate stealth detection radius', () => {
      const normalRadius = tiger.getDetectionRadius();
      tiger.setState('crouching');
      const stealthRadius = tiger.getDetectionRadius();
      expect(stealthRadius).toBe(normalRadius * 0.5);
    });
  });
});
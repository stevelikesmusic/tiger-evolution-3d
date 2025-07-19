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
      const initialHealth = tiger.health;
      const initialMaxHealth = tiger.maxHealth;
      const initialHunger = tiger.hunger;
      const initialMaxHunger = tiger.maxHunger;
      const initialPower = tiger.power;
      const initialStamina = tiger.stamina;
      const initialMaxStamina = tiger.maxStamina;
      
      tiger.gainExperience(100); // Level 1 -> 2 at 100 XP
      expect(tiger.level).toBe(2);
      expect(tiger.experience).toBe(0); // Reset after level up
      
      // Check stat bonuses: +10 health, +10 hunger, +10 damage, -5 max stamina, -5 stamina
      expect(tiger.maxHealth).toBe(initialMaxHealth + 10);
      expect(tiger.health).toBe(initialHealth + 10);
      expect(tiger.maxHunger).toBe(initialMaxHunger + 10);
      expect(tiger.hunger).toBe(initialHunger + 10);
      expect(tiger.power).toBe(initialPower + 10);
      expect(tiger.maxStamina).toBe(initialMaxStamina - 5); // Lose 5 max stamina
      expect(tiger.stamina).toBe(initialStamina - 5); // Lose 5 current stamina
    });

    it('should evolve to Adult Tiger at level 10', () => {
      // Set level to 9 and gain experience to trigger level 10 evolution
      tiger.level = 9;
      const baseHealth = 100 + (9 * 10); // Base + 9 level-ups of +10 health = 190
      const basePower = 80 + (9 * 10); // Base + 9 level-ups of +10 damage = 170
      const baseMaxStamina = 300 - (9 * 5); // Base - 9 level-ups of -5 max stamina = 255
      tiger.maxHealth = baseHealth;
      tiger.health = baseHealth;
      tiger.power = basePower;
      tiger.maxStamina = baseMaxStamina;
      
      tiger.gainExperience(100);
      expect(tiger.level).toBe(10);
      expect(tiger.evolutionStage).toBe('Adult');
      // Level-up: +10 health, +10 power, -5 max stamina
      // Evolution: +10 health, +15 max stamina (net +10 after level-up penalty)
      expect(tiger.maxHealth).toBe(baseHealth + 20); // +10 level + 10 evolution
      expect(tiger.power).toBe(basePower + 10); // +10 level only (evolution doesn't affect power for Adult)
      expect(tiger.maxStamina).toBe(baseMaxStamina + 10); // -5 level + 15 evolution = +10 net
    });

    it('should evolve to Alpha Tiger at level 30', () => {
      // Set level to 29 and gain experience to trigger level 30 evolution
      tiger.level = 29;
      const basePower = 80 + (29 * 10); // Base + 29 level-ups of +10 damage = 370
      const baseMaxStamina = 300 - (29 * 5); // Base - 29 level-ups of -5 max stamina = 155
      tiger.power = basePower;
      tiger.maxStamina = baseMaxStamina;
      tiger.evolutionStage = 'Adult'; // Must be Adult to evolve to Alpha
      
      tiger.gainExperience(100);
      expect(tiger.level).toBe(30);
      expect(tiger.evolutionStage).toBe('Alpha');
      // Level-up gives +10 power, then Alpha evolution doubles it = (basePower + 10) * 2
      expect(tiger.power).toBe((basePower + 10) * 2);
      // Max stamina: -5 from level + 15 from evolution = +10 net
      expect(tiger.maxStamina).toBe(baseMaxStamina + 10);
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
      tiger.level = 30;
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
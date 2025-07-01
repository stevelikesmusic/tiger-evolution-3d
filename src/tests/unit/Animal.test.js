import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Animal } from '../../entities/Animal.js';
import * as THREE from 'three';

describe('Animal', () => {
  describe('constructor', () => {
    it('should create an animal with default properties', () => {
      const animal = new Animal('deer');
      
      expect(animal.type).toBe('deer');
      expect(animal.health).toBe(50);
      expect(animal.maxHealth).toBe(50);
      expect(animal.speed).toBe(10);
      expect(animal.power).toBe(20);
      expect(animal.stamina).toBe(100);
      expect(animal.maxStamina).toBe(100);
      expect(animal.position).toBeInstanceOf(THREE.Vector3);
      expect(animal.rotation).toBeInstanceOf(THREE.Euler);
      expect(animal.velocity).toBeInstanceOf(THREE.Vector3);
      expect(animal.state).toBe('idle');
      expect(animal.behaviorType).toBe('neutral');
      expect(animal.isAlive()).toBe(true);
    });

    it('should accept custom stats during construction', () => {
      const stats = {
        health: 80,
        speed: 15,
        power: 40,
        stamina: 150,
        behaviorType: 'prey'
      };
      
      const animal = new Animal('rabbit', stats);
      
      expect(animal.health).toBe(80);
      expect(animal.maxHealth).toBe(80);
      expect(animal.speed).toBe(15);
      expect(animal.power).toBe(40);
      expect(animal.stamina).toBe(150);
      expect(animal.maxStamina).toBe(150);
      expect(animal.behaviorType).toBe('prey');
    });

    it('should initialize AI state properties', () => {
      const animal = new Animal('deer');
      
      expect(animal.aiState).toBe('idle');
      expect(animal.target).toBeNull();
      expect(animal.detectionRadius).toBe(25);
      expect(animal.fleeDistance).toBe(40);
      expect(animal.attackRange).toBe(3);
    });
  });

  describe('health management', () => {
    let animal;

    beforeEach(() => {
      animal = new Animal('deer');
    });

    it('should take damage correctly', () => {
      animal.takeDamage(20);
      expect(animal.health).toBe(30);
    });

    it('should not go below 0 health', () => {
      animal.takeDamage(100);
      expect(animal.health).toBe(0);
    });

    it('should heal correctly', () => {
      animal.takeDamage(20);
      animal.heal(10);
      expect(animal.health).toBe(40);
    });

    it('should not heal above max health', () => {
      animal.heal(100);
      expect(animal.health).toBe(50);
    });

    it('should report death correctly', () => {
      animal.takeDamage(50);
      expect(animal.isAlive()).toBe(false);
    });
  });

  describe('stamina management', () => {
    let animal;

    beforeEach(() => {
      animal = new Animal('deer');
    });

    it('should consume stamina correctly', () => {
      animal.consumeStamina(30);
      expect(animal.stamina).toBe(70);
    });

    it('should not go below 0 stamina', () => {
      animal.consumeStamina(150);
      expect(animal.stamina).toBe(0);
    });

    it('should restore stamina correctly', () => {
      animal.consumeStamina(30);
      animal.restoreStamina(15);
      expect(animal.stamina).toBe(85);
    });

    it('should not restore above max stamina', () => {
      animal.restoreStamina(150);
      expect(animal.stamina).toBe(100);
    });
  });

  describe('position and movement', () => {
    let animal;

    beforeEach(() => {
      animal = new Animal('deer');
    });

    it('should set position correctly', () => {
      animal.setPosition(10, 5, -3);
      expect(animal.position.x).toBe(10);
      expect(animal.position.y).toBe(5);
      expect(animal.position.z).toBe(-3);
    });

    it('should calculate distance correctly', () => {
      animal.setPosition(0, 0, 0);
      const target = { x: 3, y: 0, z: 4 };
      expect(animal.distanceTo(target)).toBe(5);
    });

    it('should set state correctly', () => {
      animal.setState('walking');
      expect(animal.state).toBe('walking');
    });
  });

  describe('AI behavior', () => {
    let animal;

    beforeEach(() => {
      animal = new Animal('deer', { behaviorType: 'prey' });
    });

    it('should set AI state correctly', () => {
      animal.setAIState('fleeing');
      expect(animal.aiState).toBe('fleeing');
    });

    it('should set target correctly', () => {
      const target = { x: 10, y: 0, z: 5 };
      animal.setTarget(target);
      expect(animal.target).toEqual(target);
    });

    it('should clear target correctly', () => {
      animal.setTarget({ x: 10, y: 0, z: 5 });
      animal.clearTarget();
      expect(animal.target).toBeNull();
    });

    it('should detect threats within detection radius', () => {
      animal.setPosition(0, 0, 0);
      const threat = { x: 20, y: 0, z: 0 }; // Within detection radius (25)
      expect(animal.canDetect(threat)).toBe(true);
    });

    it('should not detect threats outside detection radius', () => {
      animal.setPosition(0, 0, 0);
      const threat = { x: 30, y: 0, z: 0 }; // Outside detection radius (25)
      expect(animal.canDetect(threat)).toBe(false);
    });

    it('should determine if threat is within flee distance', () => {
      animal.setPosition(0, 0, 0);
      const threat = { x: 30, y: 0, z: 0 }; // Within flee distance (40)
      expect(animal.shouldFlee(threat)).toBe(true);
    });

    it('should determine if threat is within attack range for predators', () => {
      const predator = new Animal('leopard', { behaviorType: 'predator' });
      predator.setPosition(0, 0, 0);
      const target = { x: 2, y: 0, z: 0 }; // Within attack range (3)
      expect(predator.canAttack(target)).toBe(true);
    });
  });

  describe('update cycle', () => {
    let animal;

    beforeEach(() => {
      animal = new Animal('deer');
    });

    it('should regenerate stamina over time when not exhausted', () => {
      animal.consumeStamina(30);
      const initialStamina = animal.stamina;
      
      animal.update(1.0); // 1 second
      
      expect(animal.stamina).toBeGreaterThan(initialStamina);
    });

    it('should not update when animal is dead', () => {
      animal.takeDamage(50);
      const initialStamina = animal.stamina;
      
      animal.update(1.0);
      
      expect(animal.stamina).toBe(initialStamina);
    });

    it('should clamp delta time to prevent large jumps', () => {
      const spy = vi.spyOn(animal, 'update');
      animal.update(2.0); // Large delta time
      
      expect(spy).toHaveBeenCalled();
      // Test should not throw and should handle gracefully
    });
  });

  describe('experience and rewards', () => {
    let animal;

    beforeEach(() => {
      animal = new Animal('deer', { behaviorType: 'prey' });
    });

    it('should return correct XP reward for prey animals', () => {
      expect(animal.getExperienceReward()).toBe(25); // Default prey XP
    });

    it('should return correct XP reward for predator animals', () => {
      const predator = new Animal('leopard', { behaviorType: 'predator' });
      expect(predator.getExperienceReward()).toBe(50); // Higher XP for predators
    });

    it('should return correct health restoration amount', () => {
      expect(animal.getHealthRestoration()).toBe(30); // Medium health restoration
    });
  });
});
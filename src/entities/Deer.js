import { Animal } from './Animal.js';
import * as THREE from 'three';

export class Deer extends Animal {
  constructor() {
    // Deer-specific stats based on spec
    const deerStats = {
      health: 60,
      speed: 15, // Fast escape (15 speed)
      power: 10, // Low attack power (mostly for self-defense)
      stamina: 150, // High stamina for long escapes
      behaviorType: 'prey'
    };
    
    super('deer', deerStats);
    
    // Enhanced prey senses
    this.detectionRadius = 30; // Enhanced hearing radius
    this.fleeDistance = 50; // Flee at longer distance
    
    // Flocking behavior properties
    this.flockingRadius = 20; // Distance to consider other deer as flock members
    this.flockMembers = []; // Array of nearby deer
    
    // Alert system
    this.alertLevel = 0; // 0-100, affects detection and speed
    this.maxAlertLevel = 100;
    this.alertDecayRate = 10; // Alert decreases by this amount per second
    
    // Movement patterns
    this.zigzagTimer = 0;
    this.zigzagDirection = 1; // 1 or -1 for left/right zigzag
    this.zigzagIntensity = 0.3; // How much to zigzag when fleeing
    
    // Nearby threats (updated by external systems)
    this.nearbyThreats = [];
    
    // Start in wandering state
    this.setAIState('wandering');
  }

  // Override detection with alert-based enhancement
  canDetect(entity) {
    let radius = this.detectionRadius;
    
    // Enhanced detection when highly alert
    if (this.isHighlyAlert()) {
      radius *= 1.5;
    }
    
    const distance = this.distanceTo(entity);
    return distance <= radius;
  }

  // Flocking behavior
  updateFlock(nearbyAnimals) {
    this.flockMembers = nearbyAnimals.filter(animal => 
      animal !== this && 
      animal.type === 'deer' && 
      animal.isAlive() &&
      this.distanceTo(animal) <= this.flockingRadius
    );
  }

  getFlockCenter() {
    if (this.flockMembers.length === 0) {
      return this.position.clone();
    }
    
    const center = new THREE.Vector3(0, 0, 0);
    for (const member of this.flockMembers) {
      center.add(member.position);
    }
    center.divideScalar(this.flockMembers.length);
    
    return center;
  }

  // Alert system
  increaseAlert(amount) {
    this.alertLevel = Math.min(this.maxAlertLevel, this.alertLevel + amount);
  }

  decreaseAlert(amount) {
    this.alertLevel = Math.max(0, this.alertLevel - amount);
  }

  isHighlyAlert() {
    return this.alertLevel > 60;
  }

  // Threat detection and response
  detectThreat(threat) {
    this.setTarget(threat);
    this.setAIState('fleeing');
    this.increaseAlert(40);
    
    // Alert flock members
    for (const member of this.flockMembers) {
      member.increaseAlert(20);
    }
  }

  // Movement direction calculation
  getMovementDirection() {
    switch (this.aiState) {
      case 'fleeing':
        return this.getFleeDirection();
      case 'wandering':
        return this.getWanderDirection();
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  getFleeDirection() {
    if (!this.target) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    // Base flee direction (away from threat)
    let fleeDirection = this.getDirectionFrom(this.target);
    
    // Add zigzag pattern when highly stressed
    if (this.isHighlyAlert()) {
      const zigzagOffset = new THREE.Vector3(
        -fleeDirection.z * this.zigzagDirection * this.zigzagIntensity,
        0,
        fleeDirection.x * this.zigzagDirection * this.zigzagIntensity
      );
      fleeDirection.add(zigzagOffset);
    }
    
    return fleeDirection.normalize();
  }

  getWanderDirection() {
    // Move toward flock center if we have flock members
    if (this.flockMembers.length > 0) {
      const flockCenter = this.getFlockCenter();
      const distance = this.distanceTo(flockCenter);
      
      // Only move toward flock if we're not too close
      if (distance > 5) {
        return this.getDirectionTo(flockCenter);
      }
    }
    
    // Random wandering (simplified for now)
    return new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    ).normalize();
  }

  // AI behavior update
  updateAI(deltaTime) {
    if (!this.isAlive()) {
      return;
    }

    // Update zigzag timer
    this.zigzagTimer += deltaTime;
    if (this.zigzagTimer > 0.5) { // Change zigzag direction every 0.5 seconds
      this.zigzagDirection *= -1;
      this.zigzagTimer = 0;
    }

    // Check for nearby threats
    const nearestThreat = this.findNearestThreat();
    
    switch (this.aiState) {
      case 'wandering':
        this.updateWandering(nearestThreat, deltaTime);
        break;
      case 'fleeing':
        this.updateFleeing(nearestThreat, deltaTime);
        break;
    }

    // Decrease alert level over time when no immediate threats
    if (!nearestThreat || this.distanceTo(nearestThreat) > this.detectionRadius) {
      this.decreaseAlert(this.alertDecayRate * deltaTime);
    }
  }

  updateWandering(nearestThreat, deltaTime) {
    // Switch to fleeing if threat is detected
    if (nearestThreat && this.canDetect(nearestThreat) && this.shouldFlee(nearestThreat)) {
      this.detectThreat(nearestThreat);
      return;
    }
    
    // Set state based on movement
    this.setState('walking');
  }

  updateFleeing(nearestThreat, deltaTime) {
    // Continue fleeing if we have a target and it's still close
    if (this.target && this.distanceTo(this.target) < this.fleeDistance * 1.5) {
      this.setState('running');
      
      // Consume stamina while fleeing
      this.consumeStamina(40 * deltaTime); // 40 stamina per second when fleeing
    } else if (nearestThreat && this.distanceTo(nearestThreat) < this.fleeDistance * 1.5) {
      this.setTarget(nearestThreat);
      this.setState('running');
      
      // Consume stamina while fleeing
      this.consumeStamina(40 * deltaTime); // 40 stamina per second when fleeing
    } else {
      // Safe distance reached, return to wandering
      this.setAIState('wandering');
      this.clearTarget();
      this.setState('walking');
    }
  }

  findNearestThreat() {
    if (!this.nearbyThreats || this.nearbyThreats.length === 0) {
      return null;
    }
    
    let nearest = null;
    let nearestDistance = Infinity;
    
    for (const threat of this.nearbyThreats) {
      const distance = this.distanceTo(threat);
      if (distance < nearestDistance) {
        nearest = threat;
        nearestDistance = distance;
      }
    }
    
    return nearest;
  }

  // Override experience rewards (spec: deer gives 25 XP)
  getExperienceReward() {
    return 25;
  }

  getHealthRestoration() {
    return 30; // Medium health restoration
  }
}
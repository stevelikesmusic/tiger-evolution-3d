import * as THREE from 'three';

/**
 * AmbushDetector - Handles tiger awareness and threat detection mechanics
 * Calculates awareness based on proximity, stealth, movement, and environmental factors
 */
export class AmbushDetector {
  constructor() {
    // Detection parameters
    this.baseDetectionRadius = 25.0;
    this.maxAwarenessDistance = 50.0;
    
    // Awareness calculation weights
    this.awarenessFactors = {
      proximity: 0.4,      // Distance to nearest threat
      movement: 0.25,      // Tiger's movement speed and type
      stealth: 0.20,       // Tiger's stealth effectiveness
      environmental: 0.15  // Environmental factors (time, terrain, etc.)
    };
    
    // Detection modifiers
    this.movementDetectionMultipliers = {
      idle: 0.7,
      walking: 1.0,
      running: 1.4,
      crouching: 0.5
    };
    
    // Environmental detection modifiers
    this.environmentalFactors = {
      dayTime: 1.0,        // Normal detection during day
      nightTime: 0.8,      // Reduced detection at night (not implemented yet)
      nearWater: 1.2,      // Increased detection near water (crocodile territory)
      denseVegetation: 0.9 // Slightly reduced detection in dense vegetation
    };
    
    // Current awareness state
    this.currentAwareness = 0.0; // 0.0 (safe) to 1.0 (imminent danger)
    this.awarenessHistory = [];
    this.maxHistoryLength = 10;
    
    // Detection cache for performance
    this.detectionCache = new Map();
    this.cacheTimeout = 0.5; // Cache for 0.5 seconds
    this.lastCacheUpdate = 0;
    
    console.log('👁️ AmbushDetector: Initialized detection and awareness system');
  }
  
  /**
   * Update tiger awareness based on nearby threats
   */
  updateAwareness(tiger, threats) {
    const currentTime = Date.now() / 1000;
    
    // Clear old cache entries
    if (currentTime - this.lastCacheUpdate > this.cacheTimeout) {
      this.detectionCache.clear();
      this.lastCacheUpdate = currentTime;
    }
    
    // Calculate awareness components
    const proximityAwareness = this.calculateProximityAwareness(tiger, threats);
    const movementAwareness = this.calculateMovementAwareness(tiger);
    const stealthAwareness = this.calculateStealthAwareness(tiger);
    const environmentalAwareness = this.calculateEnvironmentalAwareness(tiger);
    
    // Combine awareness factors
    const totalAwareness = (
      proximityAwareness * this.awarenessFactors.proximity +
      movementAwareness * this.awarenessFactors.movement +
      stealthAwareness * this.awarenessFactors.stealth +
      environmentalAwareness * this.awarenessFactors.environmental
    );
    
    // Smooth awareness changes to prevent jitter
    this.currentAwareness = this.smoothAwareness(totalAwareness);
    
    // Update awareness history
    this.awarenessHistory.push(this.currentAwareness);
    if (this.awarenessHistory.length > this.maxHistoryLength) {
      this.awarenessHistory.shift();
    }
    
    return this.currentAwareness;
  }
  
  /**
   * Calculate awareness based on proximity to threats
   */
  calculateProximityAwareness(tiger, threats) {
    if (!threats || threats.length === 0) return 0.0;
    
    let maxProximityThreat = 0.0;
    let nearestThreat = null;
    let nearestDistance = Infinity;
    
    for (const threat of threats) {
      if (!threat.isAlive() || threat.getState() === 'cooldown') continue;
      
      const distance = this.calculateDistance(tiger.position, threat.position);
      const detectionRadius = threat.getDetectionRadius ? threat.getDetectionRadius() : this.baseDetectionRadius;
      
      // Check if threat is in detection range
      if (distance <= detectionRadius) {
        // Calculate threat level based on distance and threat state
        const proximityRatio = 1.0 - (distance / detectionRadius);
        const threatMultiplier = this.getThreatStateMultiplier(threat);
        const lineOfSightMultiplier = this.checkLineOfSight(tiger, threat) ? 1.0 : 0.3;
        
        const threatLevel = proximityRatio * threatMultiplier * lineOfSightMultiplier;
        
        if (threatLevel > maxProximityThreat) {
          maxProximityThreat = threatLevel;
          nearestThreat = threat;
          nearestDistance = distance;
        }
      }
    }
    
    // Store nearest threat info for other systems
    this.nearestThreat = nearestThreat;
    this.nearestThreatDistance = nearestDistance;
    
    return Math.min(maxProximityThreat, 1.0);
  }
  
  /**
   * Calculate awareness based on tiger's movement
   */
  calculateMovementAwareness(tiger) {
    const tigerState = tiger.state || 'idle';
    const baseMultiplier = this.movementDetectionMultipliers[tigerState] || 1.0;
    
    // Additional factors
    let movementMultiplier = baseMultiplier;
    
    // Running makes tiger more detectable
    if (tigerState === 'running') {
      movementMultiplier *= 1.2;
    }
    
    // Crouching provides stealth bonus
    if (tigerState === 'crouching') {
      movementMultiplier *= 0.6;
    }
    
    // Convert to awareness (inverse relationship - more movement = more detectable = higher awareness)
    return Math.min(movementMultiplier / 2.0, 1.0);
  }
  
  /**
   * Calculate awareness based on tiger's stealth effectiveness
   */
  calculateStealthAwareness(tiger) {
    const stealthEffectiveness = tiger.getStealthEffectiveness ? tiger.getStealthEffectiveness() : 60;
    
    // Higher stealth = lower awareness (inverse relationship)
    const stealthRatio = Math.max(0, Math.min(100, stealthEffectiveness)) / 100;
    return 1.0 - stealthRatio;
  }
  
  /**
   * Calculate environmental awareness factors
   */
  calculateEnvironmentalAwareness(tiger) {
    let environmentalMultiplier = this.environmentalFactors.dayTime; // Default to day time
    
    // Check if near water (increases crocodile threat awareness)
    if (this.isNearWater(tiger.position)) {
      environmentalMultiplier *= this.environmentalFactors.nearWater;
    }
    
    // Check vegetation density (affects visibility)
    const vegetationDensity = this.getVegetationDensity(tiger.position);
    if (vegetationDensity > 0.6) {
      environmentalMultiplier *= this.environmentalFactors.denseVegetation;
    }
    
    // Normalize environmental factor (it shouldn't exceed 1.0 for awareness)
    return Math.min(environmentalMultiplier / 2.0, 1.0);
  }
  
  /**
   * Get threat state multiplier based on ambusher state
   */
  getThreatStateMultiplier(threat) {
    const state = threat.getState ? threat.getState() : 'idle';
    
    switch (state) {
      case 'hidden':
        return 0.3; // Very low threat when completely hidden
      case 'alert':
        return 0.7; // Moderate threat when preparing
      case 'attacking':
        return 1.0; // Maximum threat when attacking
      case 'stalking':
        return 0.5; // Medium threat when stalking
      case 'approaching':
        return 0.8; // High threat when approaching
      case 'cooldown':
        return 0.1; // Very low threat during cooldown
      default:
        return 0.5; // Default moderate threat
    }
  }
  
  /**
   * Check line of sight between tiger and threat
   */
  checkLineOfSight(tiger, threat) {
    const cacheKey = `los_${tiger.position.x.toFixed(1)}_${tiger.position.z.toFixed(1)}_${threat.position.x.toFixed(1)}_${threat.position.z.toFixed(1)}`;
    
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey);
    }
    
    // Simple line of sight check using raycasting
    const direction = new THREE.Vector3()
      .subVectors(threat.position, tiger.position)
      .normalize();
    
    const distance = this.calculateDistance(tiger.position, threat.position);
    const stepSize = 2.0; // Check every 2 units
    const steps = Math.floor(distance / stepSize);
    
    for (let i = 1; i < steps; i++) {
      const checkPoint = new THREE.Vector3()
        .copy(tiger.position)
        .add(direction.clone().multiplyScalar(i * stepSize));
      
      // Check if terrain blocks line of sight
      if (this.isLineOfSightBlocked(tiger.position, checkPoint, threat.position)) {
        this.detectionCache.set(cacheKey, false);
        return false;
      }
    }
    
    this.detectionCache.set(cacheKey, true);
    return true;
  }
  
  /**
   * Check if line of sight is blocked by terrain
   */
  isLineOfSightBlocked(startPos, checkPos, endPos) {
    // This would integrate with the terrain system to check for obstacles
    // For now, simplified implementation
    return false; // Assume clear line of sight
  }
  
  /**
   * Check if tiger is near water
   */
  isNearWater(position) {
    // This would integrate with the water system
    // For now, simplified check
    return false; // To be implemented with actual water system integration
  }
  
  /**
   * Get vegetation density at position
   */
  getVegetationDensity(position) {
    // This would integrate with the vegetation system
    // For now, simplified calculation
    const gridSize = 10;
    const gridX = Math.floor(position.x / gridSize);
    const gridZ = Math.floor(position.z / gridSize);
    
    // Simple noise-based approximation
    const density = (Math.sin(gridX * 0.1) + Math.cos(gridZ * 0.15)) * 0.5 + 0.5;
    return Math.max(0, Math.min(1, density));
  }
  
  /**
   * Calculate distance between two positions
   */
  calculateDistance(pos1, pos2) {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    );
  }
  
  /**
   * Smooth awareness changes to prevent jitter
   */
  smoothAwareness(newAwareness) {
    const smoothingFactor = 0.3; // How quickly awareness changes (0.0 = no change, 1.0 = instant)
    return this.currentAwareness + (newAwareness - this.currentAwareness) * smoothingFactor;
  }
  
  /**
   * Calculate overall awareness level for UI display
   */
  calculateAwareness(tiger, threats) {
    return this.updateAwareness(tiger, threats);
  }
  
  /**
   * Get awareness level as categorical description
   */
  getAwarenessLevel() {
    if (this.currentAwareness < 0.2) return 'safe';
    if (this.currentAwareness < 0.4) return 'alert';
    if (this.currentAwareness < 0.7) return 'danger';
    return 'imminent';
  }
  
  /**
   * Get awareness color for UI
   */
  getAwarenessColor() {
    const level = this.getAwarenessLevel();
    switch (level) {
      case 'safe': return '#00FF00';    // Green
      case 'alert': return '#FFFF00';   // Yellow
      case 'danger': return '#FF8800';  // Orange
      case 'imminent': return '#FF0000'; // Red
      default: return '#FFFFFF';
    }
  }
  
  /**
   * Check if tiger can detect specific ambusher
   */
  canDetectAmbusher(tiger, ambusher) {
    if (!ambusher.isAlive()) return true; // Always detect dead ambushers
    
    const distance = this.calculateDistance(tiger.position, ambusher.position);
    const detectionRadius = tiger.getDetectionRadius ? tiger.getDetectionRadius() : this.baseDetectionRadius;
    
    if (distance > detectionRadius) return false;
    
    // Apply stealth and movement modifiers
    const stealthEffectiveness = tiger.getStealthEffectiveness ? tiger.getStealthEffectiveness() : 60;
    const movementMultiplier = this.movementDetectionMultipliers[tiger.state] || 1.0;
    
    const effectiveDetectionRadius = detectionRadius * (stealthEffectiveness / 100) / movementMultiplier;
    
    return distance <= effectiveDetectionRadius && this.checkLineOfSight(tiger, ambusher);
  }
  
  /**
   * Get nearest threat info
   */
  getNearestThreat() {
    return {
      threat: this.nearestThreat,
      distance: this.nearestThreatDistance,
      awareness: this.currentAwareness
    };
  }
  
  /**
   * Get detection statistics for debugging
   */
  getDetectionStatistics() {
    const averageAwareness = this.awarenessHistory.length > 0 
      ? this.awarenessHistory.reduce((a, b) => a + b, 0) / this.awarenessHistory.length 
      : 0;
    
    return {
      currentAwareness: this.currentAwareness,
      averageAwareness: averageAwareness,
      awarenessLevel: this.getAwarenessLevel(),
      nearestThreatDistance: this.nearestThreatDistance,
      cacheSize: this.detectionCache.size
    };
  }
  
  /**
   * Dispose of detection system
   */
  dispose() {
    this.detectionCache.clear();
    this.awarenessHistory = [];
    this.nearestThreat = null;
    console.log('👁️ AmbushDetector: Disposed');
  }
}
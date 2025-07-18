import * as THREE from 'three';

export class ScentTrailSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeTrails = [];
    this.maxTrails = 3; // Maximum number of trails at once
    this.trailDuration = 12.0; // Trail lasts 12 seconds
    
    // Trail material
    this.trailMaterial = new THREE.LineBasicMaterial({ 
      color: 0x800080, // Purple color
      linewidth: 4,
      transparent: true,
      opacity: 0.8
    });
    
    console.log('🟣 ScentTrailSystem: Initialized');
  }
  
  createTrail(tigerPosition, targetAnimal) {
    if (!targetAnimal || !targetAnimal.isAlive()) {
      console.log('🟣 ScentTrailSystem: No valid target animal found');
      return;
    }
    
    // Remove oldest trail if at max capacity
    if (this.activeTrails.length >= this.maxTrails) {
      this.removeOldestTrail();
    }
    
    // Create trail geometry
    const points = this.generateTrailPoints(tigerPosition, targetAnimal.position);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create trail line
    const trail = new THREE.Line(geometry, this.trailMaterial.clone());
    trail.userData = {
      startTime: Date.now(),
      duration: this.trailDuration * 1000, // Convert to milliseconds
      targetAnimal: targetAnimal,
      originalOpacity: 0.8
    };
    
    this.scene.add(trail);
    this.activeTrails.push(trail);
    
    console.log(`🟣 ScentTrailSystem: Created trail to ${targetAnimal.type} at distance ${tigerPosition.distanceTo(targetAnimal.position).toFixed(1)}`);
  }
  
  generateTrailPoints(start, end) {
    const points = [];
    const segments = 20; // Number of segments for smooth curve
    
    // Add some curve to make the trail more interesting
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Linear interpolation between start and end
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;
      
      // Add slight curve and height variation
      const curve = Math.sin(t * Math.PI) * 2.0; // Curve peaks in middle
      const height = Math.max(start.y, end.y) + 1.0 + curve; // Keep trail above ground
      
      points.push(new THREE.Vector3(x, height, z));
    }
    
    return points;
  }
  
  findNearestAnimal(tigerPosition, animalSystem) {
    if (!animalSystem || !animalSystem.animals) {
      return null;
    }
    
    let nearestAnimal = null;
    let nearestDistance = Infinity;
    
    for (const animal of animalSystem.animals) {
      if (!animal.isAlive()) continue;
      
      const distance = tigerPosition.distanceTo(animal.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAnimal = animal;
      }
    }
    
    return nearestAnimal;
  }
  
  removeOldestTrail() {
    if (this.activeTrails.length > 0) {
      const oldestTrail = this.activeTrails.shift();
      this.scene.remove(oldestTrail);
      oldestTrail.geometry.dispose();
      oldestTrail.material.dispose();
    }
  }
  
  update(deltaTime) {
    const currentTime = Date.now();
    const trailsToRemove = [];
    
    for (const trail of this.activeTrails) {
      const age = currentTime - trail.userData.startTime;
      const progress = age / trail.userData.duration;
      
      if (progress >= 1.0) {
        // Trail has expired
        trailsToRemove.push(trail);
      } else {
        // Update trail opacity for fade effect
        const fadeStart = 0.7; // Start fading at 70% of duration
        if (progress > fadeStart) {
          const fadeProgress = (progress - fadeStart) / (1.0 - fadeStart);
          const opacity = trail.userData.originalOpacity * (1.0 - fadeProgress);
          trail.material.opacity = Math.max(0, opacity);
        }
      }
    }
    
    // Remove expired trails
    for (const trail of trailsToRemove) {
      this.removeTrail(trail);
    }
  }
  
  removeTrail(trail) {
    const index = this.activeTrails.indexOf(trail);
    if (index !== -1) {
      this.activeTrails.splice(index, 1);
      this.scene.remove(trail);
      trail.geometry.dispose();
      trail.material.dispose();
    }
  }
  
  clearAllTrails() {
    for (const trail of this.activeTrails) {
      this.scene.remove(trail);
      trail.geometry.dispose();
      trail.material.dispose();
    }
    this.activeTrails = [];
    console.log('🟣 ScentTrailSystem: Cleared all trails');
  }
  
  dispose() {
    this.clearAllTrails();
    this.trailMaterial.dispose();
    console.log('🟣 ScentTrailSystem: Disposed');
  }
}
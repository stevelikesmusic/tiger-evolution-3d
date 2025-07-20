import * as THREE from 'three';

export class TigerTraceSystem {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.traceLine = null;
    this.traceGeometry = null;
    this.traceMaterial = null;
    this.targetTiger = null;
    this.fadeTimer = 0;
    this.traceDuration = 10.0; // 10 seconds
    
    this.initializeMaterials();
  }
  
  initializeMaterials() {
    // Create red glowing material for the trace
    this.traceMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000, // Bright red
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    
    console.log('🔴 TigerTraceSystem: Materials initialized');
  }
  
  createTrace(startPosition, animalSystem) {
    console.log('🔴 Creating red tiger trace...');
    
    // Clear any existing trace
    this.clearTrace();
    
    // Find nearest tiger
    const nearestTiger = this.findNearestTiger(startPosition, animalSystem);
    
    if (!nearestTiger) {
      console.log('🔴 No tigers found for trace');
      return false;
    }
    
    this.targetTiger = nearestTiger;
    console.log(`🔴 Tiger trace targeting ${nearestTiger.gender} ${nearestTiger.type} at distance ${startPosition.distanceTo(nearestTiger.position).toFixed(1)}`);
    
    // Create curved path to tiger
    const tracePath = this.createCurvedPath(startPosition, nearestTiger.position);
    
    // Create the visual trace line
    this.traceGeometry = new THREE.BufferGeometry().setFromPoints(tracePath);
    this.traceLine = new THREE.Line(this.traceGeometry, this.traceMaterial);
    this.traceLine.renderOrder = 100; // Render on top
    
    this.scene.add(this.traceLine);
    
    // Start fade timer
    this.isActive = true;
    this.fadeTimer = 0;
    
    return true;
  }
  
  findNearestTiger(position, animalSystem) {
    // Get all animals first for debugging
    const allAnimals = animalSystem.animals;
    console.log(`🔴 TigerTrace: Total animals in system: ${allAnimals.length}`);
    
    // Debug: show all animal types
    const animalTypes = {};
    allAnimals.forEach(animal => {
      animalTypes[animal.type] = (animalTypes[animal.type] || 0) + 1;
    });
    console.log(`🔴 TigerTrace: Animal breakdown:`, animalTypes);
    
    const tigers = animalSystem.animals.filter(animal => 
      animal.species === 'tiger' && animal.isAlive()
    );
    
    console.log(`🔴 TigerTrace: Found ${tigers.length} tigers in system`);
    
    if (tigers.length === 0) {
      console.log(`🔴 TigerTrace: No tigers available for trace`);
      return null;
    }
    
    let nearestTiger = null;
    let nearestDistance = Infinity;
    
    for (const tiger of tigers) {
      const distance = position.distanceTo(tiger.position);
      console.log(`🔴 TigerTrace: ${tiger.type} at distance ${distance.toFixed(1)}`);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTiger = tiger;
      }
    }
    
    if (nearestTiger) {
      console.log(`🔴 TigerTrace: Selected nearest ${nearestTiger.type} at distance ${nearestDistance.toFixed(1)}`);
    }
    
    return nearestTiger;
  }
  
  createCurvedPath(start, end) {
    const points = [];
    const segments = 20; // Number of segments for smooth curve
    
    // Create a curved path that arcs slightly upward
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Linear interpolation between start and end
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;
      
      // Add an arc - higher in the middle
      const arcHeight = Math.sin(t * Math.PI) * 2.0; // 2 units high at peak
      const y = Math.max(start.y, end.y) + arcHeight;
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }
  
  update(deltaTime) {
    if (!this.isActive) return;
    
    this.fadeTimer += deltaTime;
    
    // Update trace to target if tiger moved
    if (this.targetTiger && this.targetTiger.isAlive() && this.traceLine) {
      // Check if tiger moved significantly
      const lastPoint = this.traceGeometry.attributes.position.array;
      const tigerPos = this.targetTiger.position;
      const lastX = lastPoint[lastPoint.length - 3];
      const lastZ = lastPoint[lastPoint.length - 1];
      
      const distance = Math.sqrt(
        Math.pow(tigerPos.x - lastX, 2) + Math.pow(tigerPos.z - lastZ, 2)
      );
      
      if (distance > 1.0) {
        // Tiger moved, update trace endpoint
        this.updateTraceEndpoint(tigerPos);
      }
    }
    
    // Fade out over time
    if (this.fadeTimer < this.traceDuration) {
      const fadeProgress = this.fadeTimer / this.traceDuration;
      const opacity = 0.8 * (1.0 - fadeProgress);
      this.traceMaterial.opacity = Math.max(0, opacity);
      
      // Pulse effect
      const pulseIntensity = 0.5 + 0.3 * Math.sin(this.fadeTimer * 4);
      this.traceMaterial.color.setHex(0xff0000 * pulseIntensity);
    } else {
      // Trace expired
      this.clearTrace();
    }
  }
  
  updateTraceEndpoint(newEndpoint) {
    if (!this.traceGeometry || !this.traceLine) return;
    
    // Get the start position (first point)
    const positions = this.traceGeometry.attributes.position.array;
    const startPos = new THREE.Vector3(positions[0], positions[1], positions[2]);
    
    // Create new curved path to new endpoint
    const newPath = this.createCurvedPath(startPos, newEndpoint);
    
    // Update geometry
    this.traceGeometry.setFromPoints(newPath);
    this.traceGeometry.attributes.position.needsUpdate = true;
  }
  
  clearTrace() {
    if (this.traceLine) {
      this.scene.remove(this.traceLine);
      this.traceLine = null;
    }
    
    if (this.traceGeometry) {
      this.traceGeometry.dispose();
      this.traceGeometry = null;
    }
    
    this.isActive = false;
    this.fadeTimer = 0;
    this.targetTiger = null;
    
    console.log('🔴 Tiger trace cleared');
  }
  
  isTraceActive() {
    return this.isActive;
  }
  
  getTargetTiger() {
    return this.targetTiger;
  }
  
  dispose() {
    this.clearTrace();
    
    if (this.traceMaterial) {
      this.traceMaterial.dispose();
      this.traceMaterial = null;
    }
    
    console.log('🔴 TigerTraceSystem disposed');
  }
}
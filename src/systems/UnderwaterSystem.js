import * as THREE from 'three';

/**
 * UnderwaterSystem - Creates and manages underwater terrain, vegetation, and elements
 */
export class UnderwaterSystem {
  constructor(terrain, waterSystem) {
    this.terrain = terrain;
    this.waterSystem = waterSystem;
    this.isActive = false;
    
    // Underwater elements storage
    this.underwaterMeshes = [];
    this.seaweedMeshes = [];
    this.rockMeshes = [];
    this.logMeshes = [];
    this.bubbleMeshes = [];
    
    // Underwater floor
    this.underwaterFloor = null;
    
    // Animation properties
    this.time = 0;
    
    console.log('🌊 UnderwaterSystem: Starting creation...');
    this.initialize();
  }

  /**
   * Initialize the underwater system
   */
  initialize() {
    console.log('🌊 UnderwaterSystem: Initializing underwater terrain...');
    this.createUnderwaterTerrain();
    this.createBubbleSystem();
    console.log(`🌊 UnderwaterSystem: Created ${this.underwaterMeshes.length} underwater meshes`);
    console.log(`  - Seaweed/Seagrass: ${this.seaweedMeshes.length} patches`);
    console.log(`  - Rocks: ${this.rockMeshes.length} rocks`);
    console.log(`  - Logs: ${this.logMeshes.length} swim-through logs`);
    console.log(`  - Bubbles: ${this.bubbleMeshes.length} floating bubbles`);
  }
  
  /**
   * Create the underwater terrain (dirt/sand floor)
   */
  createUnderwaterTerrain() {
    const waterBodies = this.waterSystem.getWaterBodies();
    console.log(`🌊 UnderwaterSystem: Found ${waterBodies.length} water bodies`);
    
    // Create underwater floor geometry based on water bodies
    waterBodies.forEach((waterBody, index) => {
      if (waterBody.type === 'lake' || waterBody.type === 'pond') {
        console.log(`🌊 Creating underwater terrain for ${waterBody.type} ${index + 1}/${waterBodies.length}`);
        this.createUnderwaterFloor(waterBody);
        this.addSeaweedAndGrass(waterBody);
        this.addRocks(waterBody);
        this.addLogs(waterBody);
      }
    });
    
    console.log(`🌊 UnderwaterSystem: Finished creating terrain. Total meshes: ${this.underwaterMeshes.length}`);
  }
  
  /**
   * Create underwater floor for a water body
   */
  createUnderwaterFloor(waterBody) {
    const radius = waterBody.radius;
    const segments = Math.max(32, Math.floor(radius));
    
    // Create circular floor geometry (full size for visibility)
    const floorGeometry = new THREE.CircleGeometry(radius, segments);
    
    // Create dirt/sand material with better visibility
    const floorMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B4513, // Brown dirt color
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    
    // Position floor much deeper underwater for clear separation
    const terrainHeight = this.terrain.getHeightAt(waterBody.center.x, waterBody.center.z);
    const underwaterDepth = 8 + (radius * 0.1); // Much deeper lakes (8+ units deep)
    const floorY = terrainHeight - underwaterDepth; // Deep underwater floor
    
    floor.position.set(
      waterBody.center.x,
      floorY,
      waterBody.center.z
    );
    floor.rotation.x = -Math.PI / 2; // Lay flat
    
    console.log(`🏞️ Created underwater floor at (${waterBody.center.x}, ${floorY.toFixed(1)}, ${waterBody.center.z}) for ${waterBody.type} with radius ${radius}, depth: ${underwaterDepth.toFixed(1)}`);
    
    this.underwaterMeshes.push(floor);
  }
  
  /**
   * Add seaweed and seagrass spread around the underwater area
   */
  addSeaweedAndGrass(waterBody) {
    const radius = waterBody.radius;
    
    // Spread vegetation in a wider area around the water body
    const spreadRadius = radius * 2; // Much wider spread
    const numPlants = Math.floor(radius * 2); // Fewer plants but spread out
    
    for (let i = 0; i < numPlants; i++) {
      // Random position in wider area around water body
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spreadRadius;
      
      const x = waterBody.center.x + Math.cos(angle) * distance;
      const z = waterBody.center.z + Math.sin(angle) * distance;
      
      // Scattered placement - random distribution
      if (Math.random() < 0.4) { // 40% chance to place vegetation
        if (Math.random() < 0.6) {
          this.createSeaweed(x, z, waterBody);
        } else {
          this.createSeagrass(x, z, waterBody);
        }
      }
    }
    
    // Add additional scattered plants across the entire underwater terrain
    const extraPlants = Math.floor(radius * 1.5);
    for (let i = 0; i < extraPlants; i++) {
      // Completely random positions across larger area
      const randX = waterBody.center.x + (Math.random() - 0.5) * radius * 4;
      const randZ = waterBody.center.z + (Math.random() - 0.5) * radius * 4;
      
      if (Math.random() < 0.3) { // 30% chance for scattered vegetation
        if (Math.random() < 0.5) {
          this.createSeaweed(randX, randZ, waterBody);
        } else {
          this.createSeagrass(randX, randZ, waterBody);
        }
      }
    }
  }
  
  /**
   * Create individual seaweed plant
   */
  createSeaweed(x, z, waterBody) {
    const seaweedGroup = new THREE.Group();
    
    // Make seaweed MASSIVE and EXTREMELY TALL
    const height = 30 + Math.random() * 20; // 30-50 units tall!!!
    const segments = Math.floor(height * 1.5); // Many segments for swaying
    
    // Create seaweed stem with multiple segments
    for (let i = 0; i < segments; i++) {
      const segmentHeight = height / segments;
      const stemGeometry = new THREE.CylinderGeometry(
        0.2 + Math.random() * 0.3, // Much bigger top radius
        0.3 + Math.random() * 0.4, // Much bigger bottom radius  
        segmentHeight,
        8
      );
      
      const stemMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(0.3 + Math.random() * 0.1, 0.6, 0.3), // Green variations
        transparent: true,
        opacity: 0.8
      });
      
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = (i + 0.5) * segmentHeight;
      
      // Add slight random bend for natural look
      stem.rotation.x = (Math.random() - 0.5) * 0.2;
      stem.rotation.z = (Math.random() - 0.5) * 0.2;
      
      // Store animation data
      stem.userData = {
        originalRotation: { x: stem.rotation.x, z: stem.rotation.z },
        swayAmount: 0.1 + Math.random() * 0.1,
        swaySpeed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      };
      
      seaweedGroup.add(stem);
    }
    
    // Position seaweed on underwater floor
    const terrainHeight = this.terrain.getHeightAt(x, z);
    const underwaterDepth = 8 + (waterBody.radius * 0.1);
    const floorY = terrainHeight - underwaterDepth;
    seaweedGroup.position.set(x, floorY + 0.2, z);
    
    this.seaweedMeshes.push(seaweedGroup);
    this.underwaterMeshes.push(seaweedGroup);
  }
  
  /**
   * Create seagrass patch
   */
  createSeagrass(x, z, waterBody) {
    const grassGroup = new THREE.Group();
    
    // Make seagrass MASSIVE too!
    const numBlades = 30 + Math.floor(Math.random() * 20); // Tons of blades per patch
    
    for (let i = 0; i < numBlades; i++) {
      const bladeHeight = 15 + Math.random() * 25; // 15-40 units tall!!!
      const bladeGeometry = new THREE.CylinderGeometry(0.1, 0.15, bladeHeight, 8); // Much thicker blades
      
      const bladeMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.7, 0.4), // Grass green
        transparent: true,
        opacity: 0.9
      });
      
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      
      // Random position within small patch
      blade.position.set(
        (Math.random() - 0.5) * 0.3,
        bladeHeight / 2,
        (Math.random() - 0.5) * 0.3
      );
      
      // Random rotation
      blade.rotation.y = Math.random() * Math.PI * 2;
      blade.rotation.x = (Math.random() - 0.5) * 0.3;
      
      // Animation data
      blade.userData = {
        originalRotation: { x: blade.rotation.x, z: blade.rotation.z },
        swayAmount: 0.2 + Math.random() * 0.2,
        swaySpeed: 1.0 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2
      };
      
      grassGroup.add(blade);
    }
    
    // Position grass on underwater floor 
    const terrainHeight = this.terrain.getHeightAt(x, z);
    const underwaterDepth = 8 + (waterBody.radius * 0.1);
    const floorY = terrainHeight - underwaterDepth;
    grassGroup.position.set(x, floorY + 0.1, z);
    
    this.seaweedMeshes.push(grassGroup);
    this.underwaterMeshes.push(grassGroup);
  }
  
  /**
   * Add rocks to underwater floor
   */
  addRocks(waterBody) {
    const radius = waterBody.radius;
    const numRocks = Math.floor(radius * 1.5); // More rocks scattered around
    
    for (let i = 0; i < numRocks; i++) {
      // Random position within water body
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.9;
      
      const x = waterBody.center.x + Math.cos(angle) * distance;
      const z = waterBody.center.z + Math.sin(angle) * distance;
      
      this.createRock(x, z, waterBody);
    }
  }
  
  /**
   * Create individual rock
   */
  createRock(x, z, waterBody) {
    // Random rock size and shape
    const size = 0.2 + Math.random() * 0.8;
    const rockGeometry = new THREE.SphereGeometry(
      size,
      8 + Math.floor(Math.random() * 8),
      6 + Math.floor(Math.random() * 6)
    );
    
    // Deform geometry for natural rock shape
    const positions = rockGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += (Math.random() - 0.5) * size * 0.3;     // X
      positions[i + 1] += (Math.random() - 0.5) * size * 0.2; // Y
      positions[i + 2] += (Math.random() - 0.5) * size * 0.3; // Z
    }
    rockGeometry.attributes.position.needsUpdate = true;
    rockGeometry.computeVertexNormals();
    
    const rockMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0, 0, 0.3 + Math.random() * 0.2), // Gray variations
      roughness: 0.8
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    // Position rock on deep underwater floor
    const terrainHeight = this.terrain.getHeightAt(x, z);
    const underwaterDepth = 8 + (waterBody.radius * 0.1); // Same depth as floor
    rock.position.set(x, terrainHeight - underwaterDepth + size * 0.3, z);
    
    // Random rotation
    rock.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    this.rockMeshes.push(rock);
    this.underwaterMeshes.push(rock);
  }
  
  /**
   * Add logs that tiger can swim through
   */
  addLogs(waterBody) {
    const radius = waterBody.radius;
    
    // Add logs to all water bodies
    if (radius > 15) {
      const numLogs = 2 + Math.floor(radius / 20); // More logs for swimming through
      
      for (let i = 0; i < numLogs; i++) {
        // Random position within water body
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.6; // More central placement
        
        const x = waterBody.center.x + Math.cos(angle) * distance;
        const z = waterBody.center.z + Math.sin(angle) * distance;
        
        this.createLog(x, z, waterBody);
      }
    }
  }
  
  /**
   * Create hollow log that tiger can swim through
   */
  createLog(x, z, waterBody) {
    const logGroup = new THREE.Group();
    
    // Log dimensions
    const length = 3 + Math.random() * 4;
    const outerRadius = 0.8 + Math.random() * 0.4;
    const innerRadius = outerRadius * 0.6; // Hollow interior
    
    // Create log exterior
    const logGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, length, 12);
    const logMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B4513, // Brown wood color
      roughness: 0.9
    });
    const logExterior = new THREE.Mesh(logGeometry, logMaterial);
    
    // Create hollow interior (for swimming through)
    const innerGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, length + 0.1, 12);
    const innerMaterial = new THREE.MeshLambertMaterial({
      color: 0x2F1B14, // Dark interior
      side: THREE.BackSide
    });
    const logInterior = new THREE.Mesh(innerGeometry, innerMaterial);
    
    logGroup.add(logExterior);
    logGroup.add(logInterior);
    
    // Random log orientation
    logGroup.rotation.set(
      (Math.random() - 0.5) * 0.5, // Slight tilt
      Math.random() * Math.PI * 2,  // Random Y rotation
      (Math.random() - 0.5) * 0.5   // Slight roll
    );
    
    // Position log in middle of deep water column
    const terrainHeight = this.terrain.getHeightAt(x, z);
    const underwaterDepth = 8 + (waterBody.radius * 0.1); // Same depth as floor
    logGroup.position.set(x, terrainHeight - underwaterDepth / 2, z);
    
    // Store collision data for swimming through
    logGroup.userData = {
      isLog: true,
      innerRadius: innerRadius,
      length: length,
      canSwimThrough: true
    };
    
    this.logMeshes.push(logGroup);
    this.underwaterMeshes.push(logGroup);
  }
  
  /**
   * Create floating bubble system
   */
  createBubbleSystem() {
    this.waterSystem.getWaterBodies().forEach(waterBody => {
      if (waterBody.type === 'lake' || waterBody.type === 'pond') {
        this.addBubbles(waterBody);
      }
    });
  }

  /**
   * Add floating bubbles to water body
   */
  addBubbles(waterBody) {
    const radius = waterBody.radius;
    const numBubbles = Math.floor(radius * 0.5); // Fewer bubbles for better performance
    
    for (let i = 0; i < numBubbles; i++) {
      // Random position within water body
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.8;
      
      const x = waterBody.center.x + Math.cos(angle) * distance;
      const z = waterBody.center.z + Math.sin(angle) * distance;
      
      // Random height in deep water column
      const terrainHeight = this.terrain.getHeightAt(x, z);
      const underwaterDepth = 8 + (waterBody.radius * 0.1); // Same depth as floor
      const waterBottom = terrainHeight - underwaterDepth + 0.5;
      const waterTop = terrainHeight - 1; // Surface level
      const y = waterBottom + Math.random() * (waterTop - waterBottom);
      
      this.createBubble(x, y, z);
    }
  }

  /**
   * Create balloon-like bubble that tiger needle can pop
   */
  createBubble(x, y, z) {
    // Small balloon size - no lag
    const size = 0.3 + Math.random() * 0.4; // 0.3-0.7 units
    
    const bubbleGeometry = new THREE.SphereGeometry(size, 8, 6); // Lower poly for performance
    const bubbleMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ddff, // Light blue
      transparent: true,
      opacity: 0.7,
      emissive: new THREE.Color(0x4499cc),
      emissiveIntensity: 0.3
    });
    
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubble.position.set(x, y, z);
    
    // Balloon physics - float up gently
    bubble.userData = {
      isBubble: true,
      size: size,
      riseSpeed: 2.0,
      startY: y,
      floatPhase: Math.random() * Math.PI * 2
    };
    
    this.bubbleMeshes.push(bubble);
    this.underwaterMeshes.push(bubble);
  }

  /**
   * Tiger needle pops balloon bubbles - precise collision
   */
  checkBubbleCollisions(tigerX, tigerY, tigerZ) {
    if (!this.isActive || this.bubbleMeshes.length === 0) return [];
    
    const poppedBubbles = [];
    
    for (let i = this.bubbleMeshes.length - 1; i >= 0; i--) {
      const bubble = this.bubbleMeshes[i];
      if (!bubble || !bubble.userData) continue;
      
      // Calculate exact distance from tiger needle to balloon center
      const distance = Math.sqrt(
        Math.pow(tigerX - bubble.position.x, 2) +
        Math.pow(tigerY - bubble.position.y, 2) +
        Math.pow(tigerZ - bubble.position.z, 2)
      );
      
      // Tiger needle pops balloon if it touches the bubble surface
      const popDistance = bubble.userData.size + 0.5; // Balloon radius + small needle reach
      
      if (distance <= popDistance) {
        console.log(`💥 POP! Tiger needle popped balloon at distance ${distance.toFixed(2)}`);
        this.popBubble(i);
        poppedBubbles.push(bubble);
      }
    }
    
    return poppedBubbles;
  }

  /**
   * Pop a bubble (remove and create new one)
   */
  popBubble(index) {
    const bubble = this.bubbleMeshes[index];
    
    // Remove from scene
    const meshIndex = this.underwaterMeshes.indexOf(bubble);
    if (meshIndex !== -1) {
      this.underwaterMeshes.splice(meshIndex, 1);
    }
    
    // Dispose of resources
    if (bubble.geometry) bubble.geometry.dispose();
    if (bubble.material) bubble.material.dispose();
    
    // Remove from bubble array
    this.bubbleMeshes.splice(index, 1);
    
    // Create a new bubble to replace it
    setTimeout(() => {
      if (this.isActive) {
        this.respawnBubble();
      }
    }, 2000 + Math.random() * 3000); // Respawn after 2-5 seconds
  }

  /**
   * Respawn a new bubble in a random location
   */
  respawnBubble() {
    const waterBodies = this.waterSystem.getWaterBodies();
    const validBodies = waterBodies.filter(wb => wb.type === 'lake' || wb.type === 'pond');
    
    if (validBodies.length > 0) {
      const waterBody = validBodies[Math.floor(Math.random() * validBodies.length)];
      
      // Random position
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * waterBody.radius * 0.8;
      const x = waterBody.center.x + Math.cos(angle) * distance;
      const z = waterBody.center.z + Math.sin(angle) * distance;
      
      // Start near deep bottom
      const terrainHeight = this.terrain.getHeightAt(x, z);
      const underwaterDepth = 8 + (waterBody.radius * 0.1); // Same depth as floor
      const y = terrainHeight - underwaterDepth + 0.5;
      
      this.createBubble(x, y, z);
    }
  }

  /**
   * Update underwater elements (animations, etc.)
   */
  update(deltaTime) {
    if (!this.isActive) return;
    
    this.time += deltaTime;
    
    // Animate seaweed and seagrass swaying
    this.seaweedMeshes.forEach(plantGroup => {
      plantGroup.children.forEach(segment => {
        if (segment.userData.swayAmount) {
          const { originalRotation, swayAmount, swaySpeed, phase } = segment.userData;
          
          // Create gentle swaying motion
          const sway = Math.sin(this.time * swaySpeed + phase) * swayAmount;
          segment.rotation.x = originalRotation.x + sway;
          segment.rotation.z = originalRotation.z + sway * 0.5;
        }
      });
    });
    
    // Animate floating bubbles
    for (let i = this.bubbleMeshes.length - 1; i >= 0; i--) {
      const bubble = this.bubbleMeshes[i];
      
      if (!bubble || !bubble.userData) continue;
      
      // Float up continuously
      bubble.position.y += bubble.userData.riseSpeed * deltaTime;
      
      // Add gentle side-to-side floating
      const sideFloat = Math.sin(this.time + bubble.userData.floatPhase) * 0.5 * deltaTime;
      bubble.position.x += sideFloat;
      
      // Pop bubble when it rises too high
      if (bubble.position.y > bubble.userData.startY + 15) {
        this.popBubble(i);
      }
    }
  }
  
  /**
   * Activate underwater view - hide surface water and show underwater terrain
   */
  activate() {
    this.isActive = true;
    console.log(`🌊 Activating underwater terrain mode`);
    
    // Show underwater terrain
    this.underwaterMeshes.forEach(mesh => {
      mesh.visible = true;
    });
  }
  
  /**
   * Deactivate underwater view
   */
  deactivate() {
    this.isActive = false;
    this.underwaterMeshes.forEach(mesh => {
      mesh.visible = false;
    });
  }
  
  /**
   * Get all underwater meshes for adding to scene
   */
  getUnderwaterMeshes() {
    return this.underwaterMeshes;
  }
  
  /**
   * Check if position is inside a log (for swimming through)
   */
  isInsideLog(x, y, z) {
    for (const log of this.logMeshes) {
      const distance = Math.sqrt(
        Math.pow(x - log.position.x, 2) + 
        Math.pow(z - log.position.z, 2)
      );
      
      const heightDiff = Math.abs(y - log.position.y);
      
      if (distance <= log.userData.innerRadius && heightDiff <= log.userData.length / 2) {
        console.log(`🪵 Tiger is swimming through log tunnel! Radius: ${log.userData.innerRadius.toFixed(1)}`);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    this.underwaterMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.underwaterMeshes = [];
    this.seaweedMeshes = [];
    this.rockMeshes = [];
    this.logMeshes = [];
  }
}
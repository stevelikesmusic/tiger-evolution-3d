import * as THREE from 'three';

/**
 * VegetationSystem - Manages procedural placement and rendering of jungle vegetation
 */
export class VegetationSystem {
  constructor(scene, terrain, waterSystem = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.waterSystem = waterSystem;
    
    // Vegetation containers
    this.trees = [];
    this.bushes = [];
    this.grass = [];
    this.foliage = [];
    
    // Vegetation groups for performance
    this.treeGroup = new THREE.Group();
    this.bushGroup = new THREE.Group();
    this.grassGroup = new THREE.Group();
    this.foliageGroup = new THREE.Group();
    
    this.scene.add(this.treeGroup);
    this.scene.add(this.bushGroup);
    this.scene.add(this.grassGroup);
    this.scene.add(this.foliageGroup);
    
    // Vegetation parameters
    this.vegetationDensity = {
      trees: 0.02,      // Trees per square unit
      bushes: 0.05,     // Bushes per square unit
      grass: 0.3,       // Grass patches per square unit
      foliage: 0.1      // Additional foliage per square unit
    };
    
    // Vegetation constraints
    this.constraints = {
      trees: {
        minSlope: 0,
        maxSlope: 0.4,
        minHeight: -10,
        maxHeight: 30,
        spacing: 8
      },
      bushes: {
        minSlope: 0,
        maxSlope: 0.6,
        minHeight: -5,
        maxHeight: 25,
        spacing: 4
      },
      grass: {
        minSlope: 0,
        maxSlope: 0.3,
        minHeight: -5,
        maxHeight: 15,
        spacing: 2
      }
    };
    
    // Materials cache
    this.materials = new Map();
    this.geometries = new Map();
    
    this.initMaterials();
    this.initGeometries();
  }
  
  /**
   * Set water system reference for vegetation placement
   */
  setWaterSystem(waterSystem) {
    this.waterSystem = waterSystem;
  }
  
  /**
   * Initialize vegetation materials
   */
  initMaterials() {
    // Tree trunk material
    this.materials.set('treeTrunk', new THREE.MeshLambertMaterial({
      color: 0x4a3c28,
      roughness: 0.8
    }));
    
    // Vine material (more visible)
    this.materials.set('vine', new THREE.MeshLambertMaterial({
      color: 0x4d7c2a,
      transparent: false,
      roughness: 0.7
    }));
    
    // Tree leaves material with multiple variants
    const leafColors = [0x2d5016, 0x1a4b08, 0x3d6b1f, 0x4d7c2a];
    leafColors.forEach((color, index) => {
      this.materials.set(`treeLeaves${index}`, new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      }));
    });
    
    // Bush material
    this.materials.set('bush', new THREE.MeshLambertMaterial({
      color: 0x2a5c0f,
      transparent: true,
      opacity: 0.8
    }));
    
    // Grass material
    this.materials.set('grass', new THREE.MeshLambertMaterial({
      color: 0x4d7c2a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    }));
    
    // Fern material
    this.materials.set('fern', new THREE.MeshLambertMaterial({
      color: 0x1e4d0c,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    }));
  }
  
  /**
   * Initialize vegetation geometries
   */
  initGeometries() {
    // Tree trunk geometry (very very big)
    this.geometries.set('treeTrunk', new THREE.CylinderGeometry(1.0, 1.5, 20, 8));
    
    // Vine geometry (thicker and more visible)
    this.geometries.set('vine', new THREE.CylinderGeometry(0.15, 0.15, 1, 8));
    
    // Tree leaves geometries (very very big shapes)
    this.geometries.set('treeLeaves0', new THREE.SphereGeometry(10, 8, 6));
    this.geometries.set('treeLeaves1', new THREE.ConeGeometry(8, 15, 8));
    this.geometries.set('treeLeaves2', new THREE.OctahedronGeometry(9, 1));
    
    // Bush geometry
    this.geometries.set('bush', new THREE.SphereGeometry(1.5, 6, 4));
    
    // Grass geometry
    const grassGeometry = new THREE.PlaneGeometry(0.5, 1.5);
    this.geometries.set('grass', grassGeometry);
    
    // Fern geometry
    const fernGeometry = new THREE.PlaneGeometry(1, 2);
    this.geometries.set('fern', fernGeometry);
  }
  
  /**
   * Generate vegetation across the terrain
   * @param {number} seed - Random seed for reproducible generation
   */
  generateVegetation(seed = Math.random() * 1000) {
    this.clearVegetation();
    
    const bounds = this.terrain.getBounds();
    const rng = this.createSeededRandom(seed);
    
    // Calculate grid size based on terrain
    const gridSize = 4; // 4x4 unit grid
    const cols = Math.floor((bounds.maxX - bounds.minX) / gridSize);
    const rows = Math.floor((bounds.maxZ - bounds.minZ) / gridSize);
    
    // Track occupied positions for spacing
    const occupiedPositions = new Set();
    
    // Generate trees
    this.generateTrees(bounds, gridSize, cols, rows, rng, occupiedPositions);
    
    // Generate bushes
    this.generateBushes(bounds, gridSize, cols, rows, rng, occupiedPositions);
    
    // Generate grass patches
    this.generateGrass(bounds, gridSize, cols, rows, rng, occupiedPositions);
    
    // Generate additional foliage
    this.generateFoliage(bounds, gridSize, cols, rows, rng, occupiedPositions);
  }
  
  /**
   * Generate trees across terrain
   */
  generateTrees(bounds, gridSize, cols, rows, rng, occupiedPositions) {
    const density = this.vegetationDensity.trees;
    const constraints = this.constraints.trees;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (rng() > density) continue;
        
        // Calculate position
        const x = bounds.minX + (col + rng()) * gridSize;
        const z = bounds.minZ + (row + rng()) * gridSize;
        
        // Check terrain constraints
        if (!this.isValidPosition(x, z, constraints)) continue;
        
        // Check spacing
        if (!this.checkSpacing(x, z, constraints.spacing, occupiedPositions)) continue;
        
        // Create tree
        this.createTree(x, z, rng);
        
        // Mark position as occupied
        const key = `${Math.floor(x/2)}_${Math.floor(z/2)}`;
        occupiedPositions.add(key);
      }
    }
  }
  
  /**
   * Generate bushes across terrain
   */
  generateBushes(bounds, gridSize, cols, rows, rng, occupiedPositions) {
    const density = this.vegetationDensity.bushes;
    const constraints = this.constraints.bushes;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (rng() > density) continue;
        
        const x = bounds.minX + (col + rng()) * gridSize;
        const z = bounds.minZ + (row + rng()) * gridSize;
        
        if (!this.isValidPosition(x, z, constraints)) continue;
        if (!this.checkSpacing(x, z, constraints.spacing, occupiedPositions)) continue;
        
        this.createBush(x, z, rng);
        
        const key = `${Math.floor(x/2)}_${Math.floor(z/2)}`;
        occupiedPositions.add(key);
      }
    }
  }
  
  /**
   * Generate grass patches
   */
  generateGrass(bounds, gridSize, cols, rows, rng, occupiedPositions) {
    const density = this.vegetationDensity.grass;
    const constraints = this.constraints.grass;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (rng() > density) continue;
        
        const x = bounds.minX + (col + rng()) * gridSize;
        const z = bounds.minZ + (row + rng()) * gridSize;
        
        if (!this.isValidPosition(x, z, constraints)) continue;
        
        this.createGrassPatch(x, z, rng);
      }
    }
  }
  
  /**
   * Generate additional foliage (ferns, etc.)
   */
  generateFoliage(bounds, gridSize, cols, rows, rng, occupiedPositions) {
    const density = this.vegetationDensity.foliage;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (rng() > density) continue;
        
        const x = bounds.minX + (col + rng()) * gridSize;
        const z = bounds.minZ + (row + rng()) * gridSize;
        
        // Ferns prefer shadier areas (near trees)
        if (!this.isNearVegetation(x, z, 10)) continue;
        
        const height = this.terrain.getHeightAt(x, z);
        const slope = this.terrain.getSlope(x, z);
        
        if (height < -5 || height > 20 || slope > 0.5) continue;
        
        this.createFern(x, z, rng);
      }
    }
  }
  
  /**
   * Create a tree at given position
   */
  createTree(x, z, rng) {
    const height = this.terrain.getHeightAt(x, z);
    
    // Create tree group
    const treeGroup = new THREE.Group();
    
    // Create trunk
    const trunkGeometry = this.geometries.get('treeTrunk');
    const trunkMaterial = this.materials.get('treeTrunk');
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    // Vary trunk height and thickness (very very big trees with tall trunks)
    const trunkHeight = 40 + rng() * 20; // 40-60 units tall (towering trees!)
    const trunkScale = 2.0 + rng() * 1.0; // 2.0x to 3.0x scale (enormous trunks)
    trunk.scale.set(trunkScale, trunkHeight / 20, trunkScale); // Updated height divisor for new geometry
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    
    treeGroup.add(trunk);
    
    // Create leaves
    const leafType = Math.floor(rng() * 3);
    const leavesGeometry = this.geometries.get(`treeLeaves${leafType}`);
    const leavesMaterial = this.materials.get(`treeLeaves${leafType}`);
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    
    // Position leaves at top of trunk
    leaves.position.y = trunkHeight * 0.8;
    leaves.scale.setScalar(1.5 + rng() * 1.0); // Very very big leaves
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    
    treeGroup.add(leaves);
    
    // Add vines hanging from the tree
    this.createVines(treeGroup, trunkHeight, rng);
    
    // Position tree on terrain (height is already the ground level)
    treeGroup.position.set(x, height, z);
    
    // Add slight random rotation
    treeGroup.rotation.y = rng() * Math.PI * 2;
    
    this.treeGroup.add(treeGroup);
    this.trees.push(treeGroup);
  }
  
  /**
   * Create vines hanging from a tree
   */
  createVines(treeGroup, trunkHeight, rng) {
    const vineGeometry = this.geometries.get('vine');
    const vineMaterial = this.materials.get('vine');
    
    // Create 6-12 vines per tree (more vines for big trees)
    const vineCount = 6 + Math.floor(rng() * 7);
    
    for (let i = 0; i < vineCount; i++) {
      // Create vine group for multiple segments
      const vineGroup = new THREE.Group();
      
      // Position vines around the tree trunk (adjusted for bigger trees)
      const angle = (i / vineCount) * Math.PI * 2 + rng() * 0.5;
      const radius = 2.0 + rng() * 1.5; // Distance from trunk center (bigger radius for big trees)
      const vineX = Math.cos(angle) * radius;
      const vineZ = Math.sin(angle) * radius;
      
      // Vine hanging height (from middle to lower trunk)
      const startHeight = trunkHeight * (0.4 + rng() * 0.3); // Start 40-70% up the trunk
      const vineLength = 8 + rng() * 12; // 8-20 units long (much longer vines)
      const segments = Math.floor(vineLength * 1.5); // More segments for longer vines
      
      // Create vine segments with slight curve
      for (let j = 0; j < segments; j++) {
        const vine = new THREE.Mesh(vineGeometry, vineMaterial);
        
        // Position segments with slight curve and randomness
        const segmentHeight = startHeight - (j * vineLength / segments);
        const curve = Math.sin(j * 0.3) * 0.2; // Slight swaying curve
        
        vine.position.set(
          vineX + curve + (rng() - 0.5) * 0.1,
          segmentHeight,
          vineZ + curve + (rng() - 0.5) * 0.1
        );
        
        // Scale vine segments (thicker and more visible)
        vine.scale.set(
          1.5 + rng() * 0.5, // Much thicker width
          vineLength / segments, // Height of each segment
          1.5 + rng() * 0.5 // Much thicker depth
        );
        
        // Add slight rotation for natural look
        vine.rotation.x = (rng() - 0.5) * 0.3;
        vine.rotation.z = (rng() - 0.5) * 0.3;
        
        vineGroup.add(vine);
      }
      
      treeGroup.add(vineGroup);
    }
  }
  
  /**
   * Create a bush at given position
   */
  createBush(x, z, rng) {
    const height = this.terrain.getHeightAt(x, z);
    
    const bushGeometry = this.geometries.get('bush');
    const bushMaterial = this.materials.get('bush');
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    
    // Vary bush size
    const scale = 0.5 + rng() * 0.8;
    bush.scale.setScalar(scale);
    bush.position.set(x, height + scale * 0.5, z); // Position bush so bottom touches ground
    bush.rotation.y = rng() * Math.PI * 2;
    
    bush.castShadow = true;
    bush.receiveShadow = true;
    
    this.bushGroup.add(bush);
    this.bushes.push(bush);
  }
  
  /**
   * Create grass patch at given position
   */
  createGrassPatch(x, z, rng) {
    const height = this.terrain.getHeightAt(x, z);
    
    // Create multiple grass blades in a small area
    const patchSize = 1.5;
    const numBlades = 3 + Math.floor(rng() * 5);
    
    for (let i = 0; i < numBlades; i++) {
      const grassGeometry = this.geometries.get('grass');
      const grassMaterial = this.materials.get('grass');
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      
      // Random position within patch
      const offsetX = (rng() - 0.5) * patchSize;
      const offsetZ = (rng() - 0.5) * patchSize;
      const grassHeight = this.terrain.getHeightAt(x + offsetX, z + offsetZ);
      
      grass.position.set(x + offsetX, grassHeight + 0.75, z + offsetZ); // Grass height is fine as is
      grass.rotation.y = rng() * Math.PI * 2;
      grass.rotation.x = (rng() - 0.5) * 0.3; // Slight tilt
      
      const scale = 0.7 + rng() * 0.6;
      grass.scale.setScalar(scale);
      
      this.grassGroup.add(grass);
      this.grass.push(grass);
    }
  }
  
  /**
   * Create fern at given position
   */
  createFern(x, z, rng) {
    const height = this.terrain.getHeightAt(x, z);
    
    const fernGeometry = this.geometries.get('fern');
    const fernMaterial = this.materials.get('fern');
    const fern = new THREE.Mesh(fernGeometry, fernMaterial);
    
    fern.position.set(x, height + 1, z);
    fern.rotation.y = rng() * Math.PI * 2;
    fern.rotation.x = (rng() - 0.5) * 0.2;
    
    const scale = 0.8 + rng() * 0.4;
    fern.scale.setScalar(scale);
    
    this.foliageGroup.add(fern);
    this.foliage.push(fern);
  }
  
  /**
   * Check if position is valid for vegetation based on constraints
   */
  isValidPosition(x, z, constraints) {
    const height = this.terrain.getHeightAt(x, z);
    const slope = this.terrain.getSlope(x, z);
    
    // Check basic terrain constraints
    const terrainValid = height >= constraints.minHeight &&
                        height <= constraints.maxHeight &&
                        slope >= constraints.minSlope &&
                        slope <= constraints.maxSlope;
    
    if (!terrainValid) return false;
    
    // Check if position is in water - exclude water areas from vegetation
    if (this.waterSystem && this.waterSystem.isInWater(x, z)) {
      return false;
    }
    
    // Add buffer around water bodies to prevent vegetation at water's edge
    if (this.waterSystem) {
      const waterBodies = this.waterSystem.getWaterBodies();
      for (const waterBody of waterBodies) {
        if (waterBody.type === 'lake' || waterBody.type === 'pond') {
          const distance = Math.sqrt(
            Math.pow(x - waterBody.center.x, 2) + Math.pow(z - waterBody.center.z, 2)
          );
          // Add 3-unit buffer around water bodies
          if (distance <= waterBody.radius + 3) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Check spacing between vegetation
   */
  checkSpacing(x, z, minSpacing, occupiedPositions) {
    const gridSize = 2; // Size of spacing grid
    const centerKey = `${Math.floor(x/gridSize)}_${Math.floor(z/gridSize)}`;
    
    // Check current and neighboring grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const checkKey = `${Math.floor(x/gridSize) + dx}_${Math.floor(z/gridSize) + dz}`;
        if (occupiedPositions.has(checkKey)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Check if position is near existing vegetation
   */
  isNearVegetation(x, z, radius) {
    // Simple check - in a real implementation you might use spatial indexing
    for (const tree of this.trees) {
      const dx = tree.position.x - x;
      const dz = tree.position.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < radius) return true;
    }
    return false;
  }
  
  /**
   * Create seeded random number generator
   */
  createSeededRandom(seed) {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }
  
  /**
   * Clear all vegetation
   */
  clearVegetation() {
    // Clear arrays
    this.trees.length = 0;
    this.bushes.length = 0;
    this.grass.length = 0;
    this.foliage.length = 0;
    
    // Clear groups
    this.treeGroup.clear();
    this.bushGroup.clear();
    this.grassGroup.clear();
    this.foliageGroup.clear();
  }
  
  /**
   * Update vegetation system (for wind effects, growth, etc.)
   */
  update(deltaTime) {
    // Simple wind effect for grass and leaves - could be expanded
    const time = Date.now() * 0.001;
    const windStrength = 0.1;
    
    // Animate grass
    this.grass.forEach((grass, index) => {
      const windOffset = Math.sin(time + index * 0.5) * windStrength;
      grass.rotation.z = windOffset;
    });
    
    // Animate foliage
    this.foliage.forEach((fern, index) => {
      const windOffset = Math.sin(time * 0.8 + index * 0.7) * windStrength * 0.5;
      fern.rotation.z = windOffset;
    });
  }
  
  /**
   * Get vegetation statistics
   */
  getStatistics() {
    return {
      trees: this.trees.length,
      bushes: this.bushes.length,
      grass: this.grass.length,
      foliage: this.foliage.length,
      total: this.trees.length + this.bushes.length + this.grass.length + this.foliage.length
    };
  }

  /**
   * Get all vegetation meshes for hiding/showing
   */
  getVegetationMeshes() {
    return [this.treeGroup, this.bushGroup, this.grassGroup, this.foliageGroup];
  }
  
  /**
   * Dispose of vegetation system
   */
  dispose() {
    this.clearVegetation();
    
    // Dispose materials
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
    
    // Dispose geometries
    this.geometries.forEach(geometry => geometry.dispose());
    this.geometries.clear();
    
    // Remove groups from scene
    this.scene.remove(this.treeGroup);
    this.scene.remove(this.bushGroup);
    this.scene.remove(this.grassGroup);
    this.scene.remove(this.foliageGroup);
  }
}
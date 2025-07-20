import * as THREE from 'three';

/**
 * TerrainRenderer - Handles rendering of procedural terrain with heightmaps
 */
export class TerrainRenderer {
  constructor(terrain) {
    this.terrain = terrain;
    this.mesh = null;
    this.geometry = null;
    this.material = null;
    
    this.createTerrainMesh();
  }
  
  /**
   * Create the terrain mesh from heightmap data
   */
  createTerrainMesh() {
    const segments = this.terrain.segments;
    const width = this.terrain.width;
    const height = this.terrain.height;
    
    // Create plane geometry
    this.geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    this.geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
    
    // Get vertices and apply heightmap
    const vertices = this.geometry.attributes.position.array;
    const heightmap = this.terrain.getHeightmapData();
    
    // Apply heights to vertices
    for (let i = 0; i < segments + 1; i++) {
      for (let j = 0; j < segments + 1; j++) {
        const index = (i * (segments + 1) + j) * 3;
        const terrainHeight = heightmap[i][j];
        vertices[index + 1] = terrainHeight; // Y coordinate (up/down)
      }
    }
    
    // Recalculate normals for proper lighting
    this.geometry.computeVertexNormals();
    
    // Create material with jungle-appropriate textures
    this.material = this.createTerrainMaterial();
    
    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    
    // Position mesh at world origin
    this.mesh.position.set(0, 0, 0);
  }
  
  /**
   * Create terrain material with jungle textures
   */
  createTerrainMaterial() {
    // For now, create a simple material that varies color based on height
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true
    });
    
    // Add vertex colors based on height and slope
    this.addVertexColors();
    
    return material;
  }
  
  /**
   * Add vertex colors based on terrain properties
   */
  addVertexColors() {
    const segments = this.terrain.segments;
    const colors = [];
    
    // Colors for different terrain types (brightened)
    const grassColor = new THREE.Color(0x6fa83a);
    const dirtColor = new THREE.Color(0xb8691a);
    const rockColor = new THREE.Color(0x909090);
    const sandColor = new THREE.Color(0xe6d4a0);
    
    for (let i = 0; i < segments + 1; i++) {
      for (let j = 0; j < segments + 1; j++) {
        // Convert grid coordinates to world coordinates
        const x = (j / segments - 0.5) * this.terrain.width;
        const z = (i / segments - 0.5) * this.terrain.height;
        
        // Get texture weights for this position
        const weights = this.terrain.getTextureWeights(x, z);
        
        // Blend colors based on weights
        const finalColor = new THREE.Color(0, 0, 0);
        
        // Manual color blending since addScaledVector might not be available
        const grassContrib = grassColor.clone().multiplyScalar(weights.grass);
        const dirtContrib = dirtColor.clone().multiplyScalar(weights.dirt);
        const rockContrib = rockColor.clone().multiplyScalar(weights.rock);
        const sandContrib = sandColor.clone().multiplyScalar(weights.sand);
        
        finalColor.add(grassContrib);
        finalColor.add(dirtContrib);
        finalColor.add(rockContrib);
        finalColor.add(sandContrib);
        
        colors.push(finalColor.r, finalColor.g, finalColor.b);
      }
    }
    
    // Set colors on geometry
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  
  /**
   * Update terrain mesh when heightmap changes
   */
  updateTerrain() {
    if (!this.geometry || !this.mesh) return;
    
    const segments = this.terrain.segments;
    const vertices = this.geometry.attributes.position.array;
    const heightmap = this.terrain.getHeightmapData();
    
    // Update heights
    for (let i = 0; i < segments + 1; i++) {
      for (let j = 0; j < segments + 1; j++) {
        const index = (i * (segments + 1) + j) * 3;
        const terrainHeight = heightmap[i][j];
        vertices[index + 1] = terrainHeight; // Y coordinate
      }
    }
    
    // Update vertex colors
    this.addVertexColors();
    
    // Mark geometry as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    
    // Recalculate normals
    this.geometry.computeVertexNormals();
  }
  
  /**
   * Get the terrain mesh for adding to scene
   */
  getMesh() {
    return this.mesh;
  }
  
  /**
   * Get raycast intersections for mouse picking, etc.
   */
  raycast(raycaster, intersects) {
    if (this.mesh) {
      raycaster.intersectObject(this.mesh, false, intersects);
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    
    this.mesh = null;
    this.terrain = null;
  }
}
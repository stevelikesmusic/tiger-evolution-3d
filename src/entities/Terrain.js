import { TerrainGenerator } from '../utils/TerrainGenerator.js';

/**
 * Terrain - Represents the game world terrain with heightmap-based generation
 */
export class Terrain {
  /**
   * Create a new terrain
   * @param {number} width - Terrain width in world units
   * @param {number} height - Terrain height in world units
   * @param {number} segments - Number of segments for terrain mesh
   */
  constructor(width = 512, height = 512, segments = 128) {
    this.width = width;
    this.height = height;
    this.segments = segments;
    
    // Initialize heightmap array
    this.heightmap = [];
    for (let i = 0; i <= segments; i++) {
      this.heightmap[i] = new Array(segments + 1).fill(0);
    }
    
    // Terrain properties
    this.maxHeight = 50;
    this.walkableSlope = 0.7; // Maximum slope for walking (0 = flat, 1 = vertical)
    
    // Texture weights cache for performance
    this.textureCache = new Map();
  }

  /**
   * Generate heightmap using Perlin noise
   * @param {number} seed - Random seed for reproducible generation
   */
  generateHeightmap(seed) {
    // Generate heightmap using TerrainGenerator
    const generatedHeightmap = TerrainGenerator.generateHeightmap(
      this.segments + 1,
      this.segments + 1,
      {
        seed: seed || Math.random() * 10000,
        amplitude: this.maxHeight,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2,
        erosion: true,
        erosionStrength: 0.2
      }
    );
    
    // Copy to our heightmap
    for (let i = 0; i <= this.segments; i++) {
      for (let j = 0; j <= this.segments; j++) {
        this.heightmap[i][j] = generatedHeightmap[i][j];
      }
    }
    
    // Clear texture cache when heightmap changes
    this.textureCache.clear();
  }

  /**
   * Get height at world position using bilinear interpolation
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {number} Height at the given position
   */
  getHeightAt(x, z) {
    // Convert world coordinates to heightmap coordinates
    const hx = (x + this.width / 2) / this.width * this.segments;
    const hz = (z + this.height / 2) / this.height * this.segments;
    
    // Check bounds
    if (hx < 0 || hx > this.segments || hz < 0 || hz > this.segments) {
      return 0;
    }
    
    // Get grid coordinates
    const x0 = Math.floor(hx);
    const z0 = Math.floor(hz);
    const x1 = Math.min(x0 + 1, this.segments);
    const z1 = Math.min(z0 + 1, this.segments);
    
    // Get fractional parts
    const fx = hx - x0;
    const fz = hz - z0;
    
    // Get heights at four corners
    const h00 = this.heightmap[z0][x0];
    const h10 = this.heightmap[z0][x1];
    const h01 = this.heightmap[z1][x0];
    const h11 = this.heightmap[z1][x1];
    
    // Bilinear interpolation
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;
    const height = h0 * (1 - fz) + h1 * fz;
    
    return height;
  }

  /**
   * Calculate slope at given world position
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {number} Slope value (0 = flat, 1 = vertical)
   */
  getSlope(x, z) {
    // Convert world coordinates to heightmap coordinates
    const hx = (x + this.width / 2) / this.width * this.segments;
    const hz = (z + this.height / 2) / this.height * this.segments;
    
    // Check bounds - ensure we can access neighboring cells
    if (hx < 1 || hx > this.segments - 1 || hz < 1 || hz > this.segments - 1) {
      return 0;
    }
    
    // Get grid coordinates
    const x0 = Math.floor(hx);
    const z0 = Math.floor(hz);
    
    // Ensure we don't go out of bounds when accessing neighbors
    if (x0 - 1 < 0 || x0 + 1 > this.segments || z0 - 1 < 0 || z0 + 1 > this.segments) {
      return 0;
    }
    
    // Calculate slope using neighboring heightmap values directly
    const h1 = this.heightmap[z0][x0 - 1];
    const h2 = this.heightmap[z0][x0 + 1];
    const h3 = this.heightmap[z0 - 1][x0];
    const h4 = this.heightmap[z0 + 1][x0];
    
    const segmentSize = this.width / this.segments;
    const dx = (h2 - h1) / (2 * segmentSize);
    const dz = (h4 - h3) / (2 * segmentSize);
    
    const slope = Math.sqrt(dx * dx + dz * dz);
    return Math.min(slope, 1.0);
  }

  /**
   * Get texture weights for blending based on height and slope
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {Object} Texture weights {grass, dirt, rock, sand}
   */
  getTextureWeights(x, z) {
    // Check cache first
    const cacheKey = `${Math.floor(x)}_${Math.floor(z)}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey);
    }
    
    const height = this.getHeightAt(x, z);
    const slope = this.getSlope(x, z);
    
    // Normalize height to [0, 1]
    const normalizedHeight = Math.max(0, Math.min(1, (height + this.maxHeight) / (2 * this.maxHeight)));
    
    // Initialize weights
    let grass = 0;
    let dirt = 0;
    let rock = 0;
    let sand = 0;
    
    // Rock: high areas or steep slopes (check this first for priority)
    if (slope > 0.4 || normalizedHeight > 0.7) {
      rock = Math.max(slope * 1.5, normalizedHeight > 0.7 ? (normalizedHeight - 0.7) * 3 : 0);
      rock = Math.max(rock, 0.5); // Ensure minimum rock weight for steep/high areas
    }
    
    // Grass: prefer low areas with gentle slopes
    if (normalizedHeight < 0.5 && slope < 0.3) {
      grass = Math.max(0, 1.2 - slope * 2);
    } else if (normalizedHeight < 0.7 && slope < 0.2) {
      grass = Math.max(0, 0.8 - slope);
    }
    
    // Dirt: medium heights and slopes
    if (normalizedHeight > 0.2 && normalizedHeight < 0.8 && slope < 0.5) {
      dirt = Math.max(0, 0.7 - Math.abs(normalizedHeight - 0.5) - slope * 0.5);
    }
    
    // Sand: very low areas near water level
    if (normalizedHeight < 0.2 && slope < 0.1) {
      sand = Math.max(0, 0.3 - normalizedHeight);
    }
    
    // Normalize weights
    const total = Math.max(grass + dirt + rock + sand, 0.001);
    const weights = {
      grass: Math.max(grass / total, 0),
      dirt: Math.max(dirt / total, 0),
      rock: Math.max(rock / total, 0),
      sand: Math.max(sand / total, 0)
    };
    
    // Ensure weights sum to 1
    const sum = weights.grass + weights.dirt + weights.rock + weights.sand;
    if (sum < 0.99) {
      // If no texture dominates, default to grass
      weights.grass += 1 - sum;
    }
    
    // Cache the result
    this.textureCache.set(cacheKey, weights);
    
    return weights;
  }

  /**
   * Calculate surface normal at given position
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {Object} Normal vector {x, y, z}
   */
  getNormal(x, z) {
    const delta = 1.0;
    
    const hL = this.getHeightAt(x - delta, z);
    const hR = this.getHeightAt(x + delta, z);
    const hD = this.getHeightAt(x, z - delta);
    const hU = this.getHeightAt(x, z + delta);
    
    // Calculate normal using cross product
    const nx = (hL - hR) / (2 * delta);
    const nz = (hD - hU) / (2 * delta);
    const ny = 1.0;
    
    // Normalize
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    
    return {
      x: nx / length,
      y: ny / length,
      z: nz / length
    };
  }

  /**
   * Check if position is walkable for the tiger
   * @param {number} x - World X coordinate
   * @param {number} z - World Z coordinate
   * @returns {boolean} True if walkable
   */
  isWalkable(x, z) {
    const slope = this.getSlope(x, z);
    return slope <= this.walkableSlope;
  }

  /**
   * Get terrain bounds
   * @returns {Object} Bounds {minX, maxX, minZ, maxZ}
   */
  getBounds() {
    return {
      minX: -this.width / 2,
      maxX: this.width / 2,
      minZ: -this.height / 2,
      maxZ: this.height / 2
    };
  }

  /**
   * Get heightmap data for debugging or external use
   * @returns {Array<Array<number>>} 2D heightmap array
   */
  getHeightmapData() {
    return this.heightmap;
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.textureCache.clear();
  }

  /**
   * Get terrain statistics for debugging
   * @returns {Object} Statistics {minHeight, maxHeight, averageHeight}
   */
  getStatistics() {
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let totalHeight = 0;
    let count = 0;
    
    for (let i = 0; i <= this.segments; i++) {
      for (let j = 0; j <= this.segments; j++) {
        const height = this.heightmap[i][j];
        minHeight = Math.min(minHeight, height);
        maxHeight = Math.max(maxHeight, height);
        totalHeight += height;
        count++;
      }
    }
    
    return {
      minHeight,
      maxHeight,
      averageHeight: totalHeight / count
    };
  }
}
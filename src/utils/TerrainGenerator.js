/**
 * TerrainGenerator - Utility class for generating realistic terrain using Perlin noise
 */
export class TerrainGenerator {
  /**
   * Generate 2D Perlin noise
   * @param {number} width - Width of the noise array
   * @param {number} height - Height of the noise array
   * @param {Object} options - Generation options
   * @param {number} options.seed - Random seed for reproducible generation
   * @param {number} options.scale - Scale factor for noise frequency
   * @returns {Array<Array<number>>} 2D array of noise values [-1, 1]
   */
  static generatePerlinNoise(width, height, options = {}) {
    const {
      seed = Math.random() * 1000,
      scale = 0.1
    } = options;

    // Simple seedable random number generator
    let seedValue = seed;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };

    // Generate gradient vectors
    const gradients = [];
    for (let i = 0; i < 256; i++) {
      const angle = random() * 2 * Math.PI;
      gradients[i] = {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
    }

    // Permutation table
    const permutation = [];
    for (let i = 0; i < 256; i++) {
      permutation[i] = i;
    }
    
    // Shuffle permutation table
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }

    // Double the permutation table
    for (let i = 0; i < 256; i++) {
      permutation[256 + i] = permutation[i];
    }

    // Fade function for smooth interpolation
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

    // Linear interpolation
    const lerp = (a, b, t) => a + t * (b - a);

    // Dot product of gradient and distance vectors
    const dotGridGradient = (ix, iy, x, y) => {
      const gradient = gradients[permutation[permutation[ix & 255] + (iy & 255)] & 255];
      const dx = x - ix;
      const dy = y - iy;
      return dx * gradient.x + dy * gradient.y;
    };

    // Generate noise
    const noise = [];
    for (let i = 0; i < height; i++) {
      noise[i] = [];
      for (let j = 0; j < width; j++) {
        const x = j * scale;
        const y = i * scale;

        // Grid cell coordinates
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;

        // Interpolation weights
        const sx = fade(x - x0);
        const sy = fade(y - y0);

        // Dot products at grid corners
        const n00 = dotGridGradient(x0, y0, x, y);
        const n01 = dotGridGradient(x0, y1, x, y);
        const n10 = dotGridGradient(x1, y0, x, y);
        const n11 = dotGridGradient(x1, y1, x, y);

        // Interpolate
        const nx0 = lerp(n00, n10, sx);
        const nx1 = lerp(n01, n11, sx);
        const value = lerp(nx0, nx1, sy);

        noise[i][j] = value;
      }
    }

    return noise;
  }

  /**
   * Generate heightmap using multiple octaves of Perlin noise
   * @param {number} width - Width of the heightmap
   * @param {number} height - Height of the heightmap
   * @param {Object} options - Generation options
   * @param {number} options.seed - Random seed
   * @param {number} options.amplitude - Maximum height variation
   * @param {number} options.octaves - Number of noise octaves
   * @param {number} options.persistence - Amplitude reduction per octave
   * @param {number} options.lacunarity - Frequency increase per octave
   * @param {boolean} options.erosion - Apply erosion effect
   * @param {number} options.erosionStrength - Strength of erosion effect
   * @returns {Array<Array<number>>} 2D heightmap array
   */
  static generateHeightmap(width, height, options = {}) {
    const {
      seed = Math.random() * 1000,
      amplitude = 50,
      octaves = 4,
      persistence = 0.5,
      lacunarity = 2,
      erosion = false,
      erosionStrength = 0.3
    } = options;

    // Initialize heightmap
    const heightmap = [];
    for (let i = 0; i < height; i++) {
      heightmap[i] = new Array(width).fill(0);
    }

    // Generate multiple octaves
    let currentAmplitude = amplitude;
    let currentScale = 0.01;

    for (let octave = 0; octave < octaves; octave++) {
      const noise = this.generatePerlinNoise(width, height, {
        seed: seed + octave * 1000,
        scale: currentScale
      });

      // Add this octave to heightmap
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          heightmap[i][j] += noise[i][j] * currentAmplitude;
        }
      }

      currentAmplitude *= persistence;
      currentScale *= lacunarity;
    }

    // Apply erosion if enabled
    if (erosion) {
      this.applyErosion(heightmap, 10, erosionStrength);
    }

    // Smooth the heightmap slightly
    this.smoothHeightmap(heightmap, 1);

    return heightmap;
  }

  /**
   * Apply hydraulic erosion simulation to heightmap
   * @param {Array<Array<number>>} heightmap - Heightmap to modify
   * @param {number} iterations - Number of erosion iterations
   * @param {number} strength - Erosion strength
   */
  static applyErosion(heightmap, iterations, strength) {
    const height = heightmap.length;
    const width = heightmap[0].length;

    for (let iter = 0; iter < iterations; iter++) {
      // Simple erosion: reduce height based on slope
      const newHeightmap = [];
      for (let i = 0; i < height; i++) {
        newHeightmap[i] = [...heightmap[i]];
      }

      for (let i = 1; i < height - 1; i++) {
        for (let j = 1; j < width - 1; j++) {
          const currentHeight = heightmap[i][j];
          
          // Calculate average height of neighbors
          const neighborSum = heightmap[i-1][j-1] + heightmap[i-1][j] + heightmap[i-1][j+1] +
                            heightmap[i][j-1] + heightmap[i][j+1] +
                            heightmap[i+1][j-1] + heightmap[i+1][j] + heightmap[i+1][j+1];
          
          const averageNeighbor = neighborSum / 8;
          
          // If current height is higher than average, erode it
          if (currentHeight > averageNeighbor) {
            const erosionAmount = (currentHeight - averageNeighbor) * strength * 0.1;
            newHeightmap[i][j] = currentHeight - erosionAmount;
          }
        }
      }

      // Copy back to original heightmap
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          heightmap[i][j] = newHeightmap[i][j];
        }
      }
    }
  }

  /**
   * Apply smoothing to heightmap to reduce sharp edges
   * @param {Array<Array<number>>} heightmap - Heightmap to smooth
   * @param {number} iterations - Number of smoothing iterations
   */
  static smoothHeightmap(heightmap, iterations) {
    const height = heightmap.length;
    const width = heightmap[0].length;

    for (let iter = 0; iter < iterations; iter++) {
      const newHeightmap = [];
      for (let i = 0; i < height; i++) {
        newHeightmap[i] = [...heightmap[i]];
      }

      for (let i = 1; i < height - 1; i++) {
        for (let j = 1; j < width - 1; j++) {
          // Average with neighbors
          const sum = heightmap[i-1][j-1] + heightmap[i-1][j] + heightmap[i-1][j+1] +
                     heightmap[i][j-1] + heightmap[i][j] + heightmap[i][j+1] +
                     heightmap[i+1][j-1] + heightmap[i+1][j] + heightmap[i+1][j+1];
          
          newHeightmap[i][j] = sum / 9;
        }
      }

      // Copy back to original heightmap
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          heightmap[i][j] = newHeightmap[i][j];
        }
      }
    }
  }
}
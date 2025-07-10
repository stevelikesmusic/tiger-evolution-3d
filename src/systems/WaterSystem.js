import * as THREE from 'three';

/**
 * WaterSystem - Handles water generation and rendering for rivers, ponds, and lakes
 */
export class WaterSystem {
  constructor(terrain) {
    this.terrain = terrain;
    this.waterBodies = [];
    this.waterLevel = 2; // Base water level
    this.waterMeshes = [];
    this.riverGeometry = null;
    this.pondGeometry = null;
    this.waterMaterial = null;
    
    this.createWaterMaterial();
    this.generateWaterBodies();
  }

  /**
   * Create animated water material with waves and transparency
   */
  createWaterMaterial() {
    // Create animated water shader material
    const waterVertexShader = `
      uniform float time;
      uniform float waveHeight;
      uniform float waveSpeed;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normal;
        
        // Add subtle wave animation
        vec3 newPosition = position;
        newPosition.y += sin(position.x * 0.3 + time * waveSpeed) * waveHeight;
        newPosition.y += sin(position.z * 0.2 + time * waveSpeed * 0.7) * waveHeight * 0.6;
        newPosition.y += sin((position.x + position.z) * 0.4 + time * waveSpeed * 1.2) * waveHeight * 0.3;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;
    
    const waterFragmentShader = `
      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 deepWaterColor;
      uniform float transparency;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        // Create subtle ripple effect
        float ripple1 = sin(vPosition.x * 0.5 + time * 1.2) * 0.5 + 0.5;
        float ripple2 = sin(vPosition.z * 0.4 + time * 0.8) * 0.5 + 0.5;
        float ripple3 = sin((vPosition.x + vPosition.z) * 0.3 + time * 1.5) * 0.5 + 0.5;
        
        float combinedRipple = (ripple1 + ripple2 + ripple3) / 3.0;
        
        // Mix shallow and deep water colors
        vec3 color = mix(deepWaterColor, waterColor, combinedRipple * 0.3 + 0.7);
        
        // Add slight brightness variation
        color *= (0.85 + combinedRipple * 0.15);
        
        gl_FragColor = vec4(color, transparency);
      }
    `;
    
    this.waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        time: { value: 0 },
        waveHeight: { value: 0.05 }, // Much subtler waves
        waveSpeed: { value: 0.8 },
        waterColor: { value: new THREE.Color(0x4A90E2) }, // Lighter blue
        deepWaterColor: { value: new THREE.Color(0x2E5C8A) }, // Darker blue
        transparency: { value: 0.8 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false // Important for transparency
    });
  }

  /**
   * Generate water bodies based on terrain height
   */
  generateWaterBodies() {
    const terrain = this.terrain;
    const segments = terrain.segments;
    const width = terrain.width;
    const height = terrain.height;
    
    // Create large, smooth water bodies
    this.generateLargeWaterBodies();
    
    // Create small ponds scattered around
    this.generateScatteredPonds();
  }

  /**
   * Generate large, connected water bodies
   */
  generateLargeWaterBodies() {
    // Create a large lake in the center-low area
    const lakeCenter = { x: -50, z: 20 };
    const lakeRadius = 35;
    const lakeGeometry = new THREE.CircleGeometry(lakeRadius, 32);
    const lakeMesh = new THREE.Mesh(lakeGeometry, this.waterMaterial);
    
    // Position at water level
    const lakeHeight = this.waterLevel - 1; // Slightly below water level for depth
    lakeMesh.position.set(lakeCenter.x, lakeHeight, lakeCenter.z);
    lakeMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    
    this.waterMeshes.push(lakeMesh);
    this.waterBodies.push({
      type: 'lake',
      center: lakeCenter,
      radius: lakeRadius,
      mesh: lakeMesh
    });
    
    // Create a winding river
    this.generateWindingRiver();
  }

  /**
   * Generate a winding river through the terrain
   */
  generateWindingRiver() {
    const riverPath = [
      { x: 80, z: -100, width: 8 },
      { x: 60, z: -60, width: 10 },
      { x: 20, z: -20, width: 12 },
      { x: -20, z: 20, width: 14 },
      { x: -60, z: 60, width: 12 },
      { x: -80, z: 100, width: 10 }
    ];
    
    // Create river segments
    for (let i = 0; i < riverPath.length - 1; i++) {
      const start = riverPath[i];
      const end = riverPath[i + 1];
      
      // Calculate distance and create elongated geometry
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
      );
      
      const avgWidth = (start.width + end.width) / 2;
      
      // Create ellipse geometry for river segment
      const riverGeometry = new THREE.PlaneGeometry(distance, avgWidth, 16, 8);
      const riverMesh = new THREE.Mesh(riverGeometry, this.waterMaterial);
      
      // Position and rotate to connect points
      const centerX = (start.x + end.x) / 2;
      const centerZ = (start.z + end.z) / 2;
      const angle = Math.atan2(end.z - start.z, end.x - start.x);
      
      riverMesh.position.set(centerX, this.waterLevel - 0.8, centerZ);
      riverMesh.rotation.x = -Math.PI / 2;
      riverMesh.rotation.z = angle;
      
      this.waterMeshes.push(riverMesh);
    }
    
    this.waterBodies.push({
      type: 'river',
      path: riverPath
    });
  }

  /**
   * Generate scattered small ponds around the terrain
   */
  generateScatteredPonds() {
    const pondLocations = [
      { x: 100, z: 80, radius: 12 },
      { x: -120, z: -90, radius: 8 },
      { x: 70, z: -120, radius: 10 },
      { x: -80, z: 120, radius: 15 },
      { x: 150, z: -50, radius: 6 },
      { x: -150, z: 30, radius: 9 }
    ];
    
    pondLocations.forEach(pond => {
      const pondGeometry = new THREE.CircleGeometry(pond.radius, 24);
      const pondMesh = new THREE.Mesh(pondGeometry, this.waterMaterial);
      
      // Position slightly below terrain for depth effect
      const terrainHeight = this.terrain.getHeightAt(pond.x, pond.z);
      const pondHeight = Math.min(terrainHeight - 1.5, this.waterLevel - 1);
      
      pondMesh.position.set(pond.x, pondHeight, pond.z);
      pondMesh.rotation.x = -Math.PI / 2;
      
      this.waterMeshes.push(pondMesh);
      this.waterBodies.push({
        type: 'pond',
        center: { x: pond.x, z: pond.z },
        radius: pond.radius,
        mesh: pondMesh
      });
    });
  }

  /**
   * Update water animation
   */
  update(deltaTime) {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.time.value += deltaTime;
    }
  }

  /**
   * Check if position is in water
   */
  isInWater(x, z) {
    // Check each water body
    for (const waterBody of this.waterBodies) {
      if (waterBody.type === 'lake' || waterBody.type === 'pond') {
        const distance = Math.sqrt(
          Math.pow(x - waterBody.center.x, 2) + Math.pow(z - waterBody.center.z, 2)
        );
        if (distance <= waterBody.radius) {
          return true;
        }
      } else if (waterBody.type === 'river' && waterBody.path) {
        // Check if position is near river path
        for (let i = 0; i < waterBody.path.length - 1; i++) {
          const start = waterBody.path[i];
          const end = waterBody.path[i + 1];
          const riverWidth = (start.width + end.width) / 2;
          
          // Distance from point to line segment
          const distanceToRiver = this.distanceToLineSegment(
            { x, z }, 
            { x: start.x, z: start.z }, 
            { x: end.x, z: end.z }
          );
          
          if (distanceToRiver <= riverWidth / 2) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Get water depth at position
   */
  getWaterDepth(x, z) {
    if (!this.isInWater(x, z)) {
      return 0;
    }
    
    // Default depth for water bodies
    return 2.5;
  }

  /**
   * Calculate distance from point to line segment
   */
  distanceToLineSegment(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.z - lineStart.z;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.z - lineStart.z;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, zz;

    if (param < 0) {
      xx = lineStart.x;
      zz = lineStart.z;
    } else if (param > 1) {
      xx = lineEnd.x;
      zz = lineEnd.z;
    } else {
      xx = lineStart.x + param * C;
      zz = lineStart.z + param * D;
    }

    const dx = point.x - xx;
    const dz = point.z - zz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Get all water meshes for adding to scene
   */
  getWaterMeshes() {
    return this.waterMeshes;
  }

  /**
   * Get water bodies data
   */
  getWaterBodies() {
    return this.waterBodies;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.waterMaterial) {
      this.waterMaterial.dispose();
    }
    
    this.waterMeshes.forEach(mesh => {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material && mesh.material !== this.waterMaterial) {
        mesh.material.dispose();
      }
    });
    
    this.waterMeshes = [];
    this.waterBodies = [];
  }
}
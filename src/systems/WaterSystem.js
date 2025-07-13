import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

/**
 * WaterSystem - Handles water generation and rendering for rivers, ponds, and lakes
 */
export class WaterSystem {
  constructor(terrain) {
    this.terrain = terrain;
    this.waterBodies = [];
    this.waterLevel = 2; // Base water level
    this.waterMeshes = [];
    this.lilyPads = []; // Store lily pad meshes
    this.riverGeometry = null;
    this.pondGeometry = null;
    this.waterMaterial = null;
    this.waterNormalsTexture = null;
    this.useAdvancedWater = true; // Use Water class for all water bodies
    this.maxAdvancedWaterBodies = 10; // Allow multiple Water class instances
    this.advancedWaterCount = 0;
    
    this.createWaterNormalsTexture();
    this.createWaterMaterial();
    this.generateWaterBodies();
  }

  /**
   * Create procedural water normals texture
   */
  createWaterNormalsTexture() {
    const width = 128; // Dramatically reduced for performance
    const height = 128;
    const size = width * height;
    const data = new Uint8Array(3 * size);
    
    // Generate subtle normal variation for realistic water surface
    for (let i = 0; i < size; i++) {
      const stride = i * 3;
      const x = (i % width) / width;
      const y = Math.floor(i / width) / height;
      
      // Create subtle wave patterns
      const wave1 = Math.sin(x * Math.PI * 8) * Math.cos(y * Math.PI * 6);
      const wave2 = Math.sin(x * Math.PI * 12 + y * Math.PI * 8) * 0.5;
      const wave3 = Math.cos(x * Math.PI * 16) * Math.sin(y * Math.PI * 10) * 0.3;
      
      const intensity = (wave1 + wave2 + wave3) * 0.1 + 0.5;
      
      // Generate normal map values (centered around 0.5, 0.5, 1.0)
      data[stride] = Math.floor((intensity * 0.2 + 0.4) * 255);     // R (X normal)
      data[stride + 1] = Math.floor((intensity * 0.2 + 0.4) * 255); // G (Y normal)  
      data[stride + 2] = Math.floor((intensity * 0.1 + 0.9) * 255); // B (Z normal)
    }
    
    this.waterNormalsTexture = new THREE.DataTexture(data, width, height, THREE.RGBFormat);
    this.waterNormalsTexture.wrapS = this.waterNormalsTexture.wrapT = THREE.RepeatWrapping;
    this.waterNormalsTexture.needsUpdate = true;
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
    
    // Add lily pads to water bodies
    this.generateLilyPads();
  }

  /**
   * Generate large, connected water bodies
   */
  generateLargeWaterBodies() {
    // Create a large lake in the center-low area
    const lakeCenter = { x: -50, z: 20 };
    const lakeRadius = 35;
    
    let lakeMesh;
    
    if (this.useAdvancedWater && this.advancedWaterCount < this.maxAdvancedWaterBodies) {
      // Use Three.js Water class ONLY for main lake (performance critical)
      // Use CircleGeometry to match collision detection expectations
      const lakeGeometry = new THREE.CircleGeometry(lakeRadius, 32);
      
      const water = new Water(lakeGeometry, {
        textureWidth: 128, // Dramatically reduced render target size
        textureHeight: 128,
        waterNormals: this.waterNormalsTexture,
        sunDirection: new THREE.Vector3(0.70710678, 0.70710678, 0),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 1.2, // Reduced distortion for performance
        fog: false
      });
      
      lakeMesh = water;
      this.advancedWaterCount++;
    } else {
      // Fallback to custom shader for performance
      const lakeGeometry = new THREE.CircleGeometry(lakeRadius, 32);
      lakeMesh = new THREE.Mesh(lakeGeometry, this.waterMaterial);
    }
    
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
    
    // Lake created successfully
    
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
      { x: 30, z: -40, width: 12 },   // Keep river on northeast side
      { x: 0, z: -30, width: 14 },    // Curve northeast of lake
      { x: -30, z: -20, width: 12 },  // Continue northeast curve  
      { x: -100, z: 80, width: 10 }   // Far northwest endpoint
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
      
      // Use Water class for rivers too
      let riverMesh;
      
      if (this.useAdvancedWater && this.advancedWaterCount < this.maxAdvancedWaterBodies) {
        const water = new Water(riverGeometry, {
          textureWidth: 128,
          textureHeight: 128,
          waterNormals: this.waterNormalsTexture,
          sunDirection: new THREE.Vector3(0.70710678, 0.70710678, 0),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 0.8, // Lower distortion for rivers
          fog: false
        });
        
        riverMesh = water;
        this.advancedWaterCount++;
      } else {
        // Fallback to custom shader if we hit the limit
        riverMesh = new THREE.Mesh(riverGeometry, this.waterMaterial);
      }
      
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
   * Generate scattered ponds and mushrooms around the terrain
   */
  generateScatteredPonds() {
    const locations = [
      { x: 100, z: 80, radius: 12, type: 'pond' },     // Large = pond
      { x: -120, z: -90, radius: 8, type: 'mushroom' }, // Small = mushroom
      { x: 70, z: -120, radius: 10, type: 'pond' },     // Medium = pond
      { x: -80, z: 120, radius: 15, type: 'pond' },     // Large = pond
      { x: 150, z: -50, radius: 6, type: 'mushroom' },  // Small = mushroom
      { x: -150, z: 30, radius: 9, type: 'mushroom' }   // Small = mushroom
    ];
    
    locations.forEach(location => {
      if (location.type === 'mushroom') {
        this.createMushroom(location.x, location.z, location.radius);
      } else {
        this.createPond(location.x, location.z, location.radius);
      }
    });
  }
  
  /**
   * Create a pond at the specified location
   */
  createPond(x, z, radius) {
    const pondGeometry = new THREE.CircleGeometry(radius, 24);
    
    // Use Water class for ponds
    let pondMesh;
    
    if (this.useAdvancedWater && this.advancedWaterCount < this.maxAdvancedWaterBodies) {
      const water = new Water(pondGeometry, {
        textureWidth: 128,
        textureHeight: 128,
        waterNormals: this.waterNormalsTexture,
        sunDirection: new THREE.Vector3(0.70710678, 0.70710678, 0),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 1.0, // Moderate distortion for ponds
        fog: false
      });
      
      pondMesh = water;
      this.advancedWaterCount++;
    } else {
      // Fallback to custom shader if we hit the limit
      pondMesh = new THREE.Mesh(pondGeometry, this.waterMaterial);
    }
    
    // Position slightly below terrain for depth effect
    const terrainHeight = this.terrain.getHeightAt(x, z);
    const pondHeight = Math.min(terrainHeight - 1.5, this.waterLevel - 1);
    
    pondMesh.position.set(x, pondHeight, z);
    pondMesh.rotation.x = -Math.PI / 2;
    
    this.waterMeshes.push(pondMesh);
    this.waterBodies.push({
      type: 'pond',
      center: { x, z },
      radius: radius,
      mesh: pondMesh
    });
  }
  
  /**
   * Create a mushroom at the specified location
   */
  createMushroom(x, z, size) {
    const terrainHeight = this.terrain.getHeightAt(x, z);
    
    // Create mushroom group
    const mushroomGroup = new THREE.Group();
    
    // Mushroom stem
    const stemHeight = size * 0.8;
    const stemRadius = size * 0.15;
    const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius * 1.2, stemHeight, 8);
    const stemMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xf0e6d2 // Cream/beige stem color
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;
    
    // Mushroom cap
    const capRadius = size * 0.4;
    const capHeight = size * 0.3;
    const capGeometry = new THREE.SphereGeometry(capRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const capMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xd2691e // Brown/orange cap color
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = stemHeight + capHeight * 0.3;
    cap.castShadow = true;
    cap.receiveShadow = true;
    
    // Add spots to mushroom cap
    const spotsGroup = new THREE.Group();
    const numSpots = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numSpots; i++) {
      const spotGeometry = new THREE.SphereGeometry(capRadius * 0.15, 8, 6);
      const spotMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff // White spots
      });
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      
      // Random position on cap
      const angle = (Math.PI * 2 * i) / numSpots + Math.random() * 0.5;
      const distance = capRadius * (0.3 + Math.random() * 0.4);
      spot.position.x = Math.cos(angle) * distance;
      spot.position.z = Math.sin(angle) * distance;
      spot.position.y = stemHeight + capHeight * 0.5;
      
      spotsGroup.add(spot);
    }
    
    mushroomGroup.add(stem);
    mushroomGroup.add(cap);
    mushroomGroup.add(spotsGroup);
    
    // Position mushroom on terrain
    mushroomGroup.position.set(x, terrainHeight, z);
    
    // Add slight random rotation
    mushroomGroup.rotation.y = Math.random() * Math.PI * 2;
    
    // Add to scene through water system for now (could be moved to vegetation system later)
    this.waterMeshes.push(mushroomGroup);
  }
  
  /**
   * Create lily pads on a water body
   */
  createLilyPads(waterBody) {
    if (waterBody.type !== 'lake' && waterBody.type !== 'pond') {
      return; // Only add lily pads to lakes and ponds, not rivers
    }
    
    const numPads = Math.floor(waterBody.radius * 0.3); // Density based on water body size
    const waterSurfaceHeight = this.waterLevel - 0.8; // Slightly above water surface
    
    for (let i = 0; i < numPads; i++) {
      // Random position within water body
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * waterBody.radius * 0.8; // Keep away from edges
      
      const x = waterBody.center.x + Math.cos(angle) * distance;
      const z = waterBody.center.z + Math.sin(angle) * distance;
      
      // Check if position is actually in water
      if (this.isInWater(x, z)) {
        this.createSingleLilyPad(x, z, waterSurfaceHeight);
      }
    }
  }
  
  /**
   * Create a single lily pad at the specified position
   */
  createSingleLilyPad(x, z, height) {
    // Create lily pad group
    const lilyPadGroup = new THREE.Group();
    
    // Lily pad geometry - circular with a notch
    const padRadius = 1.2 + Math.random() * 0.8; // Varied size
    const padGeometry = new THREE.CircleGeometry(padRadius, 16);
    
    // Create notch by removing vertices (simple approach)
    const positions = padGeometry.attributes.position.array;
    const notchAngle = Math.random() * Math.PI * 2; // Random notch direction
    
    // Lily pad material
    const padMaterial = new THREE.MeshLambertMaterial({
      color: 0x228B22, // Forest green
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    
    const lilyPad = new THREE.Mesh(padGeometry, padMaterial);
    lilyPad.rotation.x = -Math.PI / 2; // Lay flat on water
    lilyPad.rotation.z = Math.random() * Math.PI * 2; // Random rotation
    lilyPad.position.y = 0.05; // Slightly above water surface
    
    // Add some gentle animation (floating effect)
    lilyPad.userData = {
      originalY: lilyPad.position.y,
      animationPhase: Math.random() * Math.PI * 2,
      isLilyPad: true // Mark for collision detection
    };
    
    lilyPad.castShadow = false; // Lily pads don't need to cast shadows
    lilyPad.receiveShadow = true;
    
    lilyPadGroup.add(lilyPad);
    
    // Occasionally add a small white flower
    if (Math.random() < 0.3) {
      const flowerGeometry = new THREE.SphereGeometry(0.15, 8, 6);
      const flowerMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff // White flower
      });
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(
        (Math.random() - 0.5) * padRadius * 0.5,
        0.1,
        (Math.random() - 0.5) * padRadius * 0.5
      );
      flower.scale.setScalar(0.8 + Math.random() * 0.4);
      lilyPadGroup.add(flower);
    }
    
    // Position lily pad group
    lilyPadGroup.position.set(x, height, z);
    
    this.lilyPads.push(lilyPadGroup);
    this.waterMeshes.push(lilyPadGroup); // Add to water meshes for scene addition
  }
  
  /**
   * Generate lily pads for all water bodies
   */
  generateLilyPads() {
    this.waterBodies.forEach(waterBody => {
      this.createLilyPads(waterBody);
    });
  }

  /**
   * Update water animation with performance optimization
   */
  update(deltaTime, camera) {
    // Update custom shader material
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.time.value += deltaTime;
    }
    
    // Update Water class instances (only the main lake now)
    this.waterMeshes.forEach((mesh, index) => {
      if (mesh.material && mesh.material.uniforms && mesh.material.uniforms.time) {
        mesh.material.uniforms.time.value += deltaTime * 0.5;
        
        // Distance-based culling for Water class
        if (camera && this.waterBodies[index]) {
          const distance = camera.position.distanceTo(mesh.position);
          
          // Disable expensive Water class at distance
          if (distance > 150) {
            mesh.visible = false;
          } else {
            mesh.visible = true;
            
            // Update eye position for reflections when close
            if (mesh.material.uniforms.eye && distance < 100) {
              mesh.material.uniforms.eye.value.copy(camera.position);
            }
          }
        }
      }
    });
    
    // Animate lily pads (gentle floating effect)
    this.lilyPads.forEach(lilyPadGroup => {
      const lilyPad = lilyPadGroup.children[0]; // First child is the pad mesh
      if (lilyPad && lilyPad.userData.isLilyPad) {
        lilyPad.userData.animationPhase += deltaTime * 0.5; // Slow gentle animation
        const floatOffset = Math.sin(lilyPad.userData.animationPhase) * 0.03; // Subtle 3cm float
        lilyPad.position.y = lilyPad.userData.originalY + floatOffset;
      }
    });
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
   * Get water depth at position with realistic depth gradients
   */
  getWaterDepth(x, z) {
    if (!this.isInWater(x, z)) {
      return 0;
    }
    
    // Calculate depth based on distance from shore for each water body
    for (const waterBody of this.waterBodies) {
      if (waterBody.type === 'lake' || waterBody.type === 'pond') {
        const distance = Math.sqrt(
          Math.pow(x - waterBody.center.x, 2) + Math.pow(z - waterBody.center.z, 2)
        );
        
        if (distance <= waterBody.radius) {
          // Calculate depth based on distance from shore
          // Shallow at edges (0.5 units), deeper in center (2.5 units)
          const distanceFromShore = waterBody.radius - distance;
          const maxDepth = waterBody.type === 'lake' ? 2.5 : 2.0;
          const shoreDepth = 0.5;
          
          // Linear interpolation from shore to center
          const depthRatio = Math.min(distanceFromShore / (waterBody.radius * 0.7), 1.0);
          return shoreDepth + (maxDepth - shoreDepth) * depthRatio;
        }
      } else if (waterBody.type === 'river' && waterBody.path) {
        // Rivers are shallow everywhere (wadeable)
        return 1.2;
      }
    }
    
    // Fallback depth
    return 1.0;
  }
  
  /**
   * Check if tiger is standing on a lily pad
   */
  isOnLilyPad(x, z) {
    for (const lilyPadGroup of this.lilyPads) {
      const distance = Math.sqrt(
        Math.pow(x - lilyPadGroup.position.x, 2) + 
        Math.pow(z - lilyPadGroup.position.z, 2)
      );
      
      // Check if tiger is within lily pad radius (approximately 1.5 units)
      if (distance <= 1.5) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get lily pad height at position (for tiger to stand on)
   */
  getLilyPadHeight(x, z) {
    for (const lilyPadGroup of this.lilyPads) {
      const distance = Math.sqrt(
        Math.pow(x - lilyPadGroup.position.x, 2) + 
        Math.pow(z - lilyPadGroup.position.z, 2)
      );
      
      if (distance <= 1.5) {
        // Return lily pad surface height (slightly above water)
        return lilyPadGroup.position.y + 0.1;
      }
    }
    return null;
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
    
    if (this.waterNormalsTexture) {
      this.waterNormalsTexture.dispose();
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
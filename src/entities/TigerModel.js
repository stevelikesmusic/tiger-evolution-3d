import * as THREE from 'three';

export class TigerModel {
  constructor() {
    this.evolutionStage = 'Young';
    this.currentAnimation = 'idle';
    this.isChargingLaser = false;
    
    this.createMesh();
    this.setupAnimations();
  }

  createMesh() {
    // Create a simple box geometry as placeholder for tiger model
    // In a real implementation, this would load a GLTF/FBX model
    const geometry = new THREE.BoxGeometry(2, 1, 3);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff6600 // Orange color for tiger
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0.5, 0); // Slightly above ground
    this.mesh.scale.set(1, 1, 1); // Young tiger scale
  }

  setupAnimations() {
    // Create animation mixer for handling animations
    this.mixer = new THREE.AnimationMixer(this.mesh);
    
    // Animation clips would be loaded from the 3D model
    // For now, we'll simulate having animation actions
    this.animations = {
      idle: { play: () => {}, stop: () => {}, setLoop: () => {}, clampWhenFinished: () => {} },
      walking: { play: () => {}, stop: () => {}, setLoop: () => {}, clampWhenFinished: () => {} },
      running: { play: () => {}, stop: () => {}, setLoop: () => {}, clampWhenFinished: () => {} },
      crouching: { play: () => {}, stop: () => {}, setLoop: () => {}, clampWhenFinished: () => {} },
      attacking: { play: () => {}, stop: () => {}, setLoop: () => {}, clampWhenFinished: () => {} },
      drinking: { play: () => {}, stop: () => {}, setLoop: () => {}, clampWhenFinished: () => {} }
    };

    // Start with idle animation
    this.playAnimation('idle');
  }

  // Evolution appearance changes
  evolveToAdult() {
    this.evolutionStage = 'Adult';
    // Larger, more muscular model
    this.mesh.scale.set(1.2, 1.2, 1.2);
    // Could update material/texture here for adult appearance
  }

  evolveToAlpha() {
    this.evolutionStage = 'Alpha';
    // Jet black fur with glowing blue stripes
    this.mesh.scale.set(1.4, 1.4, 1.4);
    
    // Change material to black with blue glow
    this.mesh.material.color.setRGB(0.1, 0.1, 0.1); // Dark color
    this.mesh.material.emissive = new THREE.Color(0x0066ff); // Blue glow
    this.mesh.material.emissiveIntensity = 0.3;
    
    // Add particle effects for glowing stripes
    this.addGlowEffects();
  }

  addGlowEffects() {
    // Add particle system for glowing blue stripes
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 4; // Random positions around tiger
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x0066ff,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    this.glowParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.mesh.add(this.glowParticles);
  }

  // Animation system
  playAnimation(animationName) {
    if (this.currentAnimation === animationName) return;
    
    // Stop current animation
    if (this.animations[this.currentAnimation]) {
      this.animations[this.currentAnimation].stop();
    }
    
    // Play new animation
    if (this.animations[animationName]) {
      this.animations[animationName].play();
      this.currentAnimation = animationName;
    }
  }

  // Position and rotation
  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.mesh.rotation.set(x, y, z);
  }

  getPosition() {
    return this.mesh.position.clone();
  }

  getRotation() {
    return this.mesh.rotation.clone();
  }

  // Alpha tiger special abilities
  hasGlowEffects() {
    return this.evolutionStage === 'Alpha' && this.glowParticles !== undefined;
  }

  startChargingLaser() {
    if (this.evolutionStage === 'Alpha') {
      this.isChargingLaser = true;
      // Visual charging effects would be added here
    }
  }

  fireLaser() {
    if (this.evolutionStage === 'Alpha' && this.isChargingLaser) {
      this.isChargingLaser = false;
      // Laser beam effects and damage calculation would be here
      return true;
    }
    return false;
  }

  // Update method for game loop
  update(deltaTime) {
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    // Update glow effects for Alpha tiger
    if (this.glowParticles) {
      this.glowParticles.rotation.y += deltaTime * 0.5; // Slow rotation
    }
  }

  // Cleanup
  dispose() {
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
      if (this.glowParticles) {
        this.glowParticles.geometry.dispose();
        this.glowParticles.material.dispose();
      }
    }
  }

  // Getter for Three.js mesh (for adding to scene)
  getMesh() {
    return this.mesh;
  }
}
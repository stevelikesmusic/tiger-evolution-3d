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
    // Create a group to hold all tiger parts
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0.5, 0); // Slightly above ground
    this.mesh.scale.set(1, 1, 1); // Young tiger scale

    // Main body (orange box)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 2.5);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600 // Orange color for tiger
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.set(0, 0, 0);
    this.mesh.add(this.body);

    // Head (at front of tiger - positive Z direction when camera is behind)
    const headGeometry = new THREE.BoxGeometry(1, 0.8, 1);
    const headMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff8833 // Slightly lighter orange for head
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 0.2, 1.5); // Front of tiger (positive Z)
    this.mesh.add(this.head);

    // Eyes (two larger black spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.25, 0.3, 1.9); // Closer to front (positive Z)
    this.mesh.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.25, 0.3, 1.9); // Closer to front (positive Z)
    this.mesh.add(this.rightEye);

    // Ears (two small triangular shapes)
    const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 3);
    const earMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    
    this.leftEar = new THREE.Mesh(earGeometry, earMaterial);
    this.leftEar.position.set(-0.4, 0.6, 1.4); // At head (positive Z)
    this.leftEar.rotation.z = Math.PI; // Point upward
    this.mesh.add(this.leftEar);
    
    this.rightEar = new THREE.Mesh(earGeometry, earMaterial);
    this.rightEar.position.set(0.4, 0.6, 1.4); // At head (positive Z)
    this.rightEar.rotation.z = Math.PI; // Point upward
    this.mesh.add(this.rightEar);

    // Nose (small black cube at very front)
    const noseGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.1);
    const noseMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
    this.nose.position.set(0, 0.1, 2); // Very front (positive Z)
    this.mesh.add(this.nose);

    // Tail (at back of tiger - negative Z direction)
    const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 1.5, 8);
    const tailMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600 // Same orange as body
    });
    this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
    this.tail.position.set(0, 0.3, -1.8); // Back of tiger (negative Z)
    this.tail.rotation.x = Math.PI / 6; // Angle upward slightly
    this.mesh.add(this.tail);

    // Tail tip (black)
    const tailTipGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const tailTipMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.tailTip = new THREE.Mesh(tailTipGeometry, tailTipMaterial);
    this.tailTip.position.set(0, 0.8, -2.3); // Back of tiger (negative Z)
    this.mesh.add(this.tailTip);
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

  // Getter for position property (for camera system compatibility)
  get position() {
    return this.mesh.position;
  }

  // Getter for rotation property (for camera system compatibility)
  get rotation() {
    return this.mesh.rotation;
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
      // Dispose of all child components
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      
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
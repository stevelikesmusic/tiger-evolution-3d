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
    this.mesh.position.set(0, 1.5, 0); // Raised higher so paws touch ground properly
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

    // Add tiger legs
    this.addLegs();
    
    // Add black stripes to body
    this.addStripes();
  }

  addLegs() {
    // Create leg material (same orange as body)
    const legMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600 // Same orange as body
    });
    
    // Paw material (darker for contrast)
    const pawMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xcc4400 // Darker orange/brown for paws
    });
    
    // Tiger leg proportions - realistic tiger anatomy
    const upperLegLength = 0.6;
    const lowerLegLength = 0.5;
    const legThickness = 0.15;
    const pawSize = 0.2;
    
    // Front legs (closer to head, positive Z)
    this.createLeg(-0.5, 0.8, 'frontLeft', legMaterial, pawMaterial, upperLegLength, lowerLegLength, legThickness, pawSize);
    this.createLeg(0.5, 0.8, 'frontRight', legMaterial, pawMaterial, upperLegLength, lowerLegLength, legThickness, pawSize);
    
    // Back legs (closer to tail, negative Z)  
    this.createLeg(-0.5, -0.8, 'backLeft', legMaterial, pawMaterial, upperLegLength, lowerLegLength, legThickness, pawSize);
    this.createLeg(0.5, -0.8, 'backRight', legMaterial, pawMaterial, upperLegLength, lowerLegLength, legThickness, pawSize);
  }
  
  createLeg(x, z, legName, legMaterial, pawMaterial, upperLength, lowerLength, thickness, pawSize) {
    // Create leg group for easier animation later
    const legGroup = new THREE.Group();
    
    // Upper leg (thigh/shoulder)
    const upperLegGeometry = new THREE.CylinderGeometry(thickness, thickness * 0.8, upperLength, 8);
    const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
    upperLeg.position.set(0, -upperLength / 2, 0);
    legGroup.add(upperLeg);
    
    // Lower leg (shin/forearm)
    const lowerLegGeometry = new THREE.CylinderGeometry(thickness * 0.8, thickness * 0.6, lowerLength, 8);
    const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
    lowerLeg.position.set(0, -upperLength - lowerLength / 2, 0);
    legGroup.add(lowerLeg);
    
    // Paw (foot)
    const pawGeometry = new THREE.SphereGeometry(pawSize, 8, 6);
    const paw = new THREE.Mesh(pawGeometry, pawMaterial);
    paw.position.set(0, -upperLength - lowerLength - pawSize * 0.3, 0);
    paw.scale.set(1, 0.6, 1.2); // Flatten slightly and make longer for realistic paw shape
    legGroup.add(paw);
    
    // Add toe details (small black claws)
    const clawMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for (let i = 0; i < 4; i++) {
      const clawGeometry = new THREE.ConeGeometry(0.02, 0.08, 4);
      const claw = new THREE.Mesh(clawGeometry, clawMaterial);
      
      // Position claws around front of paw
      const angle = (Math.PI * (i - 1.5)) / 3; // Spread across front of paw
      claw.position.set(
        Math.sin(angle) * pawSize * 0.8,
        -upperLength - lowerLength - pawSize * 0.7,
        Math.cos(angle) * pawSize * 0.8
      );
      claw.rotation.x = Math.PI; // Point downward
      legGroup.add(claw);
    }
    
    // Position entire leg group under body (raised higher to avoid ground clipping)
    legGroup.position.set(x, 0.1, z); // Attach under body, higher position
    
    // Add stripes to the leg
    this.addLegStripes(legGroup, upperLength, lowerLength, thickness);
    
    // Store leg reference for potential animation
    this[legName] = legGroup;
    this.mesh.add(legGroup);
  }

  addLegStripes(legGroup, upperLength, lowerLength, thickness) {
    // Create stripe material
    const stripeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: false,
      depthTest: false,
      depthWrite: false
    });
    
    // Upper leg stripes (3-4 horizontal bands)
    for (let i = 0; i < 3; i++) {
      const stripeGeometry = new THREE.RingGeometry(thickness * 0.95, thickness * 1.05, 8);
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, -0.15 - (i * 0.2), 0);
      stripe.rotation.x = Math.PI / 2; // Rotate to wrap around leg
      stripe.renderOrder = 1;
      legGroup.add(stripe);
    }
    
    // Lower leg stripes (2-3 horizontal bands)
    for (let i = 0; i < 2; i++) {
      const stripeGeometry = new THREE.RingGeometry(thickness * 0.7, thickness * 0.85, 8);
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, -upperLength - 0.15 - (i * 0.2), 0);
      stripe.rotation.x = Math.PI / 2; // Rotate to wrap around leg
      stripe.renderOrder = 1;
      legGroup.add(stripe);
    }
    
    // Alternative approach: thin rectangular stripes for better visibility
    for (let i = 0; i < 4; i++) {
      // Upper leg stripes
      const upperStripeGeometry = new THREE.BoxGeometry(thickness * 0.3, 0.04, thickness * 0.3);
      const upperStripe = new THREE.Mesh(upperStripeGeometry, stripeMaterial);
      upperStripe.position.set(thickness * 0.9, -0.15 - (i * 0.15), 0);
      upperStripe.renderOrder = 1;
      legGroup.add(upperStripe);
      
      // Mirror on other side
      const upperStripeLeft = new THREE.Mesh(upperStripeGeometry, stripeMaterial);
      upperStripeLeft.position.set(-thickness * 0.9, -0.15 - (i * 0.15), 0);
      upperStripeLeft.renderOrder = 1;
      legGroup.add(upperStripeLeft);
      
      // Lower leg stripes (fewer)
      if (i < 3) {
        const lowerStripeGeometry = new THREE.BoxGeometry(thickness * 0.25, 0.04, thickness * 0.25);
        const lowerStripe = new THREE.Mesh(lowerStripeGeometry, stripeMaterial);
        lowerStripe.position.set(thickness * 0.7, -upperLength - 0.15 - (i * 0.15), 0);
        lowerStripe.renderOrder = 1;
        legGroup.add(lowerStripe);
        
        // Mirror on other side
        const lowerStripeLeft = new THREE.Mesh(lowerStripeGeometry, stripeMaterial);
        lowerStripeLeft.position.set(-thickness * 0.7, -upperLength - 0.15 - (i * 0.15), 0);
        lowerStripeLeft.renderOrder = 1;
        legGroup.add(lowerStripeLeft);
      }
    }
  }

  addStripes() {
    // Create truly black stripe material with higher rendering priority
    const stripeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: false,
      depthTest: false,
      depthWrite: false
    });
    
    // Body stripes (vertical stripes across the body)
    for (let i = 0; i < 6; i++) {
      const stripeGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.12);
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0.77, 0, -1 + (i * 0.4)); // Position slightly outside body surface
      stripe.renderOrder = 1; // Render on top
      this.mesh.add(stripe);
      
      // Mirror stripe on left side
      const stripeLeft = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripeLeft.position.set(-0.77, 0, -1 + (i * 0.4));
      stripeLeft.renderOrder = 1;
      this.mesh.add(stripeLeft);
    }
    
    // Back stripes (horizontal stripes across the tiger's back)
    for (let i = 0; i < 5; i++) {
      const backStripeGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.15);
      const backStripe = new THREE.Mesh(backStripeGeometry, stripeMaterial);
      backStripe.position.set(0, 0.42, -1 + (i * 0.5)); // Position on top of body
      backStripe.renderOrder = 1;
      this.mesh.add(backStripe);
    }
    
    // Head stripes (smaller stripes on the head)
    for (let i = 0; i < 3; i++) {
      const headStripeGeometry = new THREE.BoxGeometry(0.04, 0.5, 0.08);
      const headStripe = new THREE.Mesh(headStripeGeometry, stripeMaterial);
      headStripe.position.set(0.52, 0.2, 1.2 + (i * 0.2)); // Position slightly outside head surface
      headStripe.renderOrder = 1;
      this.mesh.add(headStripe);
      
      // Mirror stripe on left side
      const headStripeLeft = new THREE.Mesh(headStripeGeometry, stripeMaterial);
      headStripeLeft.position.set(-0.52, 0.2, 1.2 + (i * 0.2));
      headStripeLeft.renderOrder = 1;
      this.mesh.add(headStripeLeft);
    }
    
    // Tail stripes (simpler black bands)
    for (let i = 0; i < 4; i++) {
      const tailStripeGeometry = new THREE.BoxGeometry(0.22, 0.22, 0.08);
      const tailStripe = new THREE.Mesh(tailStripeGeometry, stripeMaterial);
      tailStripe.position.set(0, 0.3 + (i * 0.15), -1.8);
      tailStripe.renderOrder = 1;
      this.mesh.add(tailStripe);
    }
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
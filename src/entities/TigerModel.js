import * as THREE from 'three';

export class TigerModel {
  constructor(gender = 'male') {
    this.gender = gender;
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
    
    // Set scale based on gender - females are smaller
    const baseScale = this.gender === 'female' ? 0.85 : 1.0; // Females 15% smaller
    this.mesh.scale.set(baseScale, baseScale, baseScale);
    console.log(`🐅 Creating ${this.gender} tiger model with scale ${baseScale}`);

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
    console.log('🔴 Starting Alpha evolution...');
    
    try {
      // Jet black fur with glowing blue stripes
      this.mesh.scale.set(1.4, 1.4, 1.4);
      
      // Change all orange materials to black
      this.changeToBlackFur();
      console.log('🖤 Changed fur to black');
      
      // Change all black stripes to blue
      this.changeToBlueStripes();
      console.log('🔵 Changed stripes to blue');
      
      // Add particle effects for glowing stripes
      this.addGlowEffects();
      console.log('✨ Added glow effects');
      
      console.log('🔴 Alpha evolution completed successfully!');
    } catch (error) {
      console.error('❌ Error during Alpha evolution:', error);
    }
  }

  changeToBlackFur() {
    try {
      // Create new black material to avoid corrupting existing uniforms
      const blackMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x0d0d0d // Very dark black
      });
      
      // Change body to deep black
      if (this.body && this.body.material) {
        if (this.body.material.dispose) this.body.material.dispose();
        this.body.material = blackMaterial.clone();
      }
      
      // Change head to deep black
      if (this.head && this.head.material) {
        if (this.head.material.dispose) this.head.material.dispose();
        this.head.material = blackMaterial.clone();
      }
      
      // Change ears to deep black
      if (this.leftEar && this.leftEar.material) {
        if (this.leftEar.material.dispose) this.leftEar.material.dispose();
        this.leftEar.material = blackMaterial.clone();
      }
      if (this.rightEar && this.rightEar.material) {
        if (this.rightEar.material.dispose) this.rightEar.material.dispose();
        this.rightEar.material = blackMaterial.clone();
      }
      
      // Change tail to deep black
      if (this.tail && this.tail.material) {
        if (this.tail.material.dispose) this.tail.material.dispose();
        this.tail.material = blackMaterial.clone();
      }
      
      // Change leg materials to deep black
      const legNames = ['frontLeft', 'frontRight', 'backLeft', 'backRight'];
      legNames.forEach(legName => {
        const leg = this[legName];
        if (leg) {
          leg.traverse(child => {
            if (child.material && child.material.color) {
              // Change orange leg materials to deep black, keep paws darker
              if (child.material.color.r > 0.5) { // If it's orange-ish
                if (child.material.dispose) child.material.dispose();
                child.material = blackMaterial.clone();
              }
            }
          });
        }
      });
      
      console.log('🖤 Successfully changed fur to black with new materials');
    } catch (error) {
      console.error('❌ Error changing fur to black:', error);
    }
  }

  changeToBlueStripes() {
    try {
      // Create new blue stripe material to avoid corrupting existing uniforms
      const blueStripeMaterial = new THREE.MeshBasicMaterial({
        color: 0x3399ff, // Bright blue
        emissive: 0x0066ff, // Blue glow
        emissiveIntensity: 0.3
      });
      
      // Specifically target stripe objects by checking their position/geometry
      // Avoid head parts (eyes, nose, ears)
      this.mesh.traverse(child => {
        if (child.material && child.material.color && child.geometry) {
          // Skip head parts to prevent blue head
          if (child === this.head || child === this.leftEye || child === this.rightEye || 
              child === this.nose || child === this.leftEar || child === this.rightEar) {
            return; // Don't change head parts
          }
          
          // If it's a very small black object (likely a stripe)
          const isStripe = child.material.color.r === 0 && child.material.color.g === 0 && child.material.color.b === 0;
          const isVeryDark = child.material.color.r < 0.15 && child.material.color.g < 0.15 && child.material.color.b < 0.15;
          
          if ((isStripe || isVeryDark)) {
            const boundingBox = new THREE.Box3().setFromObject(child);
            const size = boundingBox.getSize(new THREE.Vector3());
            const volume = size.x * size.y * size.z;
            
            // Only change very small objects (stripes) and avoid larger body parts
            if (volume < 0.5) { // Even smaller threshold to avoid head parts
              if (child.material.dispose) child.material.dispose();
              child.material = blueStripeMaterial.clone();
              console.log('🔵 Changed stripe to blue:', volume.toFixed(3));
            }
          }
        }
      });
      
      console.log('🔵 Successfully changed stripes to blue with new materials');
    } catch (error) {
      console.error('❌ Error changing stripes to blue:', error);
    }
  }

  addGlowEffects() {
    try {
      // Add particle system for glowing blue stripes
      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = 30; // Reduced count to avoid performance issues
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 3; // Random positions around tiger
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        color: 0x0066ff,
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: false // Avoid size attenuation uniform issues
      });
      
      this.glowParticles = new THREE.Points(particleGeometry, particleMaterial);
      this.mesh.add(this.glowParticles);
      
      console.log('✨ Successfully added glow effects');
    } catch (error) {
      console.error('❌ Error adding glow effects:', error);
    }
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

  fireLaser(targetPosition, duration = 1.0) {
    if (this.evolutionStage === 'Alpha') {
      console.log('🔴 Firing laser beam to target!');
      
      // Create laser beam from tiger's mouth to target
      this.createLaserBeam(targetPosition, duration);
      return true;
    }
    return false;
  }

  createLaserBeam(targetPosition, duration) {
    try {
      // Calculate beam start position (tiger's mouth/nose area)
      const startPosition = this.nose.position.clone();
      startPosition.add(this.mesh.position); // Add tiger's world position
      startPosition.y += 0.2; // Slightly above nose
      
      // Calculate beam direction and length
      const direction = new THREE.Vector3().subVectors(targetPosition, startPosition);
      const distance = direction.length();
      direction.normalize();
      
      // Create laser beam geometry (cylinder from mouth to target)
      const beamGeometry = new THREE.CylinderGeometry(0.1, 0.05, distance, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066ff, // Blue laser
        emissive: 0x4444ff, // Blue glow
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      
      this.laserBeam = new THREE.Mesh(beamGeometry, beamMaterial);
      
      // Position beam between tiger and target
      const midPoint = new THREE.Vector3().addVectors(startPosition, targetPosition).multiplyScalar(0.5);
      this.laserBeam.position.copy(midPoint);
      
      // Rotate beam to point from tiger to target
      this.laserBeam.lookAt(targetPosition);
      this.laserBeam.rotateX(Math.PI / 2); // Align with cylinder geometry
      
      // Add beam to scene
      this.mesh.parent.add(this.laserBeam);
      
      // Create glow effect around beam
      this.createLaserGlow(startPosition, targetPosition, distance);
      
      // Remove beam after duration
      setTimeout(() => {
        this.removeLaserBeam();
      }, duration * 1000);
      
      console.log('🔴 Laser beam created successfully!');
    } catch (error) {
      console.error('❌ Error creating laser beam:', error);
    }
  }

  createLaserGlow(startPosition, targetPosition, distance) {
    try {
      // Create outer glow effect
      const glowGeometry = new THREE.CylinderGeometry(0.25, 0.15, distance, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6666ff, // Lighter blue
        emissive: 0x2222ff, // Blue glow
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.3
      });
      
      this.laserGlow = new THREE.Mesh(glowGeometry, glowMaterial);
      
      // Position glow same as beam
      const midPoint = new THREE.Vector3().addVectors(startPosition, targetPosition).multiplyScalar(0.5);
      this.laserGlow.position.copy(midPoint);
      this.laserGlow.lookAt(targetPosition);
      this.laserGlow.rotateX(Math.PI / 2);
      
      // Add glow to scene
      this.mesh.parent.add(this.laserGlow);
      
      console.log('✨ Laser glow effect created!');
    } catch (error) {
      console.error('❌ Error creating laser glow:', error);
    }
  }

  removeLaserBeam() {
    try {
      if (this.laserBeam) {
        this.mesh.parent.remove(this.laserBeam);
        if (this.laserBeam.geometry) this.laserBeam.geometry.dispose();
        if (this.laserBeam.material) this.laserBeam.material.dispose();
        this.laserBeam = null;
        console.log('🔴 Laser beam removed');
      }
      
      if (this.laserGlow) {
        this.mesh.parent.remove(this.laserGlow);
        if (this.laserGlow.geometry) this.laserGlow.geometry.dispose();
        if (this.laserGlow.material) this.laserGlow.material.dispose();
        this.laserGlow = null;
        console.log('✨ Laser glow removed');
      }
    } catch (error) {
      console.error('❌ Error removing laser beam:', error);
    }
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
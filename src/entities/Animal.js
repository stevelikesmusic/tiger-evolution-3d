import * as THREE from 'three';

export class Animal {
  constructor(type, stats = {}) {
    this.type = type;
    
    // Set gender for tigers
    if (type === 'male_tiger' || type === 'female_tiger') {
      this.gender = type === 'male_tiger' ? 'male' : 'female';
      this.species = 'tiger';
    } else {
      this.gender = Math.random() < 0.5 ? 'male' : 'female'; // Random gender for other animals
      this.species = type;
    }
    
    // Default stats based on animal type
    const defaultStats = this.getDefaultStats(type);
    
    // Apply custom stats if provided
    this.health = stats.health || defaultStats.health;
    this.maxHealth = this.health;
    this.speed = stats.speed || defaultStats.speed;
    this.power = stats.power || defaultStats.power;
    this.stamina = stats.stamina || defaultStats.stamina;
    this.maxStamina = this.stamina;
    this.behaviorType = stats.behaviorType || defaultStats.behaviorType;
    
    // Position and movement
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.velocity = new THREE.Vector3();
    
    // Animation and state
    this.state = 'idle';
    this.lastStateChange = Date.now();
    
    // AI properties
    this.aiState = 'idle';
    this.target = null;
    this.detectionRadius = 25;
    this.fleeDistance = 40;
    this.attackRange = 3;
    
    // Timers
    this.stateTimer = 0;
    this.staminaRegenTimer = 0;
    
    // 3D model reference
    this.mesh = null;
    this.mixers = [];
    
    // Initialize 3D model
    this.createModel();
  }
  
  getDefaultStats(type) {
    const animalStats = {
      deer: {
        health: 150, // Increased from 50
        speed: 10,
        power: 30, // deer damage 30
        stamina: 100,
        behaviorType: 'prey'
      },
      rabbit: {
        health: 75, // Increased from 25
        speed: 15,
        power: 5, // rabbit damage 5
        stamina: 80,
        behaviorType: 'prey'
      },
      boar: {
        health: 200, // Increased from 80
        speed: 8,
        power: 20, // boar damage 20
        stamina: 120,
        behaviorType: 'neutral'
      },
      leopard: {
        health: 250, // Increased from 100
        speed: 12,
        power: 40, // leopard damage 40
        stamina: 150,
        behaviorType: 'predator'
      },
      'male_tiger': {
        health: 300, // Strong and robust
        speed: 14,
        power: 60, // Very powerful
        stamina: 200,
        behaviorType: 'territorial'
      },
      'female_tiger': {
        health: 250, // Slightly less health but faster
        speed: 16,
        power: 45, // Less power than males
        stamina: 240, // More stamina
        behaviorType: 'territorial'
      }
    };
    
    return animalStats[type] || animalStats.deer;
  }
  
  createModel() {
    // Create basic 3D model based on animal type
    const geometry = this.getGeometry();
    const material = this.getMaterial();
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData.animal = this;
    
    // Add body parts for more realistic appearance
    this.addBodyParts();
  }
  
  getGeometry() {
    switch (this.type) {
      case 'deer':
        return new THREE.BoxGeometry(1.6, 1.4, 3.2); // Tall, elegant body
      case 'rabbit':
        return new THREE.BoxGeometry(0.9, 0.7, 1.4); // Compact, rounded body
      case 'boar':
        return new THREE.BoxGeometry(2.0, 1.2, 2.8); // Wide, muscular body
      case 'leopard':
        return new THREE.BoxGeometry(1.4, 0.9, 3.0); // Lean, athletic body
      case 'male_tiger':
        return new THREE.BoxGeometry(1.8, 1.0, 3.5); // Large, powerful body
      case 'female_tiger':
        return new THREE.BoxGeometry(1.5, 0.85, 3.0); // Smaller, more agile body
      default:
        return new THREE.BoxGeometry(1.5, 1.2, 3);
    }
  }
  
  getMaterial() {
    switch (this.type) {
      case 'deer':
        return new THREE.MeshLambertMaterial({ 
          color: 0xCD853F, // Sandy brown - more natural deer color
          transparent: false,
          opacity: 1.0
        }); 
      case 'rabbit':
        // Enhanced rabbit colors with more variety
        const rabbitColors = [
          0xF5F5DC, // Beige
          0xFFFFFF, // White
          0x696969, // Dim gray
          0x8B4513, // Saddle brown
          0x2F4F4F  // Dark slate gray
        ];
        const randomColor = rabbitColors[Math.floor(Math.random() * rabbitColors.length)];
        return new THREE.MeshLambertMaterial({ 
          color: randomColor,
          transparent: false,
          opacity: 1.0
        });
      case 'boar':
        return new THREE.MeshLambertMaterial({ 
          color: 0x555555, // Darker gray - more realistic boar color
          transparent: false,
          opacity: 1.0
        });
      case 'leopard':
        return new THREE.MeshLambertMaterial({ 
          color: 0xDAA520, // Goldenrod - more realistic leopard base
          transparent: false,
          opacity: 1.0
        });
      case 'male_tiger':
        return new THREE.MeshLambertMaterial({ 
          color: 0xff6600, // Orange tiger color - same as player
          transparent: false,
          opacity: 1.0
        });
      case 'female_tiger':
        return new THREE.MeshLambertMaterial({ 
          color: 0xff8833, // Slightly lighter orange for females
          transparent: false,
          opacity: 1.0
        });
      default:
        return new THREE.MeshLambertMaterial({ 
          color: 0x8B4513,
          transparent: false,
          opacity: 1.0
        });
    }
  }

  getHeadGeometry() {
    switch (this.type) {
      case 'deer':
        return new THREE.BoxGeometry(0.8, 0.8, 1.0); // Elongated head
      case 'rabbit':
        return new THREE.BoxGeometry(0.6, 0.6, 0.7); // Rounded head
      case 'boar':
        return new THREE.BoxGeometry(0.9, 0.7, 1.2); // Wide snout
      case 'leopard':
        return new THREE.BoxGeometry(0.7, 0.6, 0.9); // Sleek feline head
      case 'male_tiger':
        return new THREE.BoxGeometry(1.0, 0.8, 1.1); // Large, powerful head
      case 'female_tiger':
        return new THREE.BoxGeometry(0.85, 0.7, 0.95); // Smaller, more refined head
      default:
        return new THREE.BoxGeometry(0.6, 0.6, 0.8);
    }
  }

  getHeadPosition() {
    switch (this.type) {
      case 'deer':
        return { x: 0, y: 0.4, z: 1.8 }; // Higher position for elegant neck
      case 'rabbit':
        return { x: 0, y: 0.2, z: 1.0 }; // Compact positioning
      case 'boar':
        return { x: 0, y: 0.1, z: 1.6 }; // Lower, forward position
      case 'leopard':
        return { x: 0, y: 0.3, z: 1.7 }; // Predator positioning
      case 'male_tiger':
        return { x: 0, y: 0.4, z: 2.0 }; // Large tiger head position
      case 'female_tiger':
        return { x: 0, y: 0.35, z: 1.7 }; // Smaller tiger head position
      default:
        return { x: 0, y: 0.3, z: 1.5 };
    }
  }
  
  addBodyParts() {
    if (!this.mesh) return;
    
    // Get shared material
    const sharedMaterial = this.getMaterial();
    
    // Add head with animal-specific proportions
    const headGeometry = this.getHeadGeometry();
    const head = new THREE.Mesh(headGeometry, sharedMaterial);
    const headPosition = this.getHeadPosition();
    head.position.set(headPosition.x, headPosition.y, headPosition.z);
    this.mesh.add(head);
    
    // Add ears for specific animals
    if (this.type === 'deer') {
      this.addAntlers(head);
    } else if (this.type === 'rabbit') {
      this.addEars(head);
    } else if (this.type === 'boar') {
      this.addTusks(head);
    }
    
    // Add eyes to all animals
    this.addEyes(head);
    
    // Add spots for deer and leopards
    if (this.type === 'deer') {
      this.addDeerSpots();
    } else if (this.type === 'leopard') {
      this.addLeopardSpots();
    }
    
    // Add muscle definition for boar
    if (this.type === 'boar') {
      this.addBoarMuscles();
    }
    
    // Add tiger stripes
    if (this.type === 'male_tiger' || this.type === 'female_tiger') {
      this.addTigerStripes();
    }
    
    // Add legs
    this.addLegs();
    
    // Add tail
    this.addTail();
    
    // Add health bar (initially hidden)
    this.createHealthBar();
  }
  
  addAntlers(head) {
    const antlerGeometry = new THREE.ConeGeometry(0.05, 0.8, 4);
    const antlerMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Darker brown for antlers
    
    const leftAntler = new THREE.Mesh(antlerGeometry, antlerMaterial);
    leftAntler.position.set(-0.2, 0.6, 0);
    head.add(leftAntler);
    
    const rightAntler = new THREE.Mesh(antlerGeometry, antlerMaterial);
    rightAntler.position.set(0.2, 0.6, 0);
    head.add(rightAntler);
  }
  
  addEars(head) {
    const earGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.2);
    const earMaterial = this.mesh.material; // Use same material as body
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.2, 0.4, 0);
    head.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.2, 0.4, 0);
    head.add(rightEar);
  }
  
  addTusks(head) {
    const tuskGeometry = new THREE.ConeGeometry(0.03, 0.3, 4);
    const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // Pure white
    
    const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    leftTusk.position.set(-0.15, -0.2, 0.3);
    leftTusk.rotation.x = Math.PI / 4;
    head.add(leftTusk);
    
    const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
    rightTusk.position.set(0.15, -0.2, 0.3);
    rightTusk.rotation.x = Math.PI / 4;
    head.add(rightTusk);
  }
  
  addTigerStripes() {
    // Add black stripes to tiger body for realistic tiger pattern
    const stripeGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.12);
    const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Tiger stripe pattern - vertical stripes across body
    const stripePositions = [
      // Body stripes (vertical stripes across the sides)
      [0.77, 0, -1 + (0 * 0.4)], [0.77, 0, -1 + (1 * 0.4)], [0.77, 0, -1 + (2 * 0.4)],
      [0.77, 0, -1 + (3 * 0.4)], [0.77, 0, -1 + (4 * 0.4)], [0.77, 0, -1 + (5 * 0.4)],
      [-0.77, 0, -1 + (0 * 0.4)], [-0.77, 0, -1 + (1 * 0.4)], [-0.77, 0, -1 + (2 * 0.4)],
      [-0.77, 0, -1 + (3 * 0.4)], [-0.77, 0, -1 + (4 * 0.4)], [-0.77, 0, -1 + (5 * 0.4)]
    ];
    
    // Back stripes (horizontal stripes across the back)
    const backStripeGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.15);
    const backStripePositions = [
      [0, 0.42, -1 + (0 * 0.5)], [0, 0.42, -1 + (1 * 0.5)], [0, 0.42, -1 + (2 * 0.5)],
      [0, 0.42, -1 + (3 * 0.5)], [0, 0.42, -1 + (4 * 0.5)]
    ];
    
    // Add body stripes
    stripePositions.forEach(pos => {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(pos[0], pos[1], pos[2]);
      stripe.renderOrder = 1;
      this.mesh.add(stripe);
    });
    
    // Add back stripes
    backStripePositions.forEach(pos => {
      const backStripe = new THREE.Mesh(backStripeGeometry, stripeMaterial);
      backStripe.position.set(pos[0], pos[1], pos[2]);
      backStripe.renderOrder = 1;
      this.mesh.add(backStripe);
    });
    
    console.log(`🐅 Added tiger stripes to ${this.type}`);
  }
  
  addLegs() {
    const legDimensions = this.getLegDimensions();
    const legGeometry = new THREE.BoxGeometry(legDimensions.width, legDimensions.height, legDimensions.depth);
    const legMaterial = this.mesh.material; // Use same material as body
    
    const positions = this.getLegPositions();
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(leg);
    });
  }

  getLegDimensions() {
    switch (this.type) {
      case 'deer':
        return { width: 0.18, height: 1.0, depth: 0.18 }; // Thin, tall legs
      case 'rabbit':
        return { width: 0.15, height: 0.6, depth: 0.15 }; // Short, compact legs
      case 'boar':
        return { width: 0.25, height: 0.8, depth: 0.25 }; // Thick, sturdy legs
      case 'leopard':
        return { width: 0.20, height: 0.9, depth: 0.20 }; // Athletic legs
      case 'male_tiger':
        return { width: 0.25, height: 1.0, depth: 0.25 }; // Strong, powerful legs
      case 'female_tiger':
        return { width: 0.22, height: 0.9, depth: 0.22 }; // Slightly smaller legs
      default:
        return { width: 0.2, height: 0.8, depth: 0.2 };
    }
  }

  getLegPositions() {
    switch (this.type) {
      case 'deer':
        return [
          [-0.6, -0.9, 1.2],   // Front left
          [0.6, -0.9, 1.2],    // Front right
          [-0.6, -0.9, -1.2],  // Back left
          [0.6, -0.9, -1.2]    // Back right
        ];
      case 'rabbit':
        return [
          [-0.35, -0.5, 0.5],   // Front left
          [0.35, -0.5, 0.5],    // Front right
          [-0.35, -0.5, -0.5],  // Back left
          [0.35, -0.5, -0.5]    // Back right
        ];
      case 'boar':
        return [
          [-0.7, -0.8, 1.0],   // Front left
          [0.7, -0.8, 1.0],    // Front right
          [-0.7, -0.8, -1.0],  // Back left
          [0.7, -0.8, -1.0]    // Back right
        ];
      case 'leopard':
        return [
          [-0.5, -0.8, 1.1],   // Front left
          [0.5, -0.8, 1.1],    // Front right
          [-0.5, -0.8, -1.1],  // Back left
          [0.5, -0.8, -1.1]    // Back right
        ];
      case 'male_tiger':
        return [
          [-0.6, -0.9, 1.3],   // Front left
          [0.6, -0.9, 1.3],    // Front right
          [-0.6, -0.9, -1.3],  // Back left
          [0.6, -0.9, -1.3]    // Back right
        ];
      case 'female_tiger':
        return [
          [-0.5, -0.85, 1.1],   // Front left
          [0.5, -0.85, 1.1],    // Front right
          [-0.5, -0.85, -1.1],  // Back left
          [0.5, -0.85, -1.1]    // Back right
        ];
      default:
        return [
          [-0.5, -0.8, 1.0],   // Front left
          [0.5, -0.8, 1.0],    // Front right
          [-0.5, -0.8, -1.0],  // Back left
          [0.5, -0.8, -1.0]    // Back right
        ];
    }
  }
  
  addTail() {
    const tailDimensions = this.getTailDimensions();
    const tailGeometry = new THREE.BoxGeometry(tailDimensions.width, tailDimensions.height, tailDimensions.length);
    const tailMaterial = this.mesh.material; // Use same material as body
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    
    const tailPosition = this.getTailPosition();
    tail.position.set(tailPosition.x, tailPosition.y, tailPosition.z);
    
    // Add slight rotation for more natural look
    const tailRotation = this.getTailRotation();
    tail.rotation.set(tailRotation.x, tailRotation.y, tailRotation.z);
    
    this.mesh.add(tail);
  }

  getTailDimensions() {
    switch (this.type) {
      case 'deer':
        return { width: 0.08, height: 0.08, length: 0.4 }; // Small, short tail
      case 'rabbit':
        return { width: 0.12, height: 0.12, length: 0.2 }; // Fluffy, short tail
      case 'boar':
        return { width: 0.06, height: 0.06, length: 0.3 }; // Thin, curly tail
      case 'leopard':
        return { width: 0.12, height: 0.12, length: 1.2 }; // Long, thick tail
      default:
        return { width: 0.1, height: 0.1, length: 0.6 };
    }
  }

  getTailPosition() {
    switch (this.type) {
      case 'deer':
        return { x: 0, y: 0.3, z: -1.8 }; // Higher position
      case 'rabbit':
        return { x: 0, y: 0.2, z: -0.9 }; // Compact positioning
      case 'boar':
        return { x: 0, y: 0.4, z: -1.6 }; // Slightly raised
      case 'leopard':
        return { x: 0, y: 0.2, z: -1.8 }; // Long tail positioning
      default:
        return { x: 0, y: 0.2, z: -1.8 };
    }
  }

  getTailRotation() {
    switch (this.type) {
      case 'deer':
        return { x: 0.2, y: 0, z: 0 }; // Slight upward tilt
      case 'rabbit':
        return { x: 0.5, y: 0, z: 0 }; // Upward bunny tail
      case 'boar':
        return { x: 0.3, y: 0.2, z: 0 }; // Slightly curled
      case 'leopard':
        return { x: -0.1, y: 0, z: 0 }; // Slight downward curve
      default:
        return { x: 0, y: 0, z: 0 };
    }
  }

  addEyes(head) {
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8); // Slightly larger eyes
    
    // Determine eye color based on animal type
    let eyeColor = 0x000000; // Default black
    if (this.type === 'rabbit') {
      // Random eye color for rabbits: black or red
      eyeColor = Math.random() < 0.5 ? 0x000000 : 0xFF0000;
    } else if (this.type === 'deer') {
      eyeColor = 0x4B0000; // Dark brown for deer
    } else if (this.type === 'boar') {
      eyeColor = 0x8B0000; // Dark red for boar
    } else if (this.type === 'leopard') {
      eyeColor = 0xFFD700; // Golden eyes for leopard
    }
    
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: eyeColor });
    
    // Animal-specific eye positioning
    const eyePositions = this.getEyePositions();
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(eyePositions.left.x, eyePositions.left.y, eyePositions.left.z);
    head.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(eyePositions.right.x, eyePositions.right.y, eyePositions.right.z);
    head.add(rightEye);
  }

  getEyePositions() {
    switch (this.type) {
      case 'deer':
        return {
          left: { x: -0.2, y: 0.15, z: 0.45 },
          right: { x: 0.2, y: 0.15, z: 0.45 }
        };
      case 'rabbit':
        return {
          left: { x: -0.15, y: 0.1, z: 0.3 },
          right: { x: 0.15, y: 0.1, z: 0.3 }
        };
      case 'boar':
        return {
          left: { x: -0.2, y: 0.05, z: 0.5 },
          right: { x: 0.2, y: 0.05, z: 0.5 }
        };
      case 'leopard':
        return {
          left: { x: -0.18, y: 0.12, z: 0.4 },
          right: { x: 0.18, y: 0.12, z: 0.4 }
        };
      default:
        return {
          left: { x: -0.15, y: 0.1, z: 0.35 },
          right: { x: 0.15, y: 0.1, z: 0.35 }
        };
    }
  }

  addDeerSpots() {
    // Add white spots to deer body with more realistic distribution
    const spotGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    // Dense spotted pattern covering the entire deer body
    const spotPositions = [
      // Front section spots
      [0.4, 0.3, 0.8],   [0.6, 0.1, 0.4],   [0.3, 0.5, 0.0],   [0.2, 0.2, 1.0],
      [-0.4, 0.3, 0.8],  [-0.6, 0.1, 0.4],  [-0.3, 0.5, 0.0],  [-0.2, 0.2, 1.0],
      [0.5, 0.6, 0.6],   [0.1, 0.4, 0.9],   [0.7, 0.0, 0.7],   [0.0, 0.3, 1.3],
      [-0.5, 0.6, 0.6],  [-0.1, 0.4, 0.9],  [-0.7, 0.0, 0.7],  [0.4, 0.5, 1.1],
      
      // Middle section spots
      [0.5, 0.2, -0.3],  [0.2, 0.4, -0.8],  [0.7, 0.0, -0.5],  [0.3, 0.6, 0.2],
      [-0.5, 0.2, -0.3], [-0.2, 0.4, -0.8], [-0.7, 0.0, -0.5], [-0.3, 0.6, 0.2],
      [0.1, 0.6, 0.6],   [0.8, 0.3, 0.1],   [0.0, 0.2, 1.2],   [0.6, 0.4, 0.3],
      [-0.1, 0.6, 0.6],  [-0.8, 0.3, 0.1],  [0.4, 0.1, -1.0],  [-0.6, 0.4, 0.3],
      
      // Back section spots
      [0.2, 0.0, 0.2],   [0.6, 0.4, -0.6],  [0.3, 0.7, -0.2],  [0.1, 0.1, -0.9],
      [-0.2, 0.0, 0.2],  [-0.6, 0.4, -0.6], [-0.3, 0.7, -0.2], [-0.1, 0.1, -0.9],
      [0.4, 0.2, -1.1],  [0.2, 0.5, -0.4],  [0.7, 0.1, -0.8],  [0.0, 0.3, -1.3],
      [-0.4, 0.2, -1.1], [-0.2, 0.5, -0.4], [-0.7, 0.1, -0.8], [0.5, 0.0, -1.2],
      
      // Additional dense spots for realistic pattern
      [0.3, 0.1, 0.5],   [0.5, 0.4, 0.1],   [0.2, 0.6, 0.8],   [0.6, 0.2, 0.9],
      [-0.3, 0.1, 0.5],  [-0.5, 0.4, 0.1],  [-0.2, 0.6, 0.8],  [-0.6, 0.2, 0.9],
      [0.1, 0.5, 0.4],   [0.8, 0.1, 0.2],   [0.4, 0.3, -0.1],  [0.2, 0.7, 0.5],
      [-0.1, 0.5, 0.4],  [-0.8, 0.1, 0.2],  [-0.4, 0.3, -0.1], [-0.2, 0.7, 0.5],
      
      // Top spine spots
      [0.0, 0.7, 0.9],   [0.0, 0.8, 0.3],   [0.0, 0.6, -0.2],  [0.0, 0.5, -0.7],
      [0.0, 0.4, -1.1],  [0.0, 0.7, 0.6],   [0.0, 0.8, 0.0],   [0.0, 0.6, -0.5],
      
      // Side accent spots
      [0.7, 0.3, 0.5],   [0.8, 0.2, -0.2],  [0.6, 0.5, -0.9],  [0.5, 0.1, 0.8],
      [-0.7, 0.3, 0.5],  [-0.8, 0.2, -0.2], [-0.6, 0.5, -0.9], [-0.5, 0.1, 0.8]
    ];
    
    spotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(spot);
    });
  }

  addLeopardSpots() {
    // Add black rosette spots to leopard body for more realistic leopard pattern
    const spotGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const spotMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Leopard rosette pattern - dense spots covering body
    const spotPositions = [
      // Main body spots
      [0.3, 0.4, 0.9],   [0.5, 0.2, 0.7],   [0.2, 0.5, 0.5],   [0.6, 0.3, 0.3],
      [-0.3, 0.4, 0.9],  [-0.5, 0.2, 0.7],  [-0.2, 0.5, 0.5],  [-0.6, 0.3, 0.3],
      [0.4, 0.1, 0.1],   [0.1, 0.6, 0.2],   [0.7, 0.0, 0.0],   [0.3, 0.2, -0.2],
      [-0.4, 0.1, 0.1],  [-0.1, 0.6, 0.2],  [-0.7, 0.0, 0.0],  [-0.3, 0.2, -0.2],
      // Back section spots
      [0.5, 0.3, -0.4],  [0.2, 0.4, -0.6],  [0.6, 0.1, -0.8],  [0.1, 0.2, -1.0],
      [-0.5, 0.3, -0.4], [-0.2, 0.4, -0.6], [-0.6, 0.1, -0.8], [-0.1, 0.2, -1.0],
      [0.4, 0.5, -0.3],  [0.3, 0.0, -0.5],  [0.8, 0.2, -0.2],  [0.0, 0.3, -0.9],
      [-0.4, 0.5, -0.3], [-0.3, 0.0, -0.5], [-0.8, 0.2, -0.2], [0.2, 0.6, -0.7],
      // Additional smaller spots for density
      [0.1, 0.3, 0.8],   [0.4, 0.4, 0.6],   [0.6, 0.5, 0.4],   [0.2, 0.1, 0.2],
      [-0.1, 0.3, 0.8],  [-0.4, 0.4, 0.6],  [-0.6, 0.5, 0.4],  [-0.2, 0.1, 0.2],
      [0.3, 0.6, -0.1],  [0.5, 0.0, -0.6],  [0.1, 0.4, -0.4],  [0.7, 0.2, -0.9],
      [-0.3, 0.6, -0.1], [-0.5, 0.0, -0.6], [-0.1, 0.4, -0.4], [-0.7, 0.2, -0.9]
    ];
    
    spotPositions.forEach(pos => {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set(pos[0], pos[1], pos[2]);
      this.mesh.add(spot);
    });
  }

  addBoarMuscles() {
    // Add muscle definition to boar body with darker shading
    const muscleGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
    const muscleMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x333333, // Darker gray for muscle definition
      transparent: true,
      opacity: 0.8
    });
    
    // Shoulder muscles
    const shoulderMuscles = [
      { pos: [0.6, 0.3, 0.8], scale: [1.0, 1.2, 1.0] },  // Right shoulder
      { pos: [-0.6, 0.3, 0.8], scale: [1.0, 1.2, 1.0] }, // Left shoulder
      { pos: [0.7, 0.1, 0.5], scale: [0.8, 1.0, 0.8] },  // Right upper arm
      { pos: [-0.7, 0.1, 0.5], scale: [0.8, 1.0, 0.8] }  // Left upper arm
    ];
    
    shoulderMuscles.forEach(muscle => {
      const muscleMesh = new THREE.Mesh(muscleGeometry, muscleMaterial);
      muscleMesh.position.set(muscle.pos[0], muscle.pos[1], muscle.pos[2]);
      muscleMesh.scale.set(muscle.scale[0], muscle.scale[1], muscle.scale[2]);
      this.mesh.add(muscleMesh);
    });
    
    // Back muscles
    const backMuscleGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.6);
    const backMuscles = [
      { pos: [0.5, 0.4, 0.0], scale: [1.0, 1.0, 1.0] },  // Right back
      { pos: [-0.5, 0.4, 0.0], scale: [1.0, 1.0, 1.0] }, // Left back
      { pos: [0.3, 0.5, -0.5], scale: [0.8, 0.8, 1.0] }, // Right rear
      { pos: [-0.3, 0.5, -0.5], scale: [0.8, 0.8, 1.0] } // Left rear
    ];
    
    backMuscles.forEach(muscle => {
      const muscleMesh = new THREE.Mesh(backMuscleGeometry, muscleMaterial);
      muscleMesh.position.set(muscle.pos[0], muscle.pos[1], muscle.pos[2]);
      muscleMesh.scale.set(muscle.scale[0], muscle.scale[1], muscle.scale[2]);
      this.mesh.add(muscleMesh);
    });
  }
  
  createHealthBar() {
    // Create health bar container
    const barWidth = 2.0;
    const barHeight = 0.2;
    
    // Background bar (red)
    const bgGeometry = new THREE.BoxGeometry(barWidth, barHeight, 0.1);
    const bgMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarBg.position.set(0, 2.5, 0); // Above animal
    this.healthBarBg.visible = false;
    this.mesh.add(this.healthBarBg);
    
    // Health bar (green)
    const healthGeometry = new THREE.BoxGeometry(barWidth, barHeight, 0.1);
    const healthMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.set(0, 2.5, 0.05); // Slightly in front
    this.healthBar.visible = false;
    this.mesh.add(this.healthBar);
    
    // Timer for hiding health bar
    this.healthBarTimer = 0;
  }
  
  showHealthBar() {
    if (this.healthBarBg && this.healthBar) {
      this.healthBarBg.visible = true;
      this.healthBar.visible = true;
      this.healthBarTimer = 5.0; // Show for 5 seconds (increased from 3)
      this.updateHealthBarScale();
    }
  }
  
  updateHealthBarScale() {
    if (this.healthBar) {
      const healthRatio = this.health / this.maxHealth;
      this.healthBar.scale.x = healthRatio;
      this.healthBar.position.x = -(1.0 - healthRatio) * 1.0; // Adjust position for left alignment
    }
  }
  
  hideHealthBar() {
    if (this.healthBarBg && this.healthBar) {
      this.healthBarBg.visible = false;
      this.healthBar.visible = false;
    }
  }
  
  flipUpsideDown() {
    if (this.mesh) {
      // Flip the animal upside down (180 degrees around Z-axis)
      this.mesh.rotation.z = Math.PI;
      console.log(`🦌 ${this.type} flipped upside down`);
    }
  }
  
  // Health management
  takeDamage(amount, attacker = null) {
    console.log(`🦌 ${this.type} taking ${amount} damage (health: ${this.health} -> ${Math.max(0, this.health - amount)})`);
    this.health = Math.max(0, this.health - amount);
    
    // Show health bar when attacked
    this.showHealthBar();
    
    // React to being attacked
    if (attacker && this.isAlive()) {
      this.reactToAttack(attacker);
    }
    
    if (this.health <= 0) {
      this.setState('dead');
      this.flipUpsideDown();
      console.log(`🦌 ${this.type} is now dead`);
    }
  }
  
  reactToAttack(attacker) {
    console.log(`🦌 ${this.type} reacting to attack from ${attacker.constructor.name}`);
    
    // Set the attacker as target
    this.setTarget(attacker.position);
    
    // ALL prey fight back when attacked
    this.setAIState('aggressive');
    console.log(`🦌 ${this.type} becoming aggressive and fighting back!`);
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  isAlive() {
    return this.health > 0;
  }
  
  // Stamina management
  consumeStamina(amount) {
    this.stamina = Math.max(0, this.stamina - amount);
  }
  
  restoreStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }
  
  // Position and movement
  setPosition(x, y, z) {
    this.position.set(x, y, z);
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }
  
  distanceTo(target) {
    return Math.sqrt(
      Math.pow(this.position.x - target.x, 2) +
      Math.pow(this.position.y - (target.y || 0), 2) +
      Math.pow(this.position.z - target.z, 2)
    );
  }
  
  // State management
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.lastStateChange = Date.now();
      this.stateTimer = 0;
    }
  }
  
  // AI behavior
  setAIState(newState) {
    this.aiState = newState;
  }
  
  setTarget(target) {
    this.target = target;
  }
  
  clearTarget() {
    this.target = null;
  }
  
  canDetect(threat) {
    return this.distanceTo(threat) <= this.detectionRadius;
  }
  
  shouldFlee(threat) {
    return this.distanceTo(threat) <= this.fleeDistance;
  }
  
  canAttack(target) {
    // All animals can attack when in aggressive state (fighting back)
    if (this.aiState === 'aggressive') {
      return this.distanceTo(target) <= this.attackRange;
    }
    // Otherwise, only predators and boars can initiate attacks
    return (this.behaviorType === 'predator' || this.type === 'boar') && this.distanceTo(target) <= this.attackRange;
  }
  
  attack(target) {
    if (!this.canAttack(target)) return false;
    
    console.log(`🦌 ${this.type} attacking ${target.constructor.name} with ${this.power} damage`);
    
    // Apply damage to target
    if (target.takeDamage) {
      target.takeDamage(this.power, this);
      console.log(`🦌 ${this.type} dealt ${this.power} damage to tiger`);
    }
    
    return true;
  }
  
  // Experience and rewards
  getExperienceReward() {
    switch (this.behaviorType) {
      case 'prey':
        return 25;
      case 'predator':
        return 50;
      default:
        return 35;
    }
  }
  
  getHealthRestoration() {
    return 30;
  }
  
  // Update cycle
  update(deltaTime) {
    if (!this.isAlive()) return;
    
    // Clamp delta time to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.1);
    
    // Update timers
    this.stateTimer += deltaTime;
    this.staminaRegenTimer += deltaTime;
    
    // Update health bar timer
    if (this.healthBarTimer > 0) {
      this.healthBarTimer -= deltaTime;
      if (this.healthBarTimer <= 0) {
        this.hideHealthBar();
      }
    }
    
    // Regenerate stamina over time
    if (this.staminaRegenTimer >= 0.5) { // Every 0.5 seconds
      this.restoreStamina(5);
      this.staminaRegenTimer = 0;
    }
    
    // Update AI behavior
    this.updateAI(deltaTime);
    
    // Update position based on velocity
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Sync mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
    }
  }
  
  updateAI(deltaTime) {
    // Basic AI state machine
    switch (this.aiState) {
      case 'idle':
        this.handleIdleState(deltaTime);
        break;
      case 'grazing':
        this.handleGrazingState(deltaTime);
        break;
      case 'moving':
        this.handleMovingState(deltaTime);
        break;
      case 'alert':
        this.handleAlertState(deltaTime);
        break;
      case 'fleeing':
        this.handleFleeingState(deltaTime);
        break;
      case 'aggressive':
        this.handleAggressiveState(deltaTime);
        break;
    }
  }
  
  handleIdleState(deltaTime) {
    // More frequent state changes
    if (this.stateTimer > 1.0 && Math.random() < 0.3) {
      const nextState = Math.random() < 0.6 ? 'grazing' : 'moving';
      this.setAIState(nextState);
    }
  }
  
  handleGrazingState(deltaTime) {
    // Graze for a while, then return to idle
    if (this.stateTimer > 3.0) {
      this.setAIState('idle');
    }
  }
  
  handleMovingState(deltaTime) {
    // Move randomly for a while, then either idle or keep moving
    if (this.stateTimer > 3.0) {
      const nextState = Math.random() < 0.5 ? 'idle' : 'moving';
      this.setAIState(nextState);
    }
  }
  
  handleAlertState(deltaTime) {
    // Stay alert for a moment
    if (this.stateTimer > 1.0) {
      this.setAIState('idle');
    }
  }
  
  handleFleeingState(deltaTime) {
    // Flee for a longer period
    if (this.stateTimer > 4.0) {
      this.setAIState('idle');
    }
  }
  
  handleAggressiveState(deltaTime) {
    // Aggressive behavior for predators
    if (this.stateTimer > 2.0) {
      this.setAIState('idle');
    }
  }
  
  // Cleanup
  dispose() {
    if (this.mesh) {
      this.mesh.clear();
      this.mesh = null;
    }
    
    this.mixers.forEach(mixer => mixer.stopAllAction());
    this.mixers = [];
  }
  
  // Get mesh for adding to scene
  getMesh() {
    return this.mesh;
  }
  
  // Tiger interaction methods
  canInteractWithTiger(playerTiger) {
    if (this.species !== 'tiger') return false;
    
    const distance = this.distanceTo(playerTiger.position);
    const interactionRange = 5.0; // Interaction range for tigers
    
    return distance <= interactionRange;
  }
  
  shouldMateWith(playerTiger) {
    // Only mate with opposite gender
    if (this.gender === playerTiger.gender) return false;
    
    // 50% chance to be interested in mating
    return Math.random() < 0.5;
  }
  
  shouldFightWith(playerTiger) {
    // Only fight with same gender (territorial behavior)
    if (this.gender !== playerTiger.gender) return false;
    
    // Always territorial with same gender
    return true;
  }
  
  attemptMating(playerTiger) {
    console.log(`💕 ${this.gender} tiger attempting to mate with ${playerTiger.gender} player tiger`);
    
    // Mating success provides benefits to both tigers
    const matingBonus = {
      health: 20,
      stamina: 30,
      experience: 50
    };
    
    // Apply bonuses to both tigers
    this.health = Math.min(this.maxHealth, this.health + matingBonus.health);
    this.stamina = Math.min(this.maxStamina, this.stamina + matingBonus.stamina);
    
    // Set state to content/resting after mating
    this.setAIState('content');
    this.stateTimer = 0;
    
    return {
      success: true,
      bonus: matingBonus,
      message: `Successfully mated with ${this.gender} tiger! Both tigers gained health and stamina.`
    };
  }
  
  initiateFight(playerTiger) {
    console.log(`⚔️ ${this.gender} tiger challenging ${playerTiger.gender} player tiger to territorial fight`);
    
    // Set to aggressive state
    this.setAIState('aggressive');
    this.setTarget(playerTiger);
    this.stateTimer = 0;
    
    // Calculate fight outcome based on stats
    const playerPower = playerTiger.power + (playerTiger.level * 5);
    const wildPower = this.power + Math.random() * 20; // Add some randomness
    
    const fightResult = {
      playerWins: playerPower > wildPower,
      powerDifference: Math.abs(playerPower - wildPower),
      wildTigerPower: wildPower,
      playerPower: playerPower
    };
    
    return fightResult;
  }
  
  getInteractionType(playerTiger) {
    if (!this.canInteractWithTiger(playerTiger)) return null;
    
    if (this.gender !== playerTiger.gender) {
      // Opposite gender - potential mating
      return this.shouldMateWith(playerTiger) ? 'mate' : 'neutral';
    } else {
      // Same gender - territorial fighting
      return 'fight';
    }
  }
}
import { Tiger } from '../entities/Tiger.js';
import { TigerModel } from '../entities/TigerModel.js';
import { Terrain } from '../entities/Terrain.js';
import { CameraSystem } from './Camera.js';
import { InputSystem } from './Input.js';
import { MovementSystem } from './Movement.js';
import { VegetationSystem } from './VegetationSystem.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { WaterSystem } from './WaterSystem.js';
import { UnderwaterSystem } from './UnderwaterSystem.js';
import { AnimalSystem } from './AnimalSystem.js';
import { UISystem } from './UISystem.js';
import { GameSave } from './GameSave.js';
import { MainMenu } from './MainMenu.js';
import { ScentTrailSystem } from './ScentTrailSystem.js';
import { TigerTraceSystem } from './TigerTraceSystem.js';
import { AmbushSystem } from './AmbushSystem.js';

export class GameController {
  constructor(scene, canvas) {
    if (!scene) {
      throw new Error('Scene is required');
    }
    if (!canvas) {
      throw new Error('Canvas is required');
    }

    this.scene = scene;
    this.canvas = canvas;

    // Game state
    this.isPaused = false;
    this.isPointerLocked = false;
    this.isUnderwater = false;
    this.underwaterSystemReady = false;
    this.gameInitialized = false;
    this.totalPlayTime = 0;

    // Initialize save system and main menu
    this.gameSave = new GameSave();
    this.mainMenu = new MainMenu();
    
    // Show main menu first
    this.showMainMenu();
    
    // Expose debug API
    this.exposeDebugAPI();
  }

  initializeSystems() {
    // Create terrain system
    this.terrain = new Terrain(512, 512, 128);
    this.terrain.generateHeightmap(12345); // Use consistent seed for now

    // Create terrain renderer and add to scene
    this.terrainRenderer = new TerrainRenderer(this.terrain);
    this.scene.add(this.terrainRenderer.getMesh());

    // Create tiger entity and model with selected gender
    const gender = this.selectedGender || 'male';
    this.tiger = new Tiger(gender);
    this.tigerModel = new TigerModel(gender);

    // Create camera system
    this.camera = new CameraSystem(this.canvas.width, this.canvas.height);

    // Create input system
    this.input = new InputSystem(this.canvas);

    // Create movement system
    this.movementSystem = new MovementSystem(this.tiger, this.terrain);

    // Create water system FIRST
    this.waterSystem = new WaterSystem(this.terrain);
    const waterMeshes = this.waterSystem.getWaterMeshes();
    waterMeshes.forEach(mesh => this.scene.add(mesh));

    // Create vegetation system AFTER water system
    this.vegetationSystem = new VegetationSystem(this.scene, this.terrain, this.waterSystem);
    this.vegetationSystem.generateVegetation(12345); // Use consistent seed - now avoids water

    // Create animal system AFTER vegetation system
    this.animalSystem = new AnimalSystem(this.scene, this.terrain, this.waterSystem, this.vegetationSystem);
    console.log('🦌 GameController: Animal system created');
    
    // Set up animal system callback for auto-save
    this.animalSystem.onAnimalEaten = (animal) => {
      console.log(`🍖 Tiger ate a ${animal.type}! Auto-saving...`);
      const success = this.autosaveGame('prey_eaten');
      if (success && this.uiSystem) {
        this.uiSystem.showSaveStatus(`Game saved after eating ${animal.type}`);
      }
    };

    // Create ambush system AFTER animal system (depends on terrain, water, vegetation, and animal systems)
    this.ambushSystem = new AmbushSystem(this.scene, this.terrain, this.waterSystem, this.vegetationSystem, this.animalSystem);
    this.ambushSystem.initialize();
    console.log('🎯 GameController: Ambush system created and initialized');

    // Create UI system
    this.uiSystem = new UISystem();
    console.log('🎮 GameController: UI system created');

    // Create scent trail system
    console.log('🎮 GameController: Creating scent trail system...');
    this.scentTrailSystem = new ScentTrailSystem(this.scene);
    
    // Create tiger trace system
    console.log('🎮 GameController: Creating tiger trace system...');
    this.tigerTraceSystem = new TigerTraceSystem(this.scene);

    // Create underwater system
    console.log('🎮 GameController: Creating underwater system...');
    this.underwaterSystem = new UnderwaterSystem(this.terrain, this.waterSystem);
    
    // Add underwater meshes to scene (initially hidden)
    const underwaterMeshes = this.underwaterSystem.getUnderwaterMeshes();
    console.log(`🎮 GameController: Adding ${underwaterMeshes.length} underwater meshes to scene`);
    underwaterMeshes.forEach((mesh, index) => {
      mesh.visible = false; // Hidden by default
      this.scene.add(mesh);
      // console.log(`  Added mesh ${index + 1}: ${mesh.constructor.name} at (${mesh.position.x.toFixed(1)}, ${mesh.position.y.toFixed(1)}, ${mesh.position.z.toFixed(1)})`);
    });
    
    // Mark underwater system as ready
    this.underwaterSystemReady = true;
    console.log('🎮 GameController: Underwater system ready for teleportation');

    // Connect water system to movement system
    this.movementSystem.setWaterSystem(this.waterSystem);
    
    // Connect underwater system to movement system
    this.movementSystem.setUnderwaterSystem(this.underwaterSystem);

    // Position tiger on terrain surface
    this.positionTigerOnTerrain();

    // Add tiger model to scene
    this.scene.add(this.tigerModel.getMesh());
  }

  setupConnections() {
    // Set camera target to follow tiger model
    this.camera.setTarget(this.tigerModel);

    // Setup input callbacks
    this.input.onMouseWheel = (event) => {
      this.camera.handleMouseWheel(event);
    };

    this.input.onPointerLockChange = (isLocked) => {
      this.isPointerLocked = isLocked;
    };
  }

  update(deltaTime) {
    if (this.isPaused || !this.gameInitialized) return;
    
    // Track total play time
    this.totalPlayTime += deltaTime;

    try {
      // Update systems in correct order
      this.input.update(deltaTime);
      
      // Process input and apply to movement
      this.processInput();
      
      // Update movement system
      this.movementSystem.update(deltaTime);
      
      // Update tiger logic
      this.tiger.update(deltaTime);
      
      // Sync tiger state to model
      this.syncTigerToModel();
      
      // Update 3D model
      this.tigerModel.update(deltaTime);
      
      // Update vegetation system (for wind effects, etc.)
      if (this.vegetationSystem) {
        this.vegetationSystem.update(deltaTime);
      }
      
      // Update water system (for wave animation)
      if (this.waterSystem) {
        this.waterSystem.update(deltaTime, this.camera.camera);
      }
      
      // Update animal system (for wildlife behavior)
      if (this.animalSystem) {
        this.animalSystem.update(deltaTime, this.tiger);
      }
      
      // Update ambush system (for predator ambushes)
      if (this.ambushSystem) {
        this.ambushSystem.update(deltaTime, this.tiger);
      }
      
      // Update UI system (for stats display)
      if (this.uiSystem) {
        this.uiSystem.updateStats(this.tiger);
      }
      
      // Update scent trail system (for trail fading)
      if (this.scentTrailSystem) {
        this.scentTrailSystem.update(deltaTime);
      }
      
      // Update tiger trace system (for trace fading and updates)
      if (this.tigerTraceSystem) {
        this.tigerTraceSystem.update(deltaTime);
      }
      
      // Update underwater system (for seaweed animation)
      if (this.underwaterSystem) {
        this.underwaterSystem.update(deltaTime);
        
        // Check bubble collisions when underwater
        if (this.isUnderwater) {
          const poppedBubbles = this.underwaterSystem.checkBubbleCollisions(
            this.tiger.position.x,
            this.tiger.position.y,
            this.tiger.position.z
          );
          
          if (poppedBubbles.length > 0) {
            console.log(`💥 Popped ${poppedBubbles.length} bubble(s)!`);
          }
        } else {
          // Debug: check if we're supposed to be underwater
          if (this.underwaterSystem && this.underwaterSystem.isActive) {
            console.log(`⚠️ DEBUG: UnderwaterSystem is active but GameController isUnderwater=${this.isUnderwater}`);
          }
        }
      }
      
      // Update camera
      this.camera.update(deltaTime);
      
      // Log position sync issues
      this.logPositionSync();
      
    } catch (error) {
      console.error('GameController update error:', error);
      // Continue running despite errors
    }
  }

  teleportToUnderwaterTerrain() {
    if (!this.isUnderwater && this.underwaterSystemReady) {
      // Teleport to underwater terrain
      this.isUnderwater = true;
      this.underwaterSystem.activate();
      console.log('🌊 TELEPORTING TO UNDERWATER TERRAIN');
      
      // Hide surface water/lakes
      const waterMeshes = this.waterSystem.getWaterMeshes();
      waterMeshes.forEach(mesh => {
        mesh.visible = false;
      });
      
      // Hide vegetation (trees) - replace with seagrass in underwater
      if (this.vegetationSystem) {
        const vegMeshes = this.vegetationSystem.getVegetationMeshes();
        vegMeshes.forEach(mesh => {
          mesh.visible = false;
        });
      }
      
      
      // Change terrain color to brown underwater
      const terrainMesh = this.terrainRenderer.getMesh();
      if (terrainMesh && terrainMesh.material) {
        terrainMesh.material.color.setHex(0xb8691a); // Brighter brown underwater ground
      }
      
      // Find the nearest water body center for teleportation
      const waterBodies = this.waterSystem.getWaterBodies();
      const tigerPos = this.tiger.position;
      let nearestWaterBody = null;
      let minDistance = Infinity;
      
      for (const waterBody of waterBodies) {
        if ((waterBody.type === 'lake' || waterBody.type === 'pond') && waterBody.center) {
          const distance = Math.sqrt(
            Math.pow(tigerPos.x - waterBody.center.x, 2) + 
            Math.pow(tigerPos.z - waterBody.center.z, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestWaterBody = waterBody;
          }
        }
      }
      
      if (nearestWaterBody) {
        // Store surface position before teleporting
        const surfaceX = this.tiger.position.x;
        const surfaceZ = this.tiger.position.z;
        
        // Teleport to underwater terrain level - much safer positioning
        const terrainHeight = this.terrain.getHeightAt(nearestWaterBody.center.x, nearestWaterBody.center.z);
        const underwaterDepth = 8 + (nearestWaterBody.radius * 0.1);
        const underwaterY = terrainHeight - underwaterDepth + 3.0; // Higher above floor for safety
        
        // Reset velocity to prevent momentum issues
        this.movementSystem.setVelocity(0, 0, 0);
        
        this.tiger.position.set(
          nearestWaterBody.center.x,
          underwaterY,
          nearestWaterBody.center.z
        );
        
        console.log(`🐅 Tiger safely teleported to underwater at (${nearestWaterBody.center.x}, ${underwaterY.toFixed(1)}, ${nearestWaterBody.center.z})`);
      }
      
      // Change to underwater controls AFTER positioning
      this.movementSystem.setUnderwaterMode(true);
    } else if (!this.underwaterSystemReady) {
      console.log('⚠️ Underwater system not ready yet, please wait...');
    }
  }

  teleportToSurface() {
    if (this.isUnderwater) {
      // Teleport back to surface
      this.isUnderwater = false;
      this.underwaterSystem.deactivate();
      console.log('🏊 TELEPORTING BACK TO SURFACE');
      
      // Show surface water/lakes again
      const waterMeshes = this.waterSystem.getWaterMeshes();
      waterMeshes.forEach(mesh => {
        mesh.visible = true;
      });
      
      // Show vegetation (trees) again
      if (this.vegetationSystem) {
        const vegMeshes = this.vegetationSystem.getVegetationMeshes();
        vegMeshes.forEach(mesh => {
          mesh.visible = true;
        });
      }
      
      
      // Restore terrain color to normal
      const terrainMesh = this.terrainRenderer.getMesh();
      if (terrainMesh && terrainMesh.material) {
        terrainMesh.material.color.setHex(0x4d7c2a); // Brighter green terrain color
      }
      
      // Reset velocity first to prevent conflicts
      this.movementSystem.setVelocity(0, 0, 0);
      
      // Keep same X,Z position but move to safe surface level
      const terrainHeight = this.terrain.getHeightAt(this.tiger.position.x, this.tiger.position.z);
      this.tiger.position.y = terrainHeight + 2.5; // Higher surface level for safety
      
      console.log(`🐅 Tiger safely teleported to surface at height: ${this.tiger.position.y.toFixed(1)}`);
      
      // Return to surface controls AFTER safe positioning
      this.movementSystem.setUnderwaterMode(false);
    }
  }
  

  logPositionSync() {
    this.positionLogCounter = (this.positionLogCounter || 0) + 1;
    if (this.positionLogCounter % 120 === 0) { // Log every 120 frames (~2 seconds at 60fps)
      const tigerModelPos = this.tigerModel.getMesh().position;
      const tigerModelRot = this.tigerModel.getMesh().rotation;
      const positionDiff = Math.abs(this.tiger.position.x - tigerModelPos.x) + 
                          Math.abs(this.tiger.position.y - tigerModelPos.y) + 
                          Math.abs(this.tiger.position.z - tigerModelPos.z);
      
      if (positionDiff > 0.1) { // Only log if there's a significant difference
        console.log('⚠️ POSITION SYNC ISSUE:', JSON.stringify({
          tiger: {
            entity: { x: this.tiger.position.x.toFixed(2), y: this.tiger.position.y.toFixed(2), z: this.tiger.position.z.toFixed(2) },
            model: { x: tigerModelPos.x.toFixed(2), y: tigerModelPos.y.toFixed(2), z: tigerModelPos.z.toFixed(2) },
            difference: positionDiff.toFixed(3)
          },
          camera: {
            pos: { x: this.camera.camera.position.x.toFixed(2), y: this.camera.camera.position.y.toFixed(2), z: this.camera.camera.position.z.toFixed(2) },
            target: this.camera.target ? 'TigerModel' : 'null'
          }
        }, null, 2));
      }
    }
  }

  processInput() {
    // Get movement input based on underwater mode
    const movementInput = {
      direction: this.isUnderwater ? 
        this.input.getUnderwaterMovementDirection() : // Underwater: T/G/F/H movement
        this.input.getMovementDirection(), // Surface: W/S forward/backward only
      rotation: this.isUnderwater ? 
        this.input.getUnderwaterRotationDirection() : // Underwater: Q/E rotation
        this.input.getRotationDirection(), // Surface: A/D rotation
      isRunning: this.input.isRunning(),
      isCrouching: this.input.isCrouching(),
      isJumping: this.input.isJumping(),
      isDiving: this.input.isDiving(), // R key for diving in water
      isHunting: this.input.isHunting(), // Z key for hunting
      isInteracting: this.input.isInteracting(), // E key for eating
      isUsingLaserBreath: this.input.isUsingLaserBreath(), // L key for laser breath (Alpha only)
      isUnderwaterMode: this.isUnderwater
    };

    // Log input data when there's significant input (throttled)
    const inputMagnitude = Math.abs(movementInput.direction.z);
    const rotationMagnitude = Math.abs(movementInput.rotation);
    if (inputMagnitude > 0.1 || rotationMagnitude > 0.1) {
      // Only log every 30 frames to reduce spam
      this.inputLogCounter = (this.inputLogCounter || 0) + 1;
      if (this.inputLogCounter % 30 === 0) {
        const movementLog = {
          movement: {
            z: movementInput.direction.z.toFixed(2),
            magnitude: inputMagnitude.toFixed(2)
          },
          rotation: movementInput.rotation.toFixed(2),
          isRunning: movementInput.isRunning,
          isCrouching: movementInput.isCrouching,
          isJumping: movementInput.isJumping,
          isDiving: movementInput.isDiving,
          pointerLocked: this.isPointerLocked
        }
        // console.log('🎮 TANK CONTROLS INPUT:', JSON.stringify(movementLog, null, 2));
      }
    }

    // Handle teleportation between surface and underwater terrain
    if (movementInput.isDiving && !this.isUnderwater) {
      // R key: Teleport to underwater terrain (only when on surface)
      this.teleportToUnderwaterTerrain();
    }
    
    if (movementInput.isJumping && this.isUnderwater) {
      // Space key while underwater: Teleport back to surface
      this.teleportToSurface();
      // Don't pass jumping to movement system when teleporting
      movementInput.isJumping = false;
    }

    // Handle hunting
    if (movementInput.isHunting && this.animalSystem && !this.isUnderwater) {
      // Z key: Attempt to hunt nearby animals (only on surface)
      console.log('🎯 Hunt key pressed! Attempting to hunt...');
      console.log(`🎯 Tiger position: (${this.tiger.position.x.toFixed(1)}, ${this.tiger.position.y.toFixed(1)}, ${this.tiger.position.z.toFixed(1)})`);
      console.log(`🎯 Tiger evolution stage: ${this.tiger.evolutionStage}`);
      console.log(`🎯 Tiger attack range: ${this.tiger.getAttackRange()}`);
      console.log(`🎯 Total animals in system: ${this.animalSystem.getAnimalCount()}`);
      
      const huntSuccess = this.animalSystem.attemptHunt(this.tiger);
      if (huntSuccess) {
        console.log('🎯 Hunt successful!');
      } else {
        console.log('🎯 Hunt failed - no animals in range');
      }
    } else if (movementInput.isHunting && this.isUnderwater) {
      console.log('🎯 Hunt key pressed but tiger is underwater - hunting disabled');
    } else if (movementInput.isHunting && !this.animalSystem) {
      console.log('🎯 Hunt key pressed but animal system not available');
    }

    // Handle laser breath
    if (movementInput.isUsingLaserBreath && this.animalSystem && !this.isUnderwater) {
      // L key: Use laser breath (Alpha tigers only, only on surface)
      console.log('🔴 Laser breath key pressed! Attempting laser attack...');
      const animals = this.animalSystem.getAnimals();
      const laserSuccess = this.tiger.useLaserBreath(animals, this.tigerModel);
      if (laserSuccess) {
        console.log('🔴 Laser breath successful!');
      } else {
        console.log('🔴 Laser breath failed - no targets hit or tiger not Alpha');
      }
    }

    // Handle eating
    if (movementInput.isInteracting && this.animalSystem && !this.isUnderwater) {
      // E key: Attempt to eat nearby dead animals (only on surface)
      console.log('🍖 Eat key pressed! Attempting to eat...');
      const eatSuccess = this.animalSystem.attemptEat(this.tiger);
      if (eatSuccess) {
        console.log('🍖 Eating successful! +20 hunger');
      } else {
        console.log('🍖 Eating failed - no dead animals in range');
      }
    }


    // Handle scent trail
    if (this.input.keys.scentTrail && this.scentTrailSystem && this.animalSystem && !this.isUnderwater) {
      // M key: Create scent trail to nearest animal
      console.log('🟣 Scent trail key pressed! Creating trail...');
      const nearestAnimal = this.scentTrailSystem.findNearestAnimal(this.tiger.position, this.animalSystem);
      if (nearestAnimal) {
        this.scentTrailSystem.createTrail(this.tiger.position, nearestAnimal);
        console.log(`🟣 Scent trail created to ${nearestAnimal.type}`);
      } else {
        console.log('🟣 No animals found for scent trail');
      }
    }

    // Handle menu toggle
    if (this.input.keys.Escape && !this.mainMenu.isVisible) {
      console.log('🎮 Escape pressed - showing menu');
      this.showMainMenu();
    }

    // Apply to movement system
    this.movementSystem.setMovementInput(movementInput);

    // Handle camera control with mouse movement
    const mouseDelta = this.input.getMouseDelta();
    
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      console.log('🔍 MOUSE INPUT:', {
        delta: {
          x: mouseDelta.x.toFixed(2),
          y: mouseDelta.y.toFixed(2)
        },
        pointerLocked: this.isPointerLocked
      });
      
      // Create a mock event for camera system
      const mockEvent = {
        movementX: mouseDelta.x,
        movementY: mouseDelta.y,
        buttons: 0 // No buttons needed for pointer lock
      };
      this.camera.handleMouseMove(mockEvent);
    }
  }

  syncTigerToModel() {
    // Sync position
    this.tigerModel.setPosition(
      this.tiger.position.x,
      this.tiger.position.y,
      this.tiger.position.z
    );

    // Sync rotation (only Y-axis rotation for turning)
    if (this.tiger.rotation !== undefined) {
      this.tigerModel.setRotation(0, this.tiger.rotation.y, 0);
    }

    // Sync animation based on tiger state
    this.tigerModel.playAnimation(this.tiger.state);

    // Handle evolution changes
    if (this.tiger.evolutionStage !== this.tigerModel.evolutionStage) {
      try {
        console.log(`🔄 Evolution detected: ${this.tigerModel.evolutionStage} -> ${this.tiger.evolutionStage}`);
        switch (this.tiger.evolutionStage) {
          case 'Adult':
            this.tigerModel.evolveToAdult();
            console.log('🟤 Adult evolution completed');
            break;
          case 'Alpha':
            this.tigerModel.evolveToAlpha();
            console.log('🔴 Alpha evolution completed');
            break;
        }
      } catch (error) {
        console.error('❌ Error during evolution:', error);
        // Reset to prevent infinite loop
        this.tigerModel.evolutionStage = this.tiger.evolutionStage;
      }
    }
  }

  // Public API methods
  getGameState() {
    return {
      tiger: this.tiger,
      camera: this.camera,
      isPointerLocked: this.isPointerLocked
    };
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  resize(width, height) {
    this.camera.updateAspectRatio(width, height);
  }

  // Get camera for rendering
  getCamera() {
    return this.camera.getCamera();
  }

  // Get scene objects (for physics/collision systems)
  getSceneObjects() {
    return [this.tigerModel.getMesh()];
  }

  // Reset game state
  reset() {
    // Reset terrain with new heightmap
    if (this.terrain) {
      this.terrain.generateHeightmap();
      
      // Update terrain renderer
      if (this.terrainRenderer) {
        this.terrainRenderer.updateTerrain();
      }
    }

    // Reset vegetation
    if (this.vegetationSystem) {
      this.vegetationSystem.generateVegetation();
    }
    

    // Reset tiger to starting state
    this.tiger = new Tiger();
    
    // Reset movement system
    this.movementSystem.reset();
    
    // Reset camera
    this.camera.reset();
    
    // Reset tiger model
    this.tigerModel.dispose();
    this.scene.remove(this.tigerModel.getMesh());
    
    this.tigerModel = new TigerModel();
    this.scene.add(this.tigerModel.getMesh());
    
    // Re-establish connections
    this.camera.setTarget(this.tigerModel);
    this.movementSystem.tiger = this.tiger;
    this.movementSystem.setTerrain(this.terrain);
    
    // Position tiger on terrain
    this.positionTigerOnTerrain();
    
    // Sync initial state
    this.syncTigerToModel();
  }

  // Make debug function globally accessible
  exposeDebugAPI() {
    if (typeof window !== 'undefined') {
      window.tigerGame = {
        logState: () => this.logGameState(),
        getTigerPosition: () => this.getTigerPosition(),
        getTigerStats: () => this.getTigerStats(),
        getMovementSystem: () => this.movementSystem,
        getCamera: () => this.camera,
        resetKeys: () => this.input.resetAllKeys(),
        getKeys: () => this.input.keys,
        validateKeys: () => this.input.validateKeyStates(),
        getPhysicalKeys: () => Array.from(this.input.physicalKeys),
        forceKeyState: (key, state) => {
          if (this.input.keys.hasOwnProperty(key)) {
            this.input.keys[key] = state;
            console.log(`🔧 Manually set ${key} to ${state}`);
          } else {
            console.log(`⚠️ Invalid key: ${key}`);
          }
        },
        logPositions: () => {
          const tigerModelPos = this.tigerModel.getMesh().position;
          const tigerModelRot = this.tigerModel.getMesh().rotation;
          console.log('📍 POSITION DEBUG:', JSON.stringify({
            tiger: {
              entity: { x: this.tiger.position.x.toFixed(2), y: this.tiger.position.y.toFixed(2), z: this.tiger.position.z.toFixed(2) },
              model: { x: tigerModelPos.x.toFixed(2), y: tigerModelPos.y.toFixed(2), z: tigerModelPos.z.toFixed(2) },
              entityRot: this.tiger.rotation ? (this.tiger.rotation.y * 180 / Math.PI).toFixed(1) + '°' : '0°',
              modelRot: (tigerModelRot.y * 180 / Math.PI).toFixed(1) + '°'
            },
            camera: {
              pos: { x: this.camera.camera.position.x.toFixed(2), y: this.camera.camera.position.y.toFixed(2), z: this.camera.camera.position.z.toFixed(2) },
              desired: { x: this.camera.desiredPosition.x.toFixed(2), y: this.camera.desiredPosition.y.toFixed(2), z: this.camera.desiredPosition.z.toFixed(2) },
              distance: this.camera.distance.toFixed(2)
            }
          }, null, 2));
        },
        addExperience: (amount) => {
          this.tiger.gainExperience(amount);
          console.log(`🎯 Added ${amount} XP. Tiger level: ${this.tiger.level}, XP: ${this.tiger.experience}, Stage: ${this.tiger.evolutionStage}`);
        },
        evolveToAdult: () => {
          this.tiger.level = this.tiger.adultLevel;
          this.tiger.evolve();
          console.log(`🐅 Forced evolution to Adult! Level: ${this.tiger.level}, Stage: ${this.tiger.evolutionStage}`);
        },
        evolveToAlpha: () => {
          this.tiger.level = this.tiger.alphaLevel;
          this.tiger.evolve();
          console.log(`🐅 Forced evolution to Alpha! Level: ${this.tiger.level}, Stage: ${this.tiger.evolutionStage}`);
        },
        testSave: () => {
          console.log('🎮 Testing manual save...');
          const success = this.autosaveGame('manual_test');
          console.log(`🎮 Manual save result: ${success}`);
          if (success) {
            console.log('✅ Manual save successful!');
          } else {
            console.log('❌ Manual save failed!');
          }
        },
        checkLocalStorage: () => {
          const saved = localStorage.getItem('tiger-evolution-3d-save');
          console.log('🎮 Current localStorage save:', saved);
          if (saved) {
            console.log('🎮 Parsed save data:', JSON.parse(saved));
          }
        },
        // Ambush System Debug Functions
        getAmbushSystem: () => this.ambushSystem,
        getAmbushStats: () => {
          if (!this.ambushSystem) {
            console.log('❌ AmbushSystem not initialized');
            return null;
          }
          const stats = this.ambushSystem.getStatistics();
          console.log('🎯 Ambush System Stats:', stats);
          return stats;
        },
        forceSpawnCrocodiles: () => {
          if (!this.ambushSystem) {
            console.log('❌ AmbushSystem not initialized');
            return;
          }
          console.log('🐊 Manually spawning crocodiles...');
          this.ambushSystem.spawnCrocodileAmbushers();
          const stats = this.ambushSystem.getStatistics();
          console.log(`🐊 Spawned! Active crocodiles: ${stats.activeCrocodiles}`);
        },
        forceSpawnLeopards: () => {
          if (!this.ambushSystem) {
            console.log('❌ AmbushSystem not initialized');
            return;
          }
          console.log('🐆 Manually spawning leopards...');
          this.ambushSystem.spawnLeopardAmbushers();
          const stats = this.ambushSystem.getStatistics();
          console.log(`🐆 Spawned! Active leopards: ${stats.activeLeopards}`);
        },
        enableAmbushDebug: () => {
          if (!this.ambushSystem) {
            console.log('❌ AmbushSystem not initialized');
            return;
          }
          this.ambushSystem.setDebugMode(true);
          console.log('🎯 Ambush debug mode enabled');
        },
        disableAmbushDebug: () => {
          if (!this.ambushSystem) {
            console.log('❌ AmbushSystem not initialized');
            return;
          }
          this.ambushSystem.setDebugMode(false);
          console.log('🎯 Ambush debug mode disabled');
        },
        getTigerAwareness: () => {
          if (!this.ambushSystem || !this.tiger) {
            console.log('❌ AmbushSystem or Tiger not initialized');
            return 0;
          }
          const awareness = this.ambushSystem.getTigerAwareness(this.tiger);
          const level = this.ambushSystem.ambushDetector.getAwarenessLevel();
          const color = this.ambushSystem.ambushDetector.getAwarenessColor();
          console.log(`🎯 Tiger Awareness: ${(awareness * 100).toFixed(1)}% (${level}) - Color: ${color}`);
          return awareness;
        }
      };
      console.log('🔍 Debug API exposed: window.tigerGame');
      console.log('Available commands:');
      console.log('  window.tigerGame.logState() - Log complete game state');
      console.log('  window.tigerGame.getTigerPosition() - Get tiger position');
      console.log('  window.tigerGame.getTigerStats() - Get tiger stats');
      console.log('  window.tigerGame.resetKeys() - Reset all stuck keys');
      console.log('  window.tigerGame.getKeys() - Show current key states');
      console.log('  window.tigerGame.validateKeys() - Validate and fix key states');
      console.log('  window.tigerGame.getPhysicalKeys() - Show physically pressed keys');
      console.log('  window.tigerGame.forceKeyState(key, state) - Manually set key state');
      console.log('  window.tigerGame.logPositions() - Log tiger and camera positions');
      console.log('  window.tigerGame.addExperience(amount) - Add XP to tiger');
      console.log('  window.tigerGame.evolveToAdult() - Force evolution to Adult (level 10)');
      console.log('  window.tigerGame.evolveToAlpha() - Force evolution to Alpha (level 30)');
      console.log('  window.tigerGame.testSave() - Test manual save functionality');
      console.log('  window.tigerGame.checkLocalStorage() - Check current save data');
      console.log('  === AMBUSH SYSTEM DEBUG ===');
      console.log('  window.tigerGame.getAmbushStats() - Show ambush system statistics');
      console.log('  window.tigerGame.forceSpawnCrocodiles() - Manually spawn crocodiles');
      console.log('  window.tigerGame.forceSpawnLeopards() - Manually spawn leopards');
      console.log('  window.tigerGame.enableAmbushDebug() - Enable ambush debug mode');
      console.log('  window.tigerGame.getTigerAwareness() - Check tiger awareness level');
    }
  }

  // Cleanup
  dispose() {
    // Clean up water system
    if (this.waterSystem) {
      const waterMeshes = this.waterSystem.getWaterMeshes();
      waterMeshes.forEach(mesh => this.scene.remove(mesh));
      this.waterSystem.dispose();
    }

    // Clean up vegetation system
    if (this.vegetationSystem) {
      this.vegetationSystem.dispose();
    }

    // Clean up animal system
    if (this.animalSystem) {
      this.animalSystem.dispose();
    }

    // Clean up ambush system
    if (this.ambushSystem) {
      this.ambushSystem.dispose();
    }

    // Clean up scent trail system
    if (this.scentTrailSystem) {
      this.scentTrailSystem.dispose();
    }

    // Clean up UI system
    if (this.uiSystem) {
      this.uiSystem.dispose();
    }

    // Clean up underwater system
    if (this.underwaterSystem) {
      const underwaterMeshes = this.underwaterSystem.getUnderwaterMeshes();
      underwaterMeshes.forEach(mesh => this.scene.remove(mesh));
      this.underwaterSystem.dispose();
    }

    // Clean up terrain renderer
    if (this.terrainRenderer) {
      this.scene.remove(this.terrainRenderer.getMesh());
      this.terrainRenderer.dispose();
    }

    // Clean up input system
    if (this.input) {
      this.input.dispose();
      this.input.onMouseWheel = null;
      this.input.onPointerLockChange = null;
    }

    // Clean up tiger model
    if (this.tigerModel) {
      this.scene.remove(this.tigerModel.getMesh());
      this.tigerModel.dispose();
    }

    // Clean up save system and main menu
    if (this.mainMenu) {
      this.mainMenu.dispose();
      this.mainMenu = null;
    }
    
    if (this.gameSave) {
      this.gameSave = null;
    }

    // Clean up references
    this.tiger = null;
    this.tigerModel = null;
    this.terrain = null;
    this.terrainRenderer = null;
    this.vegetationSystem = null;
    this.animalSystem = null;
    this.ambushSystem = null;
    this.scentTrailSystem = null;
    this.uiSystem = null;
    this.waterSystem = null;
    this.underwaterSystem = null;
    this.camera = null;
    this.input = null;
    this.movementSystem = null;
    this.scene = null;
    this.canvas = null;
  }

  // Development/debugging helpers
  getTigerPosition() {
    return {
      x: this.tiger.position.x,
      y: this.tiger.position.y,
      z: this.tiger.position.z
    };
  }

  // Log complete game state for debugging
  logGameState() {
    const tigerModelPos = this.tigerModel.getMesh().position;
    const tigerModelRot = this.tigerModel.getMesh().rotation;
    const cameraLookAt = new THREE.Vector3();
    this.camera.camera.getWorldDirection(cameraLookAt);
    
    console.log('🎮 GAME STATE DEBUG:', JSON.stringify({
      tiger: {
        entityPosition: {
          x: this.tiger.position.x.toFixed(2),
          y: this.tiger.position.y.toFixed(2),
          z: this.tiger.position.z.toFixed(2)
        },
        modelPosition: {
          x: tigerModelPos.x.toFixed(2),
          y: tigerModelPos.y.toFixed(2),
          z: tigerModelPos.z.toFixed(2)
        },
        entityRotation: this.tiger.rotation ? (this.tiger.rotation.y * 180 / Math.PI).toFixed(1) + '°' : '0°',
        modelRotation: {
          x: (tigerModelRot.x * 180 / Math.PI).toFixed(1) + '°',
          y: (tigerModelRot.y * 180 / Math.PI).toFixed(1) + '°',
          z: (tigerModelRot.z * 180 / Math.PI).toFixed(1) + '°'
        },
        state: this.tiger.state,
        velocity: {
          x: this.movementSystem.velocity.x.toFixed(2),
          y: this.movementSystem.velocity.y.toFixed(2),
          z: this.movementSystem.velocity.z.toFixed(2)
        },
        isGrounded: this.movementSystem.isGrounded,
        isMoving: this.movementSystem.isMoving,
        isRunning: this.movementSystem.isRunning
      },
      camera: {
        position: {
          x: this.camera.camera.position.x.toFixed(2),
          y: this.camera.camera.position.y.toFixed(2),
          z: this.camera.camera.position.z.toFixed(2)
        },
        desiredPosition: {
          x: this.camera.desiredPosition.x.toFixed(2),
          y: this.camera.desiredPosition.y.toFixed(2),
          z: this.camera.desiredPosition.z.toFixed(2)
        },
        lookingAt: {
          x: cameraLookAt.x.toFixed(2),
          y: cameraLookAt.y.toFixed(2),
          z: cameraLookAt.z.toFixed(2)
        },
        distance: this.camera.distance.toFixed(2),
        orbit: {
          x: (this.camera.orbitX * 180 / Math.PI).toFixed(1) + '°',
          y: (this.camera.orbitY * 180 / Math.PI).toFixed(1) + '°'
        },
        target: this.camera.target ? 'TigerModel' : 'null'
      },
      terrain: {
        heightAtTiger: this.terrain.getHeightAt(this.tiger.position.x, this.tiger.position.z).toFixed(2),
        slopeAtTiger: this.terrain.getSlope(this.tiger.position.x, this.tiger.position.z).toFixed(3)
      },
      input: {
        direction: this.input.getMovementDirection(),
        pointerLocked: this.isPointerLocked
      },
      sync: {
        positionDifference: {
          x: (this.tiger.position.x - tigerModelPos.x).toFixed(3),
          y: (this.tiger.position.y - tigerModelPos.y).toFixed(3),
          z: (this.tiger.position.z - tigerModelPos.z).toFixed(3)
        }
      },
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  setTigerPosition(x, y, z) {
    this.tiger.setPosition(x, y, z);
    this.syncTigerToModel();
  }

  getTigerStats() {
    return {
      health: this.tiger.health,
      stamina: this.tiger.stamina,
      hunger: this.tiger.hunger,
      level: this.tiger.level,
      experience: this.tiger.experience,
      evolutionStage: this.tiger.evolutionStage
    };
  }

  // Terrain and vegetation access methods
  getTerrain() {
    return this.terrain;
  }

  getVegetationSystem() {
    return this.vegetationSystem;
  }

  getVegetationStats() {
    return this.vegetationSystem ? this.vegetationSystem.getStatistics() : null;
  }

  getWaterSystem() {
    return this.waterSystem;
  }

  getWaterStats() {
    if (!this.waterSystem) return null;
    
    return {
      waterBodies: this.waterSystem.getWaterBodies().length,
      rivers: this.waterSystem.getWaterBodies().filter(body => body.type === 'river').length,
      ponds: this.waterSystem.getWaterBodies().filter(body => body.type === 'pond').length,
      waterLevel: this.waterSystem.waterLevel
    };
  }

  getAnimalSystem() {
    return this.animalSystem;
  }

  getAnimalStats() {
    if (!this.animalSystem) return null;
    
    return this.animalSystem.getStatistics();
  }


  positionTigerOnTerrain() {
    if (this.terrain && this.tiger && this.tigerModel) {
      // Start tiger at center of terrain
      const centerX = 0;
      const centerZ = 0;
      const terrainHeight = this.terrain.getHeightAt(centerX, centerZ);
      const tigerHeight = 1.0; // Height above ground
      
      // Set tiger entity position
      this.tiger.position.set(centerX, terrainHeight + tigerHeight, centerZ);
      
      // Set tiger model position and rotation
      this.tigerModel.setPosition(centerX, terrainHeight + tigerHeight, centerZ);
      
      // Set tiger to face away from camera initially
      // Tiger head is at negative Z (-1.9), tail is at positive Z (+2.3)
      // Camera is positioned at positive Z relative to tiger
      // No rotation needed - tiger should already face away from camera
      this.tigerModel.setRotation(0, 0, 0); // No rotation - default orientation
    }
  }

  regenerateTerrain(seed) {
    if (this.terrain) {
      this.terrain.generateHeightmap(seed);
      
      // Update terrain renderer
      if (this.terrainRenderer) {
        this.terrainRenderer.updateTerrain();
      }
      
      // Regenerate vegetation to match new terrain
      if (this.vegetationSystem) {
        this.vegetationSystem.generateVegetation(seed);
      }

      // Regenerate water system to match new terrain
      if (this.waterSystem) {
        // Remove old water meshes
        const oldWaterMeshes = this.waterSystem.getWaterMeshes();
        oldWaterMeshes.forEach(mesh => this.scene.remove(mesh));
        this.waterSystem.dispose();
        
        // Create new water system
        this.waterSystem = new WaterSystem(this.terrain);
        const newWaterMeshes = this.waterSystem.getWaterMeshes();
        newWaterMeshes.forEach(mesh => this.scene.add(mesh));
        
        // Reconnect to movement system
        this.movementSystem.setWaterSystem(this.waterSystem);
      }


      // Reposition tiger on new terrain
      this.positionTigerOnTerrain();
    }
  }

  // Main Menu and Save/Load System
  showMainMenu() {
    console.log('🎮 Showing main menu...');
    this.isPaused = true;
    
    // Get save info if available
    const saveInfo = this.gameSave.getSaveInfo();
    
    // Set up menu callbacks
    this.mainMenu.setOnNewGame((gender) => {
      this.startNewGame(gender);
    });
    
    this.mainMenu.setOnContinueGame(() => {
      this.continueGame();
    });
    
    this.mainMenu.setOnSettings(() => {
      console.log('🎮 Settings menu not implemented yet');
    });
    
    // Show menu
    this.mainMenu.show(saveInfo);
  }

  startNewGame(gender = 'male') {
    console.log(`🎮 Starting new game with ${gender} tiger...`);
    this.mainMenu.hide();
    
    // Store selected gender for tiger creation
    this.selectedGender = gender;
    
    // Initialize game systems if not already done
    if (!this.gameInitialized) {
      this.initializeSystems();
      this.setupConnections();
      this.gameInitialized = true;
    } else {
      // Reset existing game
      this.reset();
    }
    
    // Clear any existing save
    this.gameSave.deleteSavedGame();
    
    // Reset play time
    this.totalPlayTime = 0;
    
    // Unpause game
    this.isPaused = false;
    
    console.log('🎮 New game started!');
  }

  continueGame() {
    console.log('🎮 Continuing saved game...');
    this.mainMenu.hide();
    
    // Load saved game data first to get the gender
    const saveData = this.gameSave.loadGame();
    if (!saveData) {
      console.error('❌ Failed to load saved game, starting new game instead');
      this.startNewGame();
      return;
    }
    
    // Set the selected gender from save data before initializing systems
    this.selectedGender = saveData.tiger?.gender || 'male';
    console.log(`🎮 Loading saved game with ${this.selectedGender} tiger`);
    
    // Initialize game systems if not already done
    if (!this.gameInitialized) {
      this.initializeSystems();
      this.setupConnections();
      this.gameInitialized = true;
    }
    
    // Apply saved game state to the tiger
    const success = this.applySaveData(saveData);
    if (!success) {
      console.error('❌ Failed to apply saved game data, starting new game instead');
      this.startNewGame();
      return;
    }
    
    // Unpause game
    this.isPaused = false;
    
    console.log('🎮 Saved game loaded!');
  }

  saveGame() {
    if (!this.gameInitialized) return false;
    
    const gameState = {
      tiger: this.tiger,
      terrain: this.terrain,
      isUnderwater: this.isUnderwater,
      totalPlayTime: this.totalPlayTime
    };
    
    return this.gameSave.saveGame(gameState);
  }

  applySaveData(saveData) {
    if (!saveData) return false;
    
    try {
      // Restore tiger state
      if (saveData.tiger) {
        this.tiger.position.set(
          saveData.tiger.position.x,
          saveData.tiger.position.y,
          saveData.tiger.position.z
        );
        
        if (saveData.tiger.rotation) {
          this.tiger.rotation = {
            x: saveData.tiger.rotation.x,
            y: saveData.tiger.rotation.y,
            z: saveData.tiger.rotation.z
          };
        }
        
        // Gender is already set during tiger creation, verify it matches
        if (saveData.tiger.gender && saveData.tiger.gender !== this.tiger.gender) {
          console.warn(`⚠️ Gender mismatch in save data: expected ${this.tiger.gender}, got ${saveData.tiger.gender}`);
        }
        
        this.tiger.health = saveData.tiger.health !== undefined ? saveData.tiger.health : 100;
        this.tiger.maxHealth = saveData.tiger.maxHealth !== undefined ? saveData.tiger.maxHealth : 100;
        this.tiger.stamina = saveData.tiger.stamina !== undefined ? saveData.tiger.stamina : 100;
        this.tiger.maxStamina = saveData.tiger.maxStamina !== undefined ? saveData.tiger.maxStamina : 100;
        this.tiger.hunger = saveData.tiger.hunger !== undefined ? saveData.tiger.hunger : 100;
        this.tiger.maxHunger = saveData.tiger.maxHunger !== undefined ? saveData.tiger.maxHunger : 100;
        this.tiger.thirst = saveData.tiger.thirst !== undefined ? saveData.tiger.thirst : 100;
        this.tiger.level = saveData.tiger.level !== undefined ? saveData.tiger.level : 1;
        this.tiger.experience = saveData.tiger.experience !== undefined ? saveData.tiger.experience : 0;
        this.tiger.evolutionStage = saveData.tiger.evolutionStage || 'Young';
        this.tiger.state = saveData.tiger.state || 'idle';
        this.tiger.huntsSuccessful = saveData.tiger.huntsSuccessful !== undefined ? saveData.tiger.huntsSuccessful : 0;
        this.tiger.totalKills = saveData.tiger.totalKills !== undefined ? saveData.tiger.totalKills : 0;
        this.tiger.totalDistance = saveData.tiger.totalDistance !== undefined ? saveData.tiger.totalDistance : 0;
        this.tiger.timeAlive = saveData.tiger.timeAlive !== undefined ? saveData.tiger.timeAlive : 0;
      }
      
      // Restore terrain state
      if (saveData.terrain) {
        this.isUnderwater = saveData.terrain.isUnderwater || false;
        
        // Regenerate terrain with saved seed
        if (saveData.terrain.seed) {
          this.regenerateTerrain(saveData.terrain.seed);
        }
      }
      
      // Restore game stats
      if (saveData.gameStats) {
        this.totalPlayTime = saveData.gameStats.totalPlayTime || 0;
      }
      
      // Sync tiger to model
      this.syncTigerToModel();
      
      console.log('🎮 Game state restored successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading game:', error);
      return false;
    }
  }

  autosaveGame(reason = 'auto') {
    if (!this.gameInitialized) return false;
    
    const gameState = {
      tiger: this.tiger,
      terrain: this.terrain,
      isUnderwater: this.isUnderwater,
      totalPlayTime: this.totalPlayTime
    };
    
    return this.gameSave.autosave(gameState, reason);
  }

  showSaveNotification(message) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: #4CAF50;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      z-index: 2000;
      font-size: 14px;
      pointer-events: none;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
  
  dispose() {
    // Dispose all systems
    if (this.tigerTraceSystem) {
      this.tigerTraceSystem.dispose();
    }
    
    if (this.scentTrailSystem) {
      this.scentTrailSystem.dispose();
    }
    
    if (this.animalSystem) {
      this.animalSystem.dispose();
    }
    
    if (this.underwaterSystem) {
      this.underwaterSystem.dispose();
    }
    
    if (this.waterSystem) {
      this.waterSystem.dispose();
    }
    
    if (this.vegetationSystem) {
      this.vegetationSystem.dispose();
    }
    
    if (this.input) {
      this.input.dispose();
    }
    
    console.log('🎮 GameController disposed');
  }
}